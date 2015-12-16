<?php

class Upfront_Compat_LayoutConverter {
	protected $layout;
	protected $from_version;
	protected $to_version;
	protected $current_version;
	protected $parser;
	
	public function __construct (&$layout, $from_version, $to_version) {
		$this->layout = $layout;
		$this->from_version = $from_version;
		$this->current_version = $from_version;
		$this->to_version = $to_version;
		$this->parser = new Upfront_Compat_LayoutParser();
	}
	
	public function convert () {
		while ( $this->convert_from($this->current_version) ) {
			$this->layout->set_property_value('version', $this->current_version);
			if ( version_compare($this->current_version, $this->to_version) !== -1 ) break;
		}
	}
	
	protected function convert_from ($from_version) {
		if ( version_compare($from_version, '1.0.0') === -1 ) {
			return $this->convert_to_1_0_0();
		}
		// Future versions
		/*
		else if ( version_compare($from_version, '1.0.1') === -1 ) {
			return $this->convert_to_1_0_1();
		}
		*/
		return false;
	}
	
	protected function convert_to_1_0_0 () {
		$this->current_version = '1.0.0';
		$converter = new Upfront_Compat_LayoutConverter_Ver_1_0_0($this->layout, $this->parser);
		return $converter->convert();
	}
	
	
}

abstract class Upfront_Compat_LayoutConverter_Ver {
	protected $layout;
	protected $parser;
	protected $regions;
	
	abstract public function convert ();
	
	public function __construct (&$layout, &$parser) {
		$this->layout = $layout;
		$this->parser = $parser;
		$this->regions = $this->layout->get('regions');
	}
}


class Upfront_Compat_LayoutConverter_Ver_1_0_0 extends Upfront_Compat_LayoutConverter_Ver {
	
	public function convert () {
		
		$breakpoints = $this->parser->get_breakpoints();
		foreach ( $this->regions as $r => $region ) {
			$this->_convert_region($region, $this->parser, $this->regions);
			$regions[$r] = $region;
		}
		$this->layout->set('regions', $regions);
		
		return true;
	}

	protected function _convert_region (&$region, &$parser, $regions = false) {
		$breakpoints = $parser->get_breakpoints();
		$add_wrappers = array();
		$add_modules = array();

		// Check region version to make sure we don't convert already converted region
		// Could happen with global region
		$version = upfront_get_property_value('version', $region);
		if ( version_compare($version, '1.0.0') !== -1 ) return;

		foreach ( $breakpoints as $context => $breakpoint ) {
			$parser->prepare_walk($region, $breakpoint, $regions);
			while ( $parser->walk() ) {
				$wrapper = $parser->get_wrapper();
				$modules = $parser->get_modules();
				$first = $parser->first_in_line();
				$last = $parser->last_in_line();
				$converted = $this->_convert_margin($region, $wrapper, $modules, $breakpoint, $parser, $first, $last);
				// Add new spacer module and wrapper
				$wrapper_index = $wrapper['index'];
				$module_index = false;
				foreach ($modules as $module) {
					$module_index = ( $module_index === false || $module['index'] < $module_index ) ? $module['index'] : $module_index;
				}
				if ( !empty($converted['left']) ) {
					if ( !isset($add_wrappers[$wrapper_index]) ) $add_wrappers[$wrapper_index] = array();
					if ( !isset($add_modules[$module_index]) ) $add_modules[$module_index] = array();
					$add_wrappers[$wrapper_index][] = $converted['left']['wrapper'];
					$add_modules[$module_index][] = $converted['left']['module'];
				}
				if ( !empty($converted['right']) ) {
					$wrapper_index++;
					$module_index += count($modules);
					if ( !isset($add_wrappers[$wrapper_index]) ) $add_wrappers[$wrapper_index] = array();
					if ( !isset($add_modules[$module_index]) ) $add_modules[$module_index] = array();
					$add_wrappers[$wrapper_index][] = $converted['right']['wrapper'];
					$add_modules[$module_index][] = $converted['right']['module'];
				}
				/*var_dump(array('first' => $first, 'last' => $last));
				unset($wrapper['wrapper']);
				var_dump('wrapper');
				print_r($wrapper);
				foreach ( $modules as $module ) {
					unset($module['module']);
					var_dump('module');
					print_r($module);
				}
				//print_r($add_modules);
				/**/
			}
		}

		$new_wrappers = array();
		$new_modules = array();
		$max_index = count($region['wrappers']);
		if ( !empty($add_wrappers) ) {
			$max_add_index = max(array_keys($add_wrappers));
			$max_index = $max_add_index > $max_index ? $max_add_index : $max_index;
		}
		for ( $w = 0; $w <= $max_index; $w++ ) {
			if ( isset($add_wrappers[$w]) && is_array($add_wrappers[$w]) ) {
				foreach ( $add_wrappers[$w] as $add_wrapper ) {
					$new_wrappers[] = $add_wrapper;
				}
			}
			if ( isset($region['wrappers'][$w]) ) {
				$new_wrappers[] = $region['wrappers'][$w];
			}
		}
		$max_index = count($region['modules']);
		if ( !empty($add_modules) ) {
			$max_add_index = max(array_keys($add_modules));
			$max_index = $max_add_index > $max_index ? $max_add_index : $max_index;
		}
		for ( $m = 0; $m <= $max_index; $m++ ) {
			if ( isset($add_modules[$m]) && is_array($add_modules[$m]) ) {
				foreach ( $add_modules[$m] as $add_module ) {
					$new_modules[] = $add_module;
				}
			}
			if ( isset($region['modules'][$m]) ) {
				// If this is group, let's convert the modules inside too
				if ( !empty($region['modules'][$m]['modules']) ) {
					$this->_convert_region($region['modules'][$m], $parser);
				}
				$new_modules[] = $region['modules'][$m];
			}
		}
		$region['wrappers'] = $new_wrappers;
		$region['modules'] = $new_modules;

		upfront_set_property_value('version', '1.0.0', $region);
		return $region;
	}
	
	protected function _convert_margin (&$region, $wrapper, $modules, $breakpoint, &$parser, $first = false, $last = false) {
		$wrapper_col = 0;
		$left_space = $wrapper['max_col'];
		$right_space = $last ? $parser->remaining_col() : 0;
		foreach ( $modules as $module ) {
			$wrapper_col = ( $wrapper_col < $module['col'] ) ? $module['col'] : $wrapper_col;
			$left_space = ( $left_space < $module['left'] ) ? $left_space : $module['left'];
		}
		// Add left spacer
		if ( $left_space > 0 ) {
			$left_spacer = $this->_create_spacer($left_space, $first, $wrapper['order'], $breakpoint);
		}
		// Edit current wrapper and module
		$wrapper_index = $wrapper['index'];
		if ( $breakpoint->is_default() ) {
			$column_class = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$left_class = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$top_class = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_TOP);
			
			$classes = upfront_get_property_value('class', $region['wrappers'][$wrapper_index]);
			$classes = upfront_replace_class_num($column_class, $wrapper_col, $classes);
			if ( $first && $left_space > 0 ) {
				$classes = str_replace('clr', '', $classes);
			}
			upfront_set_property_value('class', $classes, $region['wrappers'][$wrapper_index]);
			
			foreach ( $modules as $module ) {
				$module_index = $module['index'];
				$module_classes = upfront_get_property_value('class', $region['modules'][$module_index]);
				$module_classes = upfront_replace_class_num($column_class, $wrapper_col, $module_classes);
				$module_classes = upfront_replace_class_num($left_class, 0, $module_classes);
				$module_classes = upfront_replace_class_num($top_class, 0, $module_classes);
				upfront_set_property_value('class', $module_classes, $region['modules'][$module_index]);
				// Change margin to padding
				if ( !empty($region['modules'][$module_index]['modules']) ) { // This is group
					$this->_add_padding($region['modules'][$module_index], $module, $wrapper_col, $left_space, $breakpoint);
				}
				else { // This is element
					$this->_add_padding($region['modules'][$module_index]['objects'][0], $module, $wrapper_col, $left_space, $breakpoint);
				}
			}
		}
		else {
			upfront_set_breakpoint_property_value('col', $wrapper_col, $region['wrappers'][$wrapper_index], $breakpoint);
			if ( $first && $left_space > 0 ) {
				upfront_set_breakpoint_property_value('clear', false, $region['wrappers'][$wrapper_index], $breakpoint);
			}
			
			foreach ( $modules as $module ) {
				$module_index = $module['index'];
				upfront_set_breakpoint_property_value('col', $wrapper_col, $region['modules'][$module_index], $breakpoint);
				upfront_set_breakpoint_property_value('left', 0, $region['modules'][$module_index], $breakpoint);
				upfront_set_breakpoint_property_value('top', 0, $region['modules'][$module_index], $breakpoint);
				// Change margin to padding
				if ( !empty($region['modules'][$module_index]['modules']) ) { // This is group
					$this->_add_padding($region['modules'][$module_index], $module, $wrapper_col, $left_space, $breakpoint);
				}
				else { // This is element
					$this->_add_padding($region['modules'][$module_index]['objects'][0], $module, $wrapper_col, $left_space, $breakpoint);
				}
			}
		}
		// Add right spacer
		if ( $right_space > 0 ) {
			$right_spacer = $this->_create_spacer($right_space, false, $wrapper['order'], $breakpoint);
			$new_wrappers[] = $right_spacer['wrapper'];
			$new_modules[] = $right_spacer['module'];
		}
		//var_dump(array('col' => $wrapper_col, 'left' => $left_space, 'right' => $right_space, 'wrappers' => $new_wrappers, 'modules' => $new_modules));
		return array(
			'left' => isset($left_spacer) ? $left_spacer : false,
			'right' => isset($right_spacer) ? $right_spacer : false
		);
	}
	
	protected function _create_spacer ($col, $clear, $order, $breakpoint) {
		$column_class = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
		$wrapper_id = upfront_get_unique_id('wrapper');
		$object = array(
			"name" => "",
			"properties" => upfront_array_to_properties(array_merge(array(
				'element_id' => upfront_get_unique_id('spacer-object')
				),
				Upfront_UspacerView::default_properties()
			))
		);
		$module = array(
			"name" => "",
			"properties" => upfront_array_to_properties(array(
				'element_id' => upfront_get_unique_id('module'),
				'wrapper_id' => $wrapper_id,
				'class' => $column_class . $col . ' upfront-module-spacer',
				'has_settings' => 0,
				'default_hide' => 1,
				'toggle_hide' => 0,
				'hide' => ( $breakpoint->is_default() ? 0 : 1 )
			)),
			"objects" => array($object)
		);
		$wrapper = array(
			"name" => "",
			"properties" => upfront_array_to_properties(array(
				'wrapper_id' => $wrapper_id,
				'class' => $column_class . $col . ( $clear ? ' clr' : '' ),
			))
		);
		if ( !$breakpoint->is_default() ) {
			upfront_set_breakpoint_property_value('clear', $clear, $wrapper, $breakpoint);
			upfront_set_breakpoint_property_value('order', $order, $wrapper, $breakpoint);
			upfront_set_breakpoint_property_value('edited', true, $wrapper, $breakpoint);
			upfront_set_breakpoint_property_value('hide', 0, $module, $breakpoint);
			upfront_set_breakpoint_property_value('left', 0, $module, $breakpoint);
			upfront_set_breakpoint_property_value('col', $col, $module, $breakpoint);
			upfront_set_breakpoint_property_value('edited', true, $module, $breakpoint);
		}
		return array(
			'module' => $module,
			'wrapper' => $wrapper
		);
	}

	protected function _add_padding (&$object, $module_data, $wrapper_col, $left_space, $breakpoint) {
		$column_width = $breakpoint->get_column_width();
		$column_padding = $breakpoint->get_column_padding();
		$baseline = $breakpoint->get_baseline();
		$top_padding = ( $module_data['top'] * $baseline );
		$left_padding = ( ( $module_data['left'] - $left_space) * $column_width );
		$right_padding = ( ( $wrapper_col + $left_space - $module_data['total_col'] ) * $column_width );
		$is_group = ( !empty($object['modules']) );
		if ( $breakpoint->is_default() ) {
			if ( $top_padding > 0 ) {
				upfront_set_property_value('top_padding_use', true, $object);
				upfront_set_property_value('top_padding_num', ( $is_group ? $top_padding : $top_padding + $column_padding ), $object);
				$row = upfront_get_property_value('row', $object);
				if ( !empty($row) ) {
					upfront_set_property_value('row', $row + ($top_padding/$baseline), $object);
				}
			}
			if ( $left_padding > 0 ) {
				upfront_set_property_value('left_padding_use', true, $object);
				upfront_set_property_value('left_padding_num', ( $is_group ? $left_padding : $left_padding + $column_padding ), $object);
			}
			if ( $right_padding > 0 ) {
				upfront_set_property_value('right_padding_use', true, $object);
				upfront_set_property_value('right_padding_num', ( $is_group ? $right_padding : $right_padding + $column_padding ), $object);
			}
		}
		else {
			if ( $top_padding > 0 ) {
				upfront_set_breakpoint_property_value('top_padding_use', true, $object, $breakpoint);
				upfront_set_breakpoint_property_value('top_padding_num', ( $is_group ? $top_padding : $top_padding + $column_padding ), $object, $breakpoint);
				$row = upfront_get_breakpoint_property_value('row', $object, $breakpoint);
				if ( !empty($row) ) {
					upfront_set_breakpoint_property_value('row', $row + ($top_padding/$baseline), $object, $breakpoint);
				}
			}
			if ( $left_padding > 0 ) {
				upfront_set_breakpoint_property_value('left_padding_use', true, $object, $breakpoint);
				upfront_set_breakpoint_property_value('left_padding_num', ( $is_group ? $left_padding : $left_padding + $column_padding ), $object, $breakpoint);
			}
			if ( $right_padding > 0 ) {
				upfront_set_breakpoint_property_value('right_padding_use', true, $object, $breakpoint);
				upfront_set_breakpoint_property_value('right_padding_num', ( $is_group ? $right_padding : $right_padding + $column_padding ), $object, $breakpoint);
			}
		}
		return $object;
	}
}







