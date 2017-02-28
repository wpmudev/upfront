<?php
/*
Plugin Name: Upfront New Navigation
Plugin URI: http://premium.wpmudev.org/project/upfront
Description: Complex Upfront module 1
Version: 0.1
Text Domain: unewnavigation
Author: Gagan S Goraya (Incsub)
Author URI: http://premium.wpmudev.org
WDP ID: XXX

Copyright 2009-2011 Incsub (http://incsub.com)

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License (Version 2 - GPLv2) as published by
the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/


/**
 * This is the entity entry point, where we inform Upfront of our existence.
 */
function unewnavigation_initialize () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/unewnavigation.php');
	require_once (dirname(__FILE__) . '/lib/class_upfront_nav_presets_server.php');

	// Include the backend support stuff
	require_once( ABSPATH . 'wp-admin/includes/nav-menu.php' );

	// Add element defaults to data object
	add_action('upfront_data', array('Upfront_UnewnavigationView', 'add_js_defaults'));
	add_filter('upfront_l10n', array('Upfront_UnewnavigationView', 'add_l10n_strings'));

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('unewnavigation', upfront_relative_element_url('js/unewnavigation', __FILE__));

	add_action('wp_enqueue_scripts', array('Upfront_UnewnavigationView', 'add_styles_scripts'));
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'unewnavigation_initialize');
