<?php
/*
Plugin Name: Upfront Post Data module
Plugin URI: http://premium.wpmudev.org/project/upfront
Description: Complex Upfront module 1
Version: 0.1
Text Domain: usearch
Author: Victor, Jeffri, Ve Bailovity (Incsub)
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



class Upfront_Post_Data extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('upfront-core-initialized', array($this, 'initialize'));
	}

	public function initialize () {
		require_once (dirname(__FILE__) . '/lib/class_upfront_post_data_model.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_post_data_data.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_post_data_view.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_post_data_part_view.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_post_data_frontend_view.php');

		upfront_add_layout_editor_entity('upostdata', upfront_relative_element_url('js/post-data', __FILE__));
		upfront_add_element_style('upfront-post-data', array('css/public.css', __FILE__));
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_element_style('upfront-post-data-editor', array('css/editor.css', __FILE__));
		}

		add_filter('upfront_data', array('Upfront_Post_Data_Data', 'add_js_defaults'));
		add_filter('upfront_l10n', array('Upfront_Post_Data_Data', 'add_l10n_strings'));

		upfront_add_ajax('upfront_post-data-load', array($this, "load_post"));
		//upfront_add_ajax('upfront_posts-data', array($this, "load_data"));
		//upfront_add_ajax('upfront_posts-terms', array($this, "load_terms"));

		//upfront_add_ajax('upfront_posts-list_meta', array($this, "load_meta"));

		// Handle legacy element parsing
		//add_filter('upfront-virtual_region-object_defaults-fallback', array($this, 'handle_legacy_data'), 10, 2);
		//add_filter('upfront-output-get_markup-fallback', array($this, 'handle_legacy_output'), 10, 2);
	}

	public function handle_legacy_data ($data, $type) {
	}
	public function handle_legacy_output ($msg, $view_class) {
	}

	public function load_post () {
		$request = !empty($_POST['data']) ? stripslashes_deep($_POST['data']) : array();
		$data = !empty($request['props']) ? $this->to_data_array($request['props']) : array();
		if (!empty($request['post_id'])) $data['post_id'] = $request['post_id'];
		if (!empty($request['author_id'])) $data['author_id'] = $request['author_id'];
		if (!empty($request['post_date'])) $data['post_date'] = $request['post_date'];
		if (!empty($request['objects'])) $data['objects'] = $request['objects'];

		$this->_out(new Upfront_JsonResponse_Success(array(
			'post_data' => Upfront_Post_Data_View::get_post_markup($data)
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
Upfront_Post_Data::serve();
