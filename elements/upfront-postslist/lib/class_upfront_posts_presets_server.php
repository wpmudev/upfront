<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

class Upfront_PostsLists_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'posts';
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
		$style .= ' ' . self::$instance->get_presets_styles();
		return $style;
	}

	/**
	 * @return array saved presets
	 */
	public function get_presets() {
		$presets = parent::get_presets();

		return $presets;
	}

	protected function get_style_template_path() {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-posts/tpl/preset-style.html');
	}
	
	public static function get_preset_defaults() {
		$defaults = array(
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset'),
			'enabled_post_parts' => array('title', 'content')
		);
		
		$default_parts = Upfront_PostsLists_PostView::get_default_parts();
		$default_parts = apply_filters('upfront_postslists-defaults-default_parts', $default_parts);

		// Set post part templates to preset
		foreach ($default_parts as $part) {
			$key = Upfront_PostsLists_PostsData::_slug_to_part_key($part);
			$defaults[$key] = Upfront_PostsLists_PostsData::get_template($part);
		}

		return $defaults;
	}
}

Upfront_PostsLists_Presets_Server::serve();
