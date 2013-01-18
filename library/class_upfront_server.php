<?php

class Upfront_Server {

	protected function __construct () {

	}

	public static function name_to_class ($name, $check_existence=false) {
		$parts = array_map('ucfirst', array_map('strtolower', explode('_', $name)));
		$valid = 'Upfront_' . join('', $parts);
		if (!$check_existence) return $valid;
		return class_exists($valid) ? $valid : false;
	}

	protected function _out (Upfront_HttpResponse $out) {
		status_header($out->get_status());
		header("Content-type: " . $out->get_content_type() . "; charset=utf-8");
		die($out->get_output());
	}
}



class Upfront_Ajax extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_load_layout', array($this, "load_layout"));
		add_action('wp_ajax_upfront_save_layout', array($this, "save_layout"));
	}

	// STUB LOADING
	function load_layout () {
		$layout_id = $_POST['data'];
		if (!$layout_id) $this->_out(new Upfront_JsonResponse_Error("No such layout"));

		$layout_id = Upfront_Layout::STORAGE_KEY . '-layout-' . $layout_id; // @TODO: destubify
		$layout = Upfront_Layout::from_id($layout_id);

		if (!$layout->is_empty()) $this->_out(new Upfront_JsonResponse_Success($layout->to_php()));
		else {
			//$this->_out(new Upfront_JsonResponse_Error("Unknown layout: " . $layout_id));
			// Instead of whining, create a stub layout and load that
			$layout = Upfront_Layout::create_layout();
			$this->_out(new Upfront_JsonResponse_Success($layout->to_php()));
		}
	}

	function save_layout () {
		$data = !empty($_POST['data']) ? $_POST['data'] : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Unknown layout"));

		$layout = Upfront_Layout::from_php($data);
		$key = $layout->save();
		$this->_out(new Upfront_JsonResponse_Success($key));
	}

}



class Upfront_JavascriptMain extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_load_main', array($this, "load_main"));
		//add_action('wp_ajax_upfront_save_layout', array($this, "save_layout"));
	}

	function load_main () {
		$root = Upfront::get_root_url();
		$ajax = admin_url('admin-ajax.php');
		$main = <<<EOMainJs
// Set up the global namespace
var Upfront = window.Upfront || {};

(function () {

require.config({
	urlArgs: "nocache=" + (new Date).getTime(),
	baseUrl: '{$root}/scripts',
	paths: {
		models: "upfront/upfront-models",
		views: "upfront/upfront-views",
		editor_views: "upfront/upfront-views-editor",
		util: "upfront/upfront-util",
		behaviors: "upfront/upfront-behaviors",
		application: "upfront/upfront-application",
		objects: "upfront/upfront-objects"
	}
});

(function ($) {
$(function () {
	// Fix Underscore templating to Mustache style
	_.templateSettings = {
		interpolate : /\{\{(.+?)\}\}/g
	};

	require(['application', 'util'], function (application, util) {
		// Shims and stubs
		Upfront.Events = {}
		Upfront.Settings = {
			"ajax_url": "{$ajax}",
			"LayoutEditor": {
				"Selectors": {
					"commands": "#commands",
					"properties": "#properties",
					"layouts": "#layouts",
					//"main": "#upfront-output"
					"main": "#page"
				},
				"Grid": {
					"size": 22,
					"class": "c",
					"left_margin_class": "ml",
					"right_margin_class": "mr",
					"breakpoint_columns": {
						"desktop": 22,
						"tablet": 12,
						"mobile": 6
					},
					"size_classes": {
						"desktop": "c",
						"tablet": "t",
						"mobile": "m"
					},
					"margin_left_classes": {
						"desktop": "ml",
						"tablet": "tml",
						"mobile": "mml"
					},
					"margin_right_classes": {
						"desktop": "mr",
						"tablet": "tmr",
						"mobile": "mmr"
					},
					"scope": "upfront",
				}
			}
		};

		// Populate basics
		_.extend(Upfront.Events, Backbone.Events);
		_.extend(Upfront, application);
		_.extend(Upfront, util);
		
		if (Upfront.Application && Upfront.Application.run) Upfront.Application.run();
		else Upfront.Util.log('something went wrong');
	}); // Upfront
});
})(jQuery);

})();
EOMainJs;
		$this->_out(new Upfront_JavascriptResponse_Success($main));
	}
}



class Upfront_StylesheetMain extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_load_styles', array($this, "load_styles"));
	}

	function load_styles () {
		$grid = new Upfront_Grid;
		$layout_id = Upfront_Layout::STORAGE_KEY . '-layout-1'; // @TODO: destubify
		$layout = Upfront_Layout::from_id($layout_id);

		$preprocessor = new Upfront_StylePreprocessor($grid, $layout);
		$style = $preprocessor->process();
		$this->_out(new Upfront_CssResponse_Succcess($style));
	}
}



class Upfront_StylesheetEditor extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_load_editor_grid', array($this, "load_styles"));
	}

	function load_styles () {
		$grid = new Upfront_Grid;

		$preprocessor = new Upfront_StylePreprocessor($grid);
		$style = $preprocessor->get_editor_grid();
		$this->_out(new Upfront_CssResponse_Succcess($style));
	}
}