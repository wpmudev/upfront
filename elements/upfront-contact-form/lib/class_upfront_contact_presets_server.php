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
			'field-labels-static-font-size' => 12,
			'field-labels-static-font-family' => 'Arial',
			'field-labels-static-font-color' => 'rgb(0, 0, 0)',
			'field-labels-static-weight' => 400,
			'field-labels-static-style' => 'normal',
			'field-labels-static-line-height' => 1,
			'field-labels-static-font-style' => '400 normal',
			'field-labels-hover-font-size' => 12,
			'field-labels-hover-font-family' => 'Arial',
			'field-labels-hover-font-color' => 'rgb(0, 0, 0)',
			'field-labels-hover-weight' => 400,
			'field-labels-hover-style' => 'normal',
			'field-labels-hover-line-height' => 1,
			'field-labels-hover-font-style' => '400 normal',
			'field-labels-focus-font-size' => 12,
			'field-labels-focus-font-family' => 'Arial',
			'field-labels-focus-font-color' => 'rgb(0, 0, 0)',
			'field-labels-focus-weight' => 400,
			'field-labels-focus-style' => 'normal',
			'field-labels-focus-line-height' => 1,
			'field-labels-focus-font-style' => '400 normal',
			'field-values-static-font-size' => 12,
			'field-values-static-font-family' => 'Arial',
			'field-values-static-font-color' => 'rgb(0, 0, 0)',
			'field-values-static-weight' => 400,
			'field-values-static-style' => 'normal',
			'field-values-static-line-height' => 1,
			'field-values-static-font-style' => '400 normal',
			'field-values-hover-font-size' => 12,
			'field-values-hover-font-family' => 'Arial',
			'field-values-hover-font-color' => 'rgb(0, 0, 0)',
			'field-values-hover-weight' => 400,
			'field-values-hover-style' => 'normal',
			'field-values-hover-line-height' => 1,
			'field-values-hover-font-style' => '400 normal',
			'field-values-focus-font-size' => 12,
			'field-values-focus-font-family' => 'Arial',
			'field-values-focus-font-color' => 'rgb(0, 0, 0)',
			'field-values-focus-weight' => 400,
			'field-values-focus-style' => 'normal',
			'field-values-focus-line-height' => 1,
			'field-values-focus-font-style' => '400 normal',
			'button-static-font-size' => 12,
			'button-static-font-family' => 'Arial',
			'button-static-font-color' => 'rgb(0, 0, 0)',
			'button-static-weight' => 400,
			'button-static-style' => 'normal',
			'button-static-line-height' => 1,
			'button-static-font-style' => '400 normal',
			'button-hover-font-size' => 12,
			'button-hover-font-family' => 'Arial',
			'button-hover-font-color' => 'rgb(0, 0, 0)',
			'button-hover-weight' => 400,
			'button-hover-style' => 'normal',
			'button-hover-line-height' => 1,
			'button-hover-font-style' => '400 normal',
			'button-focus-font-size' => 12,
			'button-focus-font-family' => 'Arial',
			'button-focus-font-color' => 'rgb(0, 0, 0)',
			'button-focus-weight' => 400,
			'button-focus-style' => 'normal',
			'button-focus-line-height' => 1,
			'button-focus-font-style' => '400 normal',
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
