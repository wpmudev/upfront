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
		add_action('wp_ajax_upfront_list_available_layout', array($this, "list_available_layout"));
		add_action('wp_ajax_upfront_list_saved_layout', array($this, "list_saved_layout"));
		add_action('wp_ajax_upfront_reset_layout', array($this, "reset_layout"));
		add_action('wp_ajax_upfront_build_preview', array($this, "build_preview"));
		add_action('wp_ajax_upfront_update_layout_element', array($this, "update_layout_element"));
		add_action('wp_ajax_upfront_update_insertcount', array($this, "update_insertcount"));
	}

	// STUB LOADING
	function load_layout () {
		$layout_ids = $_POST['data'];
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'];
		$layout_slug = $_POST['layout_slug'];
		$load_dev = $_POST['load_dev'] == 1 ? true : false;
		$post_type = isset($_POST['new_post']) ? $_POST['new_post'] : false;
		$parsed = false;
		$string = '';

		if (empty($layout_ids))
			$this->_out(new Upfront_JsonResponse_Error("No such layout"));

		upfront_switch_stylesheet($stylesheet);

		if(is_string($layout_ids)){
			$string = $layout_ids;
			$layout_ids = Upfront_EntityResolver::ids_from_url($layout_ids);
			$parsed = true;
		}

		$layout = Upfront_Layout::from_entity_ids($layout_ids, $storage_key, $load_dev);

		if ($layout->is_empty()){
			// Instead of whining, create a stub layout and load that
			$layout = Upfront_Layout::create_layout($layout_ids, $layout_slug);
		}

		global $post, $upfront_ajax_query;

		if(!$upfront_ajax_query)
			$upfront_ajax_query = false;

		if($post_type){
			$post = Upfront_PostModel::create($post_type);
			// set new layout IDS based on the created post ID
			$cascade = array(
				'type' => 'single',
				'item'=> $post_type,
				'specificity' => $post->ID
			);
			$layout_ids = Upfront_EntityResolver::get_entity_ids($cascade);
		}
		else {
			$post = $post;
			if ($post && is_singular())
				$layout_ids = Upfront_EntityResolver::get_entity_ids();
			else if($_POST['post_id']){
				$posts = get_posts(array('include' => $_POST['post_id'], 'suppress_filters' => false));
				if(sizeof($posts))
					$post = $posts[0];
			}
		}

		$response = array(
			'post' => $post,
			'layout' => $layout->to_php(),
			'cascade' => $layout_ids,
			'query' => $upfront_ajax_query
		);

		$this->_out(new Upfront_JsonResponse_Success($response));
	}

	function save_layout () {
		$data = !empty($_POST['data']) ? json_decode(stripslashes_deep($_POST['data']), true) : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Unknown layout"));
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'] ? $_POST['stylesheet'] : get_stylesheet();

		upfront_switch_stylesheet($stylesheet);

		$layout = Upfront_Layout::from_php($data, $storage_key);
		$key = $layout->save();
		$this->_out(new Upfront_JsonResponse_Success($key));
	}

	function list_available_layout () {
		$layouts = Upfront_Layout::list_available_layout();
		$this->_out(new Upfront_JsonResponse_Success($layouts));
	}

	function list_saved_layout () {
		$storage_key = $_POST['storage_key'];
		$layouts = Upfront_Layout::list_saved_layout($storage_key);
		$this->_out(new Upfront_JsonResponse_Success($layouts));
	}

	function reset_layout () {
		$data = !empty($_POST['data']) ? stripslashes_deep($_POST['data']) : false;
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'] ? $_POST['stylesheet'] : get_stylesheet();

		upfront_switch_stylesheet($stylesheet);

		$layout = Upfront_Layout::from_php($data, $storage_key);
		$layout->delete(true);
		delete_option('upfront_' . $stylesheet . '_styles');
		$this->_out(new Upfront_JsonResponse_Success("Layout reset"));
	}

	function update_layout_element() {
		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;

		if(!$data)
			return $this->_out(new Upfront_JsonResponse_Error("No data"));
		if(empty($data['layout']))
			return $this->_out(new Upfront_JsonResponse_Error("No layout id given"));
		if(empty($data['element']))
			return $this->_out(new Upfront_JsonResponse_Error("No element data given"));

		$element = json_decode($data['element'], true);

		$layout = Upfront_Layout::from_entity_ids($data['layout'], $data['storage_key']);
		if(empty($layout))
			return $this->_out(new Upfront_JsonResponse_Error("Unkown layout"));

		$updated = $layout->set_element_data($element);
		if(!$updated)
			return $this->_out(new Upfront_JsonResponse_Error("Error updating the layout"));

		$layout->save();
		$this->_out(new Upfront_JsonResponse_Success("Layout updated"));
	}

	function update_insertcount() {
		$insertcount = get_option('ueditor_insert_count');
		if(!$insertcount)
			$insertcount = 0;
		$insertcount++;
		update_option('ueditor_insert_count', $insertcount);
		$this->_out(new Upfront_JsonResponse_Success("Insert count updated"));
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
      "backbone" => includes_url() . "js/backbone.min",
      "underscore" => includes_url() . "js/underscore.min",
      //"jquery" => includes_url() . "js/jquery/jquery",
      "upfront-data" => $upfront_data_url,
      "text" => 'scripts/text',
      "async" => "scripts/async",
      "upfront" => "scripts/upfront",
			"models" => "scripts/upfront/upfront-models",
			"views" => "scripts/upfront/upfront-views",
			"editor_views" => "scripts/upfront/upfront-views-editor",
			"util" => "scripts/upfront/upfront-util",
			"behaviors" => "scripts/upfront/upfront-behaviors",
			"application" => "scripts/upfront/upfront-application",
			"objects" => "scripts/upfront/upfront-objects",
			"media" => "scripts/upfront/upfront-media",
			"content" => "scripts/upfront/upfront-content",
			"spectrum" => "scripts/spectrum/spectrum",
			"responsive" => "scripts/responsive",
			"redactor" => 'scripts/redactor/redactor',
			"jquery-df" => 'scripts/jquery/jquery-dateFormat.min',
      "ueditor" => 'scripts/redactor/ueditor'
		);
		$paths = apply_filters('upfront-settings-requirement_paths', $paths + $registered);

    $shim = array(
      'underscore' => array('exports' => '_'),
      'jquery-df' => array('jquery'),
    );

		$require_config = array(
			'baseUrl' => "{$root}",
			'paths' => $paths,
			'shim' => $shim,
			'waitSeconds' => 60, // allow longer wait period to prevent timeout
		);
		if ($this->_debugger->is_active(Upfront_Debug::CACHED_RESPONSE)) {
			$require_config['urlArgs'] = "nocache=" + microtime(true);
		}
		$require_config = defined('JSON_PRETTY_PRINT')
			? json_encode(apply_filters('upfront-settings-require_js_config', $require_config), JSON_PRETTY_PRINT)
			: json_encode(apply_filters('upfront-settings-require_js_config', $require_config))
		;

		$layout_editor_requirements = array(
			"core" => array('models', 'views', 'editor_views', 'behaviors', $upfront_data_url, 'media', 'content', 'spectrum', 'responsive', 'redactor', 'ueditor' ),
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
			'column_width' => '',
			'column_padding' => '',
			'type_padding' => '',
			'top_margin_class' => '',
			'bottom_margin_class' => '',
			'size_name' => ''
		);
		foreach ($breakpoints as $context => $breakpoint) {
			$grid_info['breakpoint_columns'][$context] = $breakpoint->get_columns();
			$grid_info['column_widths'][$context] = $breakpoint->get_column_width();
			$grid_info['column_paddings'][$context] = $breakpoint->get_column_padding();
			$grid_info['type_paddings'][$context] = $breakpoint->get_type_padding();
			$grid_info['baselines'][$context] = $breakpoint->get_baseline();
			$grid_info['size_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
			$grid_info['margin_left_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
			$grid_info['margin_right_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_RIGHT);
			$grid_info['margin_top_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_TOP);
			$grid_info['margin_bottom_classes'][$context] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_BOTTOM);
			// @TODO temporary fix to keep old breakpoint work, before we move on to the new breakpoint system
			if ( $breakpoint->is_default() ){
				$grid_info['size'] = $breakpoint->get_columns();
				$grid_info['column_width'] = $breakpoint->get_column_width();
				$grid_info['column_padding'] = $breakpoint->get_column_padding();
				$grid_info['type_padding'] = $breakpoint->get_type_padding();
				$grid_info['baseline'] = $breakpoint->get_baseline();
				$grid_info['class'] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_WIDTH);
				$grid_info['left_margin_class'] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_LEFT);
				$grid_info['right_margin_class'] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_RIGHT);
				$grid_info['top_margin_class'] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_TOP);
				$grid_info['bottom_margin_class'] = $breakpoint->get_prefix(Upfront_GridBreakpoint::PREFIX_MARGIN_BOTTOM);
			}
		}
		$grid_info = json_encode(
			apply_filters('upfront-settings-grid_info', $grid_info)
		);

    $theme_info = get_option('upfront_' . get_stylesheet() . '_responsive_settings');
    if (empty($theme_info)) {
      // Add defaults
      //todo - this is duplicated in responsive server - centralize
			$defaults = array(
        array(
          'name' => 'Default Desktop',
          'id' => 'desktop',
          'width' => 1080,
          'columns' => 24,
          'enabled' => true,
          'fixed' => true
        ),
        array(
          'name' => 'Tablet',
          'id' => 'tablet',
          'width' => 570,
          'columns' => 12,
          'enabled' => false,
        ),
        array(
          'name' => 'Mobile',
          'id' => 'mobile',
          'width' => 315,
          'columns' => 7,
          'enabled' => false,
        ),
        array(
          'name' => 'Custom Width',
          'id' => 'custom',
          'width' => 0,
          'columns' => 0,
          'enabled' => false,
        )
      );
      $theme_info = json_encode(array('breakpoints' => $defaults));
    }

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

		$application_modes = json_encode(array(
			"LAYOUT" => "layout",
			"CONTENT" => "content",
			"THEME" => "theme",
			"POST" => "post layout",
			"POSTCONTENT" => "post content",
      "RESPONSIVE" => "responsive",
			"DEFAULT" => (current_user_can("manage_options") ? "layout" : "content"),
			"ALLOW" => (current_user_can("manage_options") ? "layout,content,theme,postlayout,responsive" : "content")
		));

		$read_only = json_encode(defined('UPFRONT_READ_ONLY') && UPFRONT_READ_ONLY);

		$main = <<<EOMainJs
// Set up the global namespace
var Upfront = window.Upfront || {};
Upfront.mainData = {
  requireConfig: $require_config,
  root: '{$root}',
  ajax: '{$ajax}',
  admin: '{$admin}',
  site: '{$site}',
  debug: {$debug},
  layoutEditorRequirements: {$layout_editor_requirements},
  applicationModes: {$application_modes},
  readOnly: {$read_only},
  specificity: {$specificity},
  gridInfo: {$grid_info},
  themeInfo: {$theme_info},
  content: {$content}
};
EOMainJs;
		$this->_out(new Upfront_JavascriptResponse_Success($main));
	}

	public function load_upfront_data(){
		include Upfront::get_root_dir() . '/scripts/upfront/upfront-data.php';
	}

	public function sort_authors($a, $b){
		return $a['display_name'] > $b['display_name'] ? 1 : -1;
	}

	private function get_authors(){
		$data = get_users(array('who' => 'authors'));
		$authors = array();
		foreach($data as $a){
			$authors[] = array(
				'ID' => $a->ID,
				'login' => $a->user_login,
				'display_name' => $a->display_name,
				'url' => $a->user_url,
				'posts_url' => get_author_posts_url($a->ID)
			);
		}

		usort($authors, array($this, 'sort_authors'));
		return $authors;
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

		upfront_add_ajax('upfront_save_styles', array($this, "save_styles"));
		upfront_add_ajax('upfront_theme_styles', array($this, "theme_styles"));
		upfront_add_ajax('upfront_delete_styles', array($this, "delete_styles"));
	}

	function load_styles () {
		$grid = Upfront_Grid::get_grid();
		$layout = Upfront_Layout::get_instance();

		$preprocessor = new Upfront_StylePreprocessor($grid, $layout);

		//Add typography styles - rearranging so the imports from Google fonts come first, if needed
		$style = $this->prepare_typography_styles($layout);

		$style .= $preprocessor->process();

		//Add theme styles
		$style .= $this->prepare_theme_styles();

		$this->_out(new Upfront_CssResponse_Success($style));
	}

	function save_styles(){
		$name = sanitize_key(str_replace(' ', '_', trim($_POST['name'])));
		$styles = trim(stripslashes($_POST['styles']));
		$element_type = isset($_POST['elementType']) ? sanitize_key($_POST['elementType']) : 'unknown';
		$db_option = Upfront_Layout::get_storage_key() . '_' . get_stylesheet() . '_styles';
		$current_styles = get_option($db_option);
		if(!$current_styles)
			$current_styles = array();

		$styles = apply_filters('upfront-save_styles', $styles, $name, $element_type);

		if(!isset($current_styles[$element_type]))
			$current_styles[$element_type] = array();

		$current_styles[$element_type][$element_type . '-' . $name] = $styles;

		global $wpdb;
		update_option($db_option, $current_styles);

		$this->_out(new Upfront_JsonResponse_Success(array(
			'name' => $name,
			'styles' => $styles
		)));
	}

	function delete_styles(){

		$elementType = isset($_POST['elementType']) ? $_POST['elementType'] : false;
		$styleName = isset($_POST['styleName']) ? $_POST['styleName'] : false;

		if(!$elementType || !$styleName)
			$this->_out(new Upfront_JsonResponse_Error('No element type or style to delete.'));

		$db_option = Upfront_Layout::get_storage_key() . '_' . get_stylesheet() . '_styles';
		$current_styles = get_option($db_option);

		if(!$current_styles || !isset($current_styles[$elementType]) || !isset($current_styles[$elementType][$styleName]))
			$this->_out(new Upfront_JsonResponse_Error("The style doesn\'t exist."));

		unset($current_styles[$elementType][$styleName]);

		update_option($db_option, $current_styles);

		$this->_out(new Upfront_JsonResponse_Success(array()));
	}

	function theme_styles(){
		$separately = $_POST['separately'];
		$styles = get_option(Upfront_Layout::get_storage_key() . '_' . get_stylesheet() . '_styles');
		$this->_out(new Upfront_JsonResponse_Success(array(
			'styles' => $styles
		)));
	}

	function prepare_theme_styles(){
		$styles = get_option(Upfront_Layout::get_storage_key() . '_' . get_stylesheet() . '_styles');
		if(!$styles)
			return '';

		$out = '';

		foreach($styles as $type => $elements){
			foreach($elements as $name => $content){
				$selector = $type == 'layout' ? '' : '.upfront-output-object.' . $name;
				$rules = explode('}', $content);
				array_pop($rules);
				$out .= $selector . ' ' . implode("}\n" . $selector . ' ', $rules) . "} \n";
			}
		}

		return $out;
	}

	function prepare_typography_styles ($layout) {
		$options = $layout->get_property_value('typography');
		if (!$options)
			return '';
		$out = '';
		$faces = array();
		foreach ( $options as $element => $option ){
			$face = !empty($option['font_face'])
				? $option['font_face']
				: false
			;
			$faces[] = $face;
			if (!empty($face) && false !== strpos($face, ' '))  $face = '"' . $face . '"';
			$font = $option['font_face'] ? "{$face}, {$option['font_family']}" : "inherit";
			$out .= ".upfront-output-object $element {\n" .
					"font-family: {$font};\n" .
					( $option['weight'] ? "font-weight: {$option['weight']};\n" : "" ) .
					( $option['style'] ? "font-style: {$option['style']};\n" : "" ) .
					( $option['size'] ? "font-size: {$option['size']}px;\n" : "" ) .
					( $option['line_height'] ? "line-height: {$option['line_height']}em;\n" : "" ) .
					"color: {$option['color']};\n" .
					"}\n";
		}

		$faces = array_values(array_filter(array_unique($faces)));
		foreach ($faces as $face) {
			// Naive import - this will send a request regardless if it's actually an Google font or not
			$imports .= "@import \"https://fonts.googleapis.com/css?family=" .
				preg_replace('/\s/', '+', $face) .
			"\";\n";
		}
		if (!empty($imports)) $out = "{$imports}\n\n{$out}";

		return $out;
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
		add_action('wp_ajax_upfront_load_new_editor_grid', array($this, "load_new_styles"));
		add_action('wp_ajax_upfront_load_grid', array($this, "load_front_styles"));
	}

	function load_styles () {
		$grid = Upfront_Grid::get_grid();

		$preprocessor = new Upfront_StylePreprocessor($grid);
		$style = $preprocessor->get_editor_grid();
		$this->_out(new Upfront_CssResponse_Success($style));
	}


	function load_new_styles () {
		$grid = Upfront_Grid::get_grid();

		$preprocessor = new Upfront_StylePreprocessor($grid);
		$style = $preprocessor->get_new_editor_grid();
		$this->_out(new Upfront_CssResponse_Success($style));
	}

	function load_front_styles () {
		$grid = Upfront_Grid::get_grid();

		$preprocessor = new Upfront_StylePreprocessor($grid);
		$style = $preprocessor->get_light_grid();
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
		add_action('upfront-layout-applied', array($this, 'load_styles'));
		add_action('upfront-layout-applied', array($this, 'load_scripts'));

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
		))), array('jquery'));
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


/**
 * Layout revisions handling controller.
 * For actual data/storage mapping, @see Upfront_LayoutRevisions
 */
class Upfront_Server_LayoutRevisions extends Upfront_Server {

	const HOOK = 'uf-preview';

	private $_data;

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('init', array($this, 'register_requirements'));

		// Layout revisions AJAX handers
		add_action('wp_ajax_upfront_build_preview', array($this, "build_preview"));
		add_action('wp_ajax_upfront_list_revisions', array($this, "list_revisions"));

		// Cron request handlers
		add_action('upfront_hourly_schedule', array($this, 'clean_up_deprecated_revisions'));

		// Preview listener setup
		if (is_admin()) return false;
		if (!self::is_preview()) return false;

		// Apply default regions
		//add_filter('upfront_regions', array($this, 'intercept_regions_loading'), 999, 2);

		add_filter('upfront_layout_from_id', array($this, 'intercept_layout_loading'), 999, 3);
	}

	/**
	 * Registering model requirements. Should probably refactor.
	 */
	public function register_requirements () {
		register_post_type(Upfront_LayoutRevisions::REVISION_TYPE, array(
			"public" => false,
			"supports" => false,
			"has_archive" => false,
			"rewrite" => false,
		));
		$this->_data = new Upfront_LayoutRevisions;
	}

	public function clean_up_deprecated_revisions () {
		$revisions = $this->_data->get_all_deprecated_revisions();
		if (empty($revisions)) return false;

		foreach ($revisions as $revision) {
			$this->_data->drop_revision($revision->ID);
		}
	}

	/**
	 * Are we serving a preview request?
	 * @return bool
	 */
	public static function is_preview () {
		return !empty($_GET[self::HOOK]);
	}

	/**
	 * Intercepts layout loading and overrides with revision data.
	 * @deprecated
	 */
	public function intercept_regions_loading ($layout, $cascade) {
		if (!self::is_preview()) return $layout;
		$key = $_GET[self::HOOK];
		$raw = $this->_data->get_revision($key);
		/*
		if (!empty($raw)) {
			$new_layout = Upfront_Layout::from_php($raw);
		}
		*/

		return empty($raw["regions"])
			? $layout
			: $raw["regions"]
		;
	}

	/**
	 * Intercepts layout loading and overrides with revision data.
	 */
	public function intercept_layout_loading ($layout, $type, $cascade) {
		if (!self::is_preview()) return $layout;
		$key = $_GET[self::HOOK];
		$raw = $this->_data->get_revision($key);
		if (!empty($raw)) {
			$new_layout = Upfront_Layout::from_php($raw);
		}

		return !empty($new_layout) && !$new_layout->is_empty()
			? $new_layout
			: $layout
		;
	}

	/**
	 * Outputs revisions JSON data, or JSON error.
	 */
	public function list_revisions () {
		$data = stripslashes_deep($_POST);
		$cascade = !empty($data['cascade']) ? $data['cascade'] : false;
		if (empty($cascade)) $this->_out(new Upfront_JsonResponse_Error("No data received"));

		$current_url = !empty($data['current_url']) ? $data['current_url'] : home_url();
		$current_url = wp_validate_redirect(wp_sanitize_redirect($current_url), false);
		$current_url = $current_url ? $current_url : home_url();

		$revisions = $this->_data->get_entity_revisions($cascade);
		if (empty($revisions)) $this->_out(new Upfront_JsonResponse_Error("No revisions for this entity"));

		$out = array();
		$datetime = get_option("date_format") . "@" . get_option("time_format");
		foreach ($revisions as $revision) {
			$display_name = '';
			if (!empty($revision->post_author)) {
				$user = get_user_by('id', $revision->post_author);
				if (!empty($user->display_name)) $display_name = $user->display_name;
			}
			$out[] = array(
				'date_created' => mysql2date($datetime, $revision->post_date),
				'preview_url' => add_query_arg(array(
					self::HOOK => $revision->post_name,
				), $current_url),
				'created_by' => array(
					'user_id' => $revision->post_author,
					'display_name' => $display_name,
				),
			);
		}
		$this->_out(new Upfront_JsonResponse_Success($out));
	}

	/**
	 * Builds preview layout model and dispatches save.
	 */
	public function build_preview () {
		global $post;

		$raw_data = stripslashes_deep($_POST);
		$data = !empty($raw_data['data']) ? $raw_data['data'] : '';

		$current_url = !empty($raw_data['current_url']) ? $raw_data['current_url'] : home_url();
		$current_url = wp_validate_redirect(wp_sanitize_redirect($current_url), false);
		$current_url = $current_url ? $current_url : home_url();

		$layout = Upfront_Layout::from_json($data);
		$layout_id_key = $this->_data->save_revision($layout);

		$preview_url = add_query_arg(array(
			self::HOOK => $layout_id_key,
		), $current_url);
		$this->_out(new Upfront_JsonResponse_Success(array(
			'html' => $preview_url,
		)));
	}

}
Upfront_Server_LayoutRevisions::serve();


/**
 * Dictates scheduled (web cron) runs.
 */
class Upfront_Server_Schedule implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		// Debug line
		//add_action('init', create_function('', "do_action('upfront_hourly_schedule');"), 999); return false;
		// Sets up hourly schedule
		if (!wp_next_scheduled('upfront_hourly_schedule')) {
			wp_schedule_event(time(), 'hourly', 'upfront_hourly_schedule');
		}
	}
}
Upfront_Server_Schedule::serve();




/**
 * Periodically boots up to clean up the unused crops, if any are left around.
 */
class Upfront_Server_MediaCleanup implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		//add_action('upfront_hourly_schedule', array($this, 'media_cleanup'));
		//add_action('wp', array($this, 'media_cleanup'));
	}

	public function media_cleanup () {
		$media = $this->_get_cleanup_chunk();
		if (empty($media)) return false;

		foreach ($media as $item) $this->_cleanup_item_remnants($item);
	}

	private function _get_cleanup_chunk () {
		$yesterday = strtotime("yesterday");
		$never_cleaned = new WP_Query(array(
			'post_type' => 'attachment',
			'post_status' => 'any',
			'posts_per_page' => -1,
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'upfront_used_image_sizes',
					'compare' => 'EXISTS',
				),
				array(
					'key' => 'upfront_media_cleanup_time',
					'value' => $yesterday, // @see https://core.trac.wordpress.org/ticket/23268
					'compare' => 'NOT EXISTS',
				)
			),
		));
		$old_cleaned = new WP_Query(array(
			'post_type' => 'attachment',
			'post_status' => 'any',
			'posts_per_page' => -1,
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'upfront_used_image_sizes',
					'compare' => 'EXISTS',
				),
				array(
					'key' => 'upfront_media_cleanup_time',
					'value' => $yesterday,
					'compare' => '<',
				)
			),
		));
		return array_merge(
			$never_cleaned->posts,
			$old_cleaned->posts
		);
	}

	private function _cleanup_item_remnants ($item) {
		$used = array();

		// Used by Upfront image-ish elements (image, gallery, slider)
		$sizes = get_post_meta($item->ID, 'upfront_used_image_sizes', true);
		if (!empty($sizes)) foreach ($sizes as $size) {
			$used[] = $size['path'];
		}

		// Root file
		$path = get_attached_file($item->ID);
		if (empty($path)) return false;
		$used[] = $path;

		// Default thumbnails
		$meta = wp_get_attachment_metadata($item->ID);
		if (!empty($meta['sizes'])) foreach ($meta['sizes'] as $thumb) {
			if (empty($thumb['file'])) continue;
			$metapath = trailingslashit(pathinfo($path, PATHINFO_DIRNAME)) . $thumb['file'];
			if (file_exists($metapath)) $used[] = $metapath;
		}

		// Cleanup if duplicates crept in somehow
		$used = array_unique($used);

		$glob_expression = preg_replace('/(' . preg_quote(pathinfo($path, PATHINFO_FILENAME), '/') . ')\.(jpg|jpeg|gif|png)$/i', '$1*.$2', $path);
		$all_files = glob($glob_expression);

		foreach ($all_files as $file) {
			if (in_array($file, $used)) continue;
			// Alright, this could be ripe for removal - EXCEPT, it might also be rotated image...
			if (preg_match('/-r\d+$/', pathinfo($file, PATHINFO_FILENAME))) continue; // Is it?

			// ACTUALLY REMOVE THE IMAGE HERE!!!
			//@unlink($file);
		}
		update_post_meta($item->ID, 'upfront_media_cleanup_time', time());
	}
}
//Upfront_Server_MediaCleanup::serve();


class Upfront_Server_GoogleFontsServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront_list_google_fonts', array($this, 'json_list_google_fonts'));
	}

	public function json_list_google_fonts () {
		$api_key = $this->_get_api_key();
		$response = !empty($api_key)
			? $this->_get_api_response()
			: $this->_get_cached_response()
		;
		$this->_out($response);
	}

	/**
	 * Build a Upfront_HttpResponse instance from cache.
	 */
	private function _get_cached_response () {
		$response = !empty(self::$_cached_list)
			? new Upfront_JsonResponse_Success(json_decode(self::$_cached_list, true))
			: new Upfront_JsonResponse_Error("Cache error")
		;
		return $response;
	}

	protected function _get_api_response () { return $this->_get_cached_response(); }
	protected function _get_api_key () { return false; }

	private static $_cached_list = '[{"name":"ABeeZee","family":"sans-serif"},{"name":"Abel","family":"sans-serif"},{"name":"Abril Fatface","family":"display"},{"name":"Aclonica","family":"sans-serif"},{"name":"Acme","family":"sans-serif"},{"name":"Actor","family":"sans-serif"},{"name":"Adamina","family":"serif"},{"name":"Advent Pro","family":"sans-serif"},{"name":"Aguafina Script","family":"handwriting"},{"name":"Akronim","family":"display"},{"name":"Aladin","family":"handwriting"},{"name":"Aldrich","family":"sans-serif"},{"name":"Alef","family":"sans-serif"},{"name":"Alegreya","family":"serif"},{"name":"Alegreya SC","family":"serif"},{"name":"Alegreya Sans","family":"sans-serif"},{"name":"Alegreya Sans SC","family":"sans-serif"},{"name":"Alex Brush","family":"handwriting"},{"name":"Alfa Slab One","family":"display"},{"name":"Alice","family":"serif"},{"name":"Alike","family":"serif"},{"name":"Alike Angular","family":"serif"},{"name":"Allan","family":"display"},{"name":"Allerta","family":"sans-serif"},{"name":"Allerta Stencil","family":"sans-serif"},{"name":"Allura","family":"handwriting"},{"name":"Almendra","family":"serif"},{"name":"Almendra Display","family":"display"},{"name":"Almendra SC","family":"serif"},{"name":"Amarante","family":"display"},{"name":"Amaranth","family":"sans-serif"},{"name":"Amatic SC","family":"handwriting"},{"name":"Amethysta","family":"serif"},{"name":"Anaheim","family":"sans-serif"},{"name":"Andada","family":"serif"},{"name":"Andika","family":"sans-serif"},{"name":"Angkor","family":"display"},{"name":"Annie Use Your Telescope","family":"handwriting"},{"name":"Anonymous Pro","family":"monospace"},{"name":"Antic","family":"sans-serif"},{"name":"Antic Didone","family":"serif"},{"name":"Antic Slab","family":"serif"},{"name":"Anton","family":"sans-serif"},{"name":"Arapey","family":"serif"},{"name":"Arbutus","family":"display"},{"name":"Arbutus Slab","family":"serif"},{"name":"Architects Daughter","family":"handwriting"},{"name":"Archivo Black","family":"sans-serif"},{"name":"Archivo Narrow","family":"sans-serif"},{"name":"Arimo","family":"sans-serif"},{"name":"Arizonia","family":"handwriting"},{"name":"Armata","family":"sans-serif"},{"name":"Artifika","family":"serif"},{"name":"Arvo","family":"serif"},{"name":"Asap","family":"sans-serif"},{"name":"Asset","family":"display"},{"name":"Astloch","family":"display"},{"name":"Asul","family":"sans-serif"},{"name":"Atomic Age","family":"display"},{"name":"Aubrey","family":"display"},{"name":"Audiowide","family":"display"},{"name":"Autour One","family":"display"},{"name":"Average","family":"serif"},{"name":"Average Sans","family":"sans-serif"},{"name":"Averia Gruesa Libre","family":"display"},{"name":"Averia Libre","family":"display"},{"name":"Averia Sans Libre","family":"display"},{"name":"Averia Serif Libre","family":"display"},{"name":"Bad Script","family":"handwriting"},{"name":"Balthazar","family":"serif"},{"name":"Bangers","family":"display"},{"name":"Basic","family":"sans-serif"},{"name":"Battambang","family":"display"},{"name":"Baumans","family":"display"},{"name":"Bayon","family":"display"},{"name":"Belgrano","family":"serif"},{"name":"Belleza","family":"sans-serif"},{"name":"BenchNine","family":"sans-serif"},{"name":"Bentham","family":"serif"},{"name":"Berkshire Swash","family":"handwriting"},{"name":"Bevan","family":"display"},{"name":"Bigelow Rules","family":"display"},{"name":"Bigshot One","family":"display"},{"name":"Bilbo","family":"handwriting"},{"name":"Bilbo Swash Caps","family":"handwriting"},{"name":"Bitter","family":"serif"},{"name":"Black Ops One","family":"display"},{"name":"Bokor","family":"display"},{"name":"Bonbon","family":"handwriting"},{"name":"Boogaloo","family":"display"},{"name":"Bowlby One","family":"display"},{"name":"Bowlby One SC","family":"display"},{"name":"Brawler","family":"serif"},{"name":"Bree Serif","family":"serif"},{"name":"Bubblegum Sans","family":"display"},{"name":"Bubbler One","family":"sans-serif"},{"name":"Buda","family":"display"},{"name":"Buenard","family":"serif"},{"name":"Butcherman","family":"display"},{"name":"Butterfly Kids","family":"handwriting"},{"name":"Cabin","family":"sans-serif"},{"name":"Cabin Condensed","family":"sans-serif"},{"name":"Cabin Sketch","family":"display"},{"name":"Caesar Dressing","family":"display"},{"name":"Cagliostro","family":"sans-serif"},{"name":"Calligraffitti","family":"handwriting"},{"name":"Cambo","family":"serif"},{"name":"Candal","family":"sans-serif"},{"name":"Cantarell","family":"sans-serif"},{"name":"Cantata One","family":"serif"},{"name":"Cantora One","family":"sans-serif"},{"name":"Capriola","family":"sans-serif"},{"name":"Cardo","family":"serif"},{"name":"Carme","family":"sans-serif"},{"name":"Carrois Gothic","family":"sans-serif"},{"name":"Carrois Gothic SC","family":"sans-serif"},{"name":"Carter One","family":"display"},{"name":"Caudex","family":"serif"},{"name":"Cedarville Cursive","family":"handwriting"},{"name":"Ceviche One","family":"display"},{"name":"Changa One","family":"display"},{"name":"Chango","family":"display"},{"name":"Chau Philomene One","family":"sans-serif"},{"name":"Chela One","family":"display"},{"name":"Chelsea Market","family":"display"},{"name":"Chenla","family":"display"},{"name":"Cherry Cream Soda","family":"display"},{"name":"Cherry Swash","family":"display"},{"name":"Chewy","family":"display"},{"name":"Chicle","family":"display"},{"name":"Chivo","family":"sans-serif"},{"name":"Cinzel","family":"serif"},{"name":"Cinzel Decorative","family":"display"},{"name":"Clicker Script","family":"handwriting"},{"name":"Coda","family":"display"},{"name":"Coda Caption","family":"sans-serif"},{"name":"Codystar","family":"display"},{"name":"Combo","family":"display"},{"name":"Comfortaa","family":"display"},{"name":"Coming Soon","family":"handwriting"},{"name":"Concert One","family":"display"},{"name":"Condiment","family":"handwriting"},{"name":"Content","family":"display"},{"name":"Contrail One","family":"display"},{"name":"Convergence","family":"sans-serif"},{"name":"Cookie","family":"handwriting"},{"name":"Copse","family":"serif"},{"name":"Corben","family":"display"},{"name":"Courgette","family":"handwriting"},{"name":"Cousine","family":"monospace"},{"name":"Coustard","family":"serif"},{"name":"Covered By Your Grace","family":"handwriting"},{"name":"Crafty Girls","family":"handwriting"},{"name":"Creepster","family":"display"},{"name":"Crete Round","family":"serif"},{"name":"Crimson Text","family":"serif"},{"name":"Croissant One","family":"display"},{"name":"Crushed","family":"display"},{"name":"Cuprum","family":"sans-serif"},{"name":"Cutive","family":"serif"},{"name":"Cutive Mono","family":"monospace"},{"name":"Damion","family":"handwriting"},{"name":"Dancing Script","family":"handwriting"},{"name":"Dangrek","family":"display"},{"name":"Dawning of a New Day","family":"handwriting"},{"name":"Days One","family":"sans-serif"},{"name":"Delius","family":"handwriting"},{"name":"Delius Swash Caps","family":"handwriting"},{"name":"Delius Unicase","family":"handwriting"},{"name":"Della Respira","family":"serif"},{"name":"Denk One","family":"sans-serif"},{"name":"Devonshire","family":"handwriting"},{"name":"Didact Gothic","family":"sans-serif"},{"name":"Diplomata","family":"display"},{"name":"Diplomata SC","family":"display"},{"name":"Domine","family":"serif"},{"name":"Donegal One","family":"serif"},{"name":"Doppio One","family":"sans-serif"},{"name":"Dorsa","family":"sans-serif"},{"name":"Dosis","family":"sans-serif"},{"name":"Dr Sugiyama","family":"handwriting"},{"name":"Droid Sans","family":"sans-serif"},{"name":"Droid Sans Mono","family":"monospace"},{"name":"Droid Serif","family":"serif"},{"name":"Duru Sans","family":"sans-serif"},{"name":"Dynalight","family":"display"},{"name":"EB Garamond","family":"serif"},{"name":"Eagle Lake","family":"handwriting"},{"name":"Eater","family":"display"},{"name":"Economica","family":"sans-serif"},{"name":"Electrolize","family":"sans-serif"},{"name":"Elsie","family":"display"},{"name":"Elsie Swash Caps","family":"display"},{"name":"Emblema One","family":"display"},{"name":"Emilys Candy","family":"display"},{"name":"Engagement","family":"handwriting"},{"name":"Englebert","family":"sans-serif"},{"name":"Enriqueta","family":"serif"},{"name":"Erica One","family":"display"},{"name":"Esteban","family":"serif"},{"name":"Euphoria Script","family":"handwriting"},{"name":"Ewert","family":"display"},{"name":"Exo","family":"sans-serif"},{"name":"Exo 2","family":"sans-serif"},{"name":"Expletus Sans","family":"display"},{"name":"Fanwood Text","family":"serif"},{"name":"Fascinate","family":"display"},{"name":"Fascinate Inline","family":"display"},{"name":"Faster One","family":"display"},{"name":"Fasthand","family":"serif"},{"name":"Fauna One","family":"serif"},{"name":"Federant","family":"display"},{"name":"Federo","family":"sans-serif"},{"name":"Felipa","family":"handwriting"},{"name":"Fenix","family":"serif"},{"name":"Finger Paint","family":"display"},{"name":"Fjalla One","family":"sans-serif"},{"name":"Fjord One","family":"serif"},{"name":"Flamenco","family":"display"},{"name":"Flavors","family":"display"},{"name":"Fondamento","family":"handwriting"},{"name":"Fontdiner Swanky","family":"display"},{"name":"Forum","family":"display"},{"name":"Francois One","family":"sans-serif"},{"name":"Freckle Face","family":"display"},{"name":"Fredericka the Great","family":"display"},{"name":"Fredoka One","family":"display"},{"name":"Freehand","family":"display"},{"name":"Fresca","family":"sans-serif"},{"name":"Frijole","family":"display"},{"name":"Fruktur","family":"display"},{"name":"Fugaz One","family":"display"},{"name":"GFS Didot","family":"serif"},{"name":"GFS Neohellenic","family":"sans-serif"},{"name":"Gabriela","family":"serif"},{"name":"Gafata","family":"sans-serif"},{"name":"Galdeano","family":"sans-serif"},{"name":"Galindo","family":"display"},{"name":"Gentium Basic","family":"serif"},{"name":"Gentium Book Basic","family":"serif"},{"name":"Geo","family":"sans-serif"},{"name":"Geostar","family":"display"},{"name":"Geostar Fill","family":"display"},{"name":"Germania One","family":"display"},{"name":"Gilda Display","family":"serif"},{"name":"Give You Glory","family":"handwriting"},{"name":"Glass Antiqua","family":"display"},{"name":"Glegoo","family":"serif"},{"name":"Gloria Hallelujah","family":"handwriting"},{"name":"Goblin One","family":"display"},{"name":"Gochi Hand","family":"handwriting"},{"name":"Gorditas","family":"display"},{"name":"Goudy Bookletter 1911","family":"serif"},{"name":"Graduate","family":"display"},{"name":"Grand Hotel","family":"handwriting"},{"name":"Gravitas One","family":"display"},{"name":"Great Vibes","family":"handwriting"},{"name":"Griffy","family":"display"},{"name":"Gruppo","family":"display"},{"name":"Gudea","family":"sans-serif"},{"name":"Habibi","family":"serif"},{"name":"Hammersmith One","family":"sans-serif"},{"name":"Hanalei","family":"display"},{"name":"Hanalei Fill","family":"display"},{"name":"Handlee","family":"handwriting"},{"name":"Hanuman","family":"serif"},{"name":"Happy Monkey","family":"display"},{"name":"Headland One","family":"serif"},{"name":"Henny Penny","family":"display"},{"name":"Herr Von Muellerhoff","family":"handwriting"},{"name":"Holtwood One SC","family":"serif"},{"name":"Homemade Apple","family":"handwriting"},{"name":"Homenaje","family":"sans-serif"},{"name":"IM Fell DW Pica","family":"serif"},{"name":"IM Fell DW Pica SC","family":"serif"},{"name":"IM Fell Double Pica","family":"serif"},{"name":"IM Fell Double Pica SC","family":"serif"},{"name":"IM Fell English","family":"serif"},{"name":"IM Fell English SC","family":"serif"},{"name":"IM Fell French Canon","family":"serif"},{"name":"IM Fell French Canon SC","family":"serif"},{"name":"IM Fell Great Primer","family":"serif"},{"name":"IM Fell Great Primer SC","family":"serif"},{"name":"Iceberg","family":"display"},{"name":"Iceland","family":"display"},{"name":"Imprima","family":"sans-serif"},{"name":"Inconsolata","family":"monospace"},{"name":"Inder","family":"sans-serif"},{"name":"Indie Flower","family":"handwriting"},{"name":"Inika","family":"serif"},{"name":"Irish Grover","family":"display"},{"name":"Istok Web","family":"sans-serif"},{"name":"Italiana","family":"serif"},{"name":"Italianno","family":"handwriting"},{"name":"Jacques Francois","family":"serif"},{"name":"Jacques Francois Shadow","family":"display"},{"name":"Jim Nightshade","family":"handwriting"},{"name":"Jockey One","family":"sans-serif"},{"name":"Jolly Lodger","family":"display"},{"name":"Josefin Sans","family":"sans-serif"},{"name":"Josefin Slab","family":"serif"},{"name":"Joti One","family":"display"},{"name":"Judson","family":"serif"},{"name":"Julee","family":"handwriting"},{"name":"Julius Sans One","family":"sans-serif"},{"name":"Junge","family":"serif"},{"name":"Jura","family":"sans-serif"},{"name":"Just Another Hand","family":"handwriting"},{"name":"Just Me Again Down Here","family":"handwriting"},{"name":"Kameron","family":"serif"},{"name":"Kantumruy","family":"sans-serif"},{"name":"Karla","family":"sans-serif"},{"name":"Kaushan Script","family":"handwriting"},{"name":"Kavoon","family":"display"},{"name":"Kdam Thmor","family":"display"},{"name":"Keania One","family":"display"},{"name":"Kelly Slab","family":"display"},{"name":"Kenia","family":"display"},{"name":"Khmer","family":"display"},{"name":"Kite One","family":"sans-serif"},{"name":"Knewave","family":"display"},{"name":"Kotta One","family":"serif"},{"name":"Koulen","family":"display"},{"name":"Kranky","family":"display"},{"name":"Kreon","family":"serif"},{"name":"Kristi","family":"handwriting"},{"name":"Krona One","family":"sans-serif"},{"name":"La Belle Aurore","family":"handwriting"},{"name":"Lancelot","family":"display"},{"name":"Lato","family":"sans-serif"},{"name":"League Script","family":"handwriting"},{"name":"Leckerli One","family":"handwriting"},{"name":"Ledger","family":"serif"},{"name":"Lekton","family":"sans-serif"},{"name":"Lemon","family":"display"},{"name":"Libre Baskerville","family":"serif"},{"name":"Life Savers","family":"display"},{"name":"Lilita One","family":"display"},{"name":"Lily Script One","family":"display"},{"name":"Limelight","family":"display"},{"name":"Linden Hill","family":"serif"},{"name":"Lobster","family":"display"},{"name":"Lobster Two","family":"display"},{"name":"Londrina Outline","family":"display"},{"name":"Londrina Shadow","family":"display"},{"name":"Londrina Sketch","family":"display"},{"name":"Londrina Solid","family":"display"},{"name":"Lora","family":"serif"},{"name":"Love Ya Like A Sister","family":"display"},{"name":"Loved by the King","family":"handwriting"},{"name":"Lovers Quarrel","family":"handwriting"},{"name":"Luckiest Guy","family":"display"},{"name":"Lusitana","family":"serif"},{"name":"Lustria","family":"serif"},{"name":"Macondo","family":"display"},{"name":"Macondo Swash Caps","family":"display"},{"name":"Magra","family":"sans-serif"},{"name":"Maiden Orange","family":"display"},{"name":"Mako","family":"sans-serif"},{"name":"Marcellus","family":"serif"},{"name":"Marcellus SC","family":"serif"},{"name":"Marck Script","family":"handwriting"},{"name":"Margarine","family":"display"},{"name":"Marko One","family":"serif"},{"name":"Marmelad","family":"sans-serif"},{"name":"Marvel","family":"sans-serif"},{"name":"Mate","family":"serif"},{"name":"Mate SC","family":"serif"},{"name":"Maven Pro","family":"sans-serif"},{"name":"McLaren","family":"display"},{"name":"Meddon","family":"handwriting"},{"name":"MedievalSharp","family":"display"},{"name":"Medula One","family":"display"},{"name":"Megrim","family":"display"},{"name":"Meie Script","family":"handwriting"},{"name":"Merienda","family":"handwriting"},{"name":"Merienda One","family":"handwriting"},{"name":"Merriweather","family":"serif"},{"name":"Merriweather Sans","family":"sans-serif"},{"name":"Metal","family":"display"},{"name":"Metal Mania","family":"display"},{"name":"Metamorphous","family":"display"},{"name":"Metrophobic","family":"sans-serif"},{"name":"Michroma","family":"sans-serif"},{"name":"Milonga","family":"display"},{"name":"Miltonian","family":"display"},{"name":"Miltonian Tattoo","family":"display"},{"name":"Miniver","family":"display"},{"name":"Miss Fajardose","family":"handwriting"},{"name":"Modern Antiqua","family":"display"},{"name":"Molengo","family":"sans-serif"},{"name":"Molle","family":"handwriting"},{"name":"Monda","family":"sans-serif"},{"name":"Monofett","family":"display"},{"name":"Monoton","family":"display"},{"name":"Monsieur La Doulaise","family":"handwriting"},{"name":"Montaga","family":"serif"},{"name":"Montez","family":"handwriting"},{"name":"Montserrat","family":"sans-serif"},{"name":"Montserrat Alternates","family":"sans-serif"},{"name":"Montserrat Subrayada","family":"sans-serif"},{"name":"Moul","family":"display"},{"name":"Moulpali","family":"display"},{"name":"Mountains of Christmas","family":"display"},{"name":"Mouse Memoirs","family":"sans-serif"},{"name":"Mr Bedfort","family":"handwriting"},{"name":"Mr Dafoe","family":"handwriting"},{"name":"Mr De Haviland","family":"handwriting"},{"name":"Mrs Saint Delafield","family":"handwriting"},{"name":"Mrs Sheppards","family":"handwriting"},{"name":"Muli","family":"sans-serif"},{"name":"Mystery Quest","family":"display"},{"name":"Neucha","family":"handwriting"},{"name":"Neuton","family":"serif"},{"name":"New Rocker","family":"display"},{"name":"News Cycle","family":"sans-serif"},{"name":"Niconne","family":"handwriting"},{"name":"Nixie One","family":"display"},{"name":"Nobile","family":"sans-serif"},{"name":"Nokora","family":"serif"},{"name":"Norican","family":"handwriting"},{"name":"Nosifer","family":"display"},{"name":"Nothing You Could Do","family":"handwriting"},{"name":"Noticia Text","family":"serif"},{"name":"Noto Sans","family":"sans-serif"},{"name":"Noto Serif","family":"serif"},{"name":"Nova Cut","family":"display"},{"name":"Nova Flat","family":"display"},{"name":"Nova Mono","family":"monospace"},{"name":"Nova Oval","family":"display"},{"name":"Nova Round","family":"display"},{"name":"Nova Script","family":"display"},{"name":"Nova Slim","family":"display"},{"name":"Nova Square","family":"display"},{"name":"Numans","family":"sans-serif"},{"name":"Nunito","family":"sans-serif"},{"name":"Odor Mean Chey","family":"display"},{"name":"Offside","family":"display"},{"name":"Old Standard TT","family":"serif"},{"name":"Oldenburg","family":"display"},{"name":"Oleo Script","family":"display"},{"name":"Oleo Script Swash Caps","family":"display"},{"name":"Open Sans","family":"sans-serif"},{"name":"Open Sans Condensed","family":"sans-serif"},{"name":"Oranienbaum","family":"serif"},{"name":"Orbitron","family":"sans-serif"},{"name":"Oregano","family":"display"},{"name":"Orienta","family":"sans-serif"},{"name":"Original Surfer","family":"display"},{"name":"Oswald","family":"sans-serif"},{"name":"Over the Rainbow","family":"handwriting"},{"name":"Overlock","family":"display"},{"name":"Overlock SC","family":"display"},{"name":"Ovo","family":"serif"},{"name":"Oxygen","family":"sans-serif"},{"name":"Oxygen Mono","family":"monospace"},{"name":"PT Mono","family":"monospace"},{"name":"PT Sans","family":"sans-serif"},{"name":"PT Sans Caption","family":"sans-serif"},{"name":"PT Sans Narrow","family":"sans-serif"},{"name":"PT Serif","family":"serif"},{"name":"PT Serif Caption","family":"serif"},{"name":"Pacifico","family":"handwriting"},{"name":"Paprika","family":"display"},{"name":"Parisienne","family":"handwriting"},{"name":"Passero One","family":"display"},{"name":"Passion One","family":"display"},{"name":"Pathway Gothic One","family":"sans-serif"},{"name":"Patrick Hand","family":"handwriting"},{"name":"Patrick Hand SC","family":"handwriting"},{"name":"Patua One","family":"display"},{"name":"Paytone One","family":"sans-serif"},{"name":"Peralta","family":"display"},{"name":"Permanent Marker","family":"handwriting"},{"name":"Petit Formal Script","family":"handwriting"},{"name":"Petrona","family":"serif"},{"name":"Philosopher","family":"sans-serif"},{"name":"Piedra","family":"display"},{"name":"Pinyon Script","family":"handwriting"},{"name":"Pirata One","family":"display"},{"name":"Plaster","family":"display"},{"name":"Play","family":"sans-serif"},{"name":"Playball","family":"display"},{"name":"Playfair Display","family":"serif"},{"name":"Playfair Display SC","family":"serif"},{"name":"Podkova","family":"serif"},{"name":"Poiret One","family":"display"},{"name":"Poller One","family":"display"},{"name":"Poly","family":"serif"},{"name":"Pompiere","family":"display"},{"name":"Pontano Sans","family":"sans-serif"},{"name":"Port Lligat Sans","family":"sans-serif"},{"name":"Port Lligat Slab","family":"serif"},{"name":"Prata","family":"serif"},{"name":"Preahvihear","family":"display"},{"name":"Press Start 2P","family":"display"},{"name":"Princess Sofia","family":"handwriting"},{"name":"Prociono","family":"serif"},{"name":"Prosto One","family":"display"},{"name":"Puritan","family":"sans-serif"},{"name":"Purple Purse","family":"display"},{"name":"Quando","family":"serif"},{"name":"Quantico","family":"sans-serif"},{"name":"Quattrocento","family":"serif"},{"name":"Quattrocento Sans","family":"sans-serif"},{"name":"Questrial","family":"sans-serif"},{"name":"Quicksand","family":"sans-serif"},{"name":"Quintessential","family":"handwriting"},{"name":"Qwigley","family":"handwriting"},{"name":"Racing Sans One","family":"display"},{"name":"Radley","family":"serif"},{"name":"Raleway","family":"sans-serif"},{"name":"Raleway Dots","family":"display"},{"name":"Rambla","family":"sans-serif"},{"name":"Rammetto One","family":"display"},{"name":"Ranchers","family":"display"},{"name":"Rancho","family":"handwriting"},{"name":"Rationale","family":"sans-serif"},{"name":"Redressed","family":"handwriting"},{"name":"Reenie Beanie","family":"handwriting"},{"name":"Revalia","family":"display"},{"name":"Ribeye","family":"display"},{"name":"Ribeye Marrow","family":"display"},{"name":"Righteous","family":"display"},{"name":"Risque","family":"display"},{"name":"Roboto","family":"sans-serif"},{"name":"Roboto Condensed","family":"sans-serif"},{"name":"Roboto Slab","family":"serif"},{"name":"Rochester","family":"handwriting"},{"name":"Rock Salt","family":"handwriting"},{"name":"Rokkitt","family":"serif"},{"name":"Romanesco","family":"handwriting"},{"name":"Ropa Sans","family":"sans-serif"},{"name":"Rosario","family":"sans-serif"},{"name":"Rosarivo","family":"serif"},{"name":"Rouge Script","family":"handwriting"},{"name":"Rubik Mono One","family":"sans-serif"},{"name":"Rubik One","family":"sans-serif"},{"name":"Ruda","family":"sans-serif"},{"name":"Rufina","family":"serif"},{"name":"Ruge Boogie","family":"handwriting"},{"name":"Ruluko","family":"sans-serif"},{"name":"Rum Raisin","family":"sans-serif"},{"name":"Ruslan Display","family":"display"},{"name":"Russo One","family":"sans-serif"},{"name":"Ruthie","family":"handwriting"},{"name":"Rye","family":"display"},{"name":"Sacramento","family":"handwriting"},{"name":"Sail","family":"display"},{"name":"Salsa","family":"display"},{"name":"Sanchez","family":"serif"},{"name":"Sancreek","family":"display"},{"name":"Sansita One","family":"display"},{"name":"Sarina","family":"display"},{"name":"Satisfy","family":"handwriting"},{"name":"Scada","family":"sans-serif"},{"name":"Schoolbell","family":"handwriting"},{"name":"Seaweed Script","family":"display"},{"name":"Sevillana","family":"display"},{"name":"Seymour One","family":"sans-serif"},{"name":"Shadows Into Light","family":"handwriting"},{"name":"Shadows Into Light Two","family":"handwriting"},{"name":"Shanti","family":"sans-serif"},{"name":"Share","family":"display"},{"name":"Share Tech","family":"sans-serif"},{"name":"Share Tech Mono","family":"monospace"},{"name":"Shojumaru","family":"display"},{"name":"Short Stack","family":"handwriting"},{"name":"Siemreap","family":"display"},{"name":"Sigmar One","family":"display"},{"name":"Signika","family":"sans-serif"},{"name":"Signika Negative","family":"sans-serif"},{"name":"Simonetta","family":"display"},{"name":"Sintony","family":"sans-serif"},{"name":"Sirin Stencil","family":"display"},{"name":"Six Caps","family":"sans-serif"},{"name":"Skranji","family":"display"},{"name":"Slackey","family":"display"},{"name":"Smokum","family":"display"},{"name":"Smythe","family":"display"},{"name":"Sniglet","family":"display"},{"name":"Snippet","family":"sans-serif"},{"name":"Snowburst One","family":"display"},{"name":"Sofadi One","family":"display"},{"name":"Sofia","family":"handwriting"},{"name":"Sonsie One","family":"display"},{"name":"Sorts Mill Goudy","family":"serif"},{"name":"Source Code Pro","family":"monospace"},{"name":"Source Sans Pro","family":"sans-serif"},{"name":"Special Elite","family":"display"},{"name":"Spicy Rice","family":"display"},{"name":"Spinnaker","family":"sans-serif"},{"name":"Spirax","family":"display"},{"name":"Squada One","family":"display"},{"name":"Stalemate","family":"handwriting"},{"name":"Stalinist One","family":"display"},{"name":"Stardos Stencil","family":"display"},{"name":"Stint Ultra Condensed","family":"display"},{"name":"Stint Ultra Expanded","family":"display"},{"name":"Stoke","family":"serif"},{"name":"Strait","family":"sans-serif"},{"name":"Sue Ellen Francisco","family":"handwriting"},{"name":"Sunshiney","family":"handwriting"},{"name":"Supermercado One","family":"display"},{"name":"Suwannaphum","family":"display"},{"name":"Swanky and Moo Moo","family":"handwriting"},{"name":"Syncopate","family":"sans-serif"},{"name":"Tangerine","family":"handwriting"},{"name":"Taprom","family":"display"},{"name":"Tauri","family":"sans-serif"},{"name":"Telex","family":"sans-serif"},{"name":"Tenor Sans","family":"sans-serif"},{"name":"Text Me One","family":"sans-serif"},{"name":"The Girl Next Door","family":"handwriting"},{"name":"Tienne","family":"serif"},{"name":"Tinos","family":"serif"},{"name":"Titan One","family":"display"},{"name":"Titillium Web","family":"sans-serif"},{"name":"Trade Winds","family":"display"},{"name":"Trocchi","family":"serif"},{"name":"Trochut","family":"display"},{"name":"Trykker","family":"serif"},{"name":"Tulpen One","family":"display"},{"name":"Ubuntu","family":"sans-serif"},{"name":"Ubuntu Condensed","family":"sans-serif"},{"name":"Ubuntu Mono","family":"monospace"},{"name":"Ultra","family":"serif"},{"name":"Uncial Antiqua","family":"display"},{"name":"Underdog","family":"display"},{"name":"Unica One","family":"display"},{"name":"UnifrakturCook","family":"display"},{"name":"UnifrakturMaguntia","family":"display"},{"name":"Unkempt","family":"display"},{"name":"Unlock","family":"display"},{"name":"Unna","family":"serif"},{"name":"VT323","family":"monospace"},{"name":"Vampiro One","family":"display"},{"name":"Varela","family":"sans-serif"},{"name":"Varela Round","family":"sans-serif"},{"name":"Vast Shadow","family":"display"},{"name":"Vibur","family":"handwriting"},{"name":"Vidaloka","family":"serif"},{"name":"Viga","family":"sans-serif"},{"name":"Voces","family":"display"},{"name":"Volkhov","family":"serif"},{"name":"Vollkorn","family":"serif"},{"name":"Voltaire","family":"sans-serif"},{"name":"Waiting for the Sunrise","family":"handwriting"},{"name":"Wallpoet","family":"display"},{"name":"Walter Turncoat","family":"handwriting"},{"name":"Warnes","family":"display"},{"name":"Wellfleet","family":"display"},{"name":"Wendy One","family":"sans-serif"},{"name":"Wire One","family":"sans-serif"},{"name":"Yanone Kaffeesatz","family":"sans-serif"},{"name":"Yellowtail","family":"handwriting"},{"name":"Yeseva One","family":"display"},{"name":"Yesteryear","family":"handwriting"},{"name":"Zeyada","family":"handwriting"}]';
}
Upfront_Server_GoogleFontsServer::serve();

class Upfront_Server_ResponsiveServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		upfront_add_ajax('upfront_get_breakpoints', array($this, 'get_breakpoints'));
		upfront_add_ajax('upfront_update_breakpoints', array($this, 'update_breakpoints'));
	}

	public function get_breakpoints() {
		$responsive_settings = get_option('upfront_' . get_stylesheet() . '_responsive_settings');
		if(empty($responsive_settings)) {
      // Add defaults
			$defaults = array(
        array(
          'name' => 'Default Desktop',
          'id' => 'desktop',
          'width' => 1080,
          'columns' => 24,
          'enabled' => true,
          'fixed' => true
        ),
        array(
          'name' => 'Tablet',
          'id' => 'tablet',
          'width' => 570,
          'columns' => 12,
          'enabled' => false,
        ),
        array(
          'name' => 'Mobile',
          'id' => 'mobile',
          'width' => 315,
          'columns' => 7,
          'enabled' => false,
        ),
        array(
          'name' => 'Custom Width',
          'id' => 'custom',
          'width' => 0,
          'columns' => 0,
          'enabled' => false,
        )
      );
      $responsive_settings = json_encode($defaults);
    }
		$this->_out(new Upfront_JsonResponse_Success($responsive_settings));
	}

  public function update_breakpoints() {
    $breakpoints = isset($_POST['breakpoints']) ? $_POST['breakpoints'] : array();
    // Parse data types
    foreach ($breakpoints as $index=>$breakpoint) {
      $breakpoints[$index]['enabled'] = filter_var($breakpoint['enabled'], FILTER_VALIDATE_BOOLEAN);
      $breakpoints[$index]['width'] = filter_var($breakpoint['width'], FILTER_VALIDATE_INT);
      $breakpoints[$index]['columns'] = filter_var($breakpoint['columns'], FILTER_VALIDATE_INT);
      if (isset($breakpoint['fixed'])) {
        $breakpoints[$index]['fixed'] = filter_var($breakpoint['fixed'], FILTER_VALIDATE_BOOLEAN);
      }
    }

    $responsive_settings = get_option('upfront_' . get_stylesheet() . '_responsive_settings');
    if (empty($responsive_settings)) {
      $responsive_settings = array('breakpoints' => $breakpoints);
    } else {
      $responsive_settings = json_decode($responsive_settings);
      $responsive_settings->breakpoints = $breakpoints;
    }

		update_option('upfront_' . get_stylesheet() . '_responsive_settings', json_encode($responsive_settings));

		$this->_out(new Upfront_JsonResponse_Success(get_stylesheet() . ' responsive settings updated'));
  }
}
Upfront_Server_ResponsiveServer::serve();
