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
		
		upfront_add_ajax('upfront_get_revision', array($this, "get_revision"));

		// This goes before the `is_admin` check, because it fires in AJAX
		add_action('upfront-style-base_layout', array($this, 'intercept_style_loading'));

		// Preview listener setup
		if (is_admin()) return false;
		if (!self::is_preview()) return false;

		add_filter('upfront_layout_from_id', array($this, 'intercept_layout_loading'), 999, 3);	
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'intercept_entity_cascade_parsing'));
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
		
		register_post_status(Upfront_LayoutRevisions::REVISION_STATUS, array(
			'public' => Upfront_Permissions::current(Upfront_Permissions::BOOT),
			'exclude_from_search' => true,
			'show_in_admin_all_list' => false,
			'show_in_admin_status_list' => false,
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
			if (!empty($raw['layout'])) {
				$raw['layout']['revision'] = $key;
			}
			$new_layout = Upfront_Layout::from_php($raw);
		}

		return !empty($new_layout) && !$new_layout->is_empty()
			? $new_layout
			: $layout
		;
	}

	/**
	 * Intercept cascade parsing and deal with revision data if we're in preview.
	 * Needed in order to get the styles properly applied.
	 */
	public function intercept_entity_cascade_parsing ($ids) {
		if (!self::is_preview()) return $ids;
		$key = $_GET[self::HOOK];
		if (empty($key)) return $ids;

		if (empty($ids) || !is_array($ids)) return $ids;
		$ids['layout_revision'] = $key;

		return $ids;
	}

	/**
	 * This fires in style parsing AJAX request and overrides the used layout.
	 *
	 * @param Upfront_Layout $layout Style layout for parsing
	 * @return Upfront_Layout
	 */
	public function intercept_style_loading ($layout) {
		$key = !empty($_GET['layout']['layout_revision'])
			? $_GET['layout']['layout_revision']
			: false
		;
		if (empty($key)) return $layout;

		$cascade = $layout->get_cascade();
		$src_key = !empty($cascade['layout_revision'])
			? $cascade['layout_revision']
			: false
		;

		if ($key != $src_key) return $layout;

		$raw = $this->_data->get_revision($key);
		if (!empty($raw)) {
			$layout = Upfront_Layout::from_php($raw);
		}

		return $layout;
	}

	/**
	 * Outputs revisions JSON data, or JSON error.
	 */
	public function list_revisions () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE_REVISION)) $this->_out(new Upfront_JsonResponse_Error("No way"));

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
	 * Outputs a single revision as JSON data, or JSON error
	 */
	public function get_revision () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE_REVISION)) $this->_out(new Upfront_JsonResponse_Error("No way"));
		
		$data = stripslashes_deep($_POST);
		$rvsn_id = !empty($data['revision']) ? $data['revision'] : false;
		if (empty($rvsn_id)) $this->_out(new Upfront_JsonResponse_Error("No data received"));

		$revision = $this->_data->get_revision($rvsn_id);
		if (empty($revision)) $this->_out(new Upfront_JsonResponse_Error("No data found"));

		$this->_out(new Upfront_JsonResponse_Success(array(
			'revision' => $revision,
		)));
	}

	/**
	 * Builds preview layout model and dispatches save.
	 */
	public function build_preview () {
		if (
			!Upfront_Permissions::current(Upfront_Permissions::SAVE)
			&&
			!Upfront_Permissions::current(Upfront_Permissions::SAVE_REVISION)
		) $this->_reject();

		global $post;

		$raw_data = stripslashes_deep($_POST);
		$data = !empty($raw_data['data']) ? $raw_data['data'] : '';

		$current_url = !empty($raw_data['current_url']) ? $raw_data['current_url'] : home_url();
		$current_url = wp_validate_redirect(wp_sanitize_redirect($current_url), false);
		$current_url = $current_url ? $current_url : home_url();

		$layout = Upfront_Layout::from_json($data);
		$layout_id_key = $this->_data->save_revision($layout);

		// Check concurrent edits from other users
		$current_user_id = get_current_user_id();
		$other_tab_open = false;
		$current_revisions = $this->_data->get_entity_revisions($layout->get_cascade(), array(
			'date_query' => array(array(
				'after' => "-15 minutes", // 15 minutes cutoff time
			))
		));
		$concurrent_users = array();
		$current_tab_decoded = json_decode($data, true);
		$current_tab_id = isset($current_tab_decoded) ? $current_tab_decoded['tab_id'] : '';
		if (!empty($current_revisions)) foreach ($current_revisions as $rvsn) {
			if (empty($rvsn->post_author)) continue;
			
			$user = get_user_by('id', $rvsn->post_author);
			// If empty, skip.
			if ( empty($user) || empty($user->ID)) {
				continue;
			}

			// If current user, check tab_id for differences.
			if ($user->ID === $current_user_id) {
				if (!empty($rvsn->post_content)) {
					$saved_tab_decoded = unserialize(base64_decode($rvsn->post_content));
					$saved_tab_id = $saved_tab_decoded['tab_id'];
					// If the current tab id does not match the last revision
					// from 15 minutes ago, warn the user via upfront-util.js.
					if (!empty($current_tab_id) && $current_tab_id !== $saved_tab_id) {
						$other_tab_open = true;
					}
				}
			} else {
				// If other user, record other user name.
				$concurrent_users[$user->ID] = $user->display_name;
			}
		}

		$preview_url = remove_query_arg('editmode', add_query_arg(array(
			self::HOOK => $layout_id_key,
		), $current_url));
		$this->_out(new Upfront_JsonResponse_Success(array(
			'html' => $preview_url,
			'idx' => $layout_id_key,
			'concurrent_users' => $concurrent_users,
			'other_tab_open' => $other_tab_open,
		)));
	}

}
//Upfront_Server_LayoutRevisions::serve();
add_action('init', array('Upfront_Server_LayoutRevisions', 'serve'), 0);
add_action('upfront_hourly_schedule', array('Upfront_Server_LayoutRevisions', 'schedule'));
