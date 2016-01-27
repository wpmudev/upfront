<?php

class Upfront_Theme {

	protected static $instance;
	protected $supported_regions = array();
	protected $regions = array();
	protected $template_dir = 'templates';
	protected $layout_dir = 'templates';
	protected $region_default_args = array(
		'name' => "",
		'title' => "",
		'properties' => array(),
		'modules' => array(),
		'wrappers' => array(),
		'scope' => "local", // scope of region, accept local or global
		'container' => "",
		'default' => false, // default region can't deleted by user, accept true or false
		'position' => 10,
		'allow_sidebar' => true, // allow sidebar region? accept true or false
		'type' => 'wide', // type of region, accept full|wide|clip (either full screen | 100% wide | clipped)
	);

	public static function get_instance () {
		if ( ! is_a(self::$instance, __CLASS__) )
			self::$instance = new self;
		return self::$instance;
	}

	public function __construct () {

	}

	// @TODO deprecate this
	public function add_region_support ($region, $args = array()) {
		$this->supported_regions[$region] = $args;
	}
	// @TODO deprecate this
	public function has_region_support ($region) {
		if ( array_key_exists($region, $this->supported_regions) ) {
			if ( !empty($this->supported_regions[$region]) )
				return $this->supported_regions[$region];
			return true;
		}
		return false;
	}

	public function set_region_default_args ($args) {
		$this->region_default_args = wp_parse_args($args, $this->region_default_args);
		return true;
	}

	public function get_region_default_args () {
		return $this->region_default_args;
	}

	public function add_region ($args) {
		$args = wp_parse_args($args, $this->region_default_args);
		if ( ! empty($args['name']) && ! $this->has_region($args['name']) )
			$this->regions[] = $args;
	}

	public function add_regions ($regions) {
		foreach ( $regions as $region )
			$this->add_region($region);
	}

	public function get_regions () {
		// Required main region
		if ( !$this->has_region('main') )
			$this->add_region(array(
				'name' => "main",
				'title' => __("Main Area"),
				'scope' => "local",
				'container' => "main",
				'default' => true,
				'position' => 10
			));
		usort($this->regions, array(self, "_sort_region"));
		return $this->regions;
	}

	public function get_default_layout($cascade, $layout_slug = "", $add_global_regions = false) {
		$regions = new Upfront_Layout_Maker();

		$template_path = $this->find_default_layout($cascade, $layout_slug);
		$current_theme = Upfront_ChildTheme::get_instance();

		if ($add_global_regions && $current_theme && $current_theme->has_global_region('header')) {
			include(get_stylesheet_directory() . DIRECTORY_SEPARATOR . 'global-regions' . DIRECTORY_SEPARATOR . 'header.php');
		}

		require $template_path;

		if ($add_global_regions && $current_theme && $current_theme->has_global_region('footer')) {
			include(get_stylesheet_directory() . DIRECTORY_SEPARATOR . 'global-regions' . DIRECTORY_SEPARATOR . 'footer.php');
		}

		$version = isset($layout_version) ? $layout_version : false;
		$regions_data = $regions->create_layout();

		return array(
			'version' => $version,
			'regions' => $regions_data
		);
	}

	protected function find_default_layout($cascade, $layout_slug = "") {
		$filenames = array();
		$order = array('theme_defined', 'specificity', 'item', 'type');
		foreach($order as $o){
			if(isset($cascade[$o])){
				if (!empty($layout_slug))
					$filenames[] =  'layouts/' . $cascade[$o] . '-' . $layout_slug . '.php';
				$filenames[] =  'layouts/' . $cascade[$o] . '.php';
			}
		}
		if (!empty($layout_slug)) {
			$filenames[] = 'layouts/index-' . $layout_slug . '.php';
			$filenames[] = 'layouts/' . $layout_slug . '.php'; // Allowing the layout slug to be used directly
		}
		$filenames[] = 'layouts/index.php';

		return function_exists('upfront_locate_template')
			? upfront_locate_template($filenames)
			: locate_template($filenames)
		;
	}

	public function has_region ($name) {
		foreach ( $this->regions as $region ){
			if ( $region['name'] == $name )
				return true;
		}
		return false;
	}

	public static function _sort_region ($a, $b) {
		return ( $a['position'] > $b['position'] ) ? 1 : ( $a['position'] == $b['position'] ? 0 : -1 );
	}

	public function set_template_dir ($dir) {
		$this->template_dir = $dir;
	}

	public function get_template($slugs, $args = array(), $default_file = '') {
		$template_file = $this->get_template_path($slugs, $default_file);

		extract($args);
		ob_start();
		include $template_file;
		return ob_get_clean();
	}

	public function get_template_uri($slugs, $default, $url = false){
		$template_files = array();
		foreach ( (array)$slugs as $file ) {
			$template_files[] = array('stylesheet', get_stylesheet_directory(), $this->template_dir . '/' . $file . '.php');
			$template_files[] = array('stylesheet', get_stylesheet_directory(), $this->template_dir . '/' . $file . '.html');
			$template_files[] = array('template', get_template_directory(), $this->template_dir . '/' . $file . '.php');
			$template_files[] = array('template', get_template_directory(), $this->template_dir . '/' . $file . '.html');
			if (defined('UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF') && UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF) {
				$template_files[] = array('upfront_parent', UPFRONT_GRANDCHILD_THEME_PARENT_PATH, $this->template_dir . '/' . $file . '.php');
				$template_files[] = array('upfront_parent', UPFRONT_GRANDCHILD_THEME_PARENT_PATH, $this->template_dir . '/' . $file . '.html');
			}
		}
		foreach ( $template_files as $template ) {
			if ( file_exists($template[1] . '/' .  $template[2]) ){
				if($url){
					if ($template[0] == 'stylesheet') return get_stylesheet_directory_uri() . '/' . $template[2];
					else if ('upfront_parent' == $template[0]) return UPFRONT_GRANDCHILD_THEME_PARENT_URL . '/' . $template[2];
					return get_template_directory_uri() . '/' . $template[2] ;
				}
				return $template[1] . '/' .  $template[2];
			}
		}
		return $default;
	}

	public function get_template_path($slugs, $default){
		$template_files = array();
		foreach ( (array)$slugs as $file ) {
			$template_files[] = get_stylesheet_directory() . '/' . $this->template_dir . '/' . $file . '.php';
			$template_files[] = get_stylesheet_directory() . '/' . $this->template_dir . '/' . $file . '.html';
			$template_files[] = get_template_directory() . '/' . $this->template_dir . '/' . $file . '.php';
			$template_files[] = get_template_directory() . '/' . $this->template_dir . '/' . $file . '.html';
			if (defined('UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF') && UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF) {
				$template_files[] = UPFRONT_GRANDCHILD_THEME_PARENT_PATH . '/' . $this->template_dir . '/' . $file . '.php';
				$template_files[] = UPFRONT_GRANDCHILD_THEME_PARENT_PATH . '/' . $this->template_dir . '/' . $file . '.html';
			}
		}
		foreach ( $template_files as $template_file ) {
			if ( file_exists($template_file) )
				return $template_file;
		}
		return $default;
	}
}