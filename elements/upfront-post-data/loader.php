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
		require_once (dirname(__FILE__) . '/lib/class_upfront_post_data_part_view.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_post_data_presets_server.php');
		require_once (dirname(__FILE__) . '/lib/class_upfront_post_data_frontend_view.php');

		Upfront_PostData_Elements_Server::serve();

		upfront_add_layout_editor_entity('upostdata', upfront_relative_element_url('js/post-data', __FILE__));
		upfront_add_element_style('upfront-post-data', array('css/public.css', __FILE__));
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_element_style('upfront-post-data-editor', array('css/editor.css', __FILE__));
		}

		add_filter('upfront_data', array('Upfront_Post_Data_Data', 'add_js_defaults'));
		add_filter('upfront_l10n', array('Upfront_Post_Data_Data', 'add_l10n_strings'));

		upfront_add_ajax('upfront_post-data-load', array($this, "load_post"));

		upfront_add_ajax('upfront-post_data-post-specific', array($this, "json_get_post_specific_settings"));
		upfront_add_ajax('upfront-post_data-comments-disable', array($this, "json_set_comment_settings"));
		
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

		$data = Upfront_Post_Data_Data::apply_preset($data);

		$post = Upfront_Post_Data_Model::spawn_post($data);
		$view_class = Upfront_Post_Data_PartView::_get_view_class($data);
		$view = new $view_class($data);

		$this->_out(new Upfront_JsonResponse_Success(array(
			'post_data' => $view->get_markup($post, true),
		)));
	}

	/**
	 * Load post-specific settings and send it out as JSON.
	 */
	public function json_get_post_specific_settings () {
		$data = stripslashes_deep($_POST);
		$response = array();
		
		if (!empty($data['post_id']) && is_numeric($data['post_id'])) {
			$post = get_post($data['post_id']);

			$disabled = array();
			if ('open' !== $post->comment_status) $disabled[] = 'comments';
			if ('open' !== $post->ping_status) $disabled[] = 'trackbacks';
			$response['comments'] = array(
				'disable' => $disabled,
			);
		}

		$this->_out(new Upfront_JsonResponse_Success($response));
	}

	/**
	 * Set comments/trackbacks state per post.
	 */
	public function json_set_comment_settings () {
		$data = stripslashes_deep($_POST);
		$response = array();
		
		$post_id = !empty($data['post_id']) && is_numeric($data['post_id']) ? $data['post_id'] : false;
		$disable = !empty($data['disable']) ? $data['disable'] : array();

		if (!empty($post_id) && Upfront_Permissions::current(Upfront_Permissions::EDIT)) {
			$post = get_post($post_id);

			$post->comment_status = in_array('comments', $disable) ? 'closed' : 'open';
			$post->ping_status = in_array('trackbacks', $disable) ? 'closed' : 'open';
			
			wp_update_post($post);
			$response['comments'] = $post->comment_status;
			$response['trackbacks'] = $post->ping_status;
		}

		$this->_out(new Upfront_JsonResponse_Success($response));
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