<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

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

	/**
	 * @return array saved presets
	 */
	public function get_presets() {
		$presets = parent::get_presets();

		// Fix migration style issue
		foreach($presets as $index=>$preset) {
			if (isset($preset['active-use-color']) === false) {
				$presets[$index]['active-use-color'] = 1;
			}
			if (isset($preset['active-use-typography']) === false) {
				$presets[$index]['active-use-typography'] = 1;
			}
		}

		return $presets;
	}

	protected function get_style_template_path() {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-accordion/tpl/preset-style.html');
	}
	
	public static function get_preset_defaults() {
		return array(
			'static-font-size' => 18,
			'static-font-family' => 'Arial',
			'static-font-color' => 'rgb(96, 96, 96)',
			'static-font-style' => '400 normal',
			'static-weight' => 400,
			'static-style' => 'normal',
			'static-line-height' => 2,
			'static-header-bg-color' => 'rgba(232, 232, 232, 1)',
			'static-triangle-icon-color' => 'rgbа(0, 0, 0, 1)',
			'static-useborder' => '',
			'static-borderwidth' => 1,
			'static-bordertype' => 'solid',
			'static-bordercolor' => 'rgbа(0, 0, 0, 0.5)',
			'hover-font-size' => 18,
			'hover-font-family' => 'Arial',
			'hover-font-color' => 'rgb(128, 128, 128)',
			'hover-font-style' => '400 normal',
			'hover-weight' => 400,
			'hover-style' => 'normal',
			'hover-line-height' => 2,
			'hover-header-bg-color' => 'rgba(232, 232, 232, 1)',
			'hover-triangle-icon-color' => 'rgbа(0, 0, 0, 1)',
			'hover-useborder' => '',
			'hover-borderwidth' => 1,
			'hover-bordertype' => 'solid',
			'hover-bordercolor' => 'rgbа(0, 0, 0, 0.5)',
			'hover-transition-duration' => 0.3,
			'hover-transition-easing' => 'ease-in-out',
			'active-font-size' => 18,
			'active-font-family' => 'Arial',
			'active-font-color' => 'rgb(128, 128, 128)',
			'active-font-style' => '400 normal',
			'active-weight' => 400,
			'active-style' => 'normal',
			'active-line-height' => 2,
			'active-header-bg-color' => 'rgba(232, 232, 232, 1)',
			'active-triangle-icon-color' => 'rgbа(0, 0, 0, 1)',
			'active-useborder' => '',
			'active-borderwidth' => 1,
			'active-bordertype' => 'solid',
			'active-bordercolor' => 'rgbа(0, 0, 0, 0.5)',
			'active-use-color' => 1,
			'active-use-typography' => 1,
			'global-useborder' => '',
			'global-borderwidth' => 2,
			'global-bordertype' => 'solid',
			'global-bordercolor' => 'rgbа(0, 0, 0, 0.5)',
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset')
		);
	}
}

Upfront_Accordion_Presets_Server::serve();
