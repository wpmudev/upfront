<?php

class Upfront_PluginCompat implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('upfront-core-initialized', array($this, 'initialize'));
	} 

	public function initialize () {
		if (!function_exists('get_plugins')) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$all_plugins = get_plugins();
		if (empty($all_plugins)) return false;

		$root = Upfront::get_root_dir();
		foreach ($all_plugins as $key => $plug) {
			if (!is_plugin_active($key)) continue;
			
			$plugin_id = $this->_to_plugin_id($key, $plug);
			$class_name = "Upfront_Compat_{$plugin_id}";
			if (class_exists($class_name)) continue;

			$file_path = wp_normalize_path($root . '/library/plugins/' . strtolower($class_name) . '.php');
			if (!file_exists($file_path)) continue;

			require_once($file_path);
		}
	}

	private function _to_plugin_id ($key, $plugin) {
		$name = !empty($plugin['Name'])
			? $plugin['Name'] 
			: (!empty($plugin['Title']) ? $plugin['Title'] : '')
		;
		$name = !empty($name)
			? preg_replace('/[^a-z]/', '', strtolower($name))
			: 'plugin'
		;

		$file = end(explode('/', $key));
		$file = preg_replace('/\.php$/', '', $file);
		$file = preg_replace('/[^a-z]/', '_', $file);
		
		return ucfirst($name) . '_' . ucfirst($file);
	}
}
Upfront_PluginCompat::serve();