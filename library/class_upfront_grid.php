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

	public function __construct () {
		$this->_instantiate_breakpoints();
		$this->_debugger = Upfront_Debug::get_debugger();
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
			foreach ($layout['regions'] as $region) {
				foreach ($region['modules'] as $module) {
					$point_css .= $point->apply($module, $this->get_grid_scope());
					foreach ($module['objects'] as $object) {
						$point_css .= $point->apply($object, $this->get_grid_scope());
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
}

abstract class Upfront_GridBreakpoint {
	const PREFIX_WIDTH = 'width';
	const PREFIX_MARGIN_LEFT = 'margin-left';
	const PREFIX_MARGIN_RIGHT = 'margin-right';

	protected $_columns = 22;
	protected $_rule = 'min-width:1024px';
	protected $_prefixes = array(
		'width' => 'c',
		'margin-left' => 'ml',
		'margin-right' => 'mr',
	);
	protected $_color = 'red';

	public function get_debug_rule ($scope) {
		return ".{$scope} * {color:{$this->_color}!important;}\n";
	}

	/**
	 * @TODO: destubify this!!!!
	 * @return string Root CSS rule for editor grid server auto-generation
	 */
	abstract public function get_editor_root_rule ($scope);

	public function get_columns () {
		return $this->_columns;
	}

	public function get_prefix ($pfx) {
		if (!empty($this->_prefixes[$pfx])) return $this->_prefixes[$pfx];
		return false;
	}

	public function get_breakpoint_rule () {
		return $this->_rule;
	}

	public function wrap ($style) {
		$media = "@media {$this->_rule}";
		$rules = "{\n{$style} }\n\n";
		return "{$media}{$rules}";
	}

	public function apply ($entity, $scope=false, $max_columns=false) {
		$raw_classes = $this->_get_property('class', $entity);
		$classes = array_map('trim', explode(' ', $raw_classes));
		if (!$classes) return '';

		$raw_styles = array();
		foreach ($classes as $class) {
			$selector = $this->_get_property('element_id', $entity);
			$style = $this->_map_class_to_style($class, $max_columns);
			if (!$style) continue;
			
			$raw_styles[$selector] = !empty($raw_styles[$selector]) ? $raw_styles[$selector] : array();
			$raw_styles[$selector][] = rtrim($style, ' ;') . ';';
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

	protected function _map_class_to_style ($class) {
		$style = '';

		foreach ($this->_prefixes as $rule => $prefix) {
			$rx = '^' . preg_quote($prefix, '/') . '(\d+)$';
			$matches = array();
			if (!preg_match("/{$rx}/", $class, $matches)) continue; // We don't know what's this
			$size = $this->_columns_to_size($matches[1]);
			$style .= "{$rule}: {$size}";
		}
		return $style;
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

	protected function _columns_to_size ($span) {
		$base = (float)(100 / $this->_columns);
		/*
		if ($max_columns) {
			$columns_modifier = $this->_columns / $max_columns;
			$span *= $columns_modifier;
		}
		*/
		return ((float)$span * $base) . '%';
	}
}

class Upfront_GridBreakpoint_Desktop extends Upfront_GridBreakpoint {
	protected $_columns = 22;
	protected $_rule = 'only screen and (min-width: 992px)';
	protected $_prefixes = array(
		'width' => 'c',
		'margin-left' => 'ml',
		'margin-right' => 'mr',
	);
	protected $_color = "red";
	public function get_editor_root_rule ($scope) {
		return '' .
			"#page.{$scope} {max-width: 992px; background-size: 4.5454545455% 4.5454545455%;}" .
		'';
	}
}
class Upfront_GridBreakpoint_Tablet extends Upfront_GridBreakpoint {
	protected $_columns = 12;
	protected $_rule = 'only screen and (min-width: 768px)';
	protected $_prefixes = array(
		'width' => 't',
		'margin-left' => 'tml',
		'margin-right' => 'tmr',
	);
	protected $_color = "green";
	public function get_editor_root_rule ($scope) {
		return '' .
			"#page.{$scope} {max-width: 768px; background-size: 8.333333% 8.333333%;}" .
		'';
	}
}
class Upfront_GridBreakpoint_Mobile extends Upfront_GridBreakpoint {
	protected $_columns = 6;
	protected $_rule = 'only screen and (min-width: 480px)';
	protected $_prefixes = array(
		'width' => 'm',
		'margin-left' => 'mml',
		'margin-right' => 'mmr',
	);
	protected $_color = "blue";
	public function get_editor_root_rule ($scope) {
		return '' .
			"#page.{$scope} {max-width: 480px; background-size: 16.666667% 16.666667%;}" .
		'';
	}
}