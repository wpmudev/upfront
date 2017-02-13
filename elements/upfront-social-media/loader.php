<?php

function upfront_social_media_initialize(){

	// Include the backend support stuff
	require_once(dirname(__FILE__) . '/lib/upfront-social-media.php');

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('upfront-social_media', upfront_relative_element_url('js/upfront-social-media', __FILE__));

	// Add the public stylesheet
	add_action('wp_enqueue_scripts', array('Upfront_SocialMediaView', 'add_public_style'));
	add_action('upfront_data', array('Upfront_SocialMediaView', 'add_upfront_data'));
	add_filter('upfront_l10n', array('Upfront_SocialMediaView', 'add_l10n_strings'));

	//Add social to the posts
	Upfront_SocialMedia_Setting::add_post_filters();
}
//Hook it when Upfront is ready
add_action('upfront-core-initialized', 'upfront_social_media_initialize');
