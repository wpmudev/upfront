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

	function load_styles () {
		$grid = Upfront_Grid::get_grid();

		$preprocessor = new Upfront_StylePreprocessor($grid);
		$style = $preprocessor->get_editor_grid();
		$this->_out(new Upfront_CssResponse_Success($style));
	}

	function load_front_styles () {
		$grid = Upfront_Grid::get_grid();

		$preprocessor = new Upfront_StylePreprocessor($grid);
		$style = $preprocessor->get_grid();
		$this->_out(new Upfront_CssResponse_Success($style), !Upfront_Permissions::current(Upfront_Permissions::BOOT)); // Serve cacheable styles for visitors
	}
}
