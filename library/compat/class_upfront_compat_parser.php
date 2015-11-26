<?php

class Upfront_Compat_LayoutParser extends Upfront_Grid {
	
	protected $current_region_data;
	protected $current_breakpoint;
	protected $current_walk;
	protected $current_wrapper;
	protected $next_wrapper;
	protected $max_col;
	protected $line_col;

	protected $level = 0;
	protected $level_data;
	
	public function __construct () {
		parent::__construct();
	}
	
	public function parse_region ($region, $region_name, $regions = false) {
		$breakpoints = $this->get_breakpoints();
		$modules = $region['modules'];
		$wrappers = $region['wrappers'];
		$region_data = array(
			'region_name' => $region_name,
			'region' => $region
		);
		$wrappers_data = array();
		
		foreach ( $wrappers as $w => $wrapper ) {
			$wrapper_data = array(
				'index' => $w,
				'wrapper' => $wrapper,
				'breakpoints' => array()
			);
			$modules_data = array();
			$wrapper_id = upfront_get_property_value('wrapper_id', $wrapper);
			$wrapper_order = false;
			foreach ( $modules as $m => $module ) {
				$mod_wrapper_id = upfront_get_property_value('wrapper_id', $module);
				if ( $mod_wrapper_id !== $wrapper_id ) continue;
				$module_data = array(
					'index' => $m,
					'module' => $module,
					'breakpoints' => array()
				);
				if ( $wrapper_order === false ) {
					$wrapper_order = $m;
				}
				foreach ( $breakpoints as $context => $breakpoint ) {
					$col = intval($this->_get_class_col($module, $breakpoint));
					$left = intval($this->_get_class_margin('left', $module, $breakpoint));
					$top = intval($this->_get_class_margin('top', $module, $breakpoint));
					$row = intval($this->_get_property_row($module, $breakpoint));
					$order = $m - $wrapper_order;
					if ( !$breakpoint->is_default() ) {
						$breakpoint_order = upfront_get_breakpoint_property_value('order', $module, $breakpoint);
						$order = is_numeric($breakpoint_order) ? $breakpoint_order : $order;
					}
					$module_data['breakpoints'][$context] = array(
						'col' => $col,
						'left' => $left,
						'total_col' => $col + $left,
						'top' => $top,
						'row' => $row,
						'order' => $order
					);
				}
				$modules_data[] = $module_data;
			}

			$wrapper_data['modules'] = $modules_data;
			foreach ( $breakpoints as $context => $breakpoint ) {
				$col = intval($this->_get_class_col($wrapper, $breakpoint));
				$clear = $this->_get_property_clear($wrapper, $breakpoint);
				$order = $wrapper_order;
				if ( !$breakpoint->is_default() ) {
					$breakpoint_order = $this->_get_breakpoint_order($wrapper, $breakpoint);
					$order = is_numeric($breakpoint_order) ? $breakpoint_order : $order;
				}
				$max_col = 0;
				foreach ( $modules_data as $module_data ) {
					$module_col = $module_data['breakpoints'][$context]['total_col'];
					if ( !$module_col ) continue;
					$max_col = ( $max_col < $module_col ? $module_col : $max_col );
				}
				if ( $max_col === 0 ) $max_col = $col;
				$wrapper_data['breakpoints'][$context] = array(
					'col' => $col,
					'max_col' => $max_col,
					'order' => $order,
					'clear' => $clear
				);
			}
			$wrappers_data[] = $wrapper_data;
		}

		$container = !empty($region['container']) ? $region['container'] : $region['name'];
		$region_data['wrappers'] = $wrappers_data;
		foreach ( $breakpoints as $context => $breakpoint ) {
			if ( $regions === false ) {
				$col = intval($this->_get_class_col($region, $breakpoint));
			}
			else {
				if (!empty($region['sub']) && ('top' == $region['sub'] || 'bottom' == $region['sub'])) {
					$col = $breakpoint->get_columns();
				} else {
					$col = $this->_get_property_col($region, $breakpoint);
				}
				if (!$col) {
					$col = $this->_get_available_container_col($container, $regions, $breakpoint);
				}
			}
			$row = intval($this->_get_property_row($region, $breakpoint));
			$region_data['breakpoints'][$context] = array(
				'col' => $col,
				'row' => $row
			);
		}
		return $region_data;
	}

	public function prepare_walk ($region, $breakpoint, $regions = false) {
		$this->current_breakpoint = $breakpoint;
		if ( $regions === false && empty($region['name']) ) { // should be group, try element id
			$element_id = upfront_get_property_value('element_id', $region);
			if ( empty($this->current_region_data) || $this->current_region_data['region_name'] != $element_id ) {
				$this->current_region_data = $this->parse_region($region, $element_id);
			}
		}
		if ( empty($this->current_region_data) || $this->current_region_data['region_name'] != $region['name'] ){
			$this->current_region_data = $this->parse_region($region, $region['name'], $regions);
		}
		usort($this->current_region_data['wrappers'], array($this, '_sort_cb'));
		$this->current_walk = 0;
		$this->current_wrapper = false;
		$this->next_wrapper = false;
		$this->max_col = $this->current_region_data['breakpoints'][$breakpoint->get_id()]['col'];
		$this->line_col = 0;
	}
	
	public function walk () {
		if ( empty($this->current_region_data['wrappers'][$this->current_walk]) ) {
			$this->current_wrapper = false;
			return false;
		}
		$this->current_wrapper = $this->current_region_data['wrappers'][$this->current_walk];
		if ( empty($this->current_region_data['wrappers'][$this->current_walk+1]) ) {
			$this->next_wrapper = false;
		}
		else {
			$this->next_wrapper = $this->current_region_data['wrappers'][$this->current_walk+1];
		}
		$this->current_walk++;
		$wrapper_prop = $this->current_wrapper['breakpoints'][$this->current_breakpoint->get_id()];
		$col = $wrapper_prop['max_col'];
		if ( $wrapper_prop['clear'] || $this->line_col + $col > $this->max_col ) {
			$this->line_col = 0;
		}
		$this->line_col += $col;
		return true;
	}
	
	public function get_wrapper () {
		if ( $this->current_wrapper === false ) return false;
		return array_merge(
			$this->current_wrapper['breakpoints'][$this->current_breakpoint->get_id()],
			array(
				'index' => $this->current_wrapper['index'],
				'wrapper' => $this->current_wrapper['wrapper']
			)
		);
	}
	
	public function get_next_wrapper () {
		if ( $this->next_wrapper === false ) return false;
		return array_merge(
			$this->next_wrapper['breakpoints'][$this->current_breakpoint->get_id()],
			array(
				'index' => $this->next_wrapper['index'],
				'wrapper' => $this->next_wrapper['wrapper']
			)
		);
	}
	
	public function get_modules () {
		if ( $this->current_wrapper === false ) return false;
		$modules = array();
		usort($this->current_wrapper['modules'], array($this, '_sort_cb'));
		foreach ( $this->current_wrapper['modules'] as $module ) {
			$modules[] = array_merge(
				$module['breakpoints'][$this->current_breakpoint->get_id()],
				array(
					'index' => $module['index'],
					'module' => $module['module']
				)
			);
		}
		return $modules;
	}
	
	public function remaining_col () {
		if ( !$this->last_in_line() ) return 0;
		return $this->max_col - $this->line_col;
	}
	
	public function last_in_line () {
		$wrapper_prop = $this->next_wrapper['breakpoints'][$this->current_breakpoint->get_id()];
		if ( $this->next_wrapper === false || $wrapper_prop['clear'] ) return true;
		return ( $this->line_col + $wrapper_prop['max_col'] > $this->max_col );
	}
	
	public function first_in_line () {
		$wrapper_prop = $this->current_wrapper['breakpoints'][$this->current_breakpoint->get_id()];
		return ( $wrapper_prop['max_col'] == $this->line_col );
	}
	
	protected function _get_class_margin ($margin, $data, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		if ( 'left' === $margin ) $pfx = Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT;
		else if ( 'top' === $margin ) $pfx = Upfront_GridBreakpoint::PREFIX_MARGIN_TOP;
		else if ( 'right' === $margin ) $pfx = Upfront_GridBreakpoint::PREFIX_MARGIN_RIGHT;
		else if ( 'bottom' === $margin ) $pfx = Upfront_GridBreakpoint::PREFIX_MARGIN_BOTTOM;
		
		if ( $breakpoint->is_default() ) {
			$margin_pfx = $breakpoint->get_prefix($pfx);
			$class = upfront_get_property_value('class', $data);
			$val = upfront_get_class_num($margin_pfx, $class);
		}
		else {
			$val = upfront_get_breakpoint_property_value($margin, $data, $breakpoint);
		}
		return $val;
	}
	
	protected function _sort_cb ($a, $b) {
		$breakpoint_id = $this->current_breakpoint->get_id();
		$cmp_a = intval($a['breakpoints'][$breakpoint_id]['order']);
		$cmp_b = intval($b['breakpoints'][$breakpoint_id]['order']);
		if ( 0 === $cmp_a && 0 === $cmp_b ) {
			$cmp_a = intval($a['breakpoints']['desktop']['order']);
			$cmp_b = intval($b['breakpoints']['desktop']['order']);
		}
		if ( $cmp_a > $cmp_b) return 1;
		else if( $cmp_a < $cmp_b ) return -1;
		else return 0;
	}
	
}




