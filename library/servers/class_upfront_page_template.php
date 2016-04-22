<?php

/**
 * Page template handling controller.
 * For actual data/storage mapping, @see Upfront_LayoutRevisions
 */
class Upfront_Server_PageTemplate extends Upfront_Server {

	private static $_instance;
	
	private $_data;

	public static function get_instance () {
		if (!self::$_instance) {
			self::$_instance = new self;
		}
		return self::$_instance;
	}

	public static function serve () {
		self::get_instance()->_add_hooks();
	}
	
	private function _add_hooks () {
		$this->register_requirements();
	}
	
	/**
	 * Registering model requirements. Should probably refactor.
	 */
	public function register_requirements () {
		register_post_type(Upfront_PageTemplate::LAYOUT_TEMPLATE_TYPE, array(
			"exclude_from_search" => false,
			"publicly_queryable" => true,
			"show_ui" => true, // TODO make false later
			"show_in_nav_menus" => true, // TODO make false later
			// "supports" => false,
			// "has_archive" => false,
			// "rewrite" => false,
			"label" => "Page Templates", // TODO to remove later
		));
		register_post_type(Upfront_PageTemplate::LAYOUT_TEMPLATE_DEV_TYPE, array(
			"exclude_from_search" => false,
			"publicly_queryable" => true,
			"show_ui" => true, // TODO make false later
			"show_in_nav_menus" => true, // TODO make false later
			// "supports" => false,
			// "has_archive" => false,
			// "rewrite" => false,
			"label" => "Page Dev Templates", // TODO to remove later
		));
		register_post_status(Upfront_PageTemplate::LAYOUT_TEMPLATE_STATUS, array(
			'public' => true,
			'exclude_from_search' => false,
			'show_in_admin_all_list' => false,
			'show_in_admin_status_list' => false,
		));
		
		$this->_data = new Upfront_PageTemplate;
	}
	
	public function save_template ($template_id, $layout, $dev) {
		return $this->_data->save_page_template($template_id, $layout, $dev);
	}
	
	/**
	 * Outputs a single page template as JSON data
	 */
	public function get_template ($template_id, $load_dev) {
		if (empty($template_id)) return false;

		$template = $this->_data->get_page_template($template_id, $load_dev);
		if (empty($template)) return false;
		
		return $template;
	}
	
	public function get_template_id_by_slug ($slug, $load_dev) {
		return $this->_data->get_id_by_slug($slug, $load_dev);
	}
	
	// TODO: to remove later, just for unit testing
	public function test_data () {
		$templates = $this->_data->get_all_page_templates();
		print_r('templates | ');
		print_r($templates);
		print_r('post types | ');
		print_r(get_post_types());
	}
	
}
// Upfront_Server_PageTemplate::serve();
add_action('init', array('Upfront_Server_PageTemplate', 'serve'), 0);