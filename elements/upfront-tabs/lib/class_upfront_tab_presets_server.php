<?php

require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';

class Upfront_Tab_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'tab';
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
		return realpath(Upfront::get_root_dir() . '/elements/upfront-tabs/tpl/preset-style.html');
	}
	
	public function get_presets($as_array = false) {
		$json = true;
		if ($as_array) {
			$json = false;
		}
		$tab_presets = get_option('upfront_' . get_stylesheet() . '_tab_presets');
		$tab_presets = apply_filters(
			'upfront_get_tab_presets',
			$tab_presets,
			array(
				'json' => true
			)
		);
		
		if (empty($tab_presets)) {
			if($json) {
				$tab_presets = json_encode(array());
			} else {
				$tab_presets = array();
			}
		}
		
		return self::$instance->clearPreset($tab_presets, $json);
	}
}

add_action('init', array('Upfront_Tab_Presets_Server', 'serve'));
