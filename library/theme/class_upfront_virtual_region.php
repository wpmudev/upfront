<?php

class Upfront_Virtual_Region {

	protected $data = array();
	protected $wrappers = array();
	protected $modules = array();
	protected $current_wrapper;
	protected $current_wrapper_col = array();
	protected $current_group_wrapper;
	protected $current_group_wrapper_col = array();
	protected $current_module;
	protected $current_group;
	protected $current_group_col = array();
	protected $grid;
	public $side_regions = array();

	public $errors = array();

	public function __construct ($args, $properties = array()) {
		$this->data = array_merge(
			array(
				'properties' => array(),
				'modules' => array(),
				'wrappers' => array(),
				'name' => '',
				'title' => '',
				'scope' => 'local',
				'container' => '',
				'default' => false,
				'position' => 11,
				'allow_sidebar' => true,
				'type' => 'wide'
			), $args);

		foreach ( $properties as $prop => $value ){
			$this->set_property($prop, $value);
		}
		$this->grid = Upfront_Grid::get_grid();
	}

	public function get_data () {
		foreach ( $this->modules as $id => $module ){
			if ( isset($module['modules']) ){
				$this->modules[$id]['modules'] = array_values($module['modules']);
				$this->modules[$id]['wrappers'] = array_values($module['wrappers']);
			}
		}
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

	public function start_wrapper ($wrapper_id = false, $newline = true, $properties = array(), $group = '') {
		$wrapper_id = $wrapper_id ? $wrapper_id : upfront_get_unique_id('wrapper');
		$wrapper_data = array('name' => '', 'properties' => array());
		if ( $newline )
			$this->_set_property('class', 'clr', $wrapper_data);
		$this->_set_property('wrapper_id', $wrapper_id, $wrapper_data);
		foreach ( $properties as $prop => $value ) {
			$this->_set_property($prop, $value, $wrapper_data);
		}
		if ( $group && $this->modules[$group] ){
			$this->modules[$group]['wrappers'][$wrapper_id] = $wrapper_data;
			$this->current_group_wrapper = $wrapper_id;
		}
		else {
			$this->wrappers[$wrapper_id] = $wrapper_data;
			$this->current_wrapper = $wrapper_id;
		}
		$breakpoints = $this->grid->get_breakpoints(true);
		foreach ( $breakpoints as $breakpoint ){
			if ( $group && $this->modules[$group] )
				$this->current_group_wrapper_col[$breakpoint->get_id()] = 0;
			else
				$this->current_wrapper_col[$breakpoint->get_id()] = 0;
		}
	}

	public function end_wrapper ($group = '') {
		$breakpoints = $this->grid->get_breakpoints(true);
		$breakpoint_data = array();
		foreach ( $breakpoints as $breakpoint ){
			if ( $group && $this->modules[$group] ){
				$wrapper_col = $this->current_group_wrapper_col[$breakpoint->get_id()];
				$group_col = $this->current_group_col[$breakpoint->get_id()];
				$col = $group_col > $wrapper_col ? $wrapper_col : $group_col;
				if ( $breakpoint->is_default() ) {
					$default_wrapper_class = $breakpoint->get_prefix('width') . $col;
				}
				else {
					$breakpoint_data[$breakpoint->get_id()] = array();
					$breakpoint_data[$breakpoint->get_id()]['col'] = $col;
				}
			}
			else {
				$wrapper_col = $this->current_wrapper_col[$breakpoint->get_id()];
				if ( $breakpoint->is_default() ) {
					$default_wrapper_class = $breakpoint->get_prefix('width') . $wrapper_col;
				}
				else {
					$breakpoint_data[$breakpoint->get_id()] = array();
					$breakpoint_data[$breakpoint->get_id()]['col'] = $wrapper_col;
				}
			}

		}
		if ( $group && $this->modules[$group] ){
			$class = $this->get_property('class', $this->modules[$group]['wrappers'][$this->current_group_wrapper]);
			$current_breakpoint_data = $this->get_property('breakpoint', $this->modules[$group]['wrappers'][$this->current_group_wrapper]);
			$this->_set_property('class', $class . ' ' . $default_wrapper_class, $this->modules[$group]['wrappers'][$this->current_group_wrapper]);
			if ( !empty($current_breakpoint_data) ){
				foreach ( $current_breakpoint_data as $id => $data ){
					if ( !empty($breakpoint_data[$id]) )
						$breakpoint_data[$id] = array_merge($data, $breakpoint_data[$id]);
					else
						$breakpoint_data[$id] = $data;
				}
			}
			$this->_set_property('breakpoint', $breakpoint_data, $this->modules[$group]['wrappers'][$this->current_group_wrapper]);
			$this->current_group_wrapper = null;
		}
		else {
			$class = $this->get_property('class', $this->wrappers[$this->current_wrapper]);
			$current_breakpoint_data = $this->get_property('breakpoint', $this->wrappers[$this->current_wrapper]);
			$this->_set_property('class', $class . ' ' . $default_wrapper_class, $this->wrappers[$this->current_wrapper]);
			if ( !empty($current_breakpoint_data) ){
				foreach ( $current_breakpoint_data as $id => $data ){
					if ( !empty($breakpoint_data[$id]) )
						$breakpoint_data[$id] = array_merge($data, $breakpoint_data[$id]);
					else
						$breakpoint_data[$id] = $data;
				}
			}
			$this->_set_property('breakpoint', $breakpoint_data, $this->wrappers[$this->current_wrapper]);
			$this->current_wrapper = null;
		}
	}

	public function start_module ($position = array(), $properties = array(), $other_data = array(), $group = '') {
		$module_id = !empty($properties['element_id']) ? $properties['element_id'] : upfront_get_unique_id('module');
		$module_data = array_merge(array('name' => '', 'properties' => array(), 'objects' => array()), $other_data);
		$pos_class = '';
		$breakpoints = $this->grid->get_breakpoints(true);
		foreach ( $breakpoints as $breakpoint ){
			$total_col = 0;
			$breakpoint_col = $breakpoint->get_columns();
			if ( !$breakpoint->is_default() ) {
				$data = !empty($properties['breakpoint'][$breakpoint->get_id()]) && is_array($properties['breakpoint'][$breakpoint->get_id()]) ? $properties['breakpoint'][$breakpoint->get_id()] : array();
				if ( isset($data['col']) )
					$position['width'] = $data['col'];
				if ( isset($data['left']) )
					$position['margin-left'] = $data['left'];
			}
			$position = array_merge(array(
				'width' => 1,
				'margin-left' => 0,
				'margin-right' => 0,
				'margin-top' => 0,
				'margin-bottom' => 0
			), $position);
			foreach ( $position as $pfx => $value ) {
				if ( $breakpoint->is_default() )
					$pos_class .= $breakpoint->get_prefix($pfx) . $value . ' ';
				if ( in_array($pfx, array('width', 'margin-left', 'margin-right')) )
					$total_col += $value;
			}
			$total_col = $total_col <= $breakpoint_col ? $total_col : $breakpoint_col;
			if ( $group && $this->modules[$group] ){
				$wrapper_col = $this->current_group_wrapper_col[$breakpoint->get_id()];
				$this->current_group_wrapper_col[$breakpoint->get_id()] = ( $total_col > $wrapper_col ) ? $total_col : $wrapper_col;
			}
			else {
				$wrapper_col = $this->current_wrapper_col[$breakpoint->get_id()];
				$this->current_wrapper_col[$breakpoint->get_id()] = ( $total_col > $wrapper_col ) ? $total_col : $wrapper_col;
			}
		}
		$properties['class'] = rtrim($pos_class) . ( isset($properties['class']) ? ' ' . $properties['class'] : '' );
		foreach ( $properties as $prop => $value ) {
			$this->_set_property($prop, $value, $module_data);
		}
		$this->_set_property('element_id', $module_id, $module_data);
		if ( $group && $this->modules[$group] ){
			$this->_set_property('wrapper_id', $this->current_group_wrapper, $module_data);
			$this->modules[$group]['modules'][$module_id] = $module_data;
		}
		else {
			$this->_set_property('wrapper_id', $this->current_wrapper, $module_data);
			$this->modules[$module_id] = $module_data;
		}
		$this->current_module = $module_id;
	}

	public function end_module () {
		$this->current_module = null;
	}

	public function start_module_group($position = array(), $properties = array(), $other_data = array()){
		$group_id = !empty($properties['element_id']) ? $properties['element_id'] : upfront_get_unique_id('group');
		$group_data = array_merge(array('name' => '', 'properties' => array(), 'modules' => array(), 'wrappers' => array()), $other_data);
		$pos_class = '';
		$breakpoints = $this->grid->get_breakpoints(true);
		$this->current_group_col = array();
		foreach ( $breakpoints as $breakpoint ) {
			$total_col = 0;
			if ( !$breakpoint->is_default() ) {
				$data = !empty($properties['breakpoint'][$breakpoint->get_id()]) && is_array($properties['breakpoint'][$breakpoint->get_id()]) ? $properties['breakpoint'][$breakpoint->get_id()] : array();
				if ( isset($data['col']) )
					$position['width'] = $data['col'];
				if ( isset($data['left']) )
					$position['margin-left'] = $data['left'];
			}
			$position = array_merge(array(
				'width' => 1,
				'margin-left' => 0,
				'margin-right' => 0,
				'margin-top' => 0,
				'margin-bottom' => 0
			), $position);
			foreach ( $position as $pfx => $value ) {
				if ( $breakpoint->is_default() )
					$pos_class .= $breakpoint->get_prefix($pfx) . $value . ' ';
				if ( in_array($pfx, array('width', 'margin-left', 'margin-right')) )
					$total_col += $value;
			}
			$wrapper_col = $this->current_wrapper_col[$breakpoint->get_id()];
			$this->current_wrapper_col[$breakpoint->get_id()] = ( $total_col > $wrapper_col ) ? $total_col : $wrapper_col;
			$this->current_group_col[$breakpoint->get_id()] = $position['width'];
		}
		$properties['class'] = rtrim($pos_class) . ( isset($properties['class']) ? ' ' . $properties['class'] : '' );
		foreach ( $properties as $prop => $value ) {
			$this->_set_property($prop, $value, $group_data);
		}
		$this->_set_property('element_id', $group_id, $group_data);
		$this->_set_property('wrapper_id', $this->current_wrapper, $group_data);
		$this->modules[$group_id] = $group_data;
		$this->current_group = $group_id;
	}

	public function end_module_group() {
		$this->current_group = null;
	}

	public function add_object ($id = 'object', $properties = array(), $other_data = array(), $group = '') {
		$object_id = !empty($properties['element_id']) ? $properties['element_id'] : upfront_get_unique_id($id);
		$object_data = array_merge(array('name' => '', 'properties' => array()), $other_data);
		$breakpoint = $this->grid->get_default_breakpoint();
		$col_class = $breakpoint->get_prefix('width') . $breakpoint->get_columns();
		$temp_class = isset($properties['class']) ? $properties['class'] : '';
		$properties['class'] = strpos($temp_class, rtrim($col_class)) === false ?
		 	rtrim($col_class) . ' ' . $temp_class : $temp_class;
		foreach ( $properties as $prop => $value ) {
			$this->_set_property($prop, $value, $object_data);
		}
		$this->_set_property('element_id', $object_id, $object_data);
		if ( $group && $this->modules[$group] )
			$this->modules[$group]['modules'][$this->current_module]['objects'][] = $object_data;
		else
			$this->modules[$this->current_module]['objects'][] = $object_data;
	}

	/**
	 * Shorthand to add a complete element to the region.
	 *
	 * @param String $type The type of the element to add.
	 * @param array $options Options to add the element, they are
	 *           id: 			'An id to generate wrapper, module and object ids',
	 *           columns: 		(22) 'Number of columns for the element width',
	 *           rows: 			(5) 'Number of rows for th element height',
	 *           margin_left: 	(0) 'Number of columns for the left margin',
	 *           margin_top: 	(0) 'Number of rows for the top margin',
	 *           new_line: 		(true) 'Whether to add the element to a new line or continue a previous line',
	 *           close_wrapper: (true) 'Close the wrapper or leave it open for the next element',
	 * 			 group:			'The group id',
	 *           breakpoint:    Array with breakpoint options
	 *           wrapper_breakpoint: Array with breakpoint options for wrapper
	 *           options: 		Array with the object options.
	 */
	public function add_element($type = false, $options = array()){

		if(!$type){
			echo 'Bad configuration';
			return;
		}
		$options['type'] = $type;

		if(!isset($options['close_wrapper']))
			$options['close_wrapper'] = true;

		if(!isset($options['group']))
			$options['group'] = $this->current_group ? $this->current_group : '';
		else if (!$this->modules[$options['group']])
			$options['group'] = '';

		$opts = $this->parse_options($options);

		if(!is_array($opts)){
			echo $opts;
			return;
		}

		if((!$this->current_wrapper && !$options['group']) || (!$this->current_group_wrapper && $options['group'])) {
			$wrapper_props = array();
			if (isset($options['wrapper_breakpoint']) && !empty($options['wrapper_breakpoint']))
				$wrapper_props['breakpoint'] = $options['wrapper_breakpoint'];
			$this->start_wrapper($opts['wrapper_id'], $opts['new_line'], $wrapper_props, $options['group']);
		}

		$this->start_module($opts['position'], $opts['module'], array(), $options['group']);
		$this->add_object($opts['object_id'], $opts['object'], array(), $options['group']);
		$this->end_module();

		if($options['close_wrapper'])
			$this->end_wrapper($options['group']);
	}

	public function add_group($options){
		$properties = array();
		if(isset($options['id']) && !empty($options['id']))
			$properties['element_id'] = $options['id'];
		if(!isset($options['close_wrapper']))
			$options['close_wrapper'] = true;
		if(!isset($options['new_line']))
			$options['new_line'] = false;
		if(!isset($options['wrapper_id']))
			$options['wrapper_id'] = false;
		$pos = array_merge(array(
			'columns' => 24,
			'margin_left' => 0,
			'margin_top' => 0
		), $options);
		$position = array(
			'width' => $pos['columns'],
			'margin-left' => $pos['margin_left'],
			'margin-top' => $pos['margin_top']
		);
		if(!$this->current_wrapper) {
			$wrapper_props = array();
			if (isset($options['wrapper_breakpoint']) && !empty($options['wrapper_breakpoint']))
				$wrapper_props['breakpoint'] = $options['wrapper_breakpoint'];
			$this->start_wrapper($options['wrapper_id'], $options['new_line'], $wrapper_props);
		}
        foreach ($options as $option => $value) {
            if ( !in_array($option, array('id', 'close_wrapper', 'new_line', 'columns', 'margin_left', 'margin_top', 'margin_right', 'margin_bottom', 'wrapper_breakpoint')) )
               $properties[$option] = $value;
        }

		$this->start_module_group($position, $properties);
		$group_id = $this->current_group;
		$this->end_module_group();

		if($options['close_wrapper'])
			$this->end_wrapper();
		return $group_id;
	}

	public function add_side_region(Upfront_Virtual_Region $r, $sub = 'left') {
		$r->container = $this;
		$sub = is_string($sub) && preg_match('/^(left|top|bottom|right|fixed|lightbox)$/', $sub) ? $sub : 'left';
		$r->data['sub'] = $sub;
		$r->data['container'] = $this->data['name'];
		$r->data['position'] = $sub == 'left' ? -1 : ( $sub == 'top' ? -2 : ( $sub == 'right' ? 1 : 2 ) );
		$this->side_regions[] = $r;
	}

	private function parse_options($options){
		$type = $options['type'];

		$view_class = 'Upfront_' . $type . 'View';
		$object_defaults = array();

		if($type == 'PlainTxt')
			$object_defaults = array('view_class' => 'PlainTxtView', 'id_slug' => 'plaintxt');
		else if(class_exists($view_class))
			$object_defaults =  call_user_func($view_class . '::default_properties');
		else {
			$object_defaults = apply_filters('upfront-virtual_region-object_defaults-fallback', $object_defaults, $type);
			if (empty($object_defaults)) return 'Unknown element type: ' . $type;
		}

		$slug = isset($options['id']) ? $options['id'] : (isset($object_defaults['id_slug']) ? $object_defaults['id_slug'] : '');

		$opts = array(
			'wrapper_id' => isset($options['wrapper_id']) ? $options['wrapper_id'] : $slug . '-wrapper',
			'new_line' => isset($options['new_line']) ? $options['new_line'] : false
		);

		$position = array(
			'columns' => 24,
			'margin_top' => 0,
			'margin_left' => 0
		);
		$position = array_merge($position, $options);
		$opts['position'] = array(
			'width' => $position['columns'],
			'margin-top' => $position['margin_top'],
			'margin-left' => $position['margin_left']
		);


		$module = array(
			'rows' => 6,
			'module_class' => $slug,
			'module_id' => $slug,
			'sticky' => false,
			'default_hide' => 0,
			'hide' => 0,
			'toggle_hide' => 1
		);
		$module = array_merge($module, $options);
		$opts['module'] = array(
			'row' => $module['rows'],
			'class' => $module['module_class'],
			'element_id' => $module['module_id'],
			'sticky' => $module['sticky'],
			'default_hide' => $module['default_hide'],
			'hide' => $module['hide'],
			'toggle_hide' => $module['toggle_hide']
		);
        if ( isset($module['disable_resize']) )
            $opts['module']['disable_resize'] = $module['disable_resize'];
        if ( isset($module['disable_drag']) )
            $opts['module']['disable_drag'] = $module['disable_drag'];
		$breakpoint = !empty($options['breakpoint']) ? $options['breakpoint'] : false;
		if (!empty($breakpoint)) $opts['module']['breakpoint'] = $breakpoint;

		$opts['object_id'] = isset($options['object_id']) ? $options['object_id'] : $slug . '-object';

		if(!isset($options['options']))
			$options['options'] = array();

		$opts['object'] = array_merge($object_defaults, $options['options']);
		if(!isset($opts['object']['element_id']))
			$opts['object']['element_id'] = $opts['object_id'];

		return $opts;
	}
}