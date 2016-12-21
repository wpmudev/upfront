<?php


function utext_init () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/upfront_text.php');
	require_once (dirname(__FILE__) . '/lib/class_upfront_text_presets_server.php');

	add_filter('upfront_l10n', array('Upfront_PlainTxtView', 'add_l10n_strings'));
	add_filter('upfront-export-plaintxt-object_content', array('Upfront_PlainTxtView', 'export_content'));

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('utext', upfront_relative_element_url('js/utext', __FILE__));

	// Add front script
	add_action('wp_enqueue_scripts', array('Upfront_PlainTxtView', 'add_styles_scripts'));
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'utext_init');
