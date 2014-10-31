<?php
/**
 * Handles the admin side of things.
 */
class Upfront_Server_Admin implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		// Dispatch all notices
		add_action('admin_notices', array($this, 'dispatch_notices'));

		// Deal with parent deletion attempts
		add_action('load-themes.php', array($this, 'detect_parent_theme_deletion'));

		// Deal with the themes list and overall customizer requests
		add_filter('wp_prepare_themes_for_js', array($this, 'prepare_themes_list'));
		add_action('admin_menu', array($this, 'prepare_menu'));
	}

	/**
	 * Deal with appearance customizer menu.
	 */
	public function prepare_menu () {
		global $submenu;
		if (empty($submenu['themes.php'])) return false;
		foreach ($submenu['themes.php'] as $key => $item) {
			if (empty($item[1]) || 'customize' !== $item[1]) continue;
			$submenu['themes.php'][$key][2] = $this->_get_editable_theme_url();
			break;
		}
	}

	/**
	 * Preparing each of the theme's info for themes list in admin area.
	 */
	public function prepare_themes_list ($prepared_themes) {
		if (!is_array($prepared_themes) || empty($prepared_themes)) return $prepared_themes;
		foreach ($prepared_themes as $key => $theme) {
			if (empty($theme['id']) || 'upfront' === $theme['id']) continue; // Don't deal with broken themes or UF core
			if (empty($theme['parent']) || 'upfront' !== strtolower($theme['parent'])) continue; // Not dealing with the non-child themes or non-uf child themes

			if (!empty($prepared_themes[$key]['actions'])) $prepared_themes[$key]['actions']['customize'] = $this->_get_editable_theme_url();
		}
		return $prepared_themes;
	}

	/**
	 * The notices dispatch hub method.
	 * Each of the array values should be a single string which will be processed, wrapped in Ps and rendered.
	 */
	public function dispatch_notices () {
		$notices = array_filter(apply_filters('upfront-admin-admin_notices', array(
			$this->_notify_about_parent_deletion_attempt(),
			$this->_permalink_setup_check_notice(),
			$this->_direct_core_activation_notice(),
		)));
		if (empty($notices)) return false;
		echo '<div class="error"><p>' .
			join('</p><p>', $notices) .
		'</p></div>';
	}

	/**
	 * So, we can't deal with parent theme deletion because, apparently, 
	 * that's voodoo: https://core.trac.wordpress.org/ticket/14955#comment:16
	 */
	public function detect_parent_theme_deletion () {
		if (empty($_GET['action']) || 'delete' !== $_GET['action']) return false;
		$stylesheet = !empty($_GET['stylesheet'])
			? $_GET['stylesheet']
			: false
		;
		if ('upfront' !== $stylesheet) return false; // Not deleting Upfront core, no reason to stick around
		
		$current = wp_get_theme();
		$parent = $current->parent();
		if (empty($parent)) return false; // Current theme is not a child theme, carry on...
		if ('upfront' !== $parent->get_template()) return false; // Not an Upfront child, carry on...

		// We are here, so the user is deleting Upfront core with Upfront child theme active.
		wp_safe_redirect(admin_url('themes.php?upfront-delete=refused'));
		die;
	}

	private function _get_editable_theme_url () {
		return home_url('?editmode=true');
	}

	/**
	 * Cry out on refused deletion.
	 */
	private function _notify_about_parent_deletion_attempt () {
		if (empty($_GET['upfront-delete'])) return false;
		return __('You have tried removing Upfront core while still having an Upfront child theme active. Please, activate a different theme and try again.', 'upfront');
	}

	/**
	 * Cry out on missing pretty permalinks.
	 */
	private function _permalink_setup_check_notice () {
		if (get_option('permalink_structure')) return false;
		$msg = sprintf(
			__('Upfront requires Pretty Permalinks to work. Please enable them <a href="%s">here</a>', 'upfront'),
			admin_url('/options-permalink.php')
		);
		return $msg;
	}

	/**
	 * Check if the active theme is Upfront core itself and cry out if it is.
	 */
	private function _direct_core_activation_notice () {
		$current = wp_get_theme();
		if ('upfront' !== $current->template) return false; // Don't deal with non-upfront themes.

		$parent = $current->parent();
		if (!empty($parent)) return false; // Don't deal with child themes.
		
		return __('Please, activate one of the Upfront child themes.', 'upfront');
	}

}