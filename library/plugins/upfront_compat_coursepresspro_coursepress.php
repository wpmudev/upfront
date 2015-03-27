<?php

abstract class Uf2Cp_Helper implements IUpfront_Server {

	abstract public function get_post_type ();

	public function id_by_slug ($slug) {
		$res = get_posts(array(
			'name' => $slug,
			'posts_per_page' => 1,
			'post_type' => $this->get_post_type(),
			'fields' => 'ids'
		));
		return !empty($res[0])
			? $res[0]
			: false
		;
	}

	public function plural_query_args ($args) {
		$args['post_type'] = $this->get_post_type();
		$args['post_status'] = 'publish';

		return $args;
	}

	public function singular_query_args ($args) {
		$args['post_type'] = $this->get_post_type();
		$args['post_status'] = 'any';

		return $args;
	}

}


class Uf2Cp_Helper_Course extends Uf2Cp_Helper {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	public function get_post_type () { return 'course'; }

	private function _add_hooks () {
		$course_id = get_queried_object_id();
		add_filter('upfront-entity_resolver-entity_ids', array('Upfront_Compat_Coursepresspro_Coursepress', 'force_archive'));
		if (empty($course_id)) {
			// Archive
			add_filter('upfront_posts-view-data', array($this, 'plural_data'));
			add_filter('upfront_posts-model-generic-args', array($this, 'plural_query_args'));
		} else {
			// Single
			add_filter('upfront_posts-view-data', array($this, 'singular_data'));
			add_filter('upfront_posts-model-custom-args', array($this, 'singular_query_args'));
		}
	}

	public function plural_data ($data) {
		$data["list_type"] = "generic"; 
		$data["pagination"] = "numeric";
		return $data;
	}

	public function singular_data ($data) {
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


}


class Uf2Cp_Helper_Unit extends Uf2Cp_Helper {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	public function get_post_type () { return 'unit'; }

	private function _add_hooks () {
		$unitname = get_query_var('unitname');
		add_filter('upfront-entity_resolver-entity_ids', array('Upfront_Compat_Coursepresspro_Coursepress', 'force_archive'));
		if (empty($unitname)) {
			// Archive
			add_filter('upfront_posts-view-data', array($this, 'plural_data'));
		} else {
			// Single
			add_filter('upfront_posts-view-data', array($this, 'singular_data'));
		}
	}

	public function plural_data ($data) {
		$data["content"] = "content"; 
		$data["display_type"] = "single"; 
		$data["list_type"] = "generic"; 
		$data["pagination"] = "none";
		return $data;
	}

	public function singular_data ($data) {
		$unitname = get_query_var('unitname');
		$unit_id = $this->id_by_slug($unitname);
		if (empty($unit_id)) return $data;

		$data["content"] = "content"; 
		$data["list_type"] = "custom"; 
		$data["display_type"] = "single"; 
		$data["pagination"] = "none";
		$data["posts_list"] = json_encode(array(array(
			'id' => $unit_id
		)));

		return $data;
	}

}



class Uf2Cp_Helper_Discussions extends Uf2Cp_Helper {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	public function get_post_type () { return 'discussions'; }

	private function _add_hooks () {
		$discussion_name = get_query_var('name');
		$discussion_id = $this->id_by_slug($discussion_name);
		add_filter('upfront-entity_resolver-entity_ids', array('Upfront_Compat_Coursepresspro_Coursepress', 'force_archive'));
		if (empty($discussion_id)) {
			// Archive
			add_filter('upfront_posts-view-data', array($this, 'plural_data'));
			//add_filter('upfront_posts-model-generic-args', array($this, 'plural_query_args'));
		} else {
			// Single
			add_filter('upfront_posts-view-data', array($this, 'singular_data'));
			add_filter('upfront_posts-model-custom-args', array($this, 'singular_query_args'));
		}
	}

	public function plural_data ($data) {
		$data["content"] = "content";
		$data["display_type"] = "single"; 
		$data["pagination"] = "none"; 
		return $data;
	}

	public function singular_data ($data) {
		$discussion_name = get_query_var('name');
		$discussion_id = $this->id_by_slug($discussion_name);
		if (empty($discussion_id)) return $data;

		$data["content"] = "content"; 
		$data["list_type"] = "custom"; 
		$data["display_type"] = "single"; 
		$data["pagination"] = "none";
		$data["posts_list"] = json_encode(array(array(
			'id' => $discussion_id
		)));

		return $data;
	}

}



class Upfront_Compat_Coursepresspro_Coursepress extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp', array($this, 'detect_virtual_page'));
		upfront_add_ajax('upfront_posts-load', array($this, "load_posts"), 9); // Bind this early to override the default Posts element action
		// Shove some styles into footer
		add_action('wp_footer', array($this, 'inject_editor_styles'));
	}

	public static function force_archive ($cascade) {
		$cascade["type"] = "archive";
		$post_type = self::_get_post_type();
		if (!empty($post_type)) {
			$cascade['item'] = "archive-{$post_type}";
		}
		return $cascade;
	}

	public function detect_virtual_page () {
//global $wp_query; localhost_dbg($wp_query);
		$post_type = self::_get_post_type();
		if (empty($post_type)) return false;

		$method = "_dispatch_{$post_type}_overrides";
		if (is_callable(array($this, $method))) call_user_func(array($this, $method));
	}

	public function load_posts () {
		$data = stripslashes_deep($_POST);
		if (empty($data['layout']['item'])) return false; // Don't deal with this if we don't know what it is
		if (!in_array($data['layout']['item'], array(
			'archive-course',
			'archive-unit',
			'archive-notifications',
			'archive-discussions',
			'archive-instructor',
		))) return false; // Not a known CP layout nanana carry on
		$this->_out(new Upfront_JsonResponse_Success(array(
			'posts' => '<div class="upfront-coursepress_compat"><p>CoursePress specific content</p></div>',
			'pagination' => '',
		)));
	}

	private static function _get_post_type () {
		$post_type = get_query_var('post_type');

		// Is it one of the known post types requested?
		if (!in_array($post_type, array('course', 'unit', 'notifications', 'discussions'))) {

			$post_type = false; // Reset

			// No? How about a specific course unit?
			$coursename = get_query_var('coursename');
			$unitname = get_query_var('unitname');
			$instructor = get_query_var('instructor_username');
			$discussion_name = get_query_var('discussion_name');
			
			if (empty($coursename) && empty($unitname) && empty($instructor) && empty($discussion_name)) return false;
			
			if (!empty($unitname)) $post_type = 'unit';
			if (!empty($instructor)) $post_type = 'instructor';
			if (!empty($discussion_name)) $post_type = 'discussions';
		}

		return $post_type;
	}

	private function _dispatch_course_overrides () {
		Uf2Cp_Helper_Course::serve();
	}
	private function _dispatch_unit_overrides () {
		Uf2Cp_Helper_Unit::serve();
	}
	private function _dispatch_discussions_overrides () {
		Uf2Cp_Helper_Discussions::serve();
	}
	
	private function _dispatch_notifications_overrides () {
		add_filter('upfront_posts-view-data', array($this, 'generic_post_list_override'));
		add_filter('upfront-entity_resolver-entity_ids', array('Upfront_Compat_Coursepresspro_Coursepress', 'force_archive'));
	}

	private function _dispatch_instructor_overrides () {
		add_filter('upfront_posts-view-data', array($this, 'generic_post_list_override'));
		add_filter('upfront-entity_resolver-entity_ids', array('Upfront_Compat_Coursepresspro_Coursepress', 'force_archive'));
	}

	public function generic_post_list_override ($data) {
		$data["content"] = "content"; 
		$data["display_type"] = "single"; 
		$data["list_type"] = "generic"; 
		$data["pagination"] = "none";
		return $data;
	}

	public function inject_editor_styles () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false;
		echo <<<EO_CP_STYLES
<style>
.upfront-coursepress_compat {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 100%;
	text-align: center;
	opacity: .2;

}
.upfront-coursepress_compat p {
	text-align: center;
	width: 100%;
	font-size: 3em;
}
</style>
EO_CP_STYLES;
	}

}
Upfront_Compat_Coursepresspro_Coursepress::serve();