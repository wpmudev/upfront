<?php

function upfront_navigation_initialize(){

    // Include the backend support stuff
    require_once (dirname(__FILE__) . '/lib/upfront-navigation.php');

    // Include the backend support stuff
    require_once( ABSPATH . 'wp-admin/includes/nav-menu.php' );

    // Add element defaults to data object
	$ucontact = new Upfront_UcontactView(array());
	add_action('upfront_data', array('Upfront_NavigationView', 'add_js_defaults'));

    add_filter('upfront_l10n', array('Upfront_NavigationView', 'add_l10n_strings'));

    // Expose our JavaScript definitions to the Upfront API
    upfront_add_layout_editor_entity('upfront-navigation', upfront_relative_element_url('js/upfront-navigation', __FILE__));

    // Add the public stylesheet
    add_action('wp_enqueue_scripts', array('Upfront_NavigationView', 'add_public_dependencies'));
}
//Hook it when Upfront is ready
add_action('upfront-core-initialized', 'upfront_navigation_initialize');
