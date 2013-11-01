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
		add_action('wp_ajax_upfront_reset_layout', array($this, "reset_layout"));
	}

	// STUB LOADING
	function load_layout () {
		$layout_ids = $_POST['data'];
		$post_type = isset($_POST['new_post']) ? $_POST['new_post'] : false;

		if (empty($layout_ids)) 
			$this->_out(new Upfront_JsonResponse_Error("No such layout"));

		$layout = Upfront_Layout::from_entity_ids($layout_ids);

		if ($layout->is_empty()){
			// Instead of whining, create a stub layout and load that
			$layout = Upfront_Layout::create_layout($layout_ids);			
		}

		if($post_type)
			$post = Upfront_PostModel::create($post_type);
		else
			$post = false;

		$response = array(
			'post' => $post,
			'layout' => $layout->to_php()
		);

		$this->_out(new Upfront_JsonResponse_Success($response));
	}

	function save_layout () {
		$data = !empty($_POST['data']) ? json_decode(stripslashes_deep($_POST['data']), true) : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Unknown layout"));

		$layout = Upfront_Layout::from_php($data);
		$key = $layout->save();
		$this->_out(new Upfront_JsonResponse_Success($key));
	}

	function reset_layout () {
		$data = !empty($_POST['data']) ? stripslashes_deep($_POST['data']) : false;
		$layout = Upfront_Layout::from_php($data);
		$layout->delete();
		$layout->delete_regions();
		$this->_out(new Upfront_JsonResponse_Success("Layout reset"));
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
		add_action('wp_ajax_upfront_data', array($this, 'load_upfront_data'));
		//add_action('wp_ajax_upfront_save_layout', array($this, "save_layout"));
	}

	function load_main () {
		$root = Upfront::get_root_url();
		$ajax = admin_url('admin-ajax.php');
		$admin = admin_url();
		$site = site_url();
		$upfront_data_url = $ajax . '?action=upfront_data';


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
			"media" => "upfront/upfront-media",
			"content" => "upfront/upfront-content",
			"spectrum" => "spectrum/spectrum",
			"responsive" => "responsive",
			"jquerySlider" => includes_url() . 'js/jquery/ui/jquery.ui.slider.min',
			"jqueryDatepicker" => includes_url() . 'js/jquery/ui/jquery.ui.datepicker.min'
		);
		$paths = apply_filters('upfront-settings-requirement_paths', $paths + $registered);

		$require_config = array(
			'baseUrl' => "{$root}/scripts",
			'paths' => $paths,
			'waitSeconds' => 60, // allow longer wait period to prevent timeout
		);
		if ($this->_debugger->is_active(Upfront_Debug::CACHED_RESPONSE)) {
			$require_config['urlArgs'] = "nocache=" + microtime(true);
		}
		$require_config = json_encode(
			apply_filters('upfront-settings-require_js_config', $require_config)
		);

		$layout_editor_requirements = array(
			"core" => array('models', 'views', 'editor_views', 'behaviors', $upfront_data_url, 'media', 'content', 'spectrum', 'responsive', 'jquerySlider', 'jqueryDatepicker' ),
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
			'margin_top_classes' => array(),
			'margin_bottom_classes' => array(),

			'scope' => $grid->get_grid_scope(),
			'baseline' => '',
			'size' => '',
			'class' => '',
			'left_margin_class' => '',
			'right_margin_class' => '',
			
			'baseline' => '',
			'top_margin_class' => '',
			'bottom_margin_class' => '',
		);
		foreach ($breakpoints as $context => $breakpoint) {
			$grid_info['breakpoint_columns'][$context] = $breakpoint->get_columns();
			$grid_info['baseline'] = $breakpoint->get_baseline();
			$grid_info['size_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$grid_info['margin_left_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$grid_info['margin_right_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_RIGHT);
			$grid_info['margin_top_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_TOP);
			$grid_info['margin_bottom_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_BOTTOM);
		}
		$grid_info = json_encode(
			apply_filters('upfront-settings-grid_info', $grid_info)
		);

		$debug = array(
			"transients" => $this->_debugger->is_active(Upfront_Debug::JS_TRANSIENTS),
			"dev" => $this->_debugger->is_active(Upfront_Debug::DEV)
		);
		$debug = json_encode(
			apply_filters('upfront-settings-debug', $debug)
		);


		$specificity = json_encode(array(
			'specificity' => __('This post only'),
			'item' => __('All posts of this type'),
			'type' => __('All posts'),
		));

		$content = json_encode(array(
			'create' => array (
				'page' => Upfront_VirtualPage::get_url('create/page'),
				'post' => Upfront_VirtualPage::get_url('create/post'),
			),
			'edit' => array (
				'page' => Upfront_VirtualPage::get_url('edit/page/'),
				'post' => Upfront_VirtualPage::get_url('edit/post/'),
			),
		));

		$main = <<<EOMainJs
// Set up the global namespace
var Upfront = window.Upfront || {};

(function () {

require.config($require_config);

(function ($) {
$(function () {
	// Fix Underscore templating to Mustache style
	_.templateSettings = {
		evaluate : /\{\[([\s\S]+?)\]\}/g,
		interpolate : /\{\{([\s\S]+?)\}\}/g
	};

	require(['application', 'util'], function (application, util) {
		// Shims and stubs
		Upfront.Events = {}
		Upfront.Settings = {
			"root_url": "{$root}",
			"ajax_url": "{$ajax}",
			"admin_url": "{$admin}",
			"site_url": "{$site}",
			"Debug": {$debug},
			"ContentEditor": {
				"Requirements": {$layout_editor_requirements},
				"Selectors": {
					"sidebar": "#sidebar-ui",
				},
			},
			"LayoutEditor": {
				"Requirements": {$layout_editor_requirements},
				"Selectors": {
					"sidebar": "#sidebar-ui",
					"commands": "#commands",
					"properties": "#properties",
					"layouts": "#layouts",
					"settings": "#settings",
					//"main": "#upfront-output"
					"main": "#page"
				},
				"Specificity": {$specificity},
				"Grid": {$grid_info},
			},
			"Content": {$content},
		};

		// Populate basics
		_.extend(Upfront.Events, Backbone.Events);
		_.extend(Upfront, application);
		_.extend(Upfront, util);
		Upfront.Util.Transient.initialize();
		
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

	public function load_upfront_data(){
		include Upfront::get_root_dir() . '/scripts/upfront/upfront-data.php';
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
		upfront_add_ajax('upfront_load_styles', array($this, "load_styles"));
		upfront_add_ajax_nopriv('upfront_load_styles', array($this, "load_styles"));
	}

	function load_styles () {
		$grid = Upfront_Grid::get_grid();
		$layout = Upfront_Layout::get_instance();

		$preprocessor = new Upfront_StylePreprocessor($grid, $layout);
		$style = $preprocessor->process();
		$this->_out(new Upfront_CssResponse_Success($style));
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
		$this->_out(new Upfront_CssResponse_Success($style));
	}
}


/**
 * Serves registered element stylesheets.
 */
class Upfront_ElementStyles extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_enqueue_scripts', array($this, 'load_styles'));
		add_action('wp_enqueue_scripts', array($this, 'load_scripts'));

		add_action('wp_ajax_upfront-element-styles', array($this, 'serve_styles'));
		add_action('wp_ajax_nopriv_upfront-element-styles', array($this, 'serve_styles'));

		add_action('wp_ajax_upfront-element-scripts', array($this, 'serve_scripts'));
		add_action('wp_ajax_nopriv_upfront-element-scripts', array($this, 'serve_scripts'));
	}

	function load_styles () {
		$hub = Upfront_PublicStylesheets_Registry::get_instance();
		$styles = $hub->get_all();
		if (empty($styles)) return false;

		$raw_cache_key = $this->_get_raw_cache_key($styles);
		$cache_key = "css{$raw_cache_key}";
		$cache = $this->_debugger->is_active() ? false : get_transient($cache_key);
		if (empty($cache)) {
			foreach ($styles as $key => $frags) {
				$path = upfront_element_dir($frags[0], $frags[1]);
				if (file_exists($path)) $cache .= "/* {$key} */\n" . file_get_contents($path) . "\n";
			}
			if (!$this->_debugger->is_active(Upfront_Debug::STYLE)) $cache = Upfront_StylePreprocessor::compress($cache);
			set_transient($cache_key, $cache);
		}

		//wp_enqueue_style('upfront-element-styles', admin_url('admin-ajax.php?action=upfront-element-styles&key=' . $cache_key)); // It'll also work as an AJAX request
		wp_enqueue_style('upfront-element-styles', Upfront_VirtualPage::get_url(join('/', array(
			'upfront-dependencies',
			'styles',
			$raw_cache_key
		)))); // But let's do pretty instead
	}

	function load_scripts () {
		$hub = Upfront_PublicScripts_Registry::get_instance();
		$scripts = $hub->get_all();
		if (empty($scripts)) return false;

		$raw_cache_key = $this->_get_raw_cache_key($scripts);
		$cache_key = "js{$raw_cache_key}";
		$cache = $this->_debugger->is_active() ? false : get_transient($cache_key);
		if (empty($cache)) {
			foreach ($scripts as $key => $frags) {
				$path = upfront_element_dir($frags[0], $frags[1]);
				if (file_exists($path)) $cache .= "/* {$key} */\n" . file_get_contents($path) . "\n";
			}
			set_transient($cache_key, $cache);
		}
		
		//wp_enqueue_script('upfront-element-scripts', admin_url('admin-ajax.php?action=upfront-element-scripts&key=' . $cache_key), array('jquery')); // It'll also work as an AJAX request
		wp_enqueue_script('upfront-element-scripts', Upfront_VirtualPage::get_url(join('/', array(
			'upfront-dependencies',
			'scripts',
			$raw_cache_key
		))), array('jquery', 'underscore')); // But let's do pretty instead
	}

	function serve_styles () {
		$key = 'css' . stripslashes($_REQUEST['key']);
		if (empty($key)) $this->_out(new Upfront_CssResponse_Error());

		$cache = get_transient($key);
		$this->_out(new Upfront_CssResponse_Success($cache));
	}

	function serve_scripts () {
		$key = 'js' . stripslashes($_REQUEST['key']);
		if (empty($key)) $this->_out(new Upfront_JavascriptResponse_Error());

		$cache = get_transient($key);
		$this->_out(new Upfront_JavascriptResponse_Success($cache));
	}

	private function _get_raw_cache_key ($stuff) {
		//return substr(md5(serialize($stuff)), 0, 24); // Forced length for transients API key length limitation
		return md5(serialize($stuff));
	}
}