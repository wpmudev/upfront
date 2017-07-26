<?php

/**
 * Main output class
 */
class Upfront_Output {

	/**
	 * Internal layout reference
	 *
	 * @var object
	 */
	private $_layout;

	/**
	 * Internal debugger reference
	 *
	 * @var object
	 */
	private $_debugger;

	/**
	 * Internal instance reference
	 *
	 * @var object
	 */
	private static $_instance;

	/**
	 * Internal current object reference
	 *
	 * @var mixed
	 */
	public static $current_object;

	/**
	 * Internal current module reference
	 *
	 * @var mixed
	 */
	public static $current_module;

	/**
	 * Internal grid reference
	 *
	 * @var object
	 */
	public static $grid;

	/**
	 * Layout post ID reference
	 *
	 * @var number
	 */
	public static $layout_post_id;

	/**
	 * Template post ID reference
	 *
	 * @var number
	 */
	public static $template_post_id;

	/**
	 * Constructor
	 *
	 * @param object $layout Upfront layout
	 * @param object $post post instance (deprecated)
	 */
	public function __construct ($layout, $post) {
		$this->_layout = $layout;
		$this->_debugger = Upfront_Debug::get_debugger();

		self::$grid = Upfront_Grid::get_grid();
	}

	/**
	 * Post ID getter
	 *
	 * @return mixed (number)Post ID, or (bool)false if we're not dealing with a singular view
	 */
	public static function get_post_id () {
		return is_singular() ? get_the_ID() : false;
	}

	/**
	 * Bootstraps layout and adds required actions
	 *
	 * @param array $layout_ids Layout cascade
	 * @param bool $apply Whether to also apply layout
	 *
	 * @return object Upfront_Output instance
	 */
	public static function get_layout ($layout_ids, $apply = false) {
		$post_id = self::get_post_id();
		$is_dev = Upfront_Debug::get_debugger()->is_dev();
		$load_from_options = true;
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());

		// if page was still draft and viewed on FE, we should show 404 layout
		if ( !$post_id && isset($layout_ids['specificity']) && preg_match('/single-page/i', $layout_ids['specificity']) ) {
			unset($layout_ids['specificity']);
			$layout_ids['item'] = 'single-404_page';
		}
		// only for actual Pages
		if ( $post_id && is_page() ) {
			// since this is only for page then safe to use layout slug like below
			$layout_slug = strtolower($store_key . '-single-page-' . $post_id);
			$layout_post_id = Upfront_Server_PageLayout::get_instance()->get_layout_id_by_slug($layout_slug, $is_dev);

			if ( $layout_post_id ) {
				self::$layout_post_id = $layout_post_id;
				$page_layout = Upfront_Server_PageLayout::get_instance()->get_layout($layout_post_id, $is_dev);
				if ( $page_layout ) {
					$layout = Upfront_Layout::from_cpt($page_layout, Upfront_Layout::STORAGE_KEY);
					$load_from_options = false;
				}
			} else {
				// load from page template
				self::$layout_post_id = false;
				$page_template  = self::get_page_template($layout_ids);
				if ( $page_template ) {
					$layout = Upfront_Layout::from_cpt($page_template, Upfront_Layout::STORAGE_KEY);
					$load_from_options = false;
				}
			}
		}

		// load layouts not yet saved on custom post type
		if ( $load_from_options ) {
			// if maintenance page, bypass the layout
			if ( upfront_is_maintenance_page() ) $layout_ids = Upfront_Layout::get_maintenance_mode_layout_cascade();
			$layout = Upfront_Layout::from_entity_ids($layout_ids);
			if ($layout->is_empty()) {
				$layout = Upfront_Layout::create_layout($layout_ids);
			}
		}

		$post = get_post($post_id);
		self::$_instance = new self($layout, $post);

		// Add actions
		add_action('wp_enqueue_scripts', array(self::$_instance, 'add_styles'));
		add_action('wp_enqueue_scripts', array(self::$_instance, 'add_scripts'), 2);

		// Do the template...
		if ( $apply )
			return self::$_instance->apply_layout();
		return self::$_instance;
	}

	/**
	 * Resolves layout cascade to a page template
	 *
	 * @param array $layout_ids Layout cascade
	 *
	 * @return mixed Resolved content as string, or (bool)false
	 */
	public static function get_page_template ($layout_ids) {
		$post_id = self::get_post_id();
		$is_dev = Upfront_Debug::get_debugger()->is_dev();
		$page_template = false;
		$store_key = str_replace('_dev','',Upfront_Layout::get_storage_key());

		if ( $post_id ) {
			$template_meta_name = ( $is_dev )
				? strtolower($store_key . '-template_dev_post_id')
				: strtolower($store_key . '-template_post_id')
			;
			$template_post_id = get_post_meta($post_id, $template_meta_name, true);

		} else {
			// if special archive pages like homepage, use slug to get template post id
			// below will not be called anymore as already trapped above on get_layout()
			$layout_id = '';
			if ( isset($layout_ids['specificity']) ) {
				$layout_id = $layout_ids['specificity'];
			} else if ( isset($layout_ids['item']) ) {
				$layout_id = $layout_ids['item'];
			}
			$key = $store_key . '-' . $layout_id;
			$template_post_id = Upfront_Server_PageTemplate::get_instance()->get_template_id_by_slug($key, $is_dev);
		}

		if ( $template_post_id ) {
			self::$template_post_id = $template_post_id;
			$page_template = Upfront_Server_PageTemplate::get_instance()->get_template($template_post_id, $is_dev);
		}

		return $page_template;
	}

	/**
	 * Gets internal layout data representation
	 *
	 * @return mixed Layout data as array, or (bool)false
	 */
	public static function get_layout_data () {
		if ( self::$_instance )
			return self::$_instance->_layout->to_php();
		return false;
	}

	/**
	 * Gets internal layout object
	 *
	 * @return mixed Layout as object, or (bool)false
	 */
	public static function get_layout_object () {
		if ( self::$_instance )
			return self::$_instance->_layout;
		return false;
	}

	/**
	 * Gets internal current object
	 *
	 * @return mixed Current object or false
	 */
	public static function get_current_object () {
		if ( self::$current_object )
			return self::$current_object;
		return false;
	}

	/**
	 * Gets internal current module
	 *
	 * @return mixed Current module or false
	 */
	public static function get_current_module () {
		if ( self::$current_module )
			return self::$current_module;
		return false;
	}

	/**
	 * Applies the layout data
	 *
	 * Builds output HTML string
	 *
	 * @return string Output
	 */
	public function apply_layout () {
		$layout = $this->_layout->to_php();
		$html = '';
		$html_layout = '';

		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$html = "<!-- Code generated by Upfront core -->\n";
			$name = !empty($layout['name']) ? $layout['name'] : '';
			$html .= "<!-- Layout Name: {$name} -->\n";
		}
		$layout_view = new Upfront_Layout_View($layout);
		$region_markups = array();
		$region_markups_before = array();
		$region_markups_after = array();
		$container_views = array();
		// Construct container views first
		foreach ($layout['regions'] as $region) {
			$container = empty($region['container']) ? $region['name'] : $region['container'];
			if ( $container == $region['name'] ) {
				$container_views[$container] = new Upfront_Region_Container($region);
			}
		}
		// Iterate through regions
		foreach ($layout['regions'] as $region) {
			$region_view = new Upfront_Region($region);
			$region_sub = $region_view->get_sub();
			$markup = $region_view->get_markup();
			$container = $region_view->get_container();
			if ( ! isset($region_markups[$container]) )
				$region_markups[$container] = '';
			if ( ! isset($region_markups_before[$container]) )
				$region_markups_before[$container] = '';
			if ( ! isset($region_markups_after[$container]) )
				$region_markups_after[$container] = '';
			if ( 'top' === $region_sub || 'bottom' === $region_sub ) {
			    if ( isset($container_views[$container]) ) {
			        $type = $container_views[$container]->get_entity_type();
			        if ( 'full' !== $type ) continue; // Don't add top/bottom sub container if it's not full
			    }
				$sub_container = new Upfront_Region_Sub_Container($region);
				$markup = $sub_container->wrap( $markup );

				if ( 'top' === $region_sub ) $region_markups_before[$container] .= $markup;
				else $region_markups_after[$container] .= $markup;
			} else if ( 'fixed' === $region_sub ) {
				$region_markups_after[$container] .= $markup;
			} else if ( 'left' === $region_sub ) {
				if ( is_rtl() ) $region_markups[$container] .= $markup;
				else $region_markups[$container] = $markup . $region_markups[$container];
			} else {
				if ( is_rtl() ) $region_markups[$container] = $markup . $region_markups[$container];
				else $region_markups[$container] .= $markup;
			}
		}
		foreach ($container_views as $container => $container_view) {
			$type = $container_view->get_entity_type();
			$html_layout .= $container_view->wrap( $region_markups[$container], $region_markups_before[$container], $region_markups_after[$container] );
		}
		$html .= $layout_view->wrap($html_layout);
		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$html .= "<!-- Upfront layout end -->\n";
		}

		do_action('upfront-layout-applied', $layout);

		return $html;
	}

	/**
	 * Adds in all the required styles
	 */
	function add_styles () {
		$load_style_url = upfront_ajax_url('upfront_load_styles') . '&layout_post_id=' . self::$layout_post_id . '&template_post_id=' . self::$template_post_id;
		//wp_enqueue_style('upfront-main', $load_style_url, array(), Upfront_ChildTheme::get_version(), 'all');

		$deps = Upfront_CoreDependencies_Registry::get_instance();
		$deps->add_header_style($load_style_url);

		// Load theme fonts
		$theme_fonts = json_decode(Upfront_Cache_Utils::get_option('upfront_' . get_stylesheet() . '_theme_fonts'));
		$theme_fonts = apply_filters('upfront_get_theme_fonts', $theme_fonts, array());
		if ( $theme_fonts ) {
			foreach ($theme_fonts as $theme_font) {
				$deps->add_font($theme_font->font->family, $theme_font->variant);
			}
		}
		// The dependencies server will manage the fonts.
	}

	/**
	 * Adds in all the required scripts
	 */
	function add_scripts () {
		upfront_add_element_script('upfront-layout', array('scripts/layout.js', dirname(__FILE__)));
		upfront_add_element_script('upfront-effect', array('scripts/effect.js', dirname(__FILE__)));
		upfront_add_element_script('upfront-default-map', array('scripts/default-map.js', dirname(__FILE__)));
		upfront_add_element_script('upfront-default-slider', array('scripts/default-slider.js', dirname(__FILE__)));
		upfront_add_element_style('upfront-default-slider', array('styles/default-slider.css', dirname(__FILE__)));

	}
}



require_once('output/class_upfront_entity.php');
require_once('output/class_upfront_container.php');
require_once('output/class_upfront_layout_view.php');
require_once('output/class_upfront_region_container.php');
require_once('output/class_upfront_region_subcontainer.php');
require_once('output/class_upfront_region.php');
require_once('output/class_upfront_wrapper.php');
require_once('output/class_upfront_module_group.php');
require_once('output/class_upfront_module.php');
require_once('output/class_upfront_object_group.php');
require_once('output/class_upfront_object.php');
