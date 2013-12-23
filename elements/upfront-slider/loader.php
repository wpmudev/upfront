<?php
/*
Plugin Name: Upfront Slider module
Plugin URI: http://premium.wpmudev.org/project/upfront
Description: UpFront Slider Module
Version: 0.50
Text Domain: usider
Author: Paul Menard (Incsub)
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
function uslider_initialize () {
	
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/upfront_slider.php');

	//Add js and css
	add_action('wp_enqueue_scripts', array('Upfront_UsliderView', 'add_styles_scripts'));

	//Add templates to the backend
	add_action('wp_head', array('Upfront_UsliderView', 'add_admin_templates'));
	
	//// Add element defaults to data object
	add_action('upfront_data', array('Upfront_UsliderView', 'add_js_defaults'));

	//i18n
	//load_plugin_textdomain('uslider', false, dirname(__FILE__) .'/languages');

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('upfront_slider', upfront_element_url('js/uslider', __FILE__));
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'uslider_initialize'); 

/**
AJAX handler function to load the images from the list of ids stored in UpFront meta. We don't store the details in UpFront because they can change within WP.
*/

function uslider_ajax_proc() {
	
	if (!isset($_POST['function'])) die();
	echo "_POST<pre>"; print_r($_POST); echo "</pre>";
	
	switch(esc_attr($_POST['function'])) {
		case 'test_slides':
			$fp = fopen(ABSPATH.'/uslider_slides_html.php', 'w+');
			fwrite($fp, stripslashes($_POST['slides_html']));
			fclose($fp);			

			$fp = fopen(ABSPATH.'/uslider_slides_html.js', 'w+');
			fwrite($fp, stripslashes($_POST['slides_js']));
			fclose($fp);			

			break;
		
		default:
			die();
	}
	die();
} 

//add_action('wp_ajax_UpFrontSlider', 'uslider_ajax_proc');

function uslider_add_template() {
	include(dirname(__FILE__) . '/tpls/frontend.php');
}

//add_action('wp_head', 'uslider_add_template');