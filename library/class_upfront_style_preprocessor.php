<?php

class Upfront_StylePreprocessor {

	private $_grid;
	private $_layout;

	public function __construct (Upfront_Grid $grid, Upfront_Layout $layout=NULL) {
		$this->_grid = $grid;
		$this->_layout = $layout;
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	public function process () {
		$style = $this->_grid->apply_breakpoints($this->_layout->to_php());
		return $this->_debugger->is_active(Upfront_Debug::STYLE)
			? $style
			: $this->_compress($style)
		;
	}

	public function get_editor_grid () {
		$breakpoints = $this->_grid->get_breakpoints();
		$baselines = $this->_grid->get_baselines();
		$style = '';
		foreach ($breakpoints as $scope => $breakpoint_class) {
			$breakpoint = new $breakpoint_class;
			$columns = $breakpoint->get_columns();
			$width = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$margin_left = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$margin_right = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_RIGHT);
			$rules = array();
			for ($i=1; $i<=$columns; $i++) {
				$rules[] = ".{$scope} .{$width}{$i}" . 
					'{' . 
						sprintf('width: %f%%;', (100.00 / $columns)*$i) .
					'}' .
				'';
				$rules[] = ".{$scope} .{$margin_left}{$i}" . 
					'{' . 
						sprintf('margin-left: %f%%;', (100.00 / $columns)*$i) .
					'}' .
				'';
				$rules[] = ".{$scope} .{$margin_right}{$i}" . 
					'{' . 
						sprintf('margin-right: %f%%;', (100.00 / $columns)*$i) .
					'}' .
				'';
				if ($i==$columns)
					continue;
				for ($c=1; $c<$i; $c++) {
					$rules[] = ".{$scope} .{$width}{$i} .{$width}{$c}" . 
						'{' . 
							sprintf('width: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
					$rules[] = ".{$scope} .{$width}{$i} .{$margin_left}{$c}" . 
						'{' . 
							sprintf('margin-left: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
					$rules[] = ".{$scope} .{$width}{$i} .{$margin_right}{$c}" . 
						'{' . 
							sprintf('margin-right: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
				}
				$max_classes_width = array();
				$max_classes_margin_left = array();
				$max_classes_margin_right = array();
				for (;$c<=$columns;$c++) {
					$max_classes_width[] = ".{$scope} .{$width}{$i} .{$width}{$c}";
					$max_classes_margin_left[] = ".{$scope} .{$width}{$i} .{$margin_left}{$c}";
					$max_classes_margin_right[] = ".{$scope} .{$width}{$i} .{$margin_right}{$c}";
				}
				if (!empty($max_classes_width))
					$rules[] = implode(', ', $max_classes_width) . 
						'{' . 
							sprintf('width: %f%%;', 100.00) .
						'}' .
					'';
				if (!empty($max_classes_margin_left))
					$rules[] = implode(', ', $max_classes_margin_left) . 
						'{' . 
							sprintf('margin-left: %f%%;', 100.00) .
						'}' .
					'';
				if (!empty($max_classes_margin_right))
					$rules[] = implode(', ', $max_classes_margin_right) . 
						'{' . 
							sprintf('margin-right: %f%%;', 100.00) .
						'}' .
					'';
			}
			$style .= $breakpoint->get_editor_root_rule($scope) . "\n";
			$style .= join("\n", $rules);
		}
		foreach ($baselines as $scope => $baseline_class) {
			$baseline = new $baseline_class;
			$baseline_grid = $baseline->get_baseline();
			$margin_top = $baseline->get_prefix(Upfront_BaselineGrid::PREFIX_MARGIN_TOP);
			$margin_bottom = $baseline->get_prefix(Upfront_BaselineGrid::PREFIX_MARGIN_BOTTOM);
			$rules = array();
			for ($i=1; $i<=20; $i++) {
				$rules[] = ".{$margin_top}{$i}" . 
					'{' . 
						sprintf('margin-top: %dpx;', $i*$baseline_grid) .
					'}' .
				'';
				$rules[] = ".{$margin_bottom}{$i}" . 
					'{' . 
						sprintf('margin-bottom: %dpx;', $i*$baseline_grid) .
					'}' .
				'';
			}
			$style .= $baseline->get_editor_root_rule($scope) . "\n";
			$style .= join("\n", $rules);
		}
		return $style;
	}

	/**
	 * Code based on: 
	 * 	Reinhold Weber's compression method (source: )
	 * 	Manas Tungare's compression method (source: https://gist.github.com/2625128)
	 * @param  string $buffer Raw CSS
	 * @return string Compressed CSS
	 */
	private function _compress ($buffer) {
		/* remove comments */
		$buffer = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $buffer);

		/* remove tabs, spaces, newlines, etc. */
		$buffer = str_replace(array("\r\n", "\r", "\n", "\t", '  ', '    ', '    '), '', $buffer);
		
		// Remove space after colons
		$buffer = str_replace(': ', ':', $buffer);

		return $buffer;
	}
}