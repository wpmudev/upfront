<?php

require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';

class Upfront_Accordion_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'accordion';
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
		return realpath(Upfront::get_root_dir() . '/elements/upfront-accordion/tpl/preset-style.html');
	}
	
	public function get_presets($as_array = false) {
		$json = true;
		if ($as_array) {
			$json = false;
		}
		$accordion_presets = get_option('upfront_' . get_stylesheet() . '_accordion_presets');
		$accordion_presets = apply_filters(
			'upfront_get_accordion_presets',
			$accordion_presets,
			array(
				'json' => $json
			)
		);
		
		if (empty($accordion_presets)) {
			if($json) {
				$accordion_presets = json_encode(array());
			} else {
				$accordion_presets = array();
			}
		}
		
		return self::$instance->clearPreset($accordion_presets, $json);
	}
}

add_action('init', array('Upfront_Accordion_Presets_Server', 'serve'));
