<?php

class Upfront_Theme {
	
	protected static $instance;
	protected $supported_regions = array();
	protected $regions = array();
	protected $template_dir = 'templates';
	
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
	
	public function add_region ($args) {
		$defaults = array(
			'name' => "", 
			'title' => "", 
			'properties' => array(), 
			'modules' => array(), 
			'wrappers' => array(), 
			'scope' => "local", 
			'container' => "",
			'default' => false,
			'position' => 10
		);
		$args = wp_parse_args($args, $defaults);
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
			$template_files[] = array('child', get_stylesheet_directory(), $this->template_dir . '/' . $file . '.php');
			$template_files[] = array('child', get_stylesheet_directory(), $this->template_dir . '/' . $file . '.html');
			$template_files[] = array('parent', get_template_directory(), $this->template_dir . '/' . $file . '.php');
			$template_files[] = array('parent', get_template_directory(), $this->template_dir . '/' . $file . '.html');
		}
		foreach ( $template_files as $template ) {
			if ( file_exists($template[1] . '/' .  $template[2]) ){
				if($url){
					if($template[0] == 'child')
						return get_stylesheet_directory_uri() . '/' . $template[2];
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
		}
		foreach ( $template_files as $template_file ) {
			if ( file_exists($template_file) )
				return $template_file;
		}
		return $default;
	}
}

// @TODO API to get module/object
// @TODO API to create module/object

class Upfront_Virtual_Region {
	
	protected $data = array();
	protected $wrappers = array();
	protected $modules = array();
	protected $current_wrapper;
	protected $current_wrapper_col = 0;
	protected $current_module;
	protected $grid;

	public $errors = array();
	
	public function __construct ($properties = array()) {
		$this->data = array(
			'properties' => array(),
			'wrappers' => array(),
			'modules' => array()
		);
		foreach ( $properties as $prop => $value ){
			$this->set_property($prop, $value);
		}
		$this->grid = Upfront_Grid::get_grid();
	}
	
	public function get_data () {
		return array_merge(
			$this->data, 
			array(
				'wrappers' => array_values($this->wrappers), 
				'modules' => array_values($this->modules)
			)
		);
	}
	
	public function set_property ($property, $value) {
		$arr = array( 'name' => $property, 'value' => $value );
		$this->_set_property($property, $value, $this->data);
	}
	
	protected function _set_property ($property, $value, &$data) {
		$arr = array( 'name' => $property, 'value' => $value );
		$found = false;
		foreach ( $data['properties'] as $i => $prop ){
			if ( $prop['name'] == $property ){
				$data['properties'][$i] = $arr;
				$found = true;
				break;
			}
		}
		if ( ! $found )
			$data['properties'][] = $arr;
	}
	
	public function get_property ($property, $data = null) {
		return upfront_get_property_value($property, (is_null($data) ? $this->data : $data));
	}
	
	public function start_wrapper ($wrapper_id = false, $newline = true) {
		$wrapper_id = $wrapper_id ? $wrapper_id : upfront_get_unique_id('wrapper');
		$this->wrappers[$wrapper_id] = array('name' => '', 'properties' => array());
		if ( $newline )
			$this->_set_property('class', 'clr', $this->wrappers[$wrapper_id]);
		$this->_set_property('wrapper_id', $wrapper_id, $this->wrappers[$wrapper_id]);
		$this->current_wrapper = $wrapper_id;
	}
	
	public function end_wrapper () {
		$class = $this->get_property('class', $this->wrappers[$this->current_wrapper]);
		$breakpoints = $this->grid->get_breakpoints();
		$this->_set_property('class', $class . ' ' . $breakpoints['desktop']->get_prefix('width') . $this->current_wrapper_col, $this->wrappers[$this->current_wrapper]);
		$this->current_wrapper = null;
		$this->current_wrapper_col = 0;
	}
	
	public function start_module ($position = array(), $properties = array(), $other_data = array()) {
		$module_id = !empty($properties['element_id']) ? $properties['element_id'] : upfront_get_unique_id('module');
		$this->modules[$module_id] = array_merge(array('name' => '', 'properties' => array(), 'objects' => array()), $other_data);
		$pos_class = '';
		$total_col = 0;
		$breakpoints = $this->grid->get_breakpoints();
		$position = array_merge(array(
			'width' => 1,
			'margin-left' => 0,
			'margin-right' => 0,
			'margin-top' => 0,
			'margin-bottom' => 0
		), $position);
		foreach ( $position as $pfx => $value ) {
			$pos_class .= $breakpoints['desktop']->get_prefix($pfx) . $value . ' ';
			if ( in_array($pfx, array('width', 'margin-left', 'margin-right')) )
				$total_col += $value;
		}
		$this->current_wrapper_col = ( $total_col > $this->current_wrapper_col ) ? $total_col : $this->current_wrapper_col;
		$properties['class'] = rtrim($pos_class) . ( isset($properties['class']) ? ' ' . $properties['class'] : '' );
		foreach ( $properties as $prop => $value ) {
			$this->_set_property($prop, $value, $this->modules[$module_id]);
		}
		$this->_set_property('element_id', $module_id, $this->modules[$module_id]);
		$this->_set_property('wrapper_id', $this->current_wrapper, $this->modules[$module_id]);
		$this->current_module = $module_id;
	}
	
	public function end_module () {
		$this->current_module = null;
	}
	
	public function add_object ($id = 'object', $properties = array(), $other_data = array()) {
		$object_id = !empty($properties['element_id']) ? $properties['element_id'] : upfront_get_unique_id($id);
		$object_data = array_merge(array('name' => '', 'properties' => array()), $other_data);
		$breakpoints = $this->grid->get_breakpoints();
		$col_class = $breakpoints['desktop']->get_prefix('width') . $breakpoints['desktop']->get_columns();
		$properties['class'] = rtrim($col_class) . ( isset($properties['class']) ? ' ' . $properties['class'] : '' );
		foreach ( $properties as $prop => $value ) {
			$this->_set_property($prop, $value, $object_data);
		}
		$this->_set_property('element_id', $object_id, $object_data);
		$this->modules[$this->current_module]['objects'][] = $object_data;
	}

	public function add_element($options){
		if(!$options['object_class']){
			$this->errors[] = "Tried to add an element without object_class";
			return $this;
		}
		$element_defaults = array();

		try{
			$element_defaults = call_user_func($options['object_class'] . '::default_properties');
		} catch (Exception $e) {
			$this->errors[] = "Can't find the class {$options['object_class']} or its method default_properties";
		}

		$opts = array_merge($this->get_element_defaults($options), $options);
		$element_opts = array_merge($element_defaults, $opts['options']);

		$this->start_wrapper($opts['wrapper_slug'], $opts['new_line']);
		$this->start_module(
			array(
				'width' => $opts['columns'],
				'margin-top' => $opts['margin_top'],
				'margin-left' => $opts['margin_left']
			),
			array(
				'row' => $opts['rows'],
				'class' => $opts['class'],
				'element_id' => $opts['module_id']
			)
		);

		$this->add_object($opts['object_slug'], $element_opts);
		
		$this->end_module();
		$this->end_wrapper();
	}

	private function get_element_defaults($options){
		$type = $options['type'];
		$id = isset($options['id']) ? $options['id'] : $type . rand(1000, 9999);

		return array(
			'view_class' => $type . 'View',
			'wrapper_id' => $id,
			'module_id' => $id . '-module',
			'object_id' => $id . '-object',

			'rows' => 6,
			'columns' => 22,
			'margin_top' => 0,
			'margin_left' => 0,

			'new_line' => true
		);
	}
}

