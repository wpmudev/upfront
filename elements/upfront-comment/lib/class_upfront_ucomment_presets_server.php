<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

class Upfront_Ucomment_Presets_Server extends Upfront_Presets_Server {
	protected $isCommentServer = true;
	private static $instance;

	public function get_element_name () {
		return 'ucomment';
	}

	public static function serve () {
		self::$instance = new self;
		self::$instance->_add_hooks();
		add_filter('get_element_preset_styles', array(self::$instance, 'get_preset_styles_filter'));
	}

	public static function get_instance () {
		return self::$instance;
	}

	public function get_preset_styles_filter ($style) {
		$style .= ' ' . self::$instance->get_presets_styles();
		return $style;
	}

	protected function get_style_template_path () {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-comment/templates/preset-style.html');
	}
	
	public static function get_preset_defaults () {
		return array(
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset')
		);
	}
}

Upfront_Ucomment_Presets_Server::serve();
