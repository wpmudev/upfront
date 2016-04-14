<?php

class Upfront_Server_ThemeColorsServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) upfront_add_ajax('upfront_get_theme_color', array($this, 'get'));
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) upfront_add_ajax('upfront_update_theme_colors', array($this, 'update'));
	}

	public function get() {
		$theme_colors = get_option('upfront_' . get_stylesheet() . '_theme_colors');
		if (empty($theme_colors)) $theme_colors = array();
		$this->_out(new Upfront_JsonResponse_Success($theme_colors));
	}

	public function update() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();
		if (!Upfront_Permissions::current(Upfront_Permissions::LAYOUT_MODE)) $this->_reject();

		$theme_colors = isset($_POST['theme_colors']) ? $_POST['theme_colors'] : array();
		$range = isset($_POST['range']) ? $_POST['range'] : 0;

		$data = array(
			"colors" => $theme_colors,
			"range" => $range
		);

		do_action('upfront_save_theme_colors', $data);

		if (!has_action('upfront_update_theme_colors')) {
			update_option('upfront_' . get_stylesheet() . '_theme_colors', json_encode($data));
		}

		$this->_out(new Upfront_JsonResponse_Success(get_stylesheet() . ' theme colors updated'));
	}
}
//Upfront_Server_ThemeColorsServer::serve();
add_action('init', array('Upfront_Server_ThemeColorsServer', 'serve'));