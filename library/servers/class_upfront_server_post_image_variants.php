<?php

class Upfront_Server_PostImageVariants extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) upfront_add_ajax('upfront_get_post_image_variants', array($this, 'get'));
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) upfront_add_ajax('upfront_update_post_image_variants', array($this, 'update'));
	}

	public function get() {
		$variants = Upfront_Cache_Utils::get_option('upfront_' . get_stylesheet() . '_post_image_variants');
		if (empty($variants)) $variants = array();
		$this->_out(new Upfront_JsonResponse_Success($variants));
	}

	public function update() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$variants = isset($_POST['image_variants']) ? $_POST['image_variants'] : array();

		$data = array(
			"post_image_variants" => $variants,
		);

		do_action('upfront_save_post_image_variants', $data);

		if (!has_action('upfront_update_post_image_variants')) {
			Upfront_Cache_Utils::update_option('upfront_' . get_stylesheet() . '_post_image_variants', json_encode($data));
		}

		$this->_out(new Upfront_JsonResponse_Success(get_stylesheet() . ' post image variants updated'));
	}
}
//Upfront_Server_ThemeColorsServer::serve();
//add_action('init', array('Upfront_Server_PostImageVariants', 'serve'));
