<?php

require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';

class Upfront_Button_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'button';
	}

	public static function serve () {
		self::$instance = new self;
		self::$instance->_add_hooks();
		add_filter( 'get_element_preset_styles', array(self::$instance, 'get_preset_styles_filter')) ;
	}

	public static function get_instance() {
		return self::$instance;
	}
	
	public function get_preset_styles_filter($style) {
		$style .= self::$instance->get_presets_styles();
		return $style;
	}

	protected function get_style_template_path() {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-button/tpl/preset-style.html');
	}
	
	public function get() {
		$this->_out(new Upfront_JsonResponse_Success($this->clearPreset($this->get_presets(true))));
	}
	
	public function get_presets($as_array = false) {
		$json = true;
		if ($as_array) {
			$json = false;
			$as_array = true;
		}
		$button_presets = get_option('upfront_' . get_stylesheet() . '_button_presets');
		$button_presets = apply_filters(
			'upfront_get_button_presets',
			$button_presets,
			array(
				'json' => $json,
				'as_array' => $as_array
			)
		);
		
		if (empty($button_presets)) {
			if($json) {
				$button_presets = json_encode(array());
			} else {
				$button_presets = array();
			}
		}
		
		return self::$instance->clearPreset($button_presets, true);
	}
}

add_action('init', array('Upfront_Button_Presets_Server', 'serve'));
