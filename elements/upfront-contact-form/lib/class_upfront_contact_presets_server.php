<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

class Upfront_Contact_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'contact';
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
		return realpath(Upfront::get_root_dir() . '/elements/upfront-contact-form/templates/preset-style.html');
	}
	
	public static function get_preset_defaults() {
		return array(
			'static-field-bg' => 'rgb(255,255,255)',
			'static-button-bg' => 'rgb(17,210,85)',
			'static-font-size' => 14,
			'static-font-family' => 'Arial',
			'static-font-color' => 'rgb(96, 96, 96)',
			'static-font-style' => '400 normal',
			'static-weight' => 400,
			'static-style' => 'normal',
			'static-line-height' => 1,
			'static-field-labels-font-size' => 12,
			'static-field-labels-font-family' => 'Arial',
			'static-field-labels-font-color' => 'rgb(0, 0, 0)',
			'static-field-labels-weight' => 400,
			'static-field-labels-style' => 'normal',
			'static-field-labels-line-height' => 1,
			'static-field-labels-font-style' => '400 normal',
			'hover-field-labels-font-size' => 12,
			'hover-field-labels-font-family' => 'Arial',
			'hover-field-labels-font-color' => 'rgb(0, 0, 0)',
			'hover-field-labels-weight' => 400,
			'hover-field-labels-style' => 'normal',
			'hover-field-labels-line-height' => 1,
			'hover-field-labels-font-style' => '400 normal',
			'focus-field-labels-font-size' => 12,
			'focus-field-labels-font-family' => 'Arial',
			'focus-field-labels-font-color' => 'rgb(0, 0, 0)',
			'focus-field-labels-weight' => 400,
			'focus-field-labels-style' => 'normal',
			'focus-field-labels-line-height' => 1,
			'focus-field-labels-font-style' => '400 normal',
			'static-field-values-font-size' => 12,
			'static-field-values-font-family' => 'Arial',
			'static-field-values-font-color' => 'rgb(0, 0, 0)',
			'static-field-values-weight' => 400,
			'static-field-values-style' => 'normal',
			'static-field-values-line-height' => 1,
			'static-field-values-font-style' => '400 normal',
			'hover-field-values-font-size' => 12,
			'hover-field-values-font-family' => 'Arial',
			'hover-field-values-font-color' => 'rgb(0, 0, 0)',
			'hover-field-values-weight' => 400,
			'hover-field-values-style' => 'normal',
			'hover-field-values-line-height' => 1,
			'hover-field-values-font-style' => '400 normal',
			'focus-field-values-font-size' => 12,
			'focus-field-values-font-family' => 'Arial',
			'focus-field-values-font-color' => 'rgb(0, 0, 0)',
			'focus-field-values-weight' => 400,
			'focus-field-values-style' => 'normal',
			'focus-field-values-line-height' => 1,
			'focus-field-values-font-style' => '400 normal',
			'static-button-font-size' => 12,
			'static-button-font-family' => 'Arial',
			'static-button-font-color' => 'rgb(0, 0, 0)',
			'static-button-weight' => 400,
			'static-button-style' => 'normal',
			'static-button-line-height' => 1,
			'static-button-font-style' => '400 normal',
			'hover-button-font-size' => 12,
			'hover-button-font-family' => 'Arial',
			'hover-button-font-color' => 'rgb(0, 0, 0)',
			'hover-button-weight' => 400,
			'hover-button-style' => 'normal',
			'hover-button-line-height' => 1,
			'hover-button-font-style' => '400 normal',
			'focus-button-font-size' => 12,
			'focus-button-font-family' => 'Arial',
			'focus-button-font-color' => 'rgb(0, 0, 0)',
			'focus-button-weight' => 400,
			'focus-button-style' => 'normal',
			'focus-button-line-height' => 1,
			'focus-button-font-style' => '400 normal',
			'hover-field-bg' => 'rgb(255,255,255)',
			'hover-button-bg' => 'rgb(0,0,0)',
			'hover-font-size' => 14,
			'hover-font-family' => 'Arial',
			'hover-font-color' => 'rgb(96, 96, 96)',
			'hover-font-style' => '400 normal',
			'hover-weight' => 400,
			'hover-style' => 'normal',
			'hover-line-height' => 1,
			'hover-transition-duration' => 0.3,
			'hover-transition-easing' => 'ease-in-out',
			'focus-field-bg' => 'rgb(255,255,255)',
			'focus-button-bg' => 'rgb(0,0,0)',
			'focus-font-size' => 14,
			'focus-font-family' => 'Arial',
			'focus-font-color' => 'rgb(96, 96, 96)',
			'focus-font-style' => '400 normal',
			'focus-weight' => 400,
			'focus-style' => 'normal',
			'focus-line-height' => 1,
			'static-fields-useborder' => '',
			'static-fields-borderwidth' => 1,
			'static-fields-bordertype' => 'solid',
			'static-fields-bordercolor' => 'rgb(0, 0, 0)',
			'hover-fields-useborder' => '',
			'hover-fields-borderwidth' => 1,
			'hover-fields-bordertype' => 'solid',
			'hover-fields-bordercolor' => 'rgb(0, 0, 0)',
			'focus-fields-useborder' => '',
			'focus-fields-borderwidth' => 1,
			'focus-fields-bordertype' => 'solid',
			'focus-fields-bordercolor' => 'rgb(0, 0, 0)',
			'static-button-useborder' => '',
			'static-button-borderwidth' => 1,
			'static-button-bordertype' => 'solid',
			'static-button-bordercolor' => 'rgb(0, 0, 0)',
			'hover-button-useborder' => '',
			'hover-button-borderwidth' => 1,
			'hover-button-bordertype' => 'solid',
			'hover-button-bordercolor' => 'rgb(0, 0, 0)',
			'focus-button-useborder' => '',
			'focus-button-borderwidth' => 1,
			'focus-button-bordertype' => 'solid',
			'focus-button-bordercolor' => 'rgb(0, 0, 0)',
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset')
		);
	}
}

Upfront_Contact_Presets_Server::serve();
