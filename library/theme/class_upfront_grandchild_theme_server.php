<?php

class Upfront_GrandchildTheme_Server implements IUpfront_Server {

	const RELATIONSHIP_FLAG = 'UpfrontParent';

	private function __clone () {}
	private function __construct () {}

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_filter('extra_theme_headers', array($this, 'child_relationship_headers'));
		add_action('after_setup_theme', array($this, 'check_theme_relationship'), 0);
		wp_get_theme()->cache_delete();
	}

	public function child_relationship_headers ($headers) {
		$headers = is_array($headers) ? $headers : array();
		$headers[] = self::RELATIONSHIP_FLAG;
		return $headers;
	}

	public function check_theme_relationship () {
		if (defined('UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF') && UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF) return false; // Already a grandchild theme!
		$data = wp_get_theme();
		$theme = !empty($data) ? $data->get(self::RELATIONSHIP_FLAG) : false;
		if (empty($theme)) return false;
		define('UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF', $theme);
		$this->_initialize_grandchild_relationship();
	}

	private function _initialize_grandchild_relationship () {
		if (!(defined('UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF') && UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF)) return $template; // Not a grandchild theme!

		define('UPFRONT_GRANDCHILD_THEME_PARENT_PATH', realpath(trailingslashit(dirname(get_stylesheet_directory())) . UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF));
		define('UPFRONT_GRANDCHILD_THEME_PARENT_URL', trailingslashit(dirname(get_stylesheet_directory_uri())) . UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF);

		include UPFRONT_GRANDCHILD_THEME_PARENT_PATH . '/functions.php';

		add_action('wp_enqueue_scripts', array($this, 'enqueue_parent_style'), 1);
	}

	public function enqueue_parent_style () {
		if (!(defined('UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF') && UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF)) return false; // Not a grandchild theme!
		wp_enqueue_style(UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF, UPFRONT_GRANDCHILD_THEME_PARENT_URL . '/style.css', array(), null);
	}

}
Upfront_GrandchildTheme_Server::serve();