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


	protected function migrate_presets($presets) {
		if ( !is_array($presets) ) return $presets;
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

	/**
	 * @return array saved presets
	 */
	public function get_presets() {
		$presets = parent::get_presets();

		return $this->migrate_presets($presets);
	}

	protected function get_style_template_path() {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-accordion/tpl/preset-style.html');
	}
}

Upfront_Accordion_Presets_Server::serve();
