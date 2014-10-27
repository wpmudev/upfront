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
		add_action('admin_bar_menu', array($this, 'add_edit_menu'), 85);

		// Dispatch all notices
		add_action('admin_notices', array($this, 'dispatch_notices'));

		// Deal with parent deletion attempts
		add_action('load-themes.php', array($this, 'detect_parent_theme_deletion'));
	}

	/**
	 * The notices dispatch hub method.
	 * Each of the array values should be a single string which will be processed, wrapped in Ps and rendered.
	 */
	public function dispatch_notices () {
		$notices = array_filter(apply_filters('upfront-admin-admin_notices', array(
			$this->_notify_about_parent_deletion_attempt(),
			$this->_permalink_setup_check_notice(),
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

	public function add_edit_menu ( $wp_admin_bar ) {
		global $post, $tag, $wp_the_query;
		$current_object = $wp_the_query->get_queried_object();
		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );

		if ( is_plugin_active('upfront-theme-exporter/upfront-theme-exporter.php') ) {
			$wp_admin_bar->add_menu( array(
				'id' => 'upfront-create-theme',
				'title' => __('Create New Theme'),
				'href' => site_url('/create_new/theme'),
				'meta' => array( 'class' => 'upfront-create_theme' )
			) );
		}

		if ( !is_admin() && Upfront_Permissions::current(Upfront_Permissions::BOOT) ){
			$wp_admin_bar->add_menu( array(
				'id' => 'upfront-edit_layout',
				'title' => __('Edit Layout'),
				'href' => '#',
				'meta' => array( 'class' => 'upfront-edit_layout upfront-editable_trigger' )
			) );
		}
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

}