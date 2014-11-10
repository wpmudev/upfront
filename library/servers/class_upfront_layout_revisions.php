<?php

/**
 * Layout revisions handling controller.
 * For actual data/storage mapping, @see Upfront_LayoutRevisions
 */
class Upfront_Server_LayoutRevisions extends Upfront_Server {

	const HOOK = 'uf-preview';

	private $_data;

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}
	
	public static function schedule () {
		$me = new self;
		$me->register_requirements();
		$me->clean_up_deprecated_revisions();
	}

	private function _add_hooks () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false;

		$this->register_requirements();

		// Layout revisions AJAX handers
		upfront_add_ajax('upfront_build_preview', array($this, "build_preview"));

		upfront_add_ajax('upfront_list_revisions', array($this, "list_revisions"));

		// Cron request handlers
		//add_action('upfront_hourly_schedule', array($this, 'clean_up_deprecated_revisions'));

		// Preview listener setup
		if (is_admin()) return false;
		if (!self::is_preview()) return false;

		// Apply default regions
		//add_filter('upfront_regions', array($this, 'intercept_regions_loading'), 999, 2);

		add_filter('upfront_layout_from_id', array($this, 'intercept_layout_loading'), 999, 3);
	}

	/**
	 * Registering model requirements. Should probably refactor.
	 */
	public function register_requirements () {
		register_post_type(Upfront_LayoutRevisions::REVISION_TYPE, array(
			"public" => false,
			"supports" => false,
			"has_archive" => false,
			"rewrite" => false,
		));
		$this->_data = new Upfront_LayoutRevisions;
	}

	public function clean_up_deprecated_revisions () {
		$revisions = $this->_data->get_all_deprecated_revisions(array('fields' => 'ids'));
		if (empty($revisions)) return false;

		foreach ($revisions as $revision) {
			$rid = !empty($revision->ID) ? $revision->ID : (int)$revision;
			if (!$revision) continue;
			$this->_data->drop_revision($rid);
		}
	}

	/**
	 * Are we serving a preview request?
	 * @return bool
	 */
	public static function is_preview () {
		return !empty($_GET[self::HOOK]);
	}

	/**
	 * Intercepts layout loading and overrides with revision data.
	 * @deprecated
	 */
	public function intercept_regions_loading ($layout, $cascade) {
		if (!self::is_preview()) return $layout;
		$key = $_GET[self::HOOK];
		$raw = $this->_data->get_revision($key);
		/*
		if (!empty($raw)) {
			$new_layout = Upfront_Layout::from_php($raw);
		}
		*/

		return empty($raw["regions"])
			? $layout
			: $raw["regions"]
		;
	}

	/**
	 * Intercepts layout loading and overrides with revision data.
	 */
	public function intercept_layout_loading ($layout, $type, $cascade) {
		if (!self::is_preview()) return $layout;
		$key = $_GET[self::HOOK];
		$raw = $this->_data->get_revision($key);
		if (!empty($raw)) {
			$new_layout = Upfront_Layout::from_php($raw);
		}

		return !empty($new_layout) && !$new_layout->is_empty()
			? $new_layout
			: $layout
		;
	}

	/**
	 * Outputs revisions JSON data, or JSON error.
	 */
	public function list_revisions () {
		$data = stripslashes_deep($_POST);
		$cascade = !empty($data['cascade']) ? $data['cascade'] : false;
		if (empty($cascade)) $this->_out(new Upfront_JsonResponse_Error("No data received"));

		$current_url = !empty($data['current_url']) ? $data['current_url'] : home_url();
		$current_url = wp_validate_redirect(wp_sanitize_redirect($current_url), false);
		$current_url = $current_url ? $current_url : home_url();

		$revisions = $this->_data->get_entity_revisions($cascade);
		if (empty($revisions)) $this->_out(new Upfront_JsonResponse_Error("No revisions for this entity"));

		$out = array();
		$datetime = get_option("date_format") . "@" . get_option("time_format");
		foreach ($revisions as $revision) {
			$display_name = '';
			if (!empty($revision->post_author)) {
				$user = get_user_by('id', $revision->post_author);
				if (!empty($user->display_name)) $display_name = $user->display_name;
			}
			$out[] = array(
				'date_created' => mysql2date($datetime, $revision->post_date),
				'preview_url' => add_query_arg(array(
					self::HOOK => $revision->post_name,
				), $current_url),
				'created_by' => array(
					'user_id' => $revision->post_author,
					'display_name' => $display_name,
				),
			);
		}
		$this->_out(new Upfront_JsonResponse_Success($out));
	}

	/**
	 * Builds preview layout model and dispatches save.
	 */
	public function build_preview () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		global $post;

		$raw_data = stripslashes_deep($_POST);
		$data = !empty($raw_data['data']) ? $raw_data['data'] : '';

		$current_url = !empty($raw_data['current_url']) ? $raw_data['current_url'] : home_url();
		$current_url = wp_validate_redirect(wp_sanitize_redirect($current_url), false);
		$current_url = $current_url ? $current_url : home_url();

		$layout = Upfront_Layout::from_json($data);
		$layout_id_key = $this->_data->save_revision($layout);

		$preview_url = add_query_arg(array(
			self::HOOK => $layout_id_key,
		), $current_url);
		$this->_out(new Upfront_JsonResponse_Success(array(
			'html' => $preview_url,
		)));
	}

}
//Upfront_Server_LayoutRevisions::serve();
add_action('init', array('Upfront_Server_LayoutRevisions', 'serve'), 0);
add_action('upfront_hourly_schedule', array('Upfront_Server_LayoutRevisions', 'schedule'));