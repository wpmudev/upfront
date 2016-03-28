<?php

class Upfront_Grid {
	protected $_grid_scope = 'upfront';
	protected $_breakpoints = array();
	protected $_breakpoint_instances = array();
	protected $_debugger;

	protected $_current_breakpoint;
	protected $_exceptions = array();

	private $_max_columns = 0;

	protected function __construct () {
		$this->_instantiate_breakpoints();
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	public static function get_grid () {
		$grid = apply_filters('upfront-core-grid_class', 'Upfront_Grid');
		if (class_exists($grid)) return new $grid;
	}

	private function _instantiate_breakpoints () {
		$responsive_settings = json_decode(get_option('upfront_' . get_stylesheet() . '_responsive_settings', "{}"), true);
		$responsive_settings = apply_filters('upfront_get_responsive_settings', $responsive_settings);


		if ( $responsive_settings && $responsive_settings['breakpoints'] ) {
			$this->_breakpoints = $responsive_settings['breakpoints'];
		} else {
			$this->_breakpoints = $this->initialize_default_breakpoints();
		}
		foreach ($this->_breakpoints as $data) {
			$breakpoint = new Upfront_GridBreakpoint($data);
			if ($breakpoint->get_columns() > $this->_max_columns) $this->_max_columns = $breakpoint->get_columns();
			$this->_breakpoint_instances[$breakpoint->get_id()] = $breakpoint;
		}
	}

	/*
	 * Create responsive settings from layout_properties->grid if it is set in theme settings.
	 */
	private function initialize_default_breakpoints() {
		if (is_null(Upfront_ChildTheme::get_instance())) {
			return $this->get_default_breakpoints();
		}
		$layout_properties = json_decode(Upfront_ChildTheme::get_settings()->get('layout_properties'), true);
		if (!is_array($layout_properties)) {
			return $this->get_default_breakpoints();
		}
		foreach($layout_properties as $property) {
			if ($property['name'] === 'grid') {
				$grid_settings = $property['value'];
			}
		}
		if (!isset($grid_settings)) {
			return $this->get_default_breakpoints();
		}

		// Do the actual merge from here on
		$defaults = $this->get_default_breakpoints();

		$properties = array(
			'column_widths' => 'column_width',
			'column_paddings' => 'column_padding',
			'baselines' => 'baseline',
			'type_paddings' => 'type_padding',
		);
		foreach($properties as $prop_name=>$prop_translated) {
			if (isset($grid_settings[$prop_name])) {
				foreach($grid_settings[$prop_name] as $name=>$value) {
					switch($name) {
					case 'desktop':
						$defaults[0][$prop_translated] = $value;
						break;
					case 'tablet':
						$defaults[1][$prop_translated] = $value;
						break;
					case 'mobile':
						$defaults[2][$prop_translated] = $value;
						break;
					}
				}
			}
		}
		return $defaults;
	}

	public function get_default_breakpoints () {
		return array(
	        array(
	          'name' => 'Default Desktop',
	          'short_name' => 'Default',
	          'default' => true,
	          'id' => 'desktop',
	          'width' => 1080,
	          'columns' => 24,
	          'enabled' => true,
	          'fixed' => true
	        ),
	        array(
	          'name' => 'Tablet',
	          'short_name' => 'Tablet',
	          'id' => 'tablet',
	          'width' => 570,
	          'columns' => 12,
	          'enabled' => true,
	          'fixed' => true
	        ),
	        array(
	          'name' => 'Mobile',
	          'short_name' => 'Mobile',
	          'id' => 'mobile',
	          'width' => 315,
	          'columns' => 7,
	          'enabled' => true,
	          'fixed' => true
	        )
      	);
	}

	public function get_breakpoints_data () {
		return $this->_breakpoints;
	}

	public function get_breakpoints ($filter = false) {
		if ( $filter )
			return array_filter($this->_breakpoint_instances, array($this, "_filter_breakpoint"));
		return $this->_breakpoint_instances;
	}

	public function _filter_breakpoint ($breakpoint) {
		return ( $breakpoint->is_enabled() );
	}

	public function get_default_breakpoint () {
		if ( ! $this->_breakpoint_instances )
			return false;
		foreach ( $this->_breakpoint_instances as $breakpoint ){
			if ( $breakpoint->is_default() )
				return $breakpoint;
		}
		return false;
	}

	public function get_max_columns () {
		return $this->_max_columns;
	}

	public function get_grid_scope () {
		return $this->_grid_scope;
	}

	public function apply_breakpoints ($layout) {
		$css = '';
		$breakpoints = $this->get_breakpoints(true);

		foreach ($breakpoints as $name => $point) {
			$this->_current_breakpoint = $point;
			$point_css = '';
			$line_height = $point->get_line_height();
			$point_css .= $point->get_frontend_rule($layout);
			$layout_view = new Upfront_Layout_View($layout);
			$point_css .= $layout_view->get_style_for($point, $this->get_grid_scope());
			$width_pfx = $point->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			foreach ($layout['regions'] as $region) {
				// Cascade defaults
				$container = !empty($region['container']) ? $region['container'] : $region['name'];
				$region['sub'] = !empty($region['sub']) ? $region['sub'] : false;
				if ( $container == $region['name'] ) {
					$container_view = new Upfront_Region_Container($region);
					$point_css .= $container_view->get_style_for($point, $this->get_grid_scope());
				}
				if ( $region['sub'] == 'top' || $region['sub'] == 'bottom' ) {
					$sub_container_view = new Upfront_Region_Sub_Container($region);
					$point_css .= $sub_container_view->get_style_for($point, $this->get_grid_scope());
					$region_col = $point->get_columns();
				}
				else {
					$region_col = $this->_get_property_col($region);
				}
				$region_col = $region_col ? $region_col : $this->_get_available_container_col($container, $layout['regions']);
				$region_row = $this->_get_property_row($region);
				$region_hide = $this->_get_breakpoint_data($region, 'hide');
				$region_view = new Upfront_Region($region);
				$name = strtolower(str_replace(" ", "-", $region_view->get_name()));
				$point_css .= $region_view->get_style_for($point, $this->get_grid_scope());

				$this->_exceptions = array();
				$point_css .= $this->_apply_modules($region['modules'], $region['wrappers'], $region_col, false);
				$point_css .= $point->apply_col($region_col, $region, $this->get_grid_scope(), '#upfront-region-'.$name);
				$point_css .= $point->apply_bg_paddings($region, $this->get_grid_scope(), '#upfront-region-'.$name);
				if ( $region_row && !in_array('row', $this->_exceptions) ) {
						$point_css .= $point->apply_row($region_row, $region, $this->get_grid_scope(), '#upfront-region-'.$name);
				}
				if ( !$point->is_default() && $region['sub'] == 'fixed' ) { // @TODO we hide float region by default for responsive for now
					$region_hide = 1;
				}
				if ( $region_hide == 1 ) {
					$point_css .= $point->apply_hide($region_hide, $region, $this->get_grid_scope(), '#upfront-region-'.$name);
				}
			}
			if ($this->_debugger->is_active(Upfront_Debug::STYLE)) {
				$point_css .= $point->get_debug_rule($this->get_grid_scope());
			}
			$css .= $point->wrap($point_css, $breakpoints);
		}
		return $css;
	}

	protected function _apply_modules ($modules, $wrappers, $col, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		$point_css = '';
		if ( !$breakpoint->is_default() ) {
			foreach ($wrappers as $w => $wrapper) {
				$wrapper_id = upfront_get_property_value('wrapper_id', $wrapper);
				foreach ( $modules as $m => $module ) {
					if ( upfront_get_property_value('wrapper_id', $module) != $wrapper_id ) continue;
					$wrappers[$w]['_order'] = $m;
				}
			}
			usort($wrappers, array($this, '_sort_cb'));
		}

		$line_col = $col; // keep track of how many column has been applied for each line
		$rendered_wrappers = array(); // keep track of rendered wrappers to avoid render more than once
		$rendered_spacers = array(); // keep track of rendered spacers to avoid render more than once
		$spacer_col = 0; // keep track of spacer to render as margin
		$spacer_id = false; // keep track of spacer to render as margin
		$spacer_clear = false;
		foreach ($modules as $m => $module) {
			$module_col = $this->_get_class_col($module);
			$module_col = $module_col > $col ? $col : $module_col;
			$module_hide = $this->_is_module_hidden($module);
			$module_id = upfront_get_property_value('element_id', $module);
			$wrapper_id = upfront_get_property_value('wrapper_id', $module);
			$wrapper_data = $this->_find_wrapper($wrapper_id, $wrappers);
			$wrapper_index = array_search($wrapper_data, $wrappers);
			$is_clear = $this->_get_property_clear($wrapper_data);
			$prev_wrapper_id = false;
			$prev_wrapper_data = false;
			$next_wrapper_id = false;
			$next_wrapper_data = false;
			$is_post_object = false;
			$is_featured_image = false;
			$is_spacer = false;

			if ( isset($module['modules']) && is_array($module['modules']) ){ // rendering module group
				$module_view = new Upfront_Module_Group($module);
				$point_css .= $module_view->get_style_for($breakpoint, $this->get_grid_scope());
				$point_css .= $this->_apply_modules($module['modules'], $module['wrappers'], $module_col, false);
				$point_css .= $breakpoint->apply_paddings($module, $this->get_grid_scope(), 'element_id');
			}
			else {
				if ( isset($module['objects']) && is_array($module['objects']) ) {
					foreach ($module['objects'] as $object) {
						// See if this is posts/this post element, then add 'row' to exceptions list and disable height rendering
						$type = upfront_get_property_value('type', $object);
						if ( preg_match("/(PostsModel|ThisPostModel|PostDataPartModel|PostDataModel)/", $type) ) {
							if ( 'PostDataPartModel' == $type ) {
								$part_type = upfront_get_property_value('part_type', $object);
								if ( 'content' == $part_type || 'comments' == $part_type ) {
									$is_post_object = true;
								}
							}
							else if ( 'PostDataModel' == $type ) {
								$data_type = upfront_get_property_value('data_type', $object);
								if ( 'post_data' == $data_type || 'comments' == $data_type ) {
									foreach ( $object['objects'] as $child_obj ) {
										$part_type = upfront_get_property_value('part_type', $child_obj);
										if ( 'content' == $part_type || 'comments' == $part_type ) {
											$is_post_object = true;
											break;
										}
									}
								}
								if ( 'featured_image' == $data_type ) {
									$is_featured_image = true;
								}
							}
							else {
								$is_post_object = true;
							}
							if ( $is_post_object && !in_array('row', $this->_exceptions) ) {
								$this->_exceptions[] = 'row';
							}
						}
						else if ( 'UspacerModel' == $type ) {
							$is_spacer = true;
						}
						if ( !$is_spacer ) {
							if ( isset($object['objects']) && is_array($object['objects']) ){ // rendering object group
								$point_css .= $this->_apply_modules($object['objects'], $object['wrappers'], $module_col, false);
							}
							$point_css .= $breakpoint->apply($object, $this->get_grid_scope(), 'element_id', $module_col, false, ($is_post_object ? $this->_exceptions : array()));
							$point_css .= $breakpoint->apply_paddings($object, $this->get_grid_scope(), 'element_id', '#' . $module_id);
						}
					}
				}
				else {
					$type = upfront_get_property_value('type', $module);
					if ( 'PostDataPartModel' == $type ) {
						$part_type = upfront_get_property_value('part_type', $module);
						if ( 'content' == $part_type || 'comments' == $part_type ) {
							$is_post_object = true;
						}
					}
				}
			}

			if ( $is_spacer ) {
				continue;
			}

			if ( !empty($wrapper_data) ) {
				$wrapper_col = $this->_get_class_col($wrapper_data);
				$wrapper_col = $wrapper_col > $col ? $col : $wrapper_col;
				if ( ! in_array($wrapper_id, $rendered_wrappers) ){
					if ( ! $breakpoint->is_default() ) { // find prev/next wrapper based on the breakpoint order
						$prev_wrappers = array_reverse(array_slice($wrappers, 0, $wrapper_index));
						if ( !empty($prev_wrappers) ) {
							foreach ( $prev_wrappers as $w => $wrp ) {
								$prev_wrapper_id = upfront_get_property_value('wrapper_id', $wrp);
								$prev_wrapper_modules = $this->_find_modules_with_wrapper($prev_wrapper_id, $modules);
								foreach ( $prev_wrapper_modules as $nwm => $mod ) {
									if ( $this->_is_module_hidden($mod) ) continue;
									$prev_wrapper_data = $wrp;
									break;
								}
								if ( !empty($prev_wrapper_data) ) break;
							}
						}
						$next_wrappers = array_slice($wrappers, $wrapper_index+1);
						if ( !empty($next_wrappers) ) {
							foreach ( $next_wrappers as $w => $wrp ) {
								$next_wrapper_id = upfront_get_property_value('wrapper_id', $wrp);
								$next_wrapper_modules = $this->_find_modules_with_wrapper($next_wrapper_id, $modules);
								foreach ( $next_wrapper_modules as $nwm => $mod ) {
									if ( $this->_is_module_hidden($mod) ) continue;
									$next_wrapper_data = $wrp;
									break;
								}
								if ( !empty($next_wrapper_data) ) break;
							}
						}
					}
					if ( empty($next_wrapper_data) ) { // find prev/next wrapper based on the module order
						$prev_modules = array_reverse(array_slice($modules, 0, $m));
						if ( !empty($prev_modules) ){
							foreach ( $prev_modules as $n => $mod ){
								if ( $this->_is_module_hidden($mod) ) continue;
								$prev_wrapper_id = upfront_get_property_value('wrapper_id', $mod);
								if ( $prev_wrapper_id != $wrapper_id ) {
									$prev_wrapper_data = $this->_find_wrapper($prev_wrapper_id, $wrappers);
									break;
								}
							}
						}
						$next_modules = array_slice($modules, $m+1);
						if ( !empty($next_modules) ){
							foreach ( $next_modules as $n => $mod ){
								if ( $this->_is_module_hidden($mod) ) continue;
								$next_wrapper_id = upfront_get_property_value('wrapper_id', $mod);
								if ( $next_wrapper_id != $wrapper_id ) {
									$next_wrapper_data = $this->_find_wrapper($next_wrapper_id, $wrappers);
									break;
								}
							}
						}
					}
					// additional check, making sure next wrapper order is > current order
					if ( ! $breakpoint->is_default() && !empty($next_wrapper_data) ) {
						$wrapper_order = $this->_get_breakpoint_order($wrapper_data);
						$next_wrapper_order = $this->_get_breakpoint_order($next_wrapper_data);
						if ( intval($next_wrapper_order) < intval($wrapper_order) ){
							$next_wrapper_data = false;
						}
					}
					$wrapper_modules = $this->_find_modules_with_wrapper($wrapper_id, $modules);
					$wrapper_modules_hide = true;
					foreach ( $wrapper_modules as $wm => $mod ) {
						if ( !$this->_is_module_hidden($mod) ) {
							$wrapper_modules_hide = false;
						}
					}
					$prev_is_spacer = false;
					$prev_spacer_id = false;
					$next_is_spacer = false;
					$next_spacer_id = false;
					if ( $prev_wrapper_data ) {
						$prev_wrapper_id = upfront_get_property_value('wrapper_id', $prev_wrapper_data);
						$prev_wrapper_modules = $this->_find_modules_with_wrapper($prev_wrapper_id, $modules);
						foreach ( $prev_wrapper_modules as $nwm => $mod ) {
							$prev_is_spacer = $this->_is_module_spacer($mod);
							if ( $prev_is_spacer && !$is_clear ) {
								$prev_spacer_id = upfront_get_property_value('element_id', $mod);
								if ( !in_array($prev_spacer_id, $rendered_spacers) ) {
									$spacer_col = $this->_get_class_col($mod);
								}
							}
						}
					}
					if ( $next_wrapper_data ) {
						$next_wrapper_id = upfront_get_property_value('wrapper_id', $next_wrapper_data);
						$next_wrapper_modules = $this->_find_modules_with_wrapper($next_wrapper_id, $modules);
						foreach ( $next_wrapper_modules as $nwm => $mod ) {
							$next_is_spacer = $this->_is_module_spacer($mod);
							if ( $next_is_spacer ) {
								$next_spacer_id = upfront_get_property_value('element_id', $mod);
							}
						}
						$next_clear = $this->_get_property_clear($next_wrapper_data);
						$next_wrapper_col = $this->_get_class_col($next_wrapper_data);
						$next_wrapper_col = $next_wrapper_col > $col ? $col : $next_wrapper_col;
					}
					else {
						$next_clear = false;
						$next_wrapper_col = 0;
					}
					if ( $prev_is_spacer && $spacer_col > 0 ) {
						$rendered_spacers[] = $prev_spacer_id;
					}
					if ( !$wrapper_modules_hide ) {
						if ( $is_clear ) {
							$line_col = $col;
						}
						$line_col -= $wrapper_col + $spacer_col;
					}
					if ( $next_wrapper_col == $line_col && $next_is_spacer ) {
						$next_fill = $next_wrapper_col;
						$rendered_spacers[] = $next_spacer_id;
						$line_col -= $next_wrapper_col;
					}
					else {
						$next_fill = $next_clear && $line_col > 0 ? $line_col : 0;
					}
					$fill_margin = array(
						'left' => $spacer_col,
						'right' => $next_fill
					);
					$point_css .= $breakpoint->apply($wrapper_data, $this->get_grid_scope(), 'wrapper_id', $col, $fill_margin);
					//$point_css .= $breakpoint->apply_hide($wrapper_modules_hide, $wrapper_data, $this->get_grid_scope(), '#'.$wrapper_id);
					if ( !$wrapper_modules_hide && ( $next_clear || $line_col < $next_wrapper_col ) ) {
						$line_col = $col;
					}
					$rendered_wrappers[] = $wrapper_id;
					$spacer_col = 0;
					$spacer_id = false;
				}
				if ( $is_post_object ) {
					$point_css .= $breakpoint->apply($module, $this->get_grid_scope(), 'element_id', $wrapper_col, false, $this->_exceptions);
				}
				else if ( $is_featured_image ) {
					$point_css .= $breakpoint->apply($module, $this->get_grid_scope(), 'element_id', $wrapper_col, false, array('row'));
				}
				else {
					$point_css .= $breakpoint->apply($module, $this->get_grid_scope(), 'element_id', $wrapper_col, false, array());
				}
			}
			else {
				if ( $is_post_object ) {
					$point_css .= $breakpoint->apply($module, $this->get_grid_scope(), 'element_id', $col, false, $this->_exceptions);
				}
				else if ( $is_featured_image ) {
					$point_css .= $breakpoint->apply($module, $this->get_grid_scope(), 'element_id', $col, false, array('row'));
				}
				else {
					$point_css .= $breakpoint->apply($module, $this->get_grid_scope(), 'element_id', $col, false, array());
				}
			}
		}
		return $point_css;
	}

	protected function _find_wrapper ($wrapper_id, $wrappers) {
		$wrapper_data = false;
		foreach ($wrappers as $w => $wrapper){
			if ( $wrapper_id == upfront_get_property_value('wrapper_id', $wrapper) ){
				$wrapper_data = $wrapper;
				break;
			}
		}
		return $wrapper_data;
	}

	protected function _find_modules_with_wrapper ($wrapper_id, $modules) {
		$found = array();
		$found_index = 0;
		foreach ($modules as $m => $module) {
			if ( $wrapper_id == upfront_get_property_value('wrapper_id', $module) && ($found_index == 0 || $found_index == $m-1) ) {
				$found[] = $module;
				$found_index = $m;
			}
		}
		return $found;
	}

	protected function _is_module_hidden ($module, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		$module_default_hide = upfront_get_property_value('default_hide', $module);
		$module_hide = ( $breakpoint->is_default() ) ? upfront_get_property_value('hide', $module) : $this->_get_breakpoint_data($module, 'hide');
		$module_hide = $module_hide === false ? $module_default_hide : $module_hide;
		return $module_hide;
	}

	protected function _is_module_spacer ($module) {
		if( ! empty( $module['objects'] ) ) {
			foreach ($module['objects'] as $obj) {
				$type = upfront_get_property_value('type', $obj);
				if ( 'UspacerModel' == $type ) return true;
			}
		}
		else {
			$type = upfront_get_property_value('type', $module);
			if ( 'UspacerModel' == $type ) return true;
		}
		return false;
	}

	protected function _get_available_container_col ($container, $regions, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		$occupied = 0;
		$columns = $breakpoint->get_columns();
		if ( $breakpoint->is_default() ) {
			foreach ( $regions as $region ){
				if ( isset($region['container']) && $region['container'] != $container )
					continue;
				if ( empty($region['sub']) || ($region['sub'] != 'left' && $region['sub'] != 'right') )
					continue;
				$region_col = $this->_get_property_col($region, $breakpoint);
				if ( $region_col )
					$occupied += $region_col;
			}
			return ( $occupied > $columns ) ? $columns : $columns-$occupied;
		}
		else {
			return $columns;
		}
	}

	protected function _get_property_col ($data, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		$max_col = $breakpoint->get_columns();
		if ( $breakpoint->is_default() ){
			$col = upfront_get_property_value('col', $data);
		}
		else {
			$col = $this->_get_breakpoint_col($data, $breakpoint);
		}
		return $col < $max_col ? $col : $max_col;
	}

	protected function _get_class_col ($data, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		$max_col = $breakpoint->get_columns();
		if ( !$breakpoint->is_default() ){
			$col = $this->_get_breakpoint_col($data, $breakpoint);
			if ( is_numeric($col) )
				return $col < $max_col ? $col : $max_col;
		}
		if ( $breakpoint->is_default() || !is_numeric($col) ){
			$width_pfx = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$class = upfront_get_property_value('class', $data);
			$col = upfront_get_class_num($width_pfx, $class);
			return $col < $max_col ? $col : $max_col;
		}
	}

	protected function _get_property_row ($data, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		if ( !$breakpoint->is_default() ){
			$row = $this->_get_breakpoint_data($data, 'row', $breakpoint);
		}
		if ( $breakpoint->is_default() || !is_numeric($row) ) {
			$row = upfront_get_property_value('row', $data);
		}
		return $row;
	}

	protected function _get_property_clear ($data, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		if ( $breakpoint->is_default() ){
			$class = upfront_get_property_value('class', $data);
			return ( strpos($class, 'clr') !== false );
		}
		else {
			return $this->_get_breakpoint_data($data, 'clear', $breakpoint);
		}
	}

	protected function _get_breakpoint_data ($data, $key, $breakpoint = false, $return_default = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		return upfront_get_breakpoint_property_value($key, $data, $breakpoint, $return_default);
	}

	protected function _get_breakpoint_col ($data, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		return $this->_get_breakpoint_data($data, 'col', $breakpoint);
	}

	protected function _get_breakpoint_order ($data, $breakpoint = false) {
		$breakpoint = $breakpoint !== false ? $breakpoint : $this->_current_breakpoint;
		return $this->_get_breakpoint_data($data, 'order', $breakpoint);
	}

	protected function _sort_cb ($a, $b) {
		$cmp_a = intval($this->_get_breakpoint_order($a));
		$cmp_a_2 = intval($a['_order']);
		$cmp_b = intval($this->_get_breakpoint_order($b));
		$cmp_b_2 = intval($b['_order']);
		if ( $cmp_a > $cmp_b) return 1;
		else if( $cmp_a < $cmp_b ) return -1;
		else return ( $cmp_a_2 < $cmp_b_2 ? -1 : 1 );
	}
}

class Upfront_GridBreakpoint {
	const PREFIX_WIDTH = 'width';
	const PREFIX_HEIGHT = 'min-height';
	const PREFIX_CLEAR = 'clear';
	const PREFIX_MARGIN_LEFT = 'margin-left';
	const PREFIX_MARGIN_RIGHT = 'margin-right';
	const PREFIX_MARGIN_TOP = 'margin-top';
	const PREFIX_MARGIN_BOTTOM = 'margin-bottom';
	const PREFIX_PADDING_TOP = 'padding-top';
	const PREFIX_PADDING_RIGHT = 'padding-right';
	const PREFIX_PADDING_BOTTOM = 'padding-bottom';
	const PREFIX_PADDING_LEFT = 'padding-left';

	protected $_data = false;
	protected $_name = "";
	protected $_short_name = "";
	protected $_id = "";
	protected $_media = 'only screen';
	protected $_width = 1024;
	protected $_columns = 24;
	protected $_column_width = 45;
	protected $_column_padding = 15;
	protected $_type_padding = 10;
	protected $_baseline = 5;
	protected $_line_height = 30;
	protected $_default = false;
	protected $_enabled = false;
	protected $_rule = 'min-width:1080px';
	protected $_prefixes = array(
		'width' => 'c',
		'margin-left' => 'ml',
		'margin-right' => 'mr',
		'margin-top' => 'mt',
		'margin-bottom' => 'mb',
	);
	protected $_color = 'red';

	protected $_debugger;

	public function __construct ($data) {
		$this->_debugger = Upfront_Debug::get_debugger();
		
		if (isset($data['name'])) $this->_name = $data['name'];
		if (isset($data['short_name'])) $this->_short_name = $data['short_name'];
		if (isset($data['id'])) $this->_id = $data['id'];
		if (isset($data['width'])) $this->_width = $data['width'];
		if (isset($data['columns'])) $this->_columns = $data['columns'];
		if (isset($data['column_padding'])) $this->_column_padding = $data['column_padding']; // Special-case handling to allow zero-width column paddings
		
		if (!empty($data['default'])) $this->_default = $data['default'];
		if (!empty($data['enabled'])) $this->_enabled = $data['enabled'];
		if (!empty($data['column_width'])) $this->_column_width = $data['column_width'];
		if (!empty($data['baseline'])) $this->_baseline = $data['baseline'];
		if (!empty($data['type_padding'])) $this->_type_padding = $data['type_padding'];

		$this->_data = $data;
	}

	public function get_debug_rule ($scope) {
		if ($this->_debugger->is_active(Upfront_Debug::RESPONSIVE_BREAKPOINTS)) {
			/*
			$color = dechex(rand(1,200)) . dechex(rand(1,200)) . dechex(rand(1,200));
			return ".{$scope} * {color:#{$color}!important;}\n";
			*/
		}
	}

	protected function get_closest_breakpoints ($breakpoints) {
		$prev = $next = false;
		$prev_width = $next_width = 0;
		$width = $this->get_width();
		foreach ( $breakpoints as $name => $point ){
			$point_width = $point->get_width();
			if ( $point_width > $width && ( $point_width < $next_width || $next_width == 0) ){
				$next = $point;
				$next_width = $point_width;
			}
			else if ( $point_width < $width && ( $point_width > $prev_width || $prev_width == 0 ) ){
				$prev = $point;
				$prev_width = $point_width;
			}
		}
		return array(
			'prev' => $prev,
			'next' => $next
		);
	}

	/**
	 * @TODO: destubify this!!!!
	 * @return string Root CSS rule for editor grid server auto-generation
	 */
	public function get_editor_root_rule ($scope, $breakpoints) {
		if ( ! $this->is_default() )
			return '';
		$line_height = $this->get_line_height();
		$baseline = $this->get_baseline();
		$column_padding = $this->get_column_padding();
		$type_padding = $this->get_type_padding();
		$width_rule = '';
		$min_width = $max_width = 0;
		$width = $this->get_width();
		$closest = $this->get_closest_breakpoints($breakpoints);
		if ( $closest['prev'] ){
			$min_width = $width;
		}
		if ( $closest['next'] ){
			$max_width = $closest['next']->get_width() - 1;
		}
		if ( $min_width > 0 )
			$width_rule .= "min-width: {$min_width}px; ";
		if ( $max_width > 0 )
			$width_rule .= "max-width: {$max_width}px; ";
		return '' .
			"#page.upfront-layout-view .upfront-grid-layout {width: {$width}px;}" . "\n" .
			"#page.upfront-layout-view .upfront-overlay-grid {background-size: 100% {$baseline}px}" . "\n" .
			( $width_rule != "" ? "#page.upfront-layout-view { {$width_rule} }" . "\n" : "" ) .
			( $min_width > 0 ? "#page.upfront-layout-view.desktop-breakpoint .upfront-region-container, #page.upfront-layout-view.desktop-breakpoint .upfront-region-sub-container {min-width: {$min_width}px;}" . "\n" : "" ) .
			"#page.upfront-layout-view .upfront-object {padding: {$column_padding}px;}" . "\n" .
			"#page.upfront-layout-view .upfront-inserted_image-wrapper .wp-caption-text, #page.upfront-layout-view .uinsert-image-wrapper {padding: {$column_padding}px;}" . "\n" .
            "#page.upfront-layout-view .upfront-module-group-bg-padding {margin: {$column_padding}px;}" . "\n" .
			"#page.upfront-layout-view .plaintxt_padding {padding: {$type_padding}px;}" . "\n" .
			"#page.upfront-layout-view .upfront-region-postlayouteditor {padding: {$column_padding}px 0;}" . "\n" .
			"#page.upfront-layout-view #region-container-postlayouteditor {min-width: 0;}" . "\n" .
		'';
	}

	public function get_frontend_rule ($layout) {
		$contained_width = upfront_get_property_value('contained_region_width', $layout);
		$line_height = $this->get_line_height();
		$width = $this->get_grid_width();
		$column_padding = $this->get_column_padding();
		$type_padding = $this->get_type_padding();
		$contained_width = $contained_width ? $contained_width : $width;
		$styles = $this->get_styles();
		return '' .
			( $this->is_default() ? ".upfront-region-container-clip .upfront-region-container-bg {max-width: {$contained_width}px;}" . "\n" : "" ) .
			( $this->is_default() ? ".upfront-region-fixed .upfront-region-wrapper {max-width: {$contained_width}px;}" . "\n" : "" ) .
			".upfront-grid-layout {width: {$width}px;}" . "\n" .
			( $this->is_default() ? ".upfront-output-object {padding: {$column_padding}px;}" . "\n" : "") .
			( $this->is_default() ? ".upfront-inserted_image-wrapper .wp-caption-text, .uinsert-image-wrapper {padding: {$column_padding}px;}" . "\n" : "") .
			( $this->is_default() ? ".plaintxt_padding {padding: {$type_padding}px;}" . "\n" : "") .
			$styles .
		'';
	}

	public function is_default () {
		return $this->_default;
	}

	public function is_enabled () {
		return $this->_enabled;
	}

	public function get_name () {
		return $this->_name;
	}

	public function get_data () {
		return $this->_data;
	}

	public function get_short_name () {
		return $this->_short_name;
	}

	public function get_id () {
		return $this->_id;
	}

	public function get_media () {
		return $this->_media;
	}

	public function get_columns () {
		return $this->_columns;
	}

	public function get_column_width () {
		return $this->_column_width;
	}

	public function get_column_padding () {
		return $this->_column_padding;
	}

	public function get_type_padding () {
		return $this->_type_padding;
	}

	public function get_baseline () {
		return $this->_baseline;
	}

	public function get_line_height () {
		return $this->_line_height;
	}

	public function get_width () {
		return $this->_width;
	}

	public function get_typography() {
		return isset($this->_data['typography']) ? $this->_data['typography'] : array();
	}

	public function get_styles() {
		return isset($this->_data['styles']) ? $this->_data['styles'] : '';
	}

	public function get_grid_width () {
		return $this->get_columns() * $this->get_column_width();
	}

	public function get_prefix ($pfx) {
		if (!empty($this->_prefixes[$pfx])) return $this->_prefixes[$pfx];
		return false;
	}

	public function get_prefix_regex ($pfx) {
		$prefix = $this->get_prefix($pfx);
		if (!$prefix) return false;
		return '^' . preg_quote($prefix, '/') . '(\d+)$';
	}

	public function get_column_size_for ($entity, $pfx=false) {
		$size = 0;
		if (!$pfx) $pfx = self::PREFIX_WIDTH;

		$regex = $this->get_prefix_regex($pfx);
		if (!$regex) return $size;

		$raw_classes = $this->_get_property('class', $entity);
		$classes = array_map('trim', explode(' ', $raw_classes));
		if (!$classes) return $size;
		foreach ($classes as $class) {
			$matches = array();
			if (!preg_match("/{$regex}/", $class, $matches)) continue; // We don't know what's this
			$size = $matches[1];
			break;
		}

		return $size;
	}

	public function get_relative_size_for ($entity, $pfx) {
		$columns = $this->get_column_size_for($entity, $pfx);
		return $this->_columns_to_size($columns);
	}

	public function get_breakpoint_rule ($breakpoints) {
		//return $this->_rule;
		$rule = '';
		$min_width = $max_width = 0;
		$width = $this->get_width();
		$closest = $this->get_closest_breakpoints($breakpoints);
		if ( $closest['prev'] ){
			$min_width = $width;
		}
		if ( $closest['next'] ){
			$max_width = $closest['next']->get_width() - 1;
		}
		$rule .= $this->get_media();
		if ( $min_width > 0 )
			$rule .= " and (min-width:{$min_width}px)";
		if ( $max_width > 0 )
			$rule .= " and (max-width:{$max_width}px)";
		return $rule;
	}

	public function wrap ($style, $breakpoints, $force = false) {
		$media = '';
		if ( !$this->_default || $force ){
			if ($this->_debugger->is_active(Upfront_Debug::STYLE)) {
				$class_name = get_class($this);
				$columns = $this->get_columns();
				$media .= "/* Breakpoint {$class_name}: {$columns} columns */\n";
			}
			$media .= "@media " . $this->get_breakpoint_rule($breakpoints);
			$short_name = $this->get_id();
			$conditional = "body:after { content: '{$short_name}'; display: none; }";
			$rules = "{\n{$conditional}\n{$style} }\n\n";
		}
		else {
			$conditional = "body:after { content: ''; display: none; }";
			$rules = "\n{$conditional}\n{$style}\n\n";
		}
		return "{$media}{$rules}";
	}

	public function apply ($entity, $scope=false, $property='element_id', $max_columns=false, $fill_margin=false, $exception=array()) {
		$raw_classes = $this->_get_property('class', $entity);
		$classes = array_map('trim', explode(' ', $raw_classes));
		$selector = $this->_get_property($property, $entity);
		if (!$classes) return '';
		$breakpoint = $this->_get_property('breakpoint', $entity);
		$breakpoint_data = $breakpoint && !empty($breakpoint[$this->get_id()]) ? $breakpoint[$this->get_id()] : false;

		$raw_styles = array();
		if ( $this->is_default() ){
			foreach ($classes as $class) {
				$style = $this->_map_class_to_style($class, $max_columns);
				if (!$style) continue;

				$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
				$raw_styles[$selector][] = rtrim($style, ' ;') . ';';
			}
			$hide = $this->_get_property('default_hide', $entity);
			if ( $hide == 1 ) {
				$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
				$raw_styles[$selector][] = 'display: none;';
			}
			$row = $this->_get_property('row', $entity);
			$top_padding = $this->_get_property('top_padding_num', $entity);
			$right_padding = $this->_get_property('right_padding_num', $entity);
			$bottom_padding = $this->_get_property('bottom_padding_num', $entity);
			$left_padding = $this->_get_property('left_padding_num', $entity);
		}
		else if ($breakpoint_data){
			foreach ( $breakpoint_data as $key => $value ){
				$style = $this->_map_value_to_style($key, $value, $max_columns);
				if (!$style) continue;

				$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
				$raw_styles[$selector][] = rtrim($style, ' ;') . ';';
			}
			if (!empty($breakpoint_data['row'])) $row = $breakpoint_data['row'];
			if (!empty($breakpoint_data['top_padding_num'])) $top_padding = $breakpoint_data['top_padding_num'];
			if (!empty($breakpoint_data['right_padding_num'])) $right_padding = $breakpoint_data['right_padding_num'];
			if (!empty($breakpoint_data['bottom_padding_num'])) $bottom_padding = $breakpoint_data['bottom_padding_num'];
			if (!empty($breakpoint_data['left_padding_num'])) $left_padding = $breakpoint_data['left_padding_num'];
		}

		// Fill margin left or right
		if ( is_array($fill_margin) ){
			foreach ( $fill_margin as $dir => $val ) {
				if( is_rtl() )
					$prefix = ( 'left' == $dir ) ?  $this->_prefixes[self::PREFIX_MARGIN_RIGHT] : $this->_prefixes[self::PREFIX_MARGIN_LEFT] ;
				else
					$prefix = ( 'left' == $dir ) ? $this->_prefixes[self::PREFIX_MARGIN_LEFT] : $this->_prefixes[self::PREFIX_MARGIN_RIGHT];

				if ( $this->is_default() ){
					$style = $this->_map_class_to_style($prefix . $val, $max_columns);
				}
				else {
					$style = $this->_map_value_to_style($dir, $val, $max_columns);
				}
				$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
				$raw_styles[$selector][] = rtrim($style, ' ;') . ';';
			}
		}

		if ( !in_array('row', $exception) && !empty($row) ){
			$style = $this->_row_to_style($row);
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ';') . ';';
		}

		$all_styles = '';
		foreach ($raw_styles as $selector => $rules) {
			$all_styles .= sprintf('%s #%s {%s}',
				'.' . ltrim($scope, '. '),
				$selector,
				join(' ', $rules)
			) . "\n";
		}

		return $all_styles;
	}

	public function apply_col ($col, $entity, $scope=false, $selector='', $max_columns=false) {
		$rule = self::PREFIX_WIDTH;
		$size = $this->_columns_to_size($col, $max_columns) . '%';
		return sprintf('%s %s {%s}',
			'.' . ltrim($scope, '. '),
			$selector,
			"{$rule}: {$size};"
		) . "\n";
	}

	public function apply_row ($row, $entity, $scope=false, $selector='') {
		return sprintf('%s %s {%s}',
			'.' . ltrim($scope, '. '),
			$selector,
			$this->_row_to_style($row)
		) . "\n";
	}

	public function apply_hide ($hide, $entity, $scope=false, $selector='', $flex = false) {
		return sprintf('%s %s {%s}',
			'.' . ltrim($scope, '. '),
			$selector,
			( $hide == 1 ? "display: none;" : "display: block;" . ( $flex ? " display: -webkit-flex; display: flex;" : "" ) )
		) . "\n";
	}

	public function apply_paddings ($entity, $scope=false, $property='element_id', $selector = '', $exception=array()) {
		if ( !empty($property) ) {
			$selector = $selector . ' #' . $this->_get_property($property, $entity);
		}
		$breakpoint = $this->_get_property('breakpoint', $entity);
		$breakpoint_data = $breakpoint && !empty($breakpoint[$this->get_id()]) ? $breakpoint[$this->get_id()] : false;

		$raw_styles = array();
		$top_padding_use = false;
		$left_padding_use = false;
		$bottom_padding_use = false;
		$right_padding_use = false;

		if ( $this->is_default() ){
			$top_padding = $this->_get_property('top_padding_num', $entity);
			$top_padding_use = $this->_get_property('top_padding_use', $entity);
			$right_padding = $this->_get_property('right_padding_num', $entity);
			$right_padding_use = $this->_get_property('right_padding_use', $entity);
			$bottom_padding = $this->_get_property('bottom_padding_num', $entity);
			$bottom_padding_use = $this->_get_property('bottom_padding_use', $entity);
			$left_padding = $this->_get_property('left_padding_num', $entity);
			$left_padding_use = $this->_get_property('left_padding_use', $entity);
		}
		else if ($breakpoint_data){
			if (isset($breakpoint_data['top_padding_num']) && is_numeric($breakpoint_data['top_padding_num'])) {
				$top_padding = $breakpoint_data['top_padding_num'];
			}
			if (!empty($breakpoint_data['top_padding_use'])) {
				$top_padding_use = $breakpoint_data['top_padding_use'];
			}
			if (isset($breakpoint_data['right_padding_num']) && is_numeric($breakpoint_data['right_padding_num'])) {
				$right_padding = $breakpoint_data['right_padding_num'];
			}
			if (!empty($breakpoint_data['right_padding_use'])) {
				$right_padding_use = $breakpoint_data['right_padding_use'];
			}
			if (isset($breakpoint_data['bottom_padding_num']) && is_numeric($breakpoint_data['bottom_padding_num'])) {
				$bottom_padding = $breakpoint_data['bottom_padding_num'];
			}
			if (!empty($breakpoint_data['bottom_padding_use'])) {
				$bottom_padding_use = $breakpoint_data['bottom_padding_use'];
			}
			if (isset($breakpoint_data['left_padding_num']) && is_numeric($breakpoint_data['left_padding_num'])) {
				$left_padding = $breakpoint_data['left_padding_num'];
			}
			if (!empty($breakpoint_data['left_padding_use'])) {
				$left_padding_use = $breakpoint_data['left_padding_use'];
			}
		}

		if ( !in_array('top_padding', $exception) && $top_padding_use && isset($top_padding) && is_numeric($top_padding) ){
			$style = $this->_top_padding_to_style($top_padding);
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ';') . ';';
		}

		if ( !in_array('right_padding', $exception) && $right_padding_use && isset($right_padding) && is_numeric($right_padding) ){
			$style = $this->_right_padding_to_style($right_padding);
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ';') . ';';
		}

		if ( !in_array('bottom_padding', $exception) && $bottom_padding_use && isset($bottom_padding) && is_numeric($bottom_padding) ){
			$style = $this->_bottom_padding_to_style($bottom_padding);
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ';') . ';';
		}

		if ( !in_array('left_padding', $exception) && $left_padding_use && isset($left_padding) && is_numeric($left_padding) ){
			$style = $this->_left_padding_to_style($left_padding);
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ';') . ';';
		}

		$all_styles = '';
		foreach ($raw_styles as $selector => $rules) {
			$all_styles .= sprintf('%s %s {%s}',
					'.' . ltrim($scope, '. '),
					$selector,
					join(' ', $rules)
				) . "\n";
		}
		return $all_styles;
	}

	public function apply_bg_paddings ($entity, $scope=false, $selector = '') {
		$breakpoint = $this->_get_property('breakpoint', $entity);
		$breakpoint_data = $breakpoint && !empty($breakpoint[$this->get_id()]) ? $breakpoint[$this->get_id()] : false;

		$raw_styles = array();

		if ( $this->is_default() ){
			$top_padding = $this->_get_property('top_bg_padding_num', $entity);
			$bottom_padding = $this->_get_property('bottom_bg_padding_num', $entity);
		}
		else if ($breakpoint_data){
			if (isset($breakpoint_data['top_bg_padding_num']) && is_numeric($breakpoint_data['top_bg_padding_num'])) {
				$top_padding = $breakpoint_data['top_bg_padding_num'];
			}
			if (isset($breakpoint_data['bottom_bg_padding_num']) && is_numeric($breakpoint_data['bottom_bg_padding_num'])) {
				$bottom_padding = $breakpoint_data['bottom_bg_padding_num'];
			}
		}

		if ( isset($top_padding) && is_numeric($top_padding) ){
			$style = $this->_top_padding_to_style($top_padding);
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ';') . ';';
		}

		if ( isset($bottom_padding) && is_numeric($bottom_padding) ){
			$style = $this->_bottom_padding_to_style($bottom_padding);
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ';') . ';';
		}

		$all_styles = '';
		foreach ($raw_styles as $selector => $rules) {
			$all_styles .= sprintf('%s %s {%s}',
					'.' . ltrim($scope, '. '),
					$selector,
					join(' ', $rules)
				) . "\n";
		}
		return $all_styles;
	}

	protected function _map_class_to_style ($class, $max_columns) {
		$style = '';

		foreach ($this->_prefixes as $rule => $prefix) {
			$val = upfront_get_class_num($prefix, $class);
			if ($val===false) continue; // We don't know what's this
			if ( $rule == self::PREFIX_MARGIN_TOP || $rule == self::PREFIX_MARGIN_BOTTOM ){
				$size = ($val*$this->_baseline) . 'px';
			}
			else {
				$size = $this->_columns_to_size($val, $max_columns) . '%';
			}
			$style .= "{$rule}: {$size}";
		}
		if ( $class == 'clr' )
			$style .= self::PREFIX_CLEAR . ": both";

		return $style;
	}

	protected function _map_value_to_style ($key, $value, $max_columns) {
		$style = '';
		$rule = '';

		if ( $key == 'top' || $key == 'bottom' ){
			if ( $key == 'top' )
				$rule = self::PREFIX_MARGIN_TOP;
			else if ( $key == 'bottom' )
				$rule = self::PREFIX_MARGIN_BOTTOM;
			$style_value = ($value*$this->_baseline) . 'px';
		}
		else if ( $key == 'left' || $key == 'right' || $key == 'col' ) {
			if ( $key == 'left' )
				$rule = self::PREFIX_MARGIN_LEFT;
			else if ( $key == 'right' )
				$rule = self::PREFIX_MARGIN_RIGHT;
			else if ( $key == 'col' )
				$rule = self::PREFIX_WIDTH;
			$style_value = $this->_columns_to_size($value, $max_columns) . '%';
		}
		else if ( $key == 'hide' && $value == 1 ) {
			$rule = 'display';
			$style_value = 'none';
		}
		else if ( $key == 'order' ) {
			$style .= "-webkit-order: {$value}; ";
			$style .= "order: {$value}";
		}
		if ( !empty($style_value) )
			$style .= "{$rule}: {$style_value}";

		return $style;
	}

	protected function _row_to_style ($row) {
		$rule = self::PREFIX_HEIGHT;
		$size = ($row * $this->_baseline) . 'px';
		return "{$rule}: {$size}";
	}

	protected function _top_padding_to_style ($top_padding) {
		$rule = self::PREFIX_PADDING_TOP;
		$value = $top_padding . 'px';
		return "{$rule}: {$value}";
	}

	protected function _right_padding_to_style ($right_padding) {
		$rule = self::PREFIX_PADDING_RIGHT;
		$value = $right_padding . 'px';
		return "{$rule}: {$value}";
	}

	protected function _bottom_padding_to_style ($bottom_padding) {
		$rule = self::PREFIX_PADDING_BOTTOM;
		$value = $bottom_padding . 'px';
		return "{$rule}: {$value}";
	}

	protected function _left_padding_to_style ($left_padding) {
		$rule = self::PREFIX_PADDING_LEFT;
		$value = $left_padding . 'px';
		return "{$rule}: {$value}";
	}

	protected function _get_property ($prop, $entity) {
		$properties = $entity['properties'];
		$value = false;
		foreach ($properties as $property) {
			if ($prop != $property['name']) continue;
			$value = $property['value'];
			break;
		}
		return $value;
	}

	protected function _columns_to_size ($span, $max_columns=false) {
		$max = $max_columns!==false ? $max_columns : $this->_columns;
		$base = $max > 0 ? (float)(100 / $max) : 0;
		/*
		if ($max_columns) {
			$columns_modifier = $this->_columns / $max_columns;
			$span *= $columns_modifier;
		}
		*/
		return ((float)($span > $max ? $max : $span) * $base);
	}
}

