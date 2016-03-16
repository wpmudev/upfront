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
		
		// Adding fonts
		$this->_inject_admin_fonts();
		
		// Dispatch all notices
		add_action('admin_notices', array($this, 'dispatch_notices'));
		
		add_action('admin_notices', array($this, 'pagetemplate_notice'));

		// Deal with parent deletion attempts
		add_action('load-themes.php', array($this, 'detect_parent_theme_deletion'));

		// Deal with the themes list and overall customizer requests
		add_filter('wp_prepare_themes_for_js', array($this, 'prepare_themes_list'));
		add_action('admin_menu', array($this, 'prepare_menu'));
		add_action('admin_footer-themes.php', array($this, 'nasty_hack_themes_page')); // Bah!

		add_action( 'widgets_init', array($this, 'add_widgets_page') );

		// Kill the damn customizer. It's like cancer, popping out randomly all over the place
		add_action('customize_controls_init', array($this, 'refuse_customizer'));

		$this->dashboard_notice();
	}
	
	public function pagetemplate_notice() {
		if(($GLOBALS['pagenow'] == "post.php" && get_current_screen()->post_type == "page")|| $GLOBALS['pagenow'] == "post-new.php" ) {
			echo '<div class="error"><p>'. __('WARNING: If you change the template associated with this post then any content or changes you have made using the drag and drop Upfront editor will be lost.', 'upfront'). '</p></div>';
		}
	}
	
	public function dashboard_notice () {
		$path = wp_normalize_path(Upfront::get_root_dir() . '/library/external/dashboard-notice/wpmudev-dash-notification.php');
		if (!file_exists($path)) return false;

		require_once($path);
	}

	/**
	 * If someone tries to "live preview", send them back.
	 */
	public function refuse_customizer () {
		$screen = get_current_screen();
		if (!($screen && !empty($screen->id) && 'customize' === $screen->id)) return false;
		
		// We just don't do customizer.
		wp_safe_redirect(admin_url('themes.php'));
		die;
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
	 * Deal with doubled up customize links for active theme in themes.php popup (@WPv4.1)
	 * Is this nasty? Why, yes, yes it is. The way the action links are built in core is worse though (wp-admin/themes.php, lines 157-200)
	 */
	public function nasty_hack_themes_page () {
		echo '<style>.theme-overlay.active .button[href^="themes.php?page=http"] { display: none !important; } </style>';
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
			$this->_widgets_area_notice(),
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
	
	/**
	 * Adding fonts for admin side
	 */
	private function _inject_admin_fonts () {
		$deps = Upfront_CoreDependencies_Registry::get_instance();
		$deps->add_font('Roboto', array(
			'100',
			'100italic',
			'300',
			'300italic',
			'400',
			'400italic',
			'500',
			'500italic',
			'700',
			'700italic',
			'900',
			'900italic'
		));
		$deps->add_font('Roboto Condensed', array(
			'300',
			'300italic',
			'400',
			'400italic',
			'700',
			'700italic'
		));
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

	/**
	 * Adds widgets page to Upfront themes
	 * Adds widgets Upfront theme when Theme Tester plugin is activated
	 */
	public function add_widgets_page() {
		add_theme_support('widgets');
		
		$active_widgets = array();
		//Theme Tester Plugin
		$original_theme = get_option( 'tt_orig_stylesheet' );
		if(isset($original_theme) && !empty($original_theme)) {
			$original_widgets = get_option('theme_mods_'.$original_theme);
			if(isset($original_widgets['sidebars_widgets']['data'])) {
				foreach($original_widgets['sidebars_widgets']['data'] as $id=>$widget) {
					if (strpos($id,'orphaned') !== false || $id == "wp_inactive_widgets") {
						continue;
					}
					register_sidebar(
						array (
							'name'          => $id,
							'id'            => $id,
							'before_widget' => '',
							'after_widget'  => ''
						)
					);
					
					foreach($widget as $wid) {
						$active_widgets[ $id ][] = $wid;
					}
				}
				update_option( 'sidebars_widgets', $active_widgets );
			}
		}
		
		//A/B Theme Testing
		$theme_testing = get_option('ab_theme_testing');
		if(isset($theme_testing['testing_enable']) && $theme_testing['testing_enable'] == 1) {
			if(!isset($theme_testing['tracking_themes']) && empty($theme_testing['tracking_themes'])) { return; }
			
			foreach($theme_testing['tracking_themes'] as $themes) {
				$explode_theme_name = explode('|', $themes);
				if(isset($explode_theme_name[0]) && !empty($explode_theme_name[0])) {
					$original_widgets = get_option('theme_mods_'.$explode_theme_name[0]);
					
					if(isset($original_widgets['sidebars_widgets']['data'])) {
						foreach($original_widgets['sidebars_widgets']['data'] as $id=>$widget) {
							if (strpos($id,'orphaned') !== false || $id == "wp_inactive_widgets") {
								continue;
							}
							register_sidebar(
								array (
									'name'          => $id,
									'id'            => $id,
									'before_widget' => '',
									'after_widget'  => ''
								)
							);
							
							foreach($widget as $wid) {
								$active_widgets[ $id ][] = $wid;
							}
						}
						update_option( 'sidebars_widgets', $active_widgets );
					}
				}
			}
		}
	}

	/**
	 * Renders notice to widgets page
	 *
	 * @return string|void
	 */
	private function _widgets_area_notice(){
		global $pagenow;
		if( !isset($pagenow) || $pagenow !== "widgets.php" ) return;

		return sprintf(
				__('To make use of your widgets, add Widget element to your layouts. You can do so <a href="%s">here</a>', 'upfront'),
				get_home_url() . "?editmode=true"
			);
	}
}