<?php

/**
 * Page layout handling controller.
 */
class Upfront_Server_PageLayout extends Upfront_Server {

	private static $_instance;

	/**
	 * @var $_data  Upfront_PageLayout
	 */
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
		register_post_type(Upfront_PageLayout::PAGE_LAYOUT_TYPE, array(
			"exclude_from_search" => false,
			"publicly_queryable" => true,
			"supports" => false,
			"has_archive" => false,
			"rewrite" => false,
			// "label" => "Page Layouts", // uncomment this if want to check on admin
			// "show_ui" => true, // uncomment this if want to check on admin
			// "show_in_nav_menus" => true, // uncomment this if want to check on admin
		));
		register_post_type(Upfront_PageLayout::PAGE_LAYOUT_DEV_TYPE, array(
			"exclude_from_search" => false,
			"publicly_queryable" => true,
			"supports" => false,
			"has_archive" => false,
			"rewrite" => false,
			// "label" => "Page Dev Layouts", // uncomment this if want to check on admin
			// "show_ui" => true, // uncomment this if want to check on admin
			// "show_in_nav_menus" => true, // uncomment this if want to check on admin
		));
		register_post_status(Upfront_PageLayout::PAGE_LAYOUT_STATUS, array(
			'public' => true,
			'exclude_from_search' => false,
			'show_in_admin_all_list' => false,
			'show_in_admin_status_list' => false,
		));

		$this->_data = new Upfront_PageLayout;
	}

	public function save_layout ($layout_id, $layout, $dev, $slug = false) {
		return $this->_data->save_page_layout($layout_id, $layout, $dev, $slug);
	}

	/**
	 * Outputs a single page layout as JSON data
	 */
	public function get_layout ($layout_id, $load_dev) {
		if (empty($layout_id)) return false;

		$layout = $this->_data->get_page_layout($layout_id, $load_dev);

		if (empty($layout)) return false;

		return $layout;
	}

	public function get_layout_id_by_slug ($slug, $load_dev) {
		// Dumb quick check to make sure that what we try to resolve here
		// doesn't resemble something that's not a single page layout
		if (preg_match('/-archive-/', $slug)) return false;

		// Still here? Good. Possibly a page layout, let's get on with it

		return $this->_data->get_id_by_slug($slug, $load_dev);
	}

	public function delete_layout ($layout_post_id, $dev) {
		return $this->_data->drop_page_layout($layout_post_id, $dev);
	}

	public function delete_all_theme_layouts () {
		return $this->_data->drop_all_theme_page_layouts();
	}

	public function get_all_theme_layouts ($load = 'all', $layout_type = false) {
		return $this->_data->get_all_page_layouts($load, $layout_type);
	}

	public function get_pages_by_layout ($layout_id, $layout_meta_name) {
		return $this->_data->get_pages_using_layout($layout_id, $layout_meta_name);
	}

	public function parse_theme_layouts ($load_dev) {
		$results = array();
		$storage_key = strtolower(str_replace('_dev','',Upfront_Layout::get_storage_key()));

		$load = ( $load_dev )
			? Upfront_PageLayout::PAGE_LAYOUT_DEV_TYPE
			: Upfront_PageLayout::PAGE_LAYOUT_TYPE
		;

		$layouts = $this->get_all_theme_layouts($load);
		foreach ($layouts as $layout) {
			$post_name = preg_replace('/^' . preg_quote($storage_key, '/') . '-?/', '', $layout->post_name);
			$results[$layout->post_name] = array(
				'name' => $post_name,
				'source' => 'cpt' // from custom post type
			);
		}
		return wp_parse_args($results, Upfront_Layout::get_db_layouts());
	}

	public function db_layout_to_name ($item) {
		
		// bypass layout name if maintenance page
		if ( is_array($item) && isset($item['name']) && isset($item['source']) && $item['source'] == 'cpt' ) {
			// extract page id
			preg_match_all('!\d+!', $item['name'], $matches);
			$page_id = ( isset($matches[0]) ) ? (int) implode('',$matches[0]) : false;
			if ( upfront_is_maintenance_page($page_id) ) {
				return Upfront_EntityResolver::layout_to_name(Upfront_Layout::get_maintenance_mode_layout_cascade());
			}
		}
		
		if ( !is_array($item) ) return Upfront_EntityResolver::db_layout_to_name($item);

		return ucwords(preg_replace(array('/-layout/', '/[\-]/'), array('',' '), $item['name']));
	}

	public function slug_layout_to_name ($slug) {
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		return ucwords(preg_replace(array('/'. $store_key .'/', '/[\-]/'), array('',' '), $slug));
	}

	/**
	 * This fires in style parsing AJAX request and overrides the used layout.
	 *
	 * @param Upfront_Layout $layout Style layout for parsing
	 * @return Upfront_Layout
	 */
	public function intercept_page_style_loading ($layout) {
		$load_dev = !empty($_GET['load_dev']) && is_numeric($_GET['load_dev']) && $_GET['load_dev'] == 1 ? true : false;
		$is_revision = !empty($_GET['layout']['layout_revision'])
			? $_GET['layout']['layout_revision']
			: false
		;
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());
		$slug = false;

		if ( !$is_revision ) {
			if ( isset($_GET['layout_post_id']) ) {
				$layout_post_id = (int) $_GET['layout_post_id'];

			} else {
				if ( !empty($_GET['layout']['specificity']) ) {
					$slug = $store_key . '-' . $_GET['layout']['specificity'];
				} else {
					$_layout_item = !empty($_GET['layout']['item']) ? $_GET['layout']['item'] : false;
					$slug = $store_key . '-' . $_layout_item;
				}
				$layout_post_id = $this->get_layout_id_by_slug(strtolower($slug), $load_dev);
			}

			if ( $layout_post_id ) {
				$page_layout = $this->get_layout($layout_post_id, $load_dev);
				if ( $page_layout ) {
					$layout = Upfront_Layout::from_cpt($page_layout, Upfront_Layout::STORAGE_KEY);
				}
			} else {
				// load from page template
				$layout = $this->intercept_template_style_loading($layout, $_GET);
			}
		}

		return $layout;
	}

	public function intercept_template_style_loading ($layout, $params) {
		$load_dev = !empty($params['load_dev']) && is_numeric($params['load_dev']) && $params['load_dev'] == 1 ? true : false;
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());

		if ( isset($params['template_post_id']) ) {
			$template_post_id = (int) $params['template_post_id'];

		} else {
			if ( !empty($params['layout']['specificity']) ) {
				$slug = $store_key . '-' . $params['layout']['specificity'];
			} else {
				$_layout_item = !empty($params['layout']['item']) ? $params['layout']['item'] : false;
				$slug = $store_key . '-' . $_layout_item;
			}
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($slug, $load_dev);
		}

		if ( $template_post_id ) {
			$page_template = Upfront_Server_PageTemplate::get_instance()->get_template($template_post_id, $load_dev);
			if ( $page_template ) {
				$layout = Upfront_Layout::from_cpt($page_template, Upfront_Layout::STORAGE_KEY);
			}
		}

		return $layout;
	}

	/**
	 * Returns layout by $slug
	 *
	 * @param $slug
	 * @param $load_dev
	 * @return array|bool
	 */
	public function get_layout_by_slug($slug, $load_dev){

		// Dumb quick check to make sure that what we try to resolve here
		// doesn't resemble something that's not a single page layout
		if (preg_match('/-archive-/', $slug)) return false;

		return $this->_data->get_by_slug( $slug, $load_dev );
	}
}
// Upfront_Server_PageLayout::serve();
add_action('init', array('Upfront_Server_PageLayout', 'serve'), 0);
