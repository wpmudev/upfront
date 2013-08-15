<?php

class Upfront_LoginView extends Upfront_Object {

	public function get_markup () {
		
		// We're registering the styles as it turns out we'll need them
		upfront_add_element_style('upfront_login', array('css/public.css', dirname(__FILE__)));
		// They'll get concatenated and cached later on, we're done with this. Get the actual markup.

		return is_user_logged_in ()
			? self::fake_upfront_init()
			: self::get_element_markup()
		;
	}

	public static function fake_upfront_init () {
		return !current_user_can('manage_options')
			? ''
			: '<script>' .
				'(function ($) { $(window).load(function () { Upfront.Application.LayoutEditor.dispatch_layout_loading(); }); })(jQuery);' .
			'</script>'
		;
	}

	public static function get_element_markup () {
		return '<div class="upfront_login">' . wp_login_form(array(
			'echo' => false,
			'remember' => true,
		)) . '</div>';
	}
}

class Upfront_LoginAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront-login_element-get_markup', array($this, "json_get_markup"));
	}

	public function json_get_markup () {
		$markup = Upfront_LoginView::get_element_markup();
		$this->_out(new Upfront_JsonResponse_Success($markup));
	}
}
Upfront_LoginAjax::serve();