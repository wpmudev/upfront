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
				if ($i==$columns)
					continue;
				for ($c=1; $c<=$i; $c++) {
					$rules[] = ".{$scope} .{$width}{$i} .{$width}{$c}" . 
						'{' . 
							sprintf('width: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
					$rules[] = ".{$scope} .{$width}{$i} .{$margin}{$c}" . 
						'{' . 
							sprintf('margin-left: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
				}
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