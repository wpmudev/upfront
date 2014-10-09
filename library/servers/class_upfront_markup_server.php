<?php

class Upfront_Server_MarkupServer extends Upfront_Server {

	const ORIGIN_INTERNAL = '_internal';
	const ORIGIN_PLUGIN = '_plugin';
	const ORIGIN_THEME = '_theme';

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		//add_action('wp_loaded', array($this, 'populate_shortcodes_data'));
		add_action('wp_ajax_upfront_list_shortcodes', array($this, 'json_list_shortcodes'));
	}

	public function json_list_shortcodes () {
		$shortcodes = $this->parse_shortcode_origins();
		$this->_out(new Upfront_JsonResponse_Success($shortcodes));
	}

	public function populate_shortcodes_data () {
		$shortcodes = $this->parse_shortcode_origins();
		localhost_dbg($shortcodes);
	}

	public function parse_shortcode_origins () {
		global $shortcode_tags;
		$by_origin = array();

		if (empty($shortcode_tags)) return $by_origin;

		foreach ($shortcode_tags as $code => $callback) {
			if (empty($callback)) continue;
			
			$origin = $this->find_callback_origin($callback);
			$origin = !empty($origin) ? $origin : self::ORIGIN_INTERNAL;
			
			$by_origin[$origin] = is_array($by_origin[$origin]) ? $by_origin[$origin] : array();
			$by_origin[$origin][] = $code;
		}
		return $by_origin;
	}

	public function find_callback_origin ($callback) {
		if (empty($callback) || !is_callable($callback)) return false;
		if (is_array($callback) && class_exists('ReflectionMethod')) return $this->_find_origin_method($callback);
		else if (class_exists('ReflectionFunction')) return $this->_find_origin_function($callback);
		return false;
	}

	private function _find_origin_method ($callback) {
		$reflector = new ReflectionMethod($callback[0], $callback[1]);
		$file = $reflector->getFileName();
		return $this->_map_file_to_relative_origin($file);
	}

	private function _find_origin_function ($callback) {
		$reflector = new ReflectionFunction($callback);
		$file = $reflector->getFileName();
		return $this->_map_file_to_relative_origin($file);
	}

	private function _map_file_to_relative_origin ($file) {
		$file = wp_normalize_path(realpath($file));
		$plugin_path_rx = preg_quote(wp_normalize_path(WP_PLUGIN_DIR), '/');
		$muplugin_path_rx = preg_quote(wp_normalize_path(WPMU_PLUGIN_DIR), '/');
		$theme_path_rx = preg_quote(wp_normalize_path(get_theme_root()), '/');
		
		$path_prefix = false;
		if (preg_match('/^' . $plugin_path_rx . '/', $file)) $path_prefix = $plugin_path_rx;
		else if (preg_match('/^' . $muplugin_path_rx . '/', $file)) $path_prefix = $muplugin_path_rx;
		else if (preg_match('/^' . $theme_path_rx . '/', $file)) $path_prefix = $theme_path_rx;

		if (empty($path_prefix)) return self::ORIGIN_INTERNAL; // Not a pugin, mu-plugin or a theme

		$clean_path = explode('/', ltrim(preg_replace('/^' . $path_prefix . '/', '', $file), '/'));
		$basename = !empty($clean_path[0]) ? $clean_path[0] : false;
		if (empty($basename)) return self::ORIGIN_INTERNAL; // We had an issue along the way and can't figure it out further

		if (!function_exists('get_plugin_data')) require_once(ABSPATH . 'wp-admin/includes/plugin.php');
		$all_plugins = get_plugins();

		if ($path_prefix === $plugin_path_rx || $path_prefix === $muplugin_path_rx) { // It's a plugin, get the name
			$info = false;
			foreach ($all_plugins as $plugin => $pinfo) {
				if (!preg_match('/^' . preg_quote(trailingslashit($basename), '/') . '/', $plugin)) continue;
				$info = $pinfo;
				break;
			}
			if (empty($info)) {
				// Let's give it one last go for mu-plugins
				$info = get_plugin_data($file);
			}
			return !empty($info['Name'])
				? $info['Name']
				: self::ORIGIN_PLUGIN
			;
		} else if ($theme_path_rx === $path_prefix) {
			$info = wp_get_theme($basename);
			$name = is_object($info) && method_exists($info, 'get')
				? $info->get('Name')
				: false
			;
			return !empty($name)
				? $name
				: self::ORIGIN_THEME
			;
		}
		return self::ORIGIN_INTERNAL;
	}
}
add_action('init', array('Upfront_Server_MarkupServer', 'serve'));