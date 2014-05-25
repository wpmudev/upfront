<?php

class Upfront_Grid {
	protected $_grid_scope = 'upfront';
	protected $_breakpoints = array(
		"desktop" => "Upfront_GridBreakpoint_Desktop",
		"tablet" => "Upfront_GridBreakpoint_Tablet",
		"mobile" => "Upfront_GridBreakpoint_Mobile",
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
		$breakpoints = $this->get_breakpoints();

		foreach ($breakpoints as $name => $point) {
			$point_css = '';
			$line_height = $point->get_line_height();
			$point_css .= $point->get_frontend_rule();
			$width_pfx = $point->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			foreach ($layout['regions'] as $region) {
				// Cascade defaults
				$container = !empty($region['container']) ? $region['container'] : $region['name'];
				$region_col = upfront_get_property_value('col', $region);
				$region_col = $region_col ? $region_col : $this->_get_available_container_col($container, $layout['regions'], $point->get_columns());
				$region_row = upfront_get_property_value('row', $region);
				$region_view = new Upfront_Region($region);
				$name = strtolower(str_replace(" ", "-", $region_view->get_name()));
				$point_css .= $region_view->get_style_for($point, $this->get_grid_scope());
				$point_css .= $point->apply_col($region_col, $region, $this->get_grid_scope(), '.upfront-region-'.$name);
				if ( $region_row )
					$point_css .= $point->apply_row($region_row, $region, $this->get_grid_scope(), '.upfront-region-'.$name);
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
			$css .= $point->wrap($point_css, $breakpoints, $this->get_grid_scope());
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

	protected $_media = 'only screen';
	protected $_columns = 24;
	protected $_column_width = 45;
	protected $_column_padding = 15;
	protected $_type_padding = 10;
	protected $_baseline = 5;
	protected $_line_height = 30;
	protected $_default = false;
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

	public function __construct () {
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	public function get_debug_rule ($scope) {
		//return ".{$scope} * {color:{$this->_color}!important;}\n";
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
			"#page.{$scope} .upfront-grid-layout {width: {$width}px;}" . "\n" .
			"#page.{$scope} .upfront-overlay-grid {background-size: 100% {$baseline}px}" . "\n" .
			( $width_rule != "" ? "#page.{$scope} { {$width_rule} }" . "\n" : "" ) .
			"#page.{$scope} .upfront-object {padding: {$column_padding}px;}" . "\n" .
			"#page.{$scope} .plaintxt_padding {padding: {$type_padding}px;}" . "\n" .
			"#page.{$scope} .upfront-region-postlayouteditor {padding: {$column_padding}px 0;}" . "\n" .
		'';
	}

	public function get_frontend_rule () {
		$line_height = $this->get_line_height();
		$width = $this->get_width();
		$column_padding = $this->get_column_padding();
		$type_padding = $this->get_type_padding();
		return '' .
			".upfront-grid-layout {width: {$width}px;}" . "\n" .
			".upfront-output-object {padding: {$column_padding}px;}" . "\n" .
			".plaintxt_padding {padding: {$type_padding}px;}" . "\n" .
		'';
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

	public function wrap ($style, $breakpoints) {
		$media = '';
		if ( !$this->_default ){
			if ($this->_debugger->is_active(Upfront_Debug::STYLE)) {
				$class_name = get_class($this);
				$columns = $this->get_columns();
				$media .= "/* Breakpoint {$class_name}: {$columns} columns */\n";
			}
			$media .= "@media " . $this->get_breakpoint_rule($breakpoints);
			$rules = "{\n{$style} }\n\n";
		}
		else {
			$rules = "\n{$style}\n\n";
		}
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

	public function apply_row ($row, $entity, $scope=false, $selector='') {
		return sprintf('%s %s {%s}',
			'.' . ltrim($scope, '. '),
			$selector,
			$this->_row_to_style($row)
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
	protected $_columns = 24;
	//protected $_rule = 'only screen and (min-width: 993px)';
	protected $_default = true;
	protected $_prefixes = array(
		'width' => 'c',
		'margin-left' => 'ml',
		'margin-right' => 'mr',
		'margin-top' => 'mt',
		'margin-bottom' => 'mb',
	);
	protected $_color = "red";
}
class Upfront_GridBreakpoint_Tablet extends Upfront_GridBreakpoint {
	protected $_columns = 12;
	//protected $_rule = 'only screen and (min-width: 577px) and (max-width: 992px)';
	protected $_prefixes = array(
		'width' => 't',
		'margin-left' => 'tml',
		'margin-right' => 'tmr',
		'margin-top' => 'tmt',
		'margin-bottom' => 'tmb',
	);
	protected $_color = "green";
}
class Upfront_GridBreakpoint_Mobile extends Upfront_GridBreakpoint {
	protected $_columns = 3;
	//protected $_rule = 'only screen and (max-width: 576px)';
	protected $_prefixes = array(
		'width' => 'm',
		'margin-left' => 'mml',
		'margin-right' => 'mmr',
		'margin-top' => 'mmt',
		'margin-bottom' => 'mmb',
	);
	protected $_color = "blue";
}


