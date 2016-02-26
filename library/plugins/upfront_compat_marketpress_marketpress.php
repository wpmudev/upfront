<?php

class Upfront_Compat_Marketpress_Marketpress extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp', array($this, 'detect_virtual_page'));
		
		//Builder
		add_filter('upfront-core-default_layouts', array($this, 'augment_default_layouts'));

		//Editor
		add_action('wp_ajax_upfront_posts-load', array($this, "load_posts"), 9); // Bind this early to override the default Posts element action
		add_action('wp_ajax_this_post-get_markup', array($this, "load_markup"), 9);
	}

	public function detect_virtual_page () {
		//Add virtual pages compatibility
	}

	public function override_view ($view_class) {
		if ('Upfront_ThisPostView' === $view_class || 'Upfront_PostsView' === $view_class) return 'Upfront_MPView';
        return $view_class;
	}

	public function resolve_template ($tpl) {
		return $tpl;
	}
}
Upfront_Compat_Marketpress_Marketpress::serve();




class Upfront_MPView extends Upfront_Object {

	public function get_markup () {
		rewind_posts();
		ob_start();
		the_content();
		return ob_get_clean();
	}
}