<?php


class Upfront_Server_ThemeFontsServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_update_theme_fonts', array($this, 'update_theme_fonts'));
		}
	}

	public function update_theme_fonts() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$theme_fonts = isset($_POST['theme_fonts']) ? $_POST['theme_fonts'] : array();
		do_action('upfront_update_theme_fonts', $theme_fonts);
		if (!has_action('upfront_update_theme_fonts')) {
			update_option('upfront_' . get_stylesheet() . '_theme_fonts', json_encode($theme_fonts));
		}

		$this->_out(new Upfront_JsonResponse_Success(get_stylesheet() . ' theme fonts updated'));
	}
}
//Upfront_Server_ThemeFontsServer::serve();
add_action('init', array('Upfront_Server_ThemeFontsServer', 'serve'));
