<?php

class Upfront_StylePreprocessor {

	private $_grid;
	private $_layout;

	public function __construct (Upfront_Grid $grid, Upfront_Layout $layout=NULL) {
		$this->_grid = $grid;
		$this->_layout = $layout;
	}

	public function process () {
		return $this->_grid->apply_breakpoints($this->_layout->to_php());
	}

	public function get_editor_grid () {
		$breakpoints = $this->_grid->get_breakpoints();
		$style = '';
		foreach ($breakpoints as $scope => $breakpoint_class) {
			$breakpoint = new $breakpoint_class;
			$columns = $breakpoint->get_columns();
			$width = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$margin = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$rules = array();
			for ($i=1; $i<=$columns; $i++) {
				$rules[] = ".{$scope} .{$width}{$i}" . 
					'{' . 
						sprintf('width: %f%%;', (100.00 / $columns)*$i) .
					'}' .
				'';
				$rules[] = ".{$scope} .{$margin}{$i}" . 
					'{' . 
						sprintf('margin-left: %f%%;', (100.00 / $columns)*$i) .
					'}' .
				'';
			}
			$style .= $breakpoint->get_editor_root_rule($scope) . "\n";
			$style .= join("\n", $rules);
		}
		return $style;
	}
}