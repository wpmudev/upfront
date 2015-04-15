<?php

class Upfront_LoginAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront-login_element-get_markup', array($this, "json_get_markup"));
	}

	public function json_get_markup () {
		$properties = !empty($_POST['properties'])
			? stripslashes_deep($_POST['properties'])
			: array()
		;
		$markup = Upfront_LoginView::get_login_markup($properties);
		$this->_out(new Upfront_JsonResponse_Success($markup));
	}
}