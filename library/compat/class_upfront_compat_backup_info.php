<?php

class Upfront_Compat_Backup_Info {

	public function __construct () {}

	/**
	 * Check if we have our plugin ready, or at least present
	 *
	 * @return bool
	 */
	public function has_plugin () {
		if ($this->is_plugin_active()) return true;
		return (bool)$this->is_plugin_present();
	}

	/**
	 * Check if our backup plugin is ready for work
	 *
	 * @return bool
	 */
	public function is_plugin_active () {
		return class_exists('WPMUDEVSnapshot') && is_callable(array('WPMUDEVSnapshot', 'instance'));
	}

	/**
	 * Check if our backup plugin is present, just not activated
	 *
	 * @return bool
	 */
	public function is_plugin_present () {
		$present = false;
		if (!function_exists('get_plugins')) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$plugins = get_plugins();
		if (!is_array($plugins) || empty($plugins)) return false;

		return !empty($plugins['snapshot/snapshot.php']);
	}

	/**
	 * Returns the backup nag link
	 *
	 * If Snapshot is active, return backup link
	 * If Snapshot is not active but it's there, return activation link
	 * If no Snapshot and yes Dashboard, go with Dashboard install link
	 * Otherwise, go with project URL
	 *
	 * @return string
	 */
	public function get_plugin_link () {
		if ($this->is_plugin_active()) return $this->_get_backup_url();
		if ($this->is_plugin_present() && current_user_can('activate_plugins')) return $this->_get_activation_url();
		return $this->_has_dashboard()
			? $this->_get_dashboard_url()
			: $this->_get_project_url()
		;
	}

	/**
	 * Get proper action verb, based on plugin state
	 *
	 * If Snapshot active, backup
	 * If not active and preset, activate
	 * Otherwise, install
	 *
	 * @return string
	 */
	public function get_plugin_action () {
		if ($this->is_plugin_active()) return __('Backup with Snapshot', 'upfront');
		if ($this->is_plugin_present() && current_user_can('activate_plugins')) return __('Activate Snapshot', 'upfront');
		
		return __('Install Snapshot', 'upfront');
	}

	/**
	 * Check if we have Dashbaord plugin alive and active
	 *
	 * @return bool
	 */
	private function _has_dashboard () {
		if (!class_exists('WPMUDEV_Dashboard')) return false;
		
		if (!empty(WPMUDEV_Dashboard::$site) && is_callable(array(WPMUDEV_Dashboard::$site, 'allowed_user'))) {
			return WPMUDEV_Dashboard::$site->allowed_user();
		}

		return false;
	}

	/**
	 * Get Dashboard install URL
	 *
	 * @return string
	 */
	private function _get_dashboard_url () {
		return admin_url('admin.php?page=wpmudev-plugins#pid=257');
	}

	/**
	 * Gets project page URL
	 *
	 * @return string
	 */
	private function _get_project_url () {
		return 'https://premium.wpmudev.org/project/snapshot/';
	}

	/**
	 * Gets backup actionable URL
	 *
	 * @return string
	 */
	private function _get_backup_url () {
		return admin_url('admin.php?page=snapshots_new_panel');
	}

	/**
	 * Gets plugins activation URL
	 *
	 * @return string
	 */
	private function _get_activation_url () {
		return admin_url('plugins.php');
	}
	
}