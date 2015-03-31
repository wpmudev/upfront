<?php

class Upfront_Compat_Events_Events_and_bookings extends Upfront_Server {

	const LAST = 999;

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp', array($this, 'check_event_query'), self::LAST);

		// Deal with editor
		add_action('wp_ajax_upfront_posts-load', array($this, "load_posts"), 9); // Bind this early to override the default Posts element action
	}

	public function check_event_query () {
		if (Eab_EventModel::POST_TYPE !== get_query_var('post_type')) return false;
	
		// Force default (upfront) templates usage
		add_filter('archive_template', '__return_empty_string', self::LAST);
		add_filter('single_template', '__return_empty_string', self::LAST);

		// Force archive so we can use posts element
		add_filter('upfront-entity_resolver-entity_ids', array($this, 'force_archive'));

		// Ensure global query args is what we use, as E+ already does this for us
		add_filter('upfront_posts-model-generic-args', array($this, 'query_args'));
		
		// Dispatch posts element data bindings
		$object_id = get_queried_object_id();
		if (!empty($object_id)) {
			add_filter('upfront_posts-view-data', array($this, 'singular_data'));
		} else {
			add_filter('upfront_posts-view-data', array($this, 'plural_data'));
		}
	}

	public function plural_data ($data) {
		$data["list_type"] = "generic"; 
		$data["display_type"] = "list"; 
		$data["content"] = "content"; 
		$data["pagination"] = "numeric";
		return $data;
	}

	public function singular_data ($data) {
		$data["list_type"] = "generic"; 
		$data["display_type"] = "single"; 
		$data["content"] = "content"; 
		$data["pagination"] = "none";
		return $data;
	}

	public function query_args ($args) {
		global $wp_query;
		return $wp_query->query;
	}

	public function force_archive ($cascade) {
		$object_id = get_queried_object_id();
		$item = !empty($object_id)
			? 'single'
			: 'archive'
		;
		
		$cascade["type"] = "archive";
		$cascade['item'] = $item . "-" . Eab_EventModel::POST_TYPE;

		if (!empty($object_id)) {
			$cascade['specificity'] = $cascade['item'] . '-' . $object_id;
		}

		return $cascade;
	}

	public function load_posts () {
		$data = stripslashes_deep($_POST);
		if (empty($data['layout']['item'])) return false; // Don't deal with this if we don't know what it is
		if (!in_array($data['layout']['item'], array(
			'archive-' . Eab_EventModel::POST_TYPE,
			'single-' . Eab_EventModel::POST_TYPE,
		))) return false; // Not a known E+ layout nanana carry on
		$this->_out(new Upfront_JsonResponse_Success(array(
			'posts' => '<div class="upfront-eab_compat upfront-plugin_compat"><p>Events+ specific content</p></div>',
			'pagination' => '',
		)));
	}

}
Upfront_Compat_Events_Events_and_bookings::serve();