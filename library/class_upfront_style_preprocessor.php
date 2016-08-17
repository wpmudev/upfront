<?php

/**
 * Class for styles pre-processing
 */
class Upfront_StylePreprocessor {

	/**
	 * Grid reference
	 *
	 * @var object
	 */
	private $_grid;

	/**
	 * Layout reference
	 *
	 * @var object
	 */
	private $_layout;

	/**
	 * Instantiates the pre-processing
	 *
	 * @param Upfront_Grid $grid Grid object to use
	 * @param mixed $layout Optional (Upfront_Layout)object to use as layout
	 */
	public function __construct (Upfront_Grid $grid, Upfront_Layout $layout=null) {
		$this->_grid = $grid;
		$this->_layout = $layout;
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	/**
	 * Processes the grid into styles
	 *
	 * @return string Compiled styles
	 */
	public function process () {
		$style = $this->_grid->apply_breakpoints($this->_layout->to_php());
		return $this->_debugger->is_active(Upfront_Debug::STYLE)
			? $style
			: self::compress($style)
		;
	}

	/**
	 * Gets grid styles
	 *
	 * @param bool $editor Optional editor toggle flag
	 *
	 * @return string
	 */
	public function get_grid ($editor = false) {
		$override_baseline = 'POST' === $_SERVER['REQUEST_METHOD'] ? intval((!empty($_POST['baseline']) ? $_POST['baseline'] : 0)) : intval((!empty($_GET['baseline']) ? $_GET['baseline'] : 0));
	    $breakpoints = $this->_grid->get_breakpoints();
		$style = '';

		// Let's go with caching
		$cache = Upfront_Cache::get_instance();
		$cache_key = $cache->key('grid', array($this->_grid, $breakpoints, $editor));
		$css = $cache->get($cache_key);
		if (false !== $css) return $editor ? $css : self::compress($css);

		foreach ($breakpoints as $scope => $breakpoint) {
			if ('desktop' !== $scope) continue;

			$columns = $breakpoint->get_columns();
			$column_width = $breakpoint->get_column_width();
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
						sprintf('width:%.3f%%;', floor((100.00 / $columns)*$i*1000)/1000) .
					'}' .
				'';
				$rules[] = ".{$margin_left}{$i}" .
					'{' .
						sprintf('margin-left:%.3f%%;', floor((100.00 / $columns)*$i*1000)/1000) .
					'}' .
				'';
				if ($i==$columns) continue;

				// getting sub rules, e.g: .c24 .c22
				$sub_selector = array(".{$width}{$i}");
				// the classes that got 100% width/margin applied
				$max_classes_width = array();
				$max_classes_margin_left = array();

				for ($x=$columns; $x>=$i; $x--) {
					$max_classes_width[] = implode(" .{$width}{$x}, ", $sub_selector) . " .{$width}{$x}";
					$max_classes_margin_left[] = implode(" .{$margin_left}{$x}, ", $sub_selector) . " .{$margin_left}{$x}";
				}
				if (!empty($max_classes_width))
					$rules[] = implode(', ', $max_classes_width) .
						'{' .
							sprintf('width:%.3f%%;', 100.00) .
						'}' .
					'';
				if (!empty($max_classes_margin_left))
					$rules[] = implode(', ', $max_classes_margin_left) .
						'{' .
							sprintf('margin-left:%.3f%%;', 100.00) .
						'}' .
					'';
				// the smaller ones
				for ($c=$i-1; $c>0; $c--) {
					$width_classes = $this->_get_width_classes($c, $i, $columns, $width, $margin_left);
					$width_selector = array();
					foreach ( $width_classes as $width_class ) {
						$width_selector[] = implode(" {$width_class}, ", $sub_selector) . " {$width_class}";
					}
					$rules[] = implode(", ", $width_selector) .
						'{' .
							sprintf('width:%.3f%%;', floor((100.00 / $i)*$c*1000)/1000) .
						'}' .
					'';
					$rules[] = implode(" .{$margin_left}{$c}, ", $sub_selector) . " .{$margin_left}{$c}" .
						'{' .
							sprintf('margin-left:%.3f%%;', floor((100.00 / $i)*$c*1000)/1000) .
						'}' .
					'';
				}
			}
			// top and bottom margin, as we don't have any maximum rows/height specified, we use 300/2000 here (max 1500/10000px for 5px baseline, depending if user has edit permission or not)
			$max_margin_top = 300;
			if ($editor) {
				$max_margin_top = 2000;
			}
			for ($i=1; $i<=$max_margin_top; $i++) {
				$rules[] = ".{$margin_top}{$i}" .
					'{' .
						sprintf('margin-top:%dpx;', $i*$baseline_grid) .
					'}' .
				'';
			}
			if ($editor) {
				$style .= $breakpoint->get_editor_root_rule($scope, $breakpoints) . "\n";
			}
			$style .= join("\n", $rules);
		}

		$cache->set($cache_key, $style); // Cache stuff for laters

		return $editor ? $style : self::compress($style);
	}

	/**
	 * Gets width classes list
	 *
	 * @param number $col Col
	 * @param number $parent Parent
	 * @param number $max_col Max col
	 * @param string $width_class Base width class
	 * @param string $ml_class Left margin class
	 * @param string $mr_class Optional right margin class
	 *
	 * @return array
	 */
	protected function _get_width_classes ($col, $parent, $max_col, $width_class, $ml_class, $mr_class = false) {
		$classes = array();
		$classes[] = '.' . $width_class . $col;
		$margin_classes = array();
		$max_margin = $parent-$col;
		if ( $ml_class && $mr_class ) {
			for ( $m = $max_margin; $m > 0; $m-- ) {
				if ( $m == $max_margin ) {
					$margin_classes[] = '.' . $ml_class . $m;
					$margin_classes[] = '.' . $mr_class . $m;
				} else $margin_classes[] = '.' . $ml_class . $m . '.' . $mr_class . ( $max_margin-$m );
			}
		} else {
			$margin_classes[] = '.' . $ml_class . $max_margin;
		}
		for ( $m = $max_col; $m > $col; $m-- ) {
			foreach ( $margin_classes as $margin_class )
				$classes[] = $margin_class . '.' . $width_class . $m;
		}
		return $classes;
	}

	/**
	 * Gets grid for the editor
	 *
	 * @return string
	 */
	public function get_editor_grid () {
		return $this->get_grid(true);
	}

	/**
	 * Code based on:
	 * 	Reinhold Weber's compression method (source: )
	 * 	Manas Tungare's compression method (source: https://gist.github.com/2625128)
	 *
	 * @param  string $buffer Raw CSS
	 *
	 * @return string Compressed CSS
	 */
	public static function compress ($buffer) {
		// Let's normalize the non-breaking spaces first
		$buffer = preg_replace('/\xA0/u', ' ', $buffer);

		/* remove comments */
		$buffer = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $buffer);

		/* remove tabs, spaces, newlines, etc. */
		$buffer = str_replace(array("\r\n", "\r", "\n", "\t", '  ', '   ', '    '), ' ', $buffer); // Actually, replace them with single space

		/* Whitespaces cleanup */

		// We need this because fixing the issue with the previous statement (dropping whitespace that killed selectors too)
		// leaves way too much whitespace that we know we don't need
		$buffer = preg_replace('/\s+/', ' ', $buffer); // Collapse spaces
		$buffer = preg_replace('/\s(\{|\})/', '$1', $buffer); // Drop leading spaces surrounding braces
		$buffer = preg_replace('/(\{|\})\s/', '$1', $buffer); // Drop trailing spaces surrounding braces
		$buffer = preg_replace('/(\s;|;\s)/', ';', $buffer); // Drop spaces surrounding semicolons, leading or trailing

		return $buffer;
	}
}
