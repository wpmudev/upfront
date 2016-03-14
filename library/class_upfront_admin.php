<?php

include_once "admin/class_upfront_admin_restrictions.php";
include_once "admin/class_upfront_admin_experimental.php";

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
        if( in_array( str_replace("upfront_page_", "", $hook), self::$menu_slugs ) );
            wp_enqueue_style( 'upfront_admin', Upfront::get_root_url() . "/styles/admin.css", array(), Upfront_ChildTheme::get_version() );// todo Sam: add proper version
            
    }

    /**
     * Adds menu and sub-menu pages
     *
     *
     */
    function add_menus(){
        add_menu_page( __("Upfront", Upfront::TextDomain), __("Upfront", Upfront::TextDomain), "edit_theme_options",  self::$menu_slugs['main'] , array($this, "render_main_menu"), "", "3.013" );
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


}

new Upfront_Admin;