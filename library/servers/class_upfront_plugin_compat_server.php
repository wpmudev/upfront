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

		$loaded = false;

		$root = Upfront::get_root_dir();
		foreach ($all_plugins as $key => $plug) {
			if (!is_plugin_active($key)) continue;
			
			$plugin_id = $this->_to_plugin_id($key, $plug);

			// Let's try and see if anything registered the compatibility layer first
			if (apply_filters('upfront-core-plugin_compat', false, $plugin_id, $plug)) {
				$loaded = true;
				continue;
			}

			$class_name = "Upfront_Compat_{$plugin_id}";
			if (class_exists($class_name)) continue;

			$file_path = wp_normalize_path($root . '/library/plugins/' . strtolower($class_name) . '.php');
			if (!file_exists($file_path)) continue;

			require_once($file_path);

			$loaded = true;
		}

		// If we have a loaded plugin, let's add some generic loaded styles
		if ($loaded) {
			add_action('wp_footer', array($this, 'inject_editor_styles'));
		}
	}

	public function inject_editor_styles () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false;
		echo <<<EO_PLUGIN_COMPAT_STYLES
<style>
.upfront-plugin_compat {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 100%;
	text-align: center;
	opacity: .2;

}
.upfront-plugin_compat p {
	text-align: center;
	width: 100%;
	font-size: 3em;
}
</style>
EO_PLUGIN_COMPAT_STYLES;
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

		$file_parts = explode('/', $key);
		$file = end($file_parts);
		$file = preg_replace('/\.php$/', '', $file);
		$file = preg_replace('/[^a-z]/', '_', $file);
		
		return ucfirst($name) . '_' . ucfirst($file);
	}
}
Upfront_PluginCompat::serve();