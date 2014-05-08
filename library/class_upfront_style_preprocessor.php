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
			: self::compress($style)
		;
	}

	public function get_editor_grid () {
		$override_baseline = $_SERVER['REQUEST_METHOD'] == 'POST' ? intval($_POST['baseline']) : intval($_GET['baseline']);
		$breakpoints = $this->_grid->get_breakpoints();
		$style = '';
		foreach ($breakpoints as $scope => $breakpoint_class) {
			$breakpoint = new $breakpoint_class;
			$columns = $breakpoint->get_columns();
			$baseline_grid = $override_baseline > 0 ? $override_baseline : $breakpoint->get_baseline();
			$width = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$margin_left = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$margin_right = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_RIGHT);
			$margin_top = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_TOP);
			$margin_bottom = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_BOTTOM);
			$rules = array();
			// the rules were rendered from bigger columns to smaller one, to allow CSS overriding to work properly
			for ($i=$columns; $i>=0; $i--) {
				// main rules, e.g: .desktop .c24
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
				// getting sub rules, e.g: .desktop .c24 .c22
				$sub_selector = array(".{$scope} .{$width}{$i}");
				/*for ($s=$columns; $s>=$i+1; $s--){
					$sub_selector[] = ".{$scope} .{$width}{$s} .{$width}{$i}";
				}*/
				// the classes that got 100% width/margin applied
				$max_classes_width = array();
				$max_classes_margin_left = array();
				$max_classes_margin_right = array();
				for ($x=$columns; $x>=$i; $x--) {
					$max_classes_width[] = implode(" .{$width}{$x}, ", $sub_selector) . " .{$width}{$x}";
					$max_classes_margin_left[] = implode(" .{$margin_left}{$x}, ", $sub_selector) . " .{$margin_left}{$x}";
					$max_classes_margin_right[] = implode(" .{$margin_right}{$x}, ", $sub_selector) . " .{$margin_right}{$x}";
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
				// the smaller ones
				for ($c=$i-1; $c>=0; $c--) {
					$rules[] = implode(" .{$width}{$c}, ", $sub_selector) . " .{$width}{$c}" . 
						'{' . 
							sprintf('width: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
					$rules[] = implode(" .{$margin_left}{$c}, ", $sub_selector) . " .{$margin_left}{$c}" . 
						'{' . 
							sprintf('margin-left: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
					$rules[] = implode(" .{$margin_right}{$c}, ", $sub_selector) . " .{$margin_right}{$c}" . 
						'{' . 
							sprintf('margin-right: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
				}
			}
			// top and bottom margin, as we don't have any maximum rows/height specified, we use 2000 here (over 10000px for 5px baseline)
			for ($i=1; $i<=2000; $i++) {
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
			$style .= $breakpoint->get_editor_root_rule($scope, $breakpoints) . "\n";
			$style .= join("\n", $rules) . "\n\n";
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
	public static function compress ($buffer) {
		/* remove comments */
		$buffer = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $buffer);

		/* remove tabs, spaces, newlines, etc. */
		$buffer = str_replace(array("\r\n", "\r", "\n", "\t", '  ', '    ', '    '), '', $buffer);
		
		// Remove space after colons
		$buffer = str_replace(': ', ':', $buffer);

		return $buffer;
	}
}