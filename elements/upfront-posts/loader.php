<?php
/*
Plugin Name: Upfront Posts module
Plugin URI: http://premium.wpmudev.org/project/upfront
Description: Complex Upfront module 1
Version: 0.1
Text Domain: usearch
Author: Ve Bailovity (Incsub)
Author URI: http://premium.wpmudev.org

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
/*
function uposts_initialize () {
	// Include the backend support stuff
	require_once (dirname(__FILE__) . '/lib/upfront_posts.php');

	// Expose our JavaScript definitions to the Upfront API
	upfront_add_layout_editor_entity('uposts', upfront_relative_element_url('js/uposts', __FILE__));

	// Add element defaults to data object
	add_action('upfront_data', array('Upfront_UpostsView', 'add_js_defaults'));

	add_filter('upfront_l10n', array('Upfront_UpostsView', 'add_l10n_strings'));

	// Add the public stylesheet
	//add_action('wp_enqueue_scripts', array('Upfront_UpostsView', 'add_public_style'));

	add_filter('post_thumbnail_html', array('Upfront_UpostsView', 'set_featured_image'), 10 , 2);
}
// Initialize the entity when Upfront is good and ready
add_action('upfront-core-initialized', 'uposts_initialize');
*/

class Upfront_Posts extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('upfront-core-initialized', array($this, 'initialize'));
	}

	public function initialize () {
		require_once (dirname(__FILE__) . '/lib/class_upfront_posts_model.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_posts_data.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_posts_posts_view.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_posts_post_view.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_posts_frontend_view.php');
		
		upfront_add_layout_editor_entity('uposts', upfront_relative_element_url('js/posts-list', __FILE__));
		upfront_add_element_style('upfront-posts', array('css/public.css', __FILE__));
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_element_style('upfront-posts-editor', array('css/editor.css', __FILE__));
		}
		
		add_filter('upfront_data', array('Upfront_Posts_PostsData', 'add_js_defaults'));
		add_filter('upfront_l10n', array('Upfront_Posts_PostsData', 'add_l10n_strings'));

		upfront_add_ajax('upfront_posts-load', array($this, "load_posts"));
		upfront_add_ajax('upfront_posts-data', array($this, "load_data"));
		upfront_add_ajax('upfront_posts-terms', array($this, "load_terms"));
	}

	public function load_posts () {
		$data = !empty($_POST['data']) ? $this->to_data_array(stripslashes_deep($_POST['data'])) : array();

		$this->_out(new Upfront_JsonResponse_Success(array(
			'posts' => Upfront_Posts_PostsView::get_posts_markup($data),
		)));
	}

	public function load_data () {
		$raw_post_types = get_post_types(array(
			'public' => true,
		), 'objects');
		$raw_taxonomies = get_taxonomies(array(
			'public' => true,
		), 'objects');
		$data = array(
			"post_types" => array('' => __('Please, select one', 'upfront')),
			"taxonomies" => array('' => __('Please, select one', 'upfront')),
		);
		foreach ($raw_post_types as $type => $obj) {
			$data["post_types"][$type] = $obj->labels->name;
		}
		foreach ($raw_taxonomies as $tax => $obj) {
			$data['taxonomies'][$tax] = $obj->labels->name;
		}
		$this->_out(new Upfront_JsonResponse_Success($data));
	}

	public function load_terms () {
		$taxonomy = !empty($_POST['taxonomy']) ? $_POST['taxonomy'] : false;
		if (!$taxonomy)
			$this->_out(new Upfront_JsonResponse_Error("Missing taxonomy"));
		$raw_terms = get_terms($taxonomy, array(
			'hide_empty' => false,
		));
		$data = array();
		foreach ($raw_terms as $term) {
			$data[$term->term_id] = $term->name;
		}
		$this->_out(new Upfront_JsonResponse_Success($data));
	}

	public function to_data_array ($data) {
		$result = array();
		if (empty($data)) return $result;

		foreach ($data as $item) {
			if (empty($item['name'])) continue;
			$result[$item['name']] = !empty($item['value']) ? $item['value'] : false;
		}
		return $result;
	}

}
Upfront_Posts::serve();