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
		
		add_action('upfront-style-base_layout', array($this, 'intercept_page_style_loading'));
	}
	
	/**
	 * Registering model requirements. Should probably refactor.
	 */
	public function register_requirements () {
		register_post_type(Upfront_PageTemplate::LAYOUT_TEMPLATE_TYPE, array(
			"exclude_from_search" => false,
			"publicly_queryable" => true,
			"supports" => false,
			"has_archive" => false,
			"rewrite" => false,
			"label" => "Page Templates", // uncomment this if want to check on admin
			"show_ui" => true, // uncomment this if want to check on admin
			"show_in_nav_menus" => true, // uncomment this if want to check on admin
		));
		register_post_type(Upfront_PageTemplate::LAYOUT_TEMPLATE_DEV_TYPE, array(
			"exclude_from_search" => false,
			"publicly_queryable" => true,
			"supports" => false,
			"has_archive" => false,
			"rewrite" => false,
			"label" => "Page Dev Templates", // uncomment this if want to check on admin
			"show_ui" => true, // uncomment this if want to check on admin
			"show_in_nav_menus" => true, // uncomment this if want to check on admin
		));
		register_post_status(Upfront_PageTemplate::LAYOUT_TEMPLATE_STATUS, array(
			'public' => true,
			'exclude_from_search' => false,
			'show_in_admin_all_list' => false,
			'show_in_admin_status_list' => false,
		));
		
		$this->_data = new Upfront_PageTemplate;
	}
	
	public function save_template ($template_id, $layout, $dev, $slug = false) {
		return $this->_data->save_page_template($template_id, $layout, $dev, $slug);
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
	
	public function delete_template ($template_post_id, $dev) {
		return $this->_data->drop_page_template($template_post_id, $dev);
	}
	
	public function delete_all_theme_templates () {
		return $this->_data->drop_all_theme_page_templates();
	}
	
	public function get_all_theme_templates ($load = 'all', $template_type = false) {
		return $this->_data->get_all_page_templates($load, $template_type);
	}
	
	public function get_pages_by_template ($template_id, $template_meta_name) {
		return $this->_data->get_pages_using_template($template_id, $template_meta_name);
	}
	
	public function parse_theme_templates ($load_dev) {
		$results = array();
		$storage_key = Upfront_Layout::get_storage_key();
		
		$load = ( $load_dev ) 
			? Upfront_PageTemplate::LAYOUT_TEMPLATE_DEV_TYPE
			: Upfront_PageTemplate::LAYOUT_TEMPLATE_TYPE
		;
		
		$templates = $this->get_all_theme_templates($load);
		foreach ($templates as $template) {
			$post_name = preg_replace('/^' . preg_quote($storage_key, '/') . '-?/', '', $template->post_name);
			$results[$template->post_name] = array(
				'name' => $post_name,
				'source' => 'cpt' // from custom post type
			);
		}
		return wp_parse_args($results, Upfront_Layout::get_db_layouts());
	}
	
	public function db_layout_to_name ($item) {
		if ( !is_array($item) && !isset($item['source']) ) return Upfront_EntityResolver::db_layout_to_name($item);
		
		return ucwords(preg_replace(array('/-template/', '/[\-]/'), array('',' '), $item['name']));
	}
	
	/**
	 * This fires in style parsing AJAX request and overrides the used layout.
	 *
	 * @param Upfront_Layout $layout Style layout for parsing
	 * @return Upfront_Layout
	 */
	public function intercept_page_style_loading ($layout) {
		$load_dev = $_GET['load_dev'] == 1 ? true : false;
		$is_revision = !empty($_GET['layout']['layout_revision'])
			? $_GET['layout']['layout_revision']
			: false
		;
		
		if ( !$is_revision ) {
			if ( isset($_GET['template_post_id']) ) {
				$template_post_id = (int) $_GET['template_post_id'];
				
			} else {
				if ( !empty($_GET['layout']['specificity']) ) {
					$slug = Upfront_Layout::get_storage_key() . '-' . $_GET['layout']['specificity'];
				} else {
					$slug = Upfront_Layout::get_storage_key() . '-' . $_GET['layout']['item'];
				}
				$template_post_id = $this->get_template_id_by_slug($slug, $load_dev);
			}
			
			if ( $template_post_id ) {
				$page_template = $this->get_template($template_post_id, $load_dev);
				if ( $page_template ) {
					$layout = Upfront_Layout::from_php($page_template, Upfront_Layout::STORAGE_KEY);
				}
			}
			
		} 
		
		return $layout;
	}
	
}
// Upfront_Server_PageTemplate::serve();
add_action('init', array('Upfront_Server_PageTemplate', 'serve'), 0);