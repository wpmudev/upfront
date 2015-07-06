<?php

class Upfront_Compat_Bbpress_Bbpress implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_theme_support( 'bbpress' );
		add_action('wp', array($this, 'detect_virtual_page'));
	}

	public function detect_virtual_page () {

		if(is_bbpress()) { // if it is a bbPress page
			add_filter('upfront-views-view_class', array($this, 'override_view'));
		}
			
	}

	public function override_view ($view_class) {
		if ('Upfront_ThisPostView' === $view_class || 'Upfront_PostsView' === $view_class) return 'Upfront_BbPressView';
		return $view_class;
	}

	

}

class Upfront_BbPressView extends Upfront_Object {

	public function get_markup () {
		rewind_posts();
		return get_the_content();

	}
}

Upfront_Compat_Bbpress_Bbpress::serve();

