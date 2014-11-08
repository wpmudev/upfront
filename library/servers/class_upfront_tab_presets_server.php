<?php

require_once('class_upfront_presets_server.php');

class Upfront_Tab_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'tab';
	}

	public static function serve () {
		self::$instance = new self;
		self::$instance->_add_hooks();
	}

	public static function get_instance() {
		return self::$instance;
	}

	protected function get_style_template_path() {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-tabs/tpl/preset-style.html');
	}
}

add_action('init', array('Upfront_Tab_Presets_Server', 'serve'));
