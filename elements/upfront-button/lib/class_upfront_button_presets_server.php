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
		$style .= $this->get_presets_styles();
		return $style;
	}

	protected function get_style_template_path() {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-button/tpl/preset-style.html');
	}
	
	public function get() {
		$this->_out(new Upfront_JsonResponse_Success($this->get_presets(true)));
	}
		
	public function get_presets() {
		$presets = json_decode(get_option($this->db_key, '[]'), true);

		$presets = apply_filters(
			'upfront_get_' . $this->elementName . '_presets',
			$presets,
			array(
				'json' => false,
				'as_array' => true
			)
		);
		
		$result = array();
		
		foreach ($presets as $preset) {
			$preset['id'] = $this->clearPreset($preset['id']);
				
			$result[] = $preset;
		}
		
		$this->update_presets($result);
		
		$presets = $result;

		// Fail-safe
		if (is_array($presets) === false) {
			$presets = array();
		}

		return $presets;
	}
	
	public function clearPreset($preset) {
		$preset = str_replace(' ', '-', $preset);
		$preset = preg_replace('/[^-a-zA-Z0-9]/', '', $preset);

		return $preset; // Removes special chars.
	}
}

add_action('init', array('Upfront_Button_Presets_Server', 'serve'));
