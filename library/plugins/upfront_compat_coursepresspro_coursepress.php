<?php

class Upfront_Compat_Coursepresspro_Coursepress implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		$this->nerf_coursepress();

		add_action('wp', array($this, 'detect_virtual_page'));
	}

	public function nerf_coursepress () {
		global $coursepress;
		if (empty($coursepress)) return false;

		//remove_action('template_redirect', array($coursepress, 'virtual_page_template')); // Do we do this? How? Why?
	}

	public function detect_virtual_page () {
		$post_type = get_query_var('post_type');
		if ('course' !== $post_type) return false;

		$course_id = get_queried_object_id();
		if (empty($course_id)) return false;

		// Set up specific layout triggering
		
	}


}
Upfront_Compat_Coursepresspro_Coursepress::serve();