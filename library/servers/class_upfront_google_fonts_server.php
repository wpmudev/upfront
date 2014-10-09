<?php

class Upfront_Server_GoogleFontsServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) upfront_add_ajax('upfront_list_google_fonts', array($this, 'json_list_google_fonts'));
	}

	public function json_list_google_fonts () {
		$model = new Upfront_Model_GoogleFonts;
		$fonts = $model->get_all();
		$response = !empty($fonts)
			? new Upfront_JsonResponse_Success($fonts)
			: new Upfront_JsonResponse_Error("Cache error")
		;
		$this->_out($response);
	}
}
//Upfront_Server_GoogleFontsServer::serve();
add_action('init', array('Upfront_Server_GoogleFontsServer', 'serve'));