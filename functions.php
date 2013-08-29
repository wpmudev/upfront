<?php

defined('UPFRONT_DEBUG_LEVELS') || define('UPFRONT_DEBUG_LEVELS', 'none');

require_once(dirname(__FILE__) . '/library/upfront_functions.php');
require_once(dirname(__FILE__) . '/library/upfront_functions_theme.php');
require_once(dirname(__FILE__) . '/library/class_upfront_registry.php');
require_once(dirname(__FILE__) . '/library/class_upfront_debug.php');
require_once(dirname(__FILE__) . '/library/class_upfront_http_response.php');
require_once(dirname(__FILE__) . '/library/class_upfront_server.php');
require_once(dirname(__FILE__) . '/library/class_upfront_model.php');
require_once(dirname(__FILE__) . '/library/class_upfront_module_loader.php');
require_once(dirname(__FILE__) . '/library/class_upfront_theme.php');
require_once(dirname(__FILE__) . '/library/class_upfront_grid.php');
require_once(dirname(__FILE__) . '/library/class_upfront_style_preprocessor.php');
require_once(dirname(__FILE__) . '/library/class_upfront_output.php');
require_once(dirname(__FILE__) . '/library/class_upfront_form.php');
require_once(dirname(__FILE__) . '/library/class_upfront_endpoint.php');
require_once(dirname(__FILE__) . '/library/class_upfront_media.php');



class Upfront {

	private $_servers = array(
		'ajax',
		'javascript_main',
		'stylesheet_main',
		'stylesheet_editor',
		'element_styles',
	);

	private function __construct () {
		$servers = apply_filters('upfront-servers', $this->_servers);
		foreach ($servers as $component) $this->_run_server($component);
		Upfront_ModuleLoader::serve();
		do_action('upfront-core-initialized');
	}

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
		$me->_add_supports();
	}

	private function _add_hooks () {
		add_filter('body_class', array($this, 'inject_grid_scope_class'));
		add_action('wp_head', array($this, "inject_global_dependencies"), 1);
		add_action('wp_footer', array($this, "inject_upfront_dependencies"), 99);
		add_action('admin_bar_menu', array($this, 'add_edit_menu'), 85);
		add_filter('attachment_fields_to_edit', array($this, 'attachment_fields_to_edit'), 100, 2);
		
		if (is_admin()) {
			add_action('init', array($this, 'init_admin_behaviors'));
		}
	}
	
	private function _add_supports () {
		add_theme_support('post-thumbnails');
		register_nav_menu('default', _('Default'));
	}

	private function _run_server ($comp) {
		$class = Upfront_Server::name_to_class($comp);
		if (!$class) return false;
		call_user_func(array($class, 'serve'));
	}

	public static function get_root_url () {
		return get_template_directory_uri();
	}
	
	public static function get_root_dir () {
		return get_template_directory();
	}

	/**
	 * Dispatch admin transforms
	 */
	function init_admin_behaviors () {
		if (!empty($_REQUEST['upfront-meta_frame'])) {
			add_action('admin_head', array($this, 'inject_admin_meta_frame_styles'));
		}
	}

	function inject_admin_meta_frame_styles () {
		echo <<<EOAdminStyle
<style>
html {
	padding: 0 !important;
}
#adminmenuback, #adminmenuwrap, #wpadminbar, #wpfooter {
	display: none;
}
#wpcontent {
	margin: 0 !important;
}
div.icon32, h2, #post-body-content, #message {
	display: none;
}
#submitdiv, #categorydiv, #tagsdiv-post_tag {
	display: none;
}
</style>
EOAdminStyle;
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
		wp_enqueue_script('jquery-effects-core');
		wp_enqueue_script('jquery-effects-slide');
		wp_enqueue_script('jquery-ui-draggable');
		wp_enqueue_script('jquery-ui-resizable');
		wp_enqueue_script('jquery-ui-selectable');
		//wp_enqueue_script('thickbox');

		//wp_enqueue_style('upfront-jquery-ui', 'http://code.jquery.com/ui/1.9.2/themes/base/jquery-ui.css');
		//wp_enqueue_style('wp-jquery-ui-dialog');
		//wp_enqueue_style('thickbox');
		wp_enqueue_style('upfront-font-source-sans-pro', 'http://fonts.googleapis.com/css?family=Source+Sans+Pro:400,600,700,400italic,600italic,700italic');
/*		
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
*/
		// Enqueue media uploader dependencies.
		//wp_enqueue_media();
		
		// Enqueue needed styles
		wp_enqueue_style('font-awesome', self::get_root_url() . '/styles/font-awesome.min.css');
		wp_enqueue_style('upfront-global', self::get_root_url() . '/styles/global.css');
		wp_enqueue_style('upfront-editor-grid', admin_url('admin-ajax.php?action=upfront_load_editor_grid'));
		wp_enqueue_style('upfront-editor-interface', self::get_root_url() . '/styles/editor-interface.css');
		
		add_action('wp_footer', array($this, 'add_responsive_css'));
	}

	function inject_upfront_dependencies () {
		if (!is_user_logged_in()) return false; // Do not inject for non-logged in user
		$url = self::get_root_url();
		echo '<script src="' . $url . '/scripts/require.js"></script>';
		echo '<script src="' . admin_url('admin-ajax.php?action=upfront_load_main') . '"></script>';
		echo '<script type="text/javascript">var _upfront_post_data=' . json_encode(array(
			'layout' => Upfront_EntityResolver::get_entity_ids(),
			'post_id' => (is_singular() ? apply_filters('upfront-data-post_id', get_the_ID()) : false),
)) . ';</script>';
		echo <<<EOAdditivemarkup
<div id="layouts" style="display:none"></div>
<div id="properties" style="display:none">
    <h3>Properties</h3>
  </div>
  <div id="commands" style="display:none">
    <h3>Actions</h3>
    <button class="upfront-finish_layout_editing">Finish editing</button>
  </div>
  <div id="sidebar-ui"></div>
  <div id="settings" style="display:none"></div>
EOAdditivemarkup;

		echo '<script src="' . $url . '/scripts/ckeditor/ckeditor.js" type="text/javascript"></script>';
		
		do_action('upfront-core-inject_dependencies');
	}

	function add_responsive_css () {
		include(self::get_root_dir().'/styles/editor-interface-responsive.html');
	}
	
	function add_edit_menu ( $wp_admin_bar ) {
		global $post, $tag, $wp_the_query;
		$current_object = $wp_the_query->get_queried_object();
		
		$wp_admin_bar->add_menu( array(
			'id' => 'upfront-edit_layout',
			'title' => __('Edit Layout'),
			'href' => '#',
			'meta' => array( 'class' => 'upfront-edit_layout upfront-editable_trigger' )
		) );
	}
	
	function attachment_fields_to_edit ( $form_fields, $post ) {
		$image_src = wp_get_attachment_image_src($post->ID, 'full');
		$form_fields['use_image'] = array(
			'label' => __(''),
			'input' => 'html',
			'html'  => '<a href="#" onclick="top.Upfront.Events.trigger(\'uploader:image:selected\', ' . $post->ID . ', \'' . $image_src[0] . '\'); top.tb_remove(); return false;" class="button" id="upfront-use-image">Use Image</a>',
		);
		return $form_fields;
	}

}

Upfront::serve();