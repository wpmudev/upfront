<?php
/*
Plugin Name: Upfront Map Module
Plugin URI: http://premium.wpmudev.org/project/upfront
Description: Upfront Module for map and captions
Version: 0.1
Text Domain: umap
Author:
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


/*
<<< TODO:
	maps object resize

	use naming standard to include scripts directly into document body to reduce http requests

	having two markers, one marker out of view causes google maps to adjust lat lng

	two maps share the same options.
		- if two modules are both added via the command action, they share the same model.

	wp localize script, if it is called with the same named variable, it outputs it multiple times for each revision.

	issue with search module. e.g click on map, then search command and it always adds a map. also vice versa
*/
//define('UPFRONT_MAPS_ROOT_FILE', __FILE__);

/**
 * This is the entity entry point, where we inform Upfront of our existence.
 */
/*
function umap_initialize () {

	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/visitor.php');

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('umap', upfront_element_url('js/edit-init', UPFRONT_MAPS_ROOT_FILE));

	add_filter('upfront-settings-requirement_paths', 'add_plugin_path_to_requirejs');
	add_action('upfront-core-inject_dependencies', 'include_edit_css');
	add_action('upfront-core-inject_dependencies', 'include_plugin_path');
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'umap_initialize');


function add_plugin_path_to_requirejs($paths){
	$paths['m-map'] = upfront_element_url('js/', UPFRONT_MAPS_ROOT_FILE);
	return $paths;
}

// add template snippets to main document
function add_templates(){
	echo file_get_contents(dirname( UPFRONT_MAPS_ROOT_FILE).'/template/all.html');
}
add_action( 'wp_head' , 'add_templates', 1);

function ufmap_get_js_url(){
	return upfront_element_url('/js', UPFRONT_MAPS_ROOT_FILE);
}

function include_edit_css(){
	// css applicable to the edit/upfront admin
	echo '<link type="text/css" rel="stylesheet" href="'.upfront_element_url('/css', UPFRONT_MAPS_ROOT_FILE).'/edit.css" />';
}

function include_plugin_path(){
	echo "<script>var upfrontMap = {pluginPath:'".upfront_element_url('/', UPFRONT_MAPS_ROOT_FILE)."'};</script>";
}
*/

function upfront_maps_init () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/upfront_maps.php');

	// Add element defaults to data object
	add_action('upfront_data', array('Upfront_UmapView', 'add_js_defaults'));

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('upfront_maps', upfront_relative_element_url('js/upfront_maps', __FILE__));
}
add_action('upfront-core-initialized', 'upfront_maps_init');
