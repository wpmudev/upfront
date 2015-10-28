<?php

/**
 * Registers the element in Upfront
 */

function ubutton_init () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/ubutton.php');
  require_once (dirname(__FILE__) . '/lib/class_upfront_button_presets_server.php');

	add_filter('upfront_l10n', array('Upfront_ButtonView', 'add_l10n_strings'));

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('ubutton', upfront_relative_element_url('js/ubutton', __FILE__));
	
	// Add element defaults to data object
	$ubutton = new Upfront_ButtonView(array());
	add_action('upfront_data', array($ubutton, 'add_js_defaults'));
	
	add_action('wp_enqueue_scripts', array('Upfront_ButtonView', 'add_styles_scripts'));
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'ubutton_init');