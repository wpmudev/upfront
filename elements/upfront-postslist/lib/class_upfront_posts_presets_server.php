<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

class Upfront_PostsLists_Presets_Server extends Upfront_Presets_Server {
	private static $instance;

	public function get_element_name() {
		return 'postslists';
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
		return realpath(Upfront::get_root_dir() . '/elements/upfront-postslist/tpl/preset-style.html');
	}
	
	public static function get_preset_defaults() {
		$defaults = array(
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset'),
			'enabled_post_parts' => array('title', 'content'),

            // Element wrapper defaults
            'element-wrapper-use-border' => '',
            'element-wrapper-border-width' => 1,
            'element-wrapper-border-type' => 'solid',
            'element-wrapper-border-color' => 'rgb(0, 0, 0)',
            'element-wrapper-background-color' => 'rgba(0, 0, 0, 0)',

            // Post wrapper defaults
            'post-wrapper-use-margin' => '',
            'post-wrapper-lock-margin' => '',
            'post-wrapper-left-margin' => '10',
            'post-wrapper-top-margin' => '10',
            'post-wrapper-right-margin' => '10',
            'post-wrapper-bottom-margin' => '10',
            'post-wrapper-use-border' => '',
            'post-wrapper-border-width' => 1,
            'post-wrapper-border-type' => 'solid',
            'post-wrapper-border-color' => 'rgb(0, 0, 0)',
            'post-wrapper-background-color' => 'rgba(0, 0, 0, 0)',

            // Author defaults
			'author-display-name' => 'display_name',
			'author-link' => 'website',
			'author-target' => '_blank',
			'gravatar-use' => 'yes',
			'gravatar-size' => '50',
			'gravatar-border-width' => '0',
			'gravatar-border-type' => 'solid',
			'gravatar-border-color' => 'rgba(0, 0, 0, 0)',
			'gravatar-radius' => '0',
			'gravatar-radius-number' => '0',

			// Featured image defaults
			'featured-image-size' => 'custom_size',
			'featured-custom-width' => 600,
			'featured-custom-height' => 400,

			// Content defaults
			'content-type' => 'full',

			// Tags defaults
			'tags-display-type' => 'inline',
			'tags-show-max' => 3,
			'tags-separate' => ',',
			'tags-padding-top-bottom' => 0,
			'tags-padding-left-right' => 0,
			'tags-margin-top-bottom' => 0,
			'tags-margin-left-right' => 0,
			'tags-background' => 'rgba(0, 0, 0, 0)',
			'tags-single-use' => '',

			// Categories defaults
			'category-display-type' => 'inline',
			'category-show-max' => 3,
			'category-separate' => ',',
			'category-padding-top-bottom' => 0,
			'category-padding-left-right' => 0,
			'category-margin-top-bottom' => 0,
			'category-margin-left-right' => 0,
			'category-background' => 'rgba(0, 0, 0, 0)',
			'category-single-use' => '',

			// Date posted defaults
			'predefined-date-format' => 0,
			'php-date-format' => 'd M Y',

			// Read more defaults
			'read_more-use-border' => '',
			'read_more-border-width' => '1',
			'read_more-border-type' => 'solid',
			'read_more-border-color' => 'rgba(0, 0, 0, 0)',
			'read_more-background-color' => 'rgba(0, 0, 0, 0)',
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
