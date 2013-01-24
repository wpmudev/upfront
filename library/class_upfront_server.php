<?php
/**
 * Core Upfront server classes.
 * All AJAX requests should be routed through a Server implementation,
 * in order to leverage joint debugging, server response standards and compression.
 */



interface IUpfront_Server {
	public static function serve ();
}

abstract class Upfront_Server implements IUpfront_Server {

	protected $_debugger;

	protected function __construct () {
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	public static function name_to_class ($name, $check_existence=false) {
		$parts = array_map('ucfirst', array_map('strtolower', explode('_', $name)));
		$valid = 'Upfront_' . join('', $parts);
		if (!$check_existence) return $valid;
		return class_exists($valid) ? $valid : false;
	}

	protected function _out (Upfront_HttpResponse $out) {
		if (!$this->_debugger->is_active(Upfront_Debug::RESPONSE) && extension_loaded('zlib')) ob_start('ob_gzhandler');
		status_header($out->get_status());
		header("Content-type: " . $out->get_content_type() . "; charset=utf-8");
		die($out->get_output());
	}
}


/**
 * Layout editor AJAX request hub.
 */
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
		$data = !empty($_POST['data']) ? stripslashes_deep($_POST['data']) : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Unknown layout"));

		$layout = Upfront_Layout::from_php($data);
		$key = $layout->save();
		$this->_out(new Upfront_JsonResponse_Success($key));
	}

}


/**
 * Serves require.js main config file and initializes Upfront.
 */
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


		$entities = Upfront_Entity_Registry::get_instance();
		$registered = $entities->get_all();

		$paths = array(
			"models" => "upfront/upfront-models",
			"views" => "upfront/upfront-views",
			"editor_views" => "upfront/upfront-views-editor",
			"util" => "upfront/upfront-util",
			"behaviors" => "upfront/upfront-behaviors",
			"application" => "upfront/upfront-application",
			"objects" => "upfront/upfront-objects",
		);
		$paths = apply_filters('upfront-settings-requirement_paths', $paths + $registered);
		
		$require_config = array(
			'baseUrl' => "{$root}/scripts",
			'paths' => $paths,
		);
		if ($this->_debugger->is_active(Upfront_Debug::CACHED_RESPONSE)) {
			$require_config['urlArgs'] = "nocache=" + microtime(true);
		}
		$require_config = json_encode(
			apply_filters('upfront-settings-require_js_config', $require_config)
		);

		$layout_editor_requirements = array(
			"core" => array('models', 'views', 'editor_views', 'behaviors'),
			"entities" => array_merge(array('objects'), array_keys($registered)),
		);
		$layout_editor_requirements = json_encode(
			apply_filters('upfront-settings-layout_editor_requirements', $layout_editor_requirements)
		);

		$grid = Upfront_Grid::get_grid();
		$breakpoints = $grid->get_breakpoints();

		$grid_info = array(
			'breakpoint_columns' => array(),
			'size_classes' => array(),
			'margin_left_classes' => array(),
			'margin_right_classes' => array(),

			'scope' => $grid->get_grid_scope(),
			'size' => '',
			'class' => '',
			'left_margin_class' => '',
			'right_margin_class' => '',
		);
		foreach ($breakpoints as $context => $breakpoint) {
			$grid_info['breakpoint_columns'][$context] = $breakpoint->get_columns();
			$grid_info['size_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$grid_info['margin_left_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$grid_info['margin_right_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_RIGHT);
		}
		$grid_info = json_encode(
			apply_filters('upfront-settings-grid_info', $grid_info)
		);

		$main = <<<EOMainJs
// Set up the global namespace
var Upfront = window.Upfront || {};

(function () {

require.config($require_config);

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
			"root_url": "{$root}",
			"ajax_url": "{$ajax}",
			"LayoutEditor": {
				"Requirements": {$layout_editor_requirements},
				"Selectors": {
					"commands": "#commands",
					"properties": "#properties",
					"layouts": "#layouts",
					//"main": "#upfront-output"
					"main": "#page"
				},
				"Grid": {$grid_info}
			}
		};

		// Populate basics
		_.extend(Upfront.Events, Backbone.Events);
		_.extend(Upfront, application);
		_.extend(Upfront, util);

		// Set up deferreds
		Upfront.LoadedObjectsDeferreds = {};
		Upfront.Events.trigger("application:loaded:layout_editor");
		
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


/**
 * Serves frontend stylesheet.
 */
class Upfront_StylesheetMain extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_load_styles', array($this, "load_styles"));
	}

	function load_styles () {
		$grid = Upfront_Grid::get_grid();
		$layout_id = Upfront_Layout::STORAGE_KEY . '-layout-1'; // @TODO: destubify
		$layout = Upfront_Layout::from_id($layout_id);

		$preprocessor = new Upfront_StylePreprocessor($grid, $layout);
		$style = $preprocessor->process();
		$this->_out(new Upfront_CssResponse_Succcess($style));
	}
}


/**
 * Serves LayoutEditor grid stylesheet.
 */
class Upfront_StylesheetEditor extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_load_editor_grid', array($this, "load_styles"));
	}

	function load_styles () {
		$grid = Upfront_Grid::get_grid();

		$preprocessor = new Upfront_StylePreprocessor($grid);
		$style = $preprocessor->get_editor_grid();
		$this->_out(new Upfront_CssResponse_Succcess($style));
	}
}