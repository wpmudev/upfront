<?php

function upfront_like_box_initialize(){

	// Include the backend support stuff
	require_once(dirname(__FILE__) . '/lib/upfront-like-box.php');

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('upfront-like-box', upfront_relative_element_url('js/upfront-like-box', __FILE__));

	//Add defaults
	add_action('upfront_data', array('Upfront_LikeBoxView', 'add_js_defaults'));
	add_filter('upfront_l10n', array('Upfront_LikeBoxView', 'add_l10n_strings'));

	// Add the public stylesheet
	add_action('wp_enqueue_scripts', array('Upfront_LikeBoxView', 'add_public_style'));
}
//Hook it when Upfront is ready
add_action('upfront-core-initialized', 'upfront_like_box_initialize');
