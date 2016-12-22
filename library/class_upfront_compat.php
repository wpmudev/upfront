<?php

require_once('compat/class_upfront_compat_converter.php');
require_once('compat/class_upfront_compat_parser.php');
require_once('compat/class_upfront_compat_woocommerce.php');
require_once('compat/class_upfront_compat_marketpress.php');
require_once('compat/class_upfront_compat_as3cf.php');

class Upfront_Compat implements IUpfront_Server {

	/**
	 * Check if we have Dashboard plugin alive and active
	 *
	 * @return bool
	 */
	public static function has_dashboard () {
		return class_exists('WPMUDEV_Dashboard');
	}


	/**
	 * Front-end update notice key
	 *
	 * @return string
	 */
	public static function get_upgrade_notice_key () {
		return 'upfront-admin-update_notices-done';
	}

	/**
	 * Fetch currently installed upfront core version
	 *
	 * @return mixed (string)Theme version number, or (bool)false on failure
	 */
	public static function get_upfront_core_version () {
		return wp_get_theme('upfront')->Version;
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

	/**
	 * Check if a child theme has been released
	 *
	 * Released children have WDP ID header set
	 *
	 * @param string $child (Optional)Child theme slug
	 *
	 * @return boolean
	 */
	public static function is_upfront_child_released ($child=false) {
		$theme = wp_get_theme($child);
		if (!is_object($theme)) return false;

		$wdp_id = $theme->get('WDP ID');
		return !empty($wdp_id);
	}

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (!is_admin() || (defined('DOING_AJAX') && DOING_AJAX)) {
			$this->_check_v1_transition();
			$this->_check_v1_backup();
		}

		if (is_admin()) {
			// Only in admin area
			add_filter('site_transient_update_themes', array($this, 'prevent_conflicted_children_updates'));
		}

		add_action('wp_ajax_upfront-notices-dismiss', array($this, 'json_dismiss_notices'));

		// Hummingbird compat layer
		add_filter('wphb_minification_display_enqueued_file', array($this, 'is_upfront_resource_skippable_with_hummingbird'), 10, 3);
		add_filter('wphb_combine_resource', array($this, 'is_upfront_resource_skippable_with_hummingbird'), 10, 3);
		add_filter('wphb_minify_resource', array($this, 'is_upfront_resource_skippable_with_hummingbird'), 10, 3);

		// WooCommerce compat
		$this->enable_wc_compat();
		$this->enable_mp_compat();
		
		$this->enable_as3cf_compat();
	}

	/**
	 * Suppresses Upfront child themes update notices in regular WP areas
	 *
	 * @param mixed $raw Transient content - theme updates response
	 *
	 * @return mixed Processed response
	 */
	public function prevent_conflicted_children_updates ($raw) {
		if (defined('DOING_AJAX') && DOING_AJAX) return $raw; // Presumably we know what we're doing there
		// Only ever kick in when there's no WPMU DEV Dashboard around.
		// Otherwise, trust it'll do the right thing on its own.
		if (Upfront_Compat::has_dashboard()) return $raw;

		if (empty($raw) || empty($raw->response)) return $raw; // So nothing new here, carry on

		$screen = ( function_exists('get_current_screen') ) ? get_current_screen() : '';
		if (empty($screen)) return $raw; // If it's too early to do this, we're probably good with raw

		// Now, let's attempt to match pages
		if (preg_match('/upfront|builder/', $screen->id)) return $raw; // We know what to do here

		$updates = is_array($raw->response) ? $raw->response : array();
		$children = $this->_get_children_cache();

		foreach ($updates as $key => $nfo) {
			if (in_array($key, $children)) unset($raw->response[$key]);
		}

		return $raw;
	}

	/**
	 * Get the list of all Upfront children
	 *
	 * Populate the Upfront children cache if none is set
	 *
	 * @return array
	 */
	private function _get_children_cache () {
		$result = wp_cache_get('upfront-children', 'upfront');
		if (false !== $result && is_array($result)) return $result; // We have cache, let's go

		$result = array();
		$themes = wp_get_themes();
		if (!empty($themes)) foreach ($themes as $key => $theme) {
			$parent = $theme->parent();
			if (empty($parent)) continue; // Oops
			if ('upfront' !== $parent->get_template()) continue; // Not an upfront child
			$result[] = $key;
		}

		$timeout = apply_filters('upfront-compat-cache_expiry', HOUR_IN_SECONDS/4); // Keep the result around for a while
		wp_cache_set('upfront-children', $result, 'upfront', $timeout);

		return $result;
	}

	/**
	 * Hooks up to Hummingbird's native filters
	 *
	 * Fixes the necessary resources needed for Upfront to boot properly
	 *
	 * @param bool $action Context-dependent action to take (false means "skip")
	 * @param mixed $item Content-dependent item to process - array for display, string for combine/minify actions
	 * @param string $type Item type
	 *
	 * @return bool
	 */
	public function is_upfront_resource_skippable_with_hummingbird ($action, $item, $type) {
		$handle = is_string($item) ? $item : (!empty($item['handle']) ? $item['handle'] : 'unknown');
		return in_array($handle, array('upfront-main', 'upfront-element-styles', 'upfront-element-scripts'))
			? false
			: $action
		;
	}

	/**
	 * Check the transition conditions for non-v1 children and dispatch script warning if needed
	 */
	private function _check_v1_transition () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false; // We don't care, not editable
		if (function_exists('upfront_exporter_is_running') && upfront_exporter_is_running()) return false; // Not in exporter
		if (version_compare(self::get_upfront_child_version(), '1.0-alpha-1', 'ge')) return false; // Child is at or above v1 - good

		// Child theme is not released
		if (!self::is_upfront_child_released()) return false;

		if (empty($this->_v1_script_added)) {
			Upfront_CoreDependencies_Registry::get_instance()->add_script(
				trailingslashit(Upfront::get_root_url()) . 'scripts/upfront/compat/v1.js'
			);
			$this->_v1_script_added = true;
			add_filter('upfront_data', array($this, 'add_v1_transition_data'));
		}
	}

	/**
	 * Add backup notice on the v1 first editor boot
	 */
	private function _check_v1_backup () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false; // We don't care, not editable
		if (function_exists('upfront_exporter_is_running') && upfront_exporter_is_running()) return false; // Not in exporter
		if ($this->_is_update_notice_dismissed_for('1.0')) return false; // We have notices dismissed for v1.0 version and below

		if (!class_exists('Upfront_Compat_Backup_Info')) require_once('compat/class_upfront_compat_backup_info.php');
		$info = new Upfront_Compat_Backup_Info;
		if (!$info->is_actionable()) return false;

		// This check is potentially costly, so don't do it unless we have to
		if (!(defined('DOING_AJAX') && DOING_AJAX)) {
			if (!$this->_is_updated_install()) return false; // Only on updated installs
		}

		$this->_has_backup_notice = true;

		if (empty($this->_v1_script_added)) {
			Upfront_CoreDependencies_Registry::get_instance()->add_script(
				trailingslashit(Upfront::get_root_url()) . 'scripts/upfront/compat/v1.js'
			);
			$this->_v1_script_added = true;
			add_filter('upfront_data', array($this, 'add_v1_transition_data'));
		}
	}

	/**
	 * Check if this is an updated install, or a new one
	 *
	 * @return bool
	 */
	private function _is_updated_install () {
		$cache = Upfront_Cache::get_instance(Upfront_Cache::TYPE_LONG_TERM);
		$updated = $cache->get('upfront-updated', 'upfront-core');

		if ($updated === false) {
			$updated_flag = get_option('upfront_is_updated_install');
			if (empty($updated_flag)) {
				global $wpdb;
				$theme_key = $wpdb->esc_like('_transient_' . Upfront_Model::get_storage_key()) . '%ver1.0.0'; // Check transition caches
				$global_key = $wpdb->esc_like('upfront_') . '%'; // Check global keys
				$result = (int)$wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE %s OR option_name LIKE %s", $global_key, $theme_key));

				$updated = !empty($result) ? 'yes' : 'no';

				if (empty($result)) {
					update_option('upfront_is_updated_install', 'no');
				}

				$cache->set('upfront-updated', 'upfront-core', $updated);
			}
		}

		return !empty($updated) && 'yes' === $updated;
	}

	/**
	 * Check if the update notice is already seen
	 *
	 * @return bool
	 */
	private function _is_update_notice_dismissed () {
		return $this->_is_update_notice_dismissed_for(self::get_upfront_core_version());
	}

	/**
	 * Check if update notice for a particular core version has already been seen
	 *
	 * @param string $version Core version number
	 *
	 * @return bool
	 */
	private function _is_update_notice_dismissed_for ($version) {
		$done = get_option(self::get_upgrade_notice_key(), '0');
		return version_compare($version, $done, 'le');
	}

	/**
	 * Dismisses current version update notice
	 *
	 * @return bool
	 */
	private function _dismiss_update_notice () {
		return $this->_dismiss_update_notice_for(self::get_upfront_core_version());
	}

	/**
	 * Dismisses update notice for a particular core version
	 *
	 * @param string $version Core version number
	 *
	 * @return bool
	 */
	private function _dismiss_update_notice_for ($version) {
		return update_option(self::get_upgrade_notice_key(), $version);
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

		if (!empty($this->_has_backup_notice) && Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			if (!class_exists('Upfront_Compat_Backup_Info')) require_once('compat/class_upfront_compat_backup_info.php');
			$info = new Upfront_Compat_Backup_Info;
			$data['Compat']['notice'] = '' .
				__('We’ve put a lot of time into getting the migration process right, however given the variety of layouts that can be achieved with Upfront and the amazing improvements we’ve added in version 1.0, we strongly advise that you to make a full backup of your site with <b>Snapshot</b> before proceeding to edit your site. ', 'upfront') .
			'';
			$data['Compat']['snapshot_url'] = esc_url($info->get_plugin_link());
			$data['Compat']['snapshot_msg'] = esc_html($info->get_plugin_action());
		}

		return $data;
	}

	/**
	 * Notices dismissal AJAX handler
	 */
	public function json_dismiss_notices () {
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) die; // We don't care, not editable
		if ($this->_is_update_notice_dismissed()) return false; // We have notices dismissed for this version and below

		$this->_dismiss_update_notice();
		die;
	}

	private function enable_wc_compat() {
		if (class_exists('Upfront_Compat_WooCommerce')) {
			new Upfront_Compat_WooCommerce();
		}
	}

	private function enable_mp_compat() {
		if (class_exists('Upfront_Compat_MarketPress')) {
			new Upfront_Compat_MarketPress();
		}
	}
	
	private function enable_as3cf_compat() {
		if (class_exists('Upfront_Compat_AS3CF')) {
			new Upfront_Compat_AS3CF();
		}
	}
}

add_action('init', array('Upfront_Compat', 'serve'));
