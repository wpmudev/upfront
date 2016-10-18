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
		require_once (dirname(__FILE__) . '/lib/class_upfront_posts_presets_server.php');

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

		upfront_add_ajax('upfront_posts-list_meta', array($this, "load_meta"));

		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			add_action('wp_footer', array($this, 'pickle_query'), 99);
		}

		// Handle legacy element parsing
		add_filter('upfront-virtual_region-object_defaults-fallback', array($this, 'handle_legacy_data'), 10, 2);
		add_filter('upfront-output-get_markup-fallback', array($this, 'handle_legacy_output'), 10, 2);

		// Force out the 404 handling for archives
		if (!is_admin()) {
			add_action('parse_request', array($this, 'force_wp_archive_limit'));
		}
	}

	/**
	 * Force default limit to single post.
	 * This is because on archive pages, we're using our own posts element.
	 * The default query global will use whatever instead, and will 404 if its limit
	 * value is higher than our posts element
	 *
	 * @param WP $wp WordPress object
	 */
	public function force_wp_archive_limit ($wp) {
		// Let WooCommerce handle stuff if we are dealing with products, since in that case we just
		// pass through content rendering
		if (!empty($wp->query_vars['post_type']) && $wp->query_vars['post_type'] === 'product') return;
		if (!empty($wp->query_vars['product_cat'])) return;
		if (!empty($wp->query_vars['product_tag'])) return;

		if (!empty($wp->query_vars['paged'])) $wp->query_vars['posts_per_page'] = 1;
	}

	public function handle_legacy_data ($data, $type) {
		if ('Uposts' !== $type) return $data;
		return Upfront_Posts_PostsData::get_defaults();
	}
	public function handle_legacy_output ($msg, $view_class) {
		if ('Upfront_UpostsView' !== $view_class) return $msg;
		return '';
	}

	public function load_posts () {
		$request = !empty($_POST['data']) ? stripslashes_deep($_POST['data']) : array();
		$data = !empty($request['props']) ? $this->to_data_array($request['props']) : array();
		if (!empty($request['query'])) $data['query'] = $request['query'];

		$this->_out(new Upfront_JsonResponse_Success(array(
			'posts' => Upfront_Posts_PostsView::get_posts_markup($data),
			'pagination' => Upfront_Posts_PostsView::get_pagination($data),
		)));
	}

	public function load_meta () {
		$request = !empty($_POST['data']) ? stripslashes_deep($_POST['data']) : array();
		$data = !empty($request['props']) ? $this->to_data_array($request['props']) : array();
		if (!empty($request['query'])) $data['query'] = $request['query'];

		$fields = Upfront_Posts_Model::get_meta_fields($data);
		$this->_out(new Upfront_JsonResponse_Success(array(
			'fields' => $fields,
		)));
	}

	public function load_data () {
		$raw_post_types = apply_filters('upfront_posts-list-post_types', get_post_types(array(
			'public' => true,
		), 'objects'));
		$raw_taxonomies = apply_filters('upfront_posts-list-taxonomies', get_taxonomies(array(
			'public' => true,
		), 'objects'));
		$data = array(
			"post_types" => array('' => __('Please, select one', 'upfront')),
			"taxonomies" => array('' => __('Please, select one', 'upfront')),
		);
		foreach ($raw_post_types as $type => $obj) {
			if (apply_filters('upfront_posts-list-skip_post_type-' . $type, false, $obj)) continue;
			$data["post_types"][$type] = $obj->labels->name;
		}
		foreach ($raw_taxonomies as $tax => $obj) {
			if (apply_filters('upfront_posts-list-skip_taxonomy-' . $tax, false, $obj)) continue;
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

	public function pickle_query () {
		global $wp_query;
		$request = clone($wp_query);
		unset($request->post);
		unset($request->posts);
		unset($request->request);
		if (!empty($request->queried_object)) {
			unset($request->queried_object->post_title);
			unset($request->queried_object->post_excerpt);
			unset($request->queried_object->post_content);
		}
		echo '<script>window._upfront_get_current_query=window._upfront_get_current_query||function () {return' . json_encode($request) . ';};</script>';
	}

}
Upfront_Posts::serve();
