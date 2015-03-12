<?php

class Upfront_Compat_Coursepresspro_Coursepress implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp', array($this, 'detect_virtual_page'));
	}

	public function detect_virtual_page () {
		$post_type = get_query_var('post_type');

//global $wp_query; localhost_dbg($wp_query);
		// Is it one of the known post types requested?
		if (!in_array($post_type, array('course', 'unit'))) {
			// No? How about a specific course unit?
			$coursename = get_query_var('coursename');
			$unitname = get_query_var('unitname');
			if (empty($coursename) && empty($unitname)) return false;
			
			if (!empty($unitname)) $post_type = 'unit';
		}

		$method = "_dispatch_{$post_type}_overrides";
		if (is_callable(array($this, $method))) call_user_func(array($this, $method));
	}

	public function _dispatch_course_overrides () {
		$course_id = get_queried_object_id();
		if (empty($course_id)) return false;

		add_filter('upfront-entity_resolver-entity_ids', create_function('$cascade', '$cascade["type"] = "archive"; return $cascade;'));
		add_filter('upfront_posts-view-data', array($this, 'override_course_data'));
		add_filter('upfront_posts-model-custom-args', array($this, 'override_course_query_args'));
	}

	public function _dispatch_unit_overrides () {
//global $wp_query; localhost_dbg($wp_query);
		add_filter('upfront_posts-view-data', array($this, 'override_units_data'));

		// Set up specific layout triggering
	}

	public function override_course_data ($data) {
		$course_id = get_queried_object_id();
		if (empty($course_id)) return $data;

		$data["content"] = "content"; 
		$data["list_type"] = "custom"; 
		$data["display_type"] = "single"; 
		$data["pagination"] = "none"; 
		$data["posts_list"] = json_encode(array(array(
			'id' => $course_id
		)));

		return $data;
	}

	public function override_course_query_args ($args) {
		$args['post_type'] = 'course';
		$args['post_status'] = 'any';

		return $args;
	}

	public function override_units_data ($data) {
		$data["content"] = "content"; 
		$data["display_type"] = "single"; 
		$data["pagination"] = "none"; 
		return $data;
	}


}
Upfront_Compat_Coursepresspro_Coursepress::serve();