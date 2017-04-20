<?php
include_once "admin/class_upfront_admin_page.php";
include_once "admin/class_upfront_admin_general.php";
include_once "admin/class_upfront_admin_restrictions.php";
include_once "admin/class_upfront_admin_experimental.php";
include_once "admin/class_upfront_admin_api_keys.php";
include_once "admin/class_upfront_admin_response_cache.php";

/**
 * Constructs Upfront admin pages
 *
 * Class Upfront_Admin
 */
class Upfront_Admin
{

	public static $menu_slugs = array(
		"main" => "upfront",
		"restrictions" => "upfront_restrictions",
		"experimental" => "upfront_experimental"
	);

	/**
	 * Hook to necessary hooks, add assets and initialize the admin
	 *
	 * Upfront_Admin constructor.
	 */
	function __construct()
	{
		add_action( 'admin_menu', array( $this, "add_menus" ) );
		add_action("admin_enqueue_scripts", array( $this, "enqueue_scripts" ) );
	}

	/**
	 * Enqueue necessary scripts and styles
	 *
	 *
	 */
	function enqueue_scripts( $hook ){

		if( !( in_array( str_replace("upfront_page_", "", $hook), self::$menu_slugs ) || "toplevel_page_upfront" === $hook ) ) return;

		wp_enqueue_style( 'upfront_admin', Upfront::get_root_url() . "/styles/build/admin.css", array(), Upfront_ChildTheme::get_version() );// todo Sam: add proper version
		wp_register_script( 'upfront_admin_js', Upfront::get_root_url() . "/scripts/admin.js", array("jquery"), Upfront_ChildTheme::get_version(), true);
		wp_localize_script( 'upfront_admin_js', "Upfront_Data", array(
			'l10n' => array(
				"sure_to_reset_theme" => __('Are you sure you want to reset theme to default state? Please note that this can not be undone.'),
				"sure_to_reset_layout" => __('Are you sure you want to reset layout "{layout}" to default state? Please note that this can not be undone.')
			)
		) );
		wp_enqueue_script('upfront_admin_js');
	}

	/**
	 * Adds menu and sub-menu pages
	 *
	 *
	 */
	function add_menus(){

		global $menu, $submenu;

		if (Upfront_Permissions::current( Upfront_Permissions::SEE_USE_DEBUG ) || Upfront_Permissions::current( Upfront_Permissions::MODIFY_RESTRICTIONS )) {
			add_menu_page( __("General Settings", Upfront::TextDomain), __("Upfront", Upfront::TextDomain), "manage_options", self::$menu_slugs['main'], null, "", 58);
		}

		new Upfront_Admin_General();
		new Upfront_Admin_Restrictions();
		new Upfront_Admin_Experimental();
	}

	/**
	 * Renders main menu page
	 */
	function render_main_menu(){
		?>
			<div class="wrap upfront_admin">
				<h1><?php _e("General Settings", Upfront::TextDomain); ?></h1>
			</div>
		<?php
	}

		function RemoveAddMediaButtonsForNonAdmins(){
				remove_action( 'media_buttons', 'media_buttons' );
		}


}

new Upfront_Admin;
