<?php

class Upfront_Url_Server extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	protected function _add_hooks () {
		upfront_add_ajax('upfront_get_url_data', array($this, 'get_url_data'));
	}

	public function get_url_data() {
		$this->_out(new Upfront_JsonResponse_Success(array('type'=>'generic')));
	}
}
add_action('init', array('Upfront_Url_Server', 'serve'));
