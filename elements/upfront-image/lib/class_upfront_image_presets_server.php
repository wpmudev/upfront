<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

class Upfront_Image_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'image';
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
		return realpath(Upfront::get_root_dir() . '/elements/upfront-image/tpl/preset-style.html');
	}
	
	public static function get_preset_properties($preset) {
		$properties = self::$instance->get_preset_by_id($preset);

		return $properties;
	}
	
	public static function get_preset_defaults() {
		return array(
			'image-style' => 'default',
			'useradius' => '',
			'borderradiuslock' => 'yes',
			'borderradius1' => 5,
			'borderradius2' => 5,
			'borderradius3' => 5,
			'borderradius4' => 5,
			'useborder' => '',
			'bordertype' => 'solid',
			'borderwidth' => 1,
			'bordercolor' => 'rgb(0, 0, 0)',
			'caption-text' => 'rgba(0, 0, 0, 0.9)',
			'caption-bg' => 'rgba(255, 255, 255, 0.8)',
			'use_captions' => '',
			'caption-position-value' => 'nocaption',
			'caption-trigger' => 'hover_show',
			'caption-position' => 'over_image',
			'caption-alignment' => 'bottom',
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset')
		);
	}
}

Upfront_Image_Presets_Server::serve();
