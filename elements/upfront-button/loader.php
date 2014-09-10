<?php


function ubutton_init () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/upfront_button.php');

	add_filter('upfront_l10n', array('Upfront_ButtonView', 'add_l10n_strings'));
	add_filter('upfront-export-button-object_content', array('Upfront_ButtonView', 'export_content'));

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('ubutton', upfront_relative_element_url('js/ubutton', __FILE__));
	
	add_action('wp_enqueue_scripts', array('Upfront_ButtonView', 'add_styles_scripts'));
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'ubutton_init');