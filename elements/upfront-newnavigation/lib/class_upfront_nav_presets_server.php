<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

class Upfront_Nav_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'nav';
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
		return realpath(Upfront::get_root_dir() . '/elements/upfront-newnavigation/tpl/preset-style.html');
	}
	
	public static function get_preset_properties($preset) {
		$properties = self::$instance->get_preset_by_id($preset);

		return $properties;
	}
	
	public static function get_preset_defaults() {
		return array(
			'menu_style' => 'horizontal',
			'menu_alignment' => 'left',
			'burger_alignment' => 'left',
			'static-font-size' => 16,
			'static-font-family' => 'Arial',
			'static-font-color' => 'rgba(255, 255, 255, 1)',
			'static-font-style' => '400 normal',
			'static-weight' => 400,
			'static-style' => 'normal',
			'static-line-height' => 1.6,
			'static-nav-bg' => 'rgba(51, 51, 51, 0)',
			'hover-font-size' => 16,
			'hover-font-family' => 'Arial',
			'hover-font-color' => 'rgba(26, 124, 252, 1)',
			'hover-font-style' => '400 normal',
			'hover-weight' => 400,
			'hover-style' => 'normal',
			'hover-line-height' => 1.6,
			'hover-transition-duration' => 0.3,
			'hover-transition-easing' => 'ease-in-out',
			'hover-nav-bg' => 'rgba(255, 255, 255, 0)',
			'focus-font-size' => 16,
			'focus-font-family' => 'Arial',
			'focus-font-color' => 'rgba(26, 124, 252, 1)',
			'focus-font-style' => '400 normal',
			'focus-weight' => 400,
			'focus-style' => 'normal',
			'focus-line-height' => 1.6,
			'focus-nav-bg' => 'rgba(255, 255, 255, 0)',
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset')
		);
	}
}

Upfront_Nav_Presets_Server::serve();
