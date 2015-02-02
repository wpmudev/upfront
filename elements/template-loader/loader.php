<?php

/**
 * Registers the element in Upfront
 */
function template_loader_initialize () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/template_loader.php');
	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('template_loader', upfront_relative_element_url('js/template_loader', __FILE__));
}

//Hook it when Upfront is ready
add_action('upfront-core-initialized', 'template_loader_initialize');
