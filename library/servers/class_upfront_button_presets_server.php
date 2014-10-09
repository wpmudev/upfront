<?php

class Upfront_Server_ButtonPresetsServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) upfront_add_ajax('upfront_get_button_presets', array($this, 'get'));
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) upfront_add_ajax('upfront_update_button_presets', array($this, 'update'));
	}

	public function get() {
		$button_presets = get_option('upfront_' . get_stylesheet() . '_button_presets');
		if (empty($button_presets)) $button_presets = array();
		$this->_out(new Upfront_JsonResponse_Success($button_presets));
	}

	public function update() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$button_presets = isset($_POST['button_presets']) ? $_POST['button_presets'] : array();


		//do_action('upfront_save_button_presets', $button_presets);

		if (!has_action('upfront_update_button_presets')) {
			update_option('upfront_' . get_stylesheet() . '_button_presets', json_encode($button_presets));
		}

		$this->_out(new Upfront_JsonResponse_Success(get_stylesheet() . ' button presets updated'));
	}
}

add_action('init', array('Upfront_Server_ButtonPresetsServer', 'serve'));