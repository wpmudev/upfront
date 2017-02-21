<?php


/**
 * Serves LayoutEditor grid stylesheet.
 */
class Upfront_StylesheetEditor extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_load_editor_grid', array($this, "load_styles"));
		}
		upfront_add_ajax('upfront_load_grid', array($this, "load_front_styles"));
		upfront_add_ajax_nopriv('upfront_load_grid', array($this, "load_front_styles"));
	}

	/**
	 * Output editor grid styles
	 */
	function load_styles () {
		$grid = Upfront_Grid::get_grid();

		$preprocessor = new Upfront_StylePreprocessor($grid);
		$style = $preprocessor->get_editor_grid();
		$this->_out(new Upfront_CssResponse_Success($style));
	}

	/**
	 * Output front-end grid styles
	 */
	function load_front_styles () {
		$grid = Upfront_Grid::get_grid();

		if (!Upfront_Behavior::debug()->is_active(Upfront_Behavior::debug()->constant('STYLE'))) {
			$cache = Upfront_Cache::get_instance(Upfront_Cache::TYPE_LONG_TERM);
			$style = $cache->get('grid_front_response', $grid);
			if (!$style) {
				$preprocessor = new Upfront_StylePreprocessor($grid);
				$style = $preprocessor->get_grid();
				$cache->set('grid_front_response', $grid, $style);
			}
		} else {
			$preprocessor = new Upfront_StylePreprocessor($grid);
			$style = $preprocessor->get_grid();
		}

		/**
		 * Filter the styles just before we use them
		 *
		 * @param string $style Gathered styles
		 */
		$style = apply_filters('upfront-dependencies-grid-styles', $style);

		$this->_out(new Upfront_CssResponse_Success($style), !Upfront_Permissions::current(Upfront_Permissions::BOOT)); // Serve cacheable styles for visitors
	}
}
