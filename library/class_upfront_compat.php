<?php

require_once('compat/class_upfront_compat_converter.php');
require_once('compat/class_upfront_compat_parser.php');

class Upfront_Compat implements IUpfront_Server {

	/**
	 * Fetch currently installed upfront core version
	 *
	 * @return mixed (string)Theme version number, or (bool)false on failure
	 */
	public static function get_upfront_core_version () {
		wp_get_theme('upfront')->Version;
	}

	/**
	 * Fetch currently active Upfront child theme version
	 *
	 * @return mixed (string)Theme version number, or (bool)false on failure
	 */
	public static function get_upfront_child_version () {
		$current = wp_get_theme();
		$parent = $current->parent();
		if (empty($parent)) return false; // Current theme is not a child theme, carry on...
		if ('upfront' !== $parent->get_template()) return false; // Not an Upfront child, carry on...

		return $current->Version;
	}

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (!is_admin() || (defined('DOING_AJAX') && DOING_AJAX)) {
			$this->_check_v1_transition();
		}
	}

	/**
	 * Check the transition conditions for non-v1 children and dispatch script warning if needed
	 */
	private function _check_v1_transition () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false; // We don't care, not editable
		if (function_exists('upfront_exporter_is_running') && upfront_exporter_is_running()) return false; // Not in exporter
		if (version_compare(self::get_upfront_child_version(), '1.0-alpha-1', 'ge')) return false; // Child is at or above v1 - good

		Upfront_CoreDependencies_Registry::get_instance()->add_script(
			trailingslashit(Upfront::get_root_url()) . 'scripts/upfront/compat/v1.js'
		);
		add_filter('upfront_data', array($this, 'add_v1_transition_data'));
	}

	/**
	 * Data filtering handler
	 *
	 * @param array $data
	 */
	public function add_v1_transition_data ($data) {
		$current = wp_get_theme();
		$data['Compat'] = array(
			'theme' => $current->Name,
			'theme_url' => admin_url('themes.php'),
		);
		return $data;
	}



} 
add_action('init', array('Upfront_Compat', 'serve'));