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

	public function get_light_grid() {
		$override_baseline = $_SERVER['REQUEST_METHOD'] == 'POST' ? intval((!empty($_POST['baseline']) ? $_POST['baseline'] : 0)) : intval((!empty($_GET['baseline']) ? $_GET['baseline'] : 0));
		$breakpoints = $this->_grid->get_breakpoints();
		$style = '';
		$top_prefixes = array();
		foreach ($breakpoints as $scope => $breakpoint) {
			if($scope != 'desktop')
				continue;

			$columns = $breakpoint->get_columns();
			$baseline_grid = $override_baseline > 0 ? $override_baseline : $breakpoint->get_baseline();
			if(!isset($top_prefixes[$baseline_grid]))
				$top_prefixes[$baseline_grid] = array();
			$top_prefixes[$baseline_grid][] = '.' . $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_TOP) . '%d';
			$width = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$margin_left = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$rules = array();
			$percentages = array();
			for ($i=1; $i <= $columns; $i++) {
				for ($j= 1; $j<=$i ; $j++) {
					$percentage = ($j / $i * 100) . '%';
					if (!isset($percentages[$percentage]))
						$percentages[$percentage] = '.' . $width . $i . '>.%selector%' . $j;
					else
						$percentages[$percentage] .= ',.' . $width . $i . '>.%selector%' . $j;
				}
				$column = ($i / $columns * 100) . '%';

				if (!isset($percentages[$column]))
					$percentages[$column] = '.%selector%' . $i;
				else
					$percentages[$column] .= ',.%selector%' . $i;
			}
			foreach($percentages as $percent => $selectors){
				$rules[] = str_replace('%selector%', $width, $selectors) . '{width: ' . $percent . '}';
				$rules[] = str_replace('%selector%', $margin_left, $selectors) . '{margin-left: ' . $percent . '}';
			}

			//$style .= $breakpoint->get_editor_root_rule($scope, $breakpoints) . "\n";
			$style .= join("\n", $rules) . "\n\n";
		}

		//Top margins
		foreach($top_prefixes as $baseline => $prefixes){
			$top_prefixes[$baseline] = implode(',', $prefixes);
		}

		$rules = array();
		for ($i=1; $i<=300; $i++) {
			foreach($top_prefixes as $baseline => $prefixes){
				$rules[] = sprintf($prefixes, $i, $i, $i) . '{margin-top: ' . $i*$baseline . 'px}';
			}
		}
		$style .= implode("\n", $rules);
		return $style;
	}

	public function get_new_editor_grid() {
		$override_baseline = $_SERVER['REQUEST_METHOD'] == 'POST' ? intval($_POST['baseline']) : intval($_GET['baseline']);
		$breakpoints = $this->_grid->get_breakpoints();
		$style = '';
		foreach ($breakpoints as $scope => $breakpoint) {
			$columns = $breakpoint->get_columns();
			$baseline_grid = $override_baseline > 0 ? $override_baseline : $breakpoint->get_baseline();
			$width = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$margin_left = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$margin_right = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_RIGHT);
			$margin_top = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_TOP);


			if(!isset($top_prefixes[$baseline_grid]))
				$top_prefixes[$baseline_grid] = array();
			$top_prefixes[$baseline_grid][] = '.' . $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_TOP) . '%d';


			$rules = array();
			$widths = array();
			$margins = array();
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
				$sub_selector = array(".{$scope} .{$width}{$i}");

				for ($c=1; $c<=$i; $c++) {
					$percentage = ((100.00 / $i)*$c) . '%';
					$widthRules = ".upfront-wrapper.{$width}{$i} .upfront-module.{$width}{$c}, .upfront-region.{$width}{$i} .upfront-wrapper.{$width}{$c}, .upfront-wrapper .upfront-wrapper.{$width}{$i} .upfront-module.{$width}{$c}, .upfront-wrapper .upfront-region.{$width}{$i} .upfront-wrapper.{$width}{$c}";
					$marginRules = ".upfront-wrapper.{$width}{$i} .upfront-module.{$margin_left}{$c}, .upfront-region.{$width}{$i} .upfront-wrapper.{$margin_left}{$c}, .upfront-wrapper .upfront-wrapper.{$width}{$i} .upfront-module.{$margin_left}{$c}, .upfront-wrapper .upfront-region.{$width}{$i} .upfront-wrapper.{$margin_left}{$c}";
					if(!isset($widths[$percentage])){
						$widths[$percentage] = $widthRules;
						$margins[$percentage] = $marginRules;
					}
					else{
						$widths[$percentage] .= ', ' . $widthRules;
						$margins[$percentage] .= ', ' . $marginRules;
					}
				}
			}
			foreach($widths as $percentage => $selectors){
				$rules[] = $selectors . '{ width: ' . $percentage ." }";
				$rules[] = $margins[$percentage] . '{ margin-left: ' . $percentage ." }";
			}

			$style .= $breakpoint->get_editor_root_rule($scope, $breakpoints) . "\n";
			$style .= join("\n", $rules) . "\n\n";
		}


		//Top margins
		foreach($top_prefixes as $baseline => $prefixes){
			$top_prefixes[$baseline] = implode(',', $prefixes);
		}

		$rules = array();
		for ($i=1; $i<=300; $i++) {
			foreach($top_prefixes as $baseline => $prefixes){
				$rules[] = sprintf($prefixes, $i, $i, $i) . '{margin-top: ' . $i*$baseline . 'px}';
			}
		}
		$style .= implode("\n", $rules);

		return $style;
	}

	protected function _get_width_classes ($col, $parent, $max_col, $width_class, $ml_class, $mr_class = false) {
		$classes = array();
		$classes[] = '.' . $width_class . $col;
		$margin_classes = array();
		$max_margin = $parent-$col;
		if ( $ml_class && $mr_class ){
			for ( $m = $max_margin; $m > 0; $m-- ){
				if ( $m == $max_margin ){
					$margin_classes[] = '.' . $ml_class . $m;
					$margin_classes[] = '.' . $mr_class . $m;
				}
				else
					$margin_classes[] = '.' . $ml_class . $m . '.' . $mr_class . ( $max_margin-$m );
			}
		}
		else {
			$margin_classes[] = '.' . $ml_class . $max_margin;
		}
		for ( $m = $max_col; $m > $col; $m-- ){
			foreach ( $margin_classes as $margin_class )
				$classes[] = $margin_class . '.' . $width_class . $m;
		}
		return $classes;
	}

	public function get_editor_grid () {
		$override_baseline = $_SERVER['REQUEST_METHOD'] == 'POST' ? intval((!empty($_POST['baseline']) ? $_POST['baseline'] : 0)) : intval((!empty($_GET['baseline']) ? $_GET['baseline'] : 0));
		$breakpoints = $this->_grid->get_breakpoints();
		$style = '';
		foreach ($breakpoints as $scope => $breakpoint) {
			if($scope != 'desktop')
				continue;
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
				// main rules, e.g: .c24
				$rules[] = ".{$width}{$i}" . 
					'{' . 
						sprintf('width: %f%%;', (100.00 / $columns)*$i) .
					'}' .
				'';
				$rules[] = ".{$margin_left}{$i}" . 
					'{' . 
						sprintf('margin-left: %f%%;', (100.00 / $columns)*$i) .
					'}' .
				'';
				if ($i==$columns)
					continue;
				// getting sub rules, e.g: .c24 .c22
				$sub_selector = array(".{$width}{$i}");
				// the classes that got 100% width/margin applied
				$max_classes_width = array();
				$max_classes_margin_left = array();
				//$max_classes_margin_right = array();
				for ($x=$columns; $x>=$i; $x--) {
					$max_classes_width[] = implode(" .{$width}{$x}, ", $sub_selector) . " .{$width}{$x}";
					$max_classes_margin_left[] = implode(" .{$margin_left}{$x}, ", $sub_selector) . " .{$margin_left}{$x}";
					//$max_classes_margin_right[] = implode(" .{$margin_right}{$x}, ", $sub_selector) . " .{$margin_right}{$x}";
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
				// the smaller ones
				for ($c=$i-1; $c>=0; $c--) {
					$width_classes = $this->_get_width_classes($c, $i, $columns, $width, $margin_left/*, $margin_right*/);
					$width_selector = array();
					foreach ( $width_classes as $width_class )
						$width_selector[] = implode(" {$width_class}, ", $sub_selector) . " {$width_class}";
					//$rules[] = implode(" .{$width}{$c}, ", $sub_selector) . " .{$width}{$c}" . 
					$rules[] = implode(", ", $width_selector) .
						'{' . 
							sprintf('width: %f%%;', (100.00 / $i)*$c) .
						'}' .
					'';
					$rules[] = implode(" .{$margin_left}{$c}, ", $sub_selector) . " .{$margin_left}{$c}" . 
						'{' . 
							sprintf('margin-left: %f%%;', (100.00 / $i)*$c) .
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
			}
			/*$style .= $breakpoint->wrap(
				$breakpoint->get_editor_root_rule($scope, $breakpoints) . "\n" . join("\n", $rules) . "\n\n",
				$breakpoints, true
			);*/
			$style .= $breakpoint->get_editor_root_rule($scope, $breakpoints) . "\n" . join("\n", $rules) . "\n\n";
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