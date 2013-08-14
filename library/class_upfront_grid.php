<?php

class Upfront_Grid {
	protected $_grid_scope = 'upfront';
	protected $_breakpoints = array(
		"mobile" => "Upfront_GridBreakpoint_Mobile",
		"tablet" => "Upfront_GridBreakpoint_Tablet",
		"desktop" => "Upfront_GridBreakpoint_Desktop",
	);
	protected $_breakpoint_instances = array();
	protected $_debugger;

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
		foreach ($this->_breakpoints as $name => $class) {
			$breakpoint = new $class;
			if ($breakpoint->get_columns() > $this->_max_columns) $this->_max_columns = $breakpoint->get_columns();
			$this->_breakpoint_instances[$name] = $breakpoint;
		}
	}

	public function get_breakpoints () {
		return $this->_breakpoint_instances;
	}

	public function get_max_columns () {
		return $this->_max_columns;
	}

	public function get_grid_scope () {
		return $this->_grid_scope;
	}

	public function apply_breakpoints ($layout) {
		$css = '';
		
		foreach ($this->get_breakpoints() as $name => $point) {
			$point_css = '';
			$line_height = $point->get_line_height();
			$point_css .= "body {line-height: {$line_height}px;}" . "\n";
			$width_pfx = $point->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			foreach ($layout['regions'] as $region) {
				// Cascade defaults
				$container = isset($region['container']) ? $region['container'] : $region['name'];
				$region_col = upfront_get_property_value('col', $region);
				$region_col = $region_col ? $region_col : $this->_get_available_container_col($container, $layout['regions'], $point->get_columns());
				$region_view = new Upfront_Region($region);
				$name = strtolower(str_replace(" ", "-", $region_view->get_name()));
				$point_css .= $region_view->get_style_for($point, $this->get_grid_scope());
				$point_css .= $point->apply_col($region_col, $region, $this->get_grid_scope(), '.upfront-region-'.$name);
				foreach ($region['modules'] as $module) {
					// Particular overrides
					$class = upfront_get_property_value('class', $module);
					$module_col = upfront_get_class_num($width_pfx, $class);
					$wrapper_id = upfront_get_property_value('wrapper_id', $module);
					foreach ($region['wrappers'] as $wrapper){
						if ( $wrapper_id == upfront_get_property_value('wrapper_id', $wrapper) ){
							$wrapper_data = $wrapper;
							break;
						}
					}
					if ( isset($wrapper_data) ){
						$wrapper_class = upfront_get_property_value('class', $wrapper_data);
						$wrapper_col = upfront_get_class_num($width_pfx, $wrapper_class);
						$point_css .= $point->apply($wrapper_data, $this->get_grid_scope(), 'wrapper_id', $region_col);
						$point_css .= $point->apply($module, $this->get_grid_scope(), 'element_id', $wrapper_col);
					}
					else{
						$point_css .= $point->apply($module, $this->get_grid_scope(), 'element_id', $region_col);
					}
					foreach ($module['objects'] as $object) {
						$point_css .= $point->apply($object, $this->get_grid_scope(), 'element_id', $module_col);
					}
				}
			}
			if ($this->_debugger->is_active(Upfront_Debug::STYLE)) {
				$point_css .= $point->get_debug_rule($this->get_grid_scope());
			}
			$css .= $point->wrap($point_css, $this->get_grid_scope());
		}
		return $css;
	}

	protected function _get_available_container_col ($container, $regions, $columns) {
		$occupied = 0;
		foreach ( $regions as $region ){
			if ( isset($region['container']) && $region['container'] != $container )
				continue;
			$region_col = upfront_get_property_value('col', $region);
			if ( $region_col )
				$occupied += $region_col;
		}
		return ( $occupied > $columns ) ? $columns : $columns-$occupied;
	}
}

abstract class Upfront_GridBreakpoint {
	const PREFIX_WIDTH = 'width';
	const PREFIX_HEIGHT = 'min-height';
	const PREFIX_CLEAR = 'clear';
	const PREFIX_MARGIN_LEFT = 'margin-left';
	const PREFIX_MARGIN_RIGHT = 'margin-right';
	const PREFIX_MARGIN_TOP = 'margin-top';
	const PREFIX_MARGIN_BOTTOM = 'margin-bottom';

	protected $_columns = 22;
	protected $_baseline = 15;
	protected $_line_height = 2; // Multiplier to $this->_baseline
	protected $_rule = 'min-width:1024px';
	protected $_prefixes = array(
		'width' => 'c',
		'margin-left' => 'ml',
		'margin-right' => 'mr',
		'margin-top' => 'mt',
		'margin-bottom' => 'mb',
	);
	protected $_color = 'red';

	protected $_debugger;

	public function __construct () {
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	public function get_debug_rule ($scope) {
		//return ".{$scope} * {color:{$this->_color}!important;}\n";
	}

	/**
	 * @TODO: destubify this!!!!
	 * @return string Root CSS rule for editor grid server auto-generation
	 */
	public function get_editor_root_rule ($scope) {
		$line_height = $this->get_line_height();
		return '' .
			"#page {line-height: {$line_height}px;}" .
			"#page .upfront-overlay-grid {background-size: 100% {$this->_baseline}px}" . 
		'';
	}

	public function get_columns () {
		return $this->_columns;
	}
	
	public function get_baseline () {
		return $this->_baseline;
	}
	
	public function get_line_height () {
		return $this->_baseline * $this->_line_height;
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

	public function get_breakpoint_rule () {
		return $this->_rule;
	}

	public function wrap ($style) {
		$media = '';
		if ($this->_debugger->is_active(Upfront_Debug::STYLE)) {
			$class_name = get_class($this);
			$columns = $this->get_columns();
			$media .= "/* Breakpoint {$class_name}: {$columns} columns */\n";
		}
		$media .= "@media {$this->_rule}";
		$rules = "{\n{$style} }\n\n";
		return "{$media}{$rules}";
	}

	public function apply ($entity, $scope=false, $property='element_id', $max_columns=false) {
		$raw_classes = $this->_get_property('class', $entity);
		$classes = array_map('trim', explode(' ', $raw_classes));
		$selector = $this->_get_property($property, $entity);
		if (!$classes) return '';

		$raw_styles = array();
		foreach ($classes as $class) {
			$style = $this->_map_class_to_style($class, $max_columns);
			if (!$style) continue;
			
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ' ;') . ';';
		}
		$row = $this->_get_property('row', $entity);
		if ($row){
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
	
	protected function _row_to_style ($row) {
		$rule = self::PREFIX_HEIGHT;
		$size = ($row * $this->_baseline) . 'px';
		return "{$rule}: {$size}";
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
		$base = (float)(100 / ($max_columns!==false ? $max_columns : $this->_columns));
		/*
		if ($max_columns) {
			$columns_modifier = $this->_columns / $max_columns;
			$span *= $columns_modifier;
		}
		*/
		return ((float)($max_columns!==false && $span > $max_columns ? $max_columns : $span) * $base);
	}
}

class Upfront_GridBreakpoint_Desktop extends Upfront_GridBreakpoint {
	protected $_columns = 22;
	protected $_rule = 'only screen and (min-width: 993px)';
	protected $_prefixes = array(
		'width' => 'c',
		'margin-left' => 'ml',
		'margin-right' => 'mr',
		'margin-top' => 'mt',
		'margin-bottom' => 'mb',
	);
	protected $_color = "red";
	public function get_editor_root_rule ($scope) {
		$parent_rule = parent::get_editor_root_rule($scope);
		return '' .
			$parent_rule.
			"#page.{$scope} {min-width: 968px;}" .
		'';
	}
}
class Upfront_GridBreakpoint_Tablet extends Upfront_GridBreakpoint {
	protected $_columns = 12;
	protected $_rule = 'only screen and (min-width: 577px) and (max-width: 992px)';
	protected $_prefixes = array(
		'width' => 't',
		'margin-left' => 'tml',
		'margin-right' => 'tmr',
		'margin-top' => 'tmt',
		'margin-bottom' => 'tmb',
	);
	protected $_color = "green";
	public function get_editor_root_rule ($scope) {
		$parent_rule = parent::get_editor_root_rule($scope);
		return '' .
			$parent_rule.
			"#page.{$scope} {min-width: 552px; max-width: 960px;}" .
		'';
	}
}
class Upfront_GridBreakpoint_Mobile extends Upfront_GridBreakpoint {
	protected $_columns = 3;
	protected $_rule = 'only screen and (max-width: 576px)';
	protected $_prefixes = array(
		'width' => 'm',
		'margin-left' => 'mml',
		'margin-right' => 'mmr',
		'margin-top' => 'mmt',
		'margin-bottom' => 'mmb',
	);
	protected $_color = "blue";
	public function get_editor_root_rule ($scope) {
		$parent_rule = parent::get_editor_root_rule($scope);
		return '' .
			$parent_rule .
			"#page.{$scope} {min-width: 210px; max-width: 576px;}" .
		'';
	}
}


