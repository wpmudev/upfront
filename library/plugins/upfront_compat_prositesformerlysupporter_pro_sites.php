<?php

class Upfront_Compat_Prositesformerlysupporter_Pro_sites implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('admin_init', array($this, 'nerf_pro_sites'), 1);
	}

	public function nerf_pro_sites () {
		global $psts;
		if (empty($psts)) return false;
		if (!(defined('DOING_AJAX') && DOING_AJAX)) return false;
		$action = !empty($_REQUEST['action']) ? $_REQUEST['action'] : false;
		if (!preg_match('/^upfront[-_]/', $action)) return false;
		
		remove_action('admin_init', array($psts, 'signup_redirect'), 100);
	}
}