<?php

define('UPFRONT_DEBUG_LEVELS', 'all');

require_once(dirname(__FILE__) . '/library/upfront_functions.php');
require_once(dirname(__FILE__) . '/library/class_upfront_registry.php');
require_once(dirname(__FILE__) . '/library/class_upfront_debug.php');
require_once(dirname(__FILE__) . '/library/class_upfront_http_response.php');
require_once(dirname(__FILE__) . '/library/class_upfront_server.php');
require_once(dirname(__FILE__) . '/library/class_upfront_model.php');
require_once(dirname(__FILE__) . '/library/class_upfront_grid.php');
require_once(dirname(__FILE__) . '/library/class_upfront_style_preprocessor.php');
require_once(dirname(__FILE__) . '/library/class_upfront_output.php');



class Upfront {

	private $_servers = array(
		'ajax',
		'javascript_main',
		'stylesheet_main',
		'stylesheet_editor',
	);

	private function __construct () {
		foreach ($this->_servers as $component) $this->_run_server($component);
		do_action('upfront-core-initialized');
	}

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_filter('body_class', array($this, 'inject_grid_scope_class'));
		add_action('wp_head', array($this, "inject_global_dependencies"), 1);
		add_action('wp_footer', array($this, "inject_upfront_dependencies"), 99);
	}

	private function _run_server ($comp) {
		$class = Upfront_Server::name_to_class($comp);
		if (!$class) return false;
		call_user_func(array($class, 'serve'));
	}

	public static function get_root_url () {
		return get_stylesheet_directory_uri();
	}

	function inject_grid_scope_class ($cls) {
		$grid = Upfront_Grid::get_grid();
		$cls[] = $grid->get_grid_scope();
		return $cls;
	}

	function inject_global_dependencies () {
		if (!is_user_logged_in()) return false; // Do not inject for non-logged in user
		wp_enqueue_script('jquery');
		wp_enqueue_script('underscore');
		wp_enqueue_script('backbone');
		wp_enqueue_script('jquery-ui');
		wp_enqueue_script('jquery-ui-draggable');
		wp_enqueue_script('jquery-ui-resizable');
		wp_enqueue_script('jquery-ui-selectable');

		wp_enqueue_style('upfront-jquery-ui', 'http://code.jquery.com/ui/1.9.2/themes/base/jquery-ui.css');
		
		// Color picker dependency - new stuff only works in admin :(
		//wp_enqueue_script('wp-color-picker');
		//wp_enqueue_style('wp-color-picker');
		
		// Won't gonna stop us!
		wp_enqueue_script('jquery-ui-slider'); // Required by Iris picker
		wp_enqueue_script('iris', admin_url('js/iris.min.js'), array('jquery-ui-draggable', 'jquery-ui-slider', 'jquery-touch-punch'));
		wp_enqueue_script('wp-color-picker', admin_url('js/color-picker.js'), array('iris'));
		wp_localize_script('wp-color-picker', 'wpColorPickerL10n', array(
			'clear' => __( 'Clear' ),
			'defaultString' => __( 'Default' ),
			'pick' => __( 'Select Color' ),
			'current' => __( 'Current Color' ),
		));
		wp_enqueue_style('wp-color-picker', admin_url('css/color-picker.css'));

	}

	function inject_upfront_dependencies () {
		if (!is_user_logged_in()) return false; // Do not inject for non-logged in user
		$url = self::get_root_url();
		echo '<link type="text/css" rel="stylesheet" href="' . $url . '/styles/font-awesome.min.css" />';
		echo '<link type="text/css" rel="stylesheet" href="' . $url . '/styles/global.css" />';
		echo '<link type="text/css" rel="stylesheet" href="' . admin_url('admin-ajax.php?action=upfront_load_editor_grid') . '" />';
		echo '<link type="text/css" rel="stylesheet" href="' . $url . '/styles/editor-interface.css" />';
		echo '<script src="' . $url . '/scripts/require.js"></script>';
		echo '<script src="' . admin_url('admin-ajax.php?action=upfront_load_main') . '"></script>';
		echo <<<EOAdditivemarkup
<div id="layouts" style="display:none"></div>
<div id="properties" style="display:none">
    <h3>Properties</h3>
  </div>
  <div id="commands" style="display:none">
    <h3>Actions</h3>
    <button class="upfront-finish_layout_editing">Finish editing</button>
  </div>
  <div id="settings" style="display:none"></div>
  <button class="upfront-edit_layout upfront-editable_trigger" id="edit-layout">Edit layout</button>
EOAdditivemarkup;
		
		do_action('upfront-core-inject_dependencies');
	}

}

Upfront::serve();