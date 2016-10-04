<?php
/*
Plugin Name: Upfront Login element
Plugin URI: http://premium.wpmudev.org/project/upfront
Description: Login element
Version: 0.1
Text Domain: upfront-login
Author: Ve Bailovity (Incsub)
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
function upfront_login_initialize () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/upfront_login.php');

	add_filter('upfront_l10n', array('Upfront_LoginView', 'add_l10n_strings'));
	add_filter('upfront_data', array('Upfront_LoginView', 'add_data_defaults'));

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('upfront_login', upfront_relative_element_url('js/upfront_login', __FILE__));

	require_once (dirname(__FILE__) . '/lib/upfront_login_server.php');
	require_once (dirname(__FILE__) . '/lib/class_upfront_login_presets_server.php');
	Upfront_LoginAjax::serve();
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'upfront_login_initialize');
