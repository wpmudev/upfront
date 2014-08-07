<?php


function utext_init () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/upfront_text.php');

	add_filter('upfront_l10n', array('Upfront_PlainTxtView', 'add_l10n_strings'));

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('utext', upfront_relative_element_url('js/utext', __FILE__));
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'utext_init');