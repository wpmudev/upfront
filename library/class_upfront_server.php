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

	const REJECT_NOT_ALLOWED = "not allowed";

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

	protected function _reject ($reason=false) {
		$reason = $reason ? $reason : self::REJECT_NOT_ALLOWED;
		$msg = new Upfront_JsonResponse_Error($reason);
		$this->_out($msg);
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
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_load_layout', array($this, "load_layout"));
			upfront_add_ajax('upfront_list_available_layout', array($this, "list_available_layout"));
			upfront_add_ajax('upfront_list_theme_layouts', array($this, "list_theme_layouts"));
			upfront_add_ajax('upfront_list_saved_layout', array($this, "list_saved_layout"));
		}

		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_save_layout', array($this, "save_layout"));
			upfront_add_ajax('upfront_reset_layout', array($this, "reset_layout"));
			upfront_add_ajax('upfront_update_layout_element', array($this, "update_layout_element"));

			//upfront_add_ajax('upfront_build_preview', array($this, "build_preview")); // No more previews building

			upfront_add_ajax('upfront_update_insertcount', array($this, "update_insertcount"));
		}
	}

	// STUB LOADING
	function load_layout () {
		$layout_ids = $_POST['data'];
		$storage_key = $_POST['storage_key'];
		$stylesheet = $_POST['stylesheet'];
		$layout_slug = !empty($_POST['layout_slug']) ? $_POST['layout_slug'] : false;
		$load_dev = $_POST['load_dev'] == 1 ? true : false;
		$post_type = isset($_POST['new_post']) ? $_POST['new_post'] : false;
		$parsed = false;

		if (empty($layout_ids))
			$this->_out(new Upfront_JsonResponse_Error("No such layout"));

		upfront_switch_stylesheet($stylesheet);

		if(is_string($layout_ids)){
			$layout_ids = Upfront_EntityResolver::ids_from_url($layout_ids);
			$parsed = true;
		}
//		  $layout_ids = array('item' => 'single-post');
//		  $storage_key = 'upfront_dev';
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
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

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

	function list_theme_layouts() {
		$layouts = Upfront_Layout::list_theme_layouts();
		$this->_out( new Upfront_JsonResponse_Success($layouts) );
	}

	function list_saved_layout () {
		$storage_key = $_POST['storage_key'];
		$layouts = Upfront_Layout::list_saved_layout($storage_key);
		$this->_out(new Upfront_JsonResponse_Success($layouts));
	}

	function reset_layout () {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

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
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

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
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

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
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_load_main', array($this, "load_main"));
			upfront_add_ajax('upfront_data', array($this, 'load_upfront_data'));
		}
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
			"jquery-simulate" => 'scripts/jquery/jquery.simulate',
			"ueditor" => 'scripts/redactor/ueditor',
			"chosen" => "scripts/chosen/chosen.jquery.min"
		);
		$paths = apply_filters('upfront-settings-requirement_paths', $paths + $registered);

    $shim = array(
      'underscore' => array('exports' => '_'),
      'jquery-df' => array('jquery'),
			'chosen' => array(
				'deps' => array('jquery'),
				'exports' => 'jQuery.fn.chosen'
			),
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
				$grid_info['size_name'] = $context;
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
			$defaults = Upfront_Grid::get_grid()->get_default_breakpoints();
      $theme_info = json_encode(array('breakpoints' => $defaults));
    }

		if (upfront_is_builder_running()) {
			$theme_fonts = apply_filters(
				'upfront_get_theme_fonts',
				array(),
				array(
					'stylesheet' => upfront_get_builder_stylesheet(),
					'json' => true
				)
			);
		} else {
			$theme_fonts = get_option('upfront_' . get_stylesheet() . '_theme_fonts');
			if (empty($theme_fonts)) {
				// Maybe fonts are not initialized yet, try to load from theme files.
				$theme_fonts = apply_filters(
					'upfront_get_theme_fonts',
					array(),
					array(
						'stylesheet' => get_stylesheet(),
						'json' => true
					)
				);
			}
		}
    if (empty($theme_fonts)) $theme_fonts = json_encode(array());

		if (upfront_is_builder_running()) {
			$theme_colors = apply_filters(
				'upfront_get_theme_colors',
				array(),
				array(
					'stylesheet' => upfront_get_builder_stylesheet(),
					'json' => true
				)
			);
		} else {
			$theme_colors = get_option('upfront_' . get_stylesheet() . '_theme_colors');
			if (empty($theme_colors)) {
				// Maybe fonts are not initialized yet, try to load from theme files.
				$theme_colors = apply_filters(
					'upfront_get_theme_colors',
					array(),
					array(
						'stylesheet' => get_stylesheet(),
						'json' => true
					)
				);
			}
		}
    if (empty($theme_colors)) $theme_colors = json_encode(array());

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

		$allowed_modes = array();
		if (Upfront_Permissions::current(Upfront_Permissions::LAYOUT_MODE)) $allowed_modes[] = 'layout';
		if (Upfront_Permissions::current(Upfront_Permissions::CONTENT_MODE)) $allowed_modes[] = 'content';
		if (Upfront_Permissions::current(Upfront_Permissions::THEME_MODE)) $allowed_modes[] = 'theme';
		if (Upfront_Permissions::current(Upfront_Permissions::POSTLAYOUT_MODE)) $allowed_modes[] = 'postlayout';
		if (Upfront_Permissions::current(Upfront_Permissions::RESPONSIVE_MODE)) $allowed_modes[] = 'responsive';

		$application_modes = json_encode(array(
			"LAYOUT" => "layout",
			"CONTENT" => "content",
			"THEME" => "theme",
			"POST" => "post layout",
			"POSTCONTENT" => "post content",
     		"RESPONSIVE" => "responsive",
			//"DEFAULT" => (current_user_can("manage_options") ? "layout" : "content"),
		// These need some finer control over
			"DEFAULT" => (Upfront_Permissions::current(Upfront_Permissions::LAYOUT_MODE) ? "layout" : "content"),
			"ALLOW" => (Upfront_Permissions::current(Upfront_Permissions::LAYOUT_MODE) ? join(',', $allowed_modes) : "content")
		));

		$read_only = json_encode(defined('UPFRONT_READ_ONLY') && UPFRONT_READ_ONLY);

		$l10n = json_encode($this->_get_l10n_strings());

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
  themeFonts: {$theme_fonts},
  themeColors: {$theme_colors},
  content: {$content},
  l10n: {$l10n}
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

	private function _get_l10n_strings () {
		$l10n = array();
		return apply_filters('upfront_l10n', $l10n);
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

		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_theme_styles', array($this, "theme_styles"));
		}
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_save_styles', array($this, "save_styles"));
			upfront_add_ajax('upfront_delete_styles', array($this, "delete_styles"));

			upfront_add_ajax('upfront_save_theme_colors_styles', array($this, "save_theme_colors_styles"));
		}
	}

	function load_styles () {
		$grid = Upfront_Grid::get_grid();
		$layout = Upfront_Layout::get_instance();

		$preprocessor = new Upfront_StylePreprocessor($grid, $layout);

		//Add typography styles - rearranging so the imports from Google fonts come first, if needed
		$style = $this->prepare_typography_styles($layout);

		$style .= $preprocessor->process();

		// When loading styles in editor mode don't include element styles and colors since they
		// will be loaded separately to the body. If they are included in main style than after
		// style is edited in editor (e.g. some property is removed) inconsistencies may occur
		// especially with rules removal since those would still be defined in main style.
		$base_only = isset($_POST['base_only']) ? filter_var($_POST['base_only'], FILTER_VALIDATE_BOOLEAN) : false;
		if ($base_only) {
			$this->_out(new Upfront_JsonResponse_Success(array('styles' => $style)));
			return;
		}

		//Add theme styles
		$style .= $this->prepare_theme_styles();

		// Add theme colors styles
		$style .= $this->_get_theme_colors_styles();

		$this->_out(new Upfront_CssResponse_Success($style));
	}

	function save_styles(){
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$name = sanitize_key(str_replace(' ', '_', trim($_POST['name'])));
		$styles = trim(stripslashes($_POST['styles']));
		$element_type = isset($_POST['elementType']) ? sanitize_key($_POST['elementType']) : 'unknown';

		// Fix storage key missing _dev in dev mode. Called from ajax, use POST.
		$storage_key = Upfront_Layout::get_storage_key();
		if (isset($_POST['dev']) && $_POST['dev'] === 'true' && strpos($storage_key, '_dev') === false) $storage_key = $storage_key . '_dev';

		$db_option = $storage_key . '_' . get_stylesheet() . '_styles';
		$current_styles = get_option($db_option);
		if(!$current_styles)
			$current_styles = array();

		$styles = apply_filters('upfront-save_styles', $styles, $name, $element_type);

		if(!isset($current_styles[$element_type]))
			$current_styles[$element_type] = array();
		$properties = array();

		$current_styles[$element_type][$name] = $styles;

		global $wpdb;
		update_option($db_option, $current_styles);

		$this->_out(new Upfront_JsonResponse_Success(array(
			'name' => $name,
			'styles' => $styles
		)));
	}

	function delete_styles(){
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

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

	function theme_styles() {
		// If in buiilder mode we need stuff from files
		if (upfront_is_builder_running()) {
			$theme_styles = array('styles' => array());
			$stylesheet = upfront_get_builder_stylesheet();
			if ($stylesheet) {
				$styles_root = get_theme_root() . DIRECTORY_SEPARATOR . $stylesheet . DIRECTORY_SEPARATOR . 'element-styles';
				if (file_exists($styles_root) === false) {
					$this->_out(new Upfront_JsonResponse_Success(array( 'styles' => $theme_styles )));
					return;
				}

				// List subdirectories as element types
				$element_types = array_diff(scandir($styles_root), array('.', '..'));
				foreach($element_types as $type) {
					$theme_style[$type] = array();
					$styles = array_diff(scandir($styles_root . DIRECTORY_SEPARATOR . $type), array('.', '..'));
					foreach ($styles as $style) {
						$style_content = file_get_contents($styles_root . DIRECTORY_SEPARATOR . $type . DIRECTORY_SEPARATOR . $style);
						$theme_styles[$type][str_replace('.css', '', $style)] = $style_content;
					}
				}
			}
			$this->_out(new Upfront_JsonResponse_Success(array( 'styles' => $theme_styles )));
			return;
		}

		// Fix storage key missing _dev in dev mode. This is called from ajax calls so use POST.
		$storage_key = Upfront_Layout::get_storage_key();
		if (isset($_POST['dev']) && $_POST['dev'] === 'true' && strpos($storage_key, '_dev') === false) $storage_key = $storage_key . '_dev';

		$styles = get_option($storage_key . '_' . get_stylesheet() . '_styles');
		$this->_out(new Upfront_JsonResponse_Success(array(
			'styles' => $styles
		)));
	}

	function prepare_theme_styles() {
		// If in buiilder mode we need stuff from files
		if (upfront_is_builder_running()) {
			// In editor mode this would load element styles to main stylesheet. In builder mode
			// don't load any since styles are gonna be loaded each separately.
			return '';
		}

		// Fix storage key missing _dev in dev mode. This is regular GET request.
		$storage_key = Upfront_Layout::get_storage_key();
		if (isset($_GET['load_dev']) && $_GET['load_dev'] == 1 && strpos($storage_key, '_dev') === false) $storage_key = $storage_key . '_dev';

		// Preffer styles from database since they include user overrides
		$styles = get_option($storage_key . '_' . get_stylesheet() . '_styles');

		// If no overrides
		if(!$styles) {
			$out = '';
			// See if there are styles in theme files
			$styles_root = get_theme_root() . DIRECTORY_SEPARATOR . $stylesheet . DIRECTORY_SEPARATOR . 'element-styles';
			// List subdirectories as element types
			$element_types = array_diff(scandir($styles_root), array('.', '..'));
			foreach($element_types as $type) {
				$style_files = array_diff(scandir($styles_root . DIRECTORY_SEPARATOR . $type), array('.', '..'));
				foreach ($style_files as $style) {
					$style_content = file_get_contents($styles_root . DIRECTORY_SEPARATOR . $type . DIRECTORY_SEPARATOR . $style);
					$out .= $style_content;
				}
			}

			return $styles;
		}

		$out = '';
		// Continue with parsing overrides from db
		foreach($styles as $type => $elements) {
			foreach($elements as $name => $content) {
				$out .= $content;
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
			$option = wp_parse_args($option, array(
				'font_face' => false,
				'weight' => false,
				'style' => false,
				'size' => false,
				'line_height' => false,
				'color' => false,
			));
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
		$google_fonts = new Upfront_Model_GoogleFonts;
		$imports = '';
		foreach ($faces as $face) {
			if (!$google_fonts->is_from_google($face)) continue;
			// Naive import - this will send a request regardless if it's actually an Google font or not
			$imports .= "@import \"https://fonts.googleapis.com/css?family=" .
				preg_replace('/\s/', '+', $face) .
			"\";\n";
		}
		if (!empty($imports)) $out = "{$imports}\n\n{$out}";

		return $out;
	}

    /**
     * Saves theme colors styles
     * Hooks to upfront_save_theme_colors_styles ajax call
     * @access public
     */
    function save_theme_colors_styles(){
        if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

        $styles = trim(stripslashes($_POST['styles']));
        $styles = apply_filters('upfront-save_theme_colors_styles', $styles);

        update_option("upfront_theme_colors_styles", $styles);

        $this->_out(new Upfront_JsonResponse_Success(array(
            'styles' => $styles
        )));
    }

    private function _get_theme_colors_styles(){
        return get_option("upfront_theme_colors_styles");
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
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_load_editor_grid', array($this, "load_styles"));
			upfront_add_ajax('upfront_load_new_editor_grid', array($this, "load_new_styles"));
			upfront_add_ajax('upfront_load_grid', array($this, "load_front_styles"));
		}
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

		//add_action('wp_ajax_upfront-element-styles', array($this, 'serve_styles'));
		//add_action('wp_ajax_nopriv_upfront-element-styles', array($this, 'serve_styles'));
		upfront_add_ajax('upfront-element-styles', array($this, 'serve_styles'));
		upfront_add_ajax_nopriv('upfront-element-styles', array($this, 'serve_styles'));

		//add_action('wp_ajax_upfront-element-scripts', array($this, 'serve_scripts'));
		//add_action('wp_ajax_nopriv_upfront-element-scripts', array($this, 'serve_scripts'));
		upfront_add_ajax('upfront-element-scripts', array($this, 'serve_scripts'));
		upfront_add_ajax_nopriv('upfront-element-scripts', array($this, 'serve_scripts'));
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
		if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) return false;

		$this->register_requirements();

		// Layout revisions AJAX handers
		upfront_add_ajax('upfront_build_preview', array($this, "build_preview"));

		upfront_add_ajax('upfront_list_revisions', array($this, "list_revisions"));

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
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

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
//Upfront_Server_LayoutRevisions::serve();
add_action('init', array('Upfront_Server_LayoutRevisions', 'serve'));


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
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) upfront_add_ajax('upfront_list_google_fonts', array($this, 'json_list_google_fonts'));
	}

	public function json_list_google_fonts () {
		$model = new Upfront_Model_GoogleFonts;
		$fonts = $model->get_all();
		$response = !empty($fonts)
			? new Upfront_JsonResponse_Success($fonts)
			: new Upfront_JsonResponse_Error("Cache error")
		;
		$this->_out($response);
	}
}
//Upfront_Server_GoogleFontsServer::serve();
add_action('init', array('Upfront_Server_GoogleFontsServer', 'serve'));

class Upfront_Server_ResponsiveServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_get_breakpoints', array($this, 'get_breakpoints'));
		}
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_update_breakpoints', array($this, 'update_breakpoints'));
		}
	}

	public function get_breakpoints() {
		$responsive_settings = get_option('upfront_' . get_stylesheet() . '_responsive_settings');
		if(empty($responsive_settings)) {
      // Add defaults
			$defaults = Upfront_Grid::get_grid()->get_default_breakpoints();
      $responsive_settings = json_encode($defaults);
    }
		$this->_out(new Upfront_JsonResponse_Success($responsive_settings));
	}

  public function update_breakpoints() {
  	if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

    $breakpoints = isset($_POST['breakpoints']) ? $_POST['breakpoints'] : array();
    // Parse data types
    foreach ($breakpoints as $index=>$breakpoint) {
      $breakpoints[$index]['enabled'] = filter_var($breakpoint['enabled'], FILTER_VALIDATE_BOOLEAN);
      $breakpoints[$index]['default'] = filter_var($breakpoint['default'], FILTER_VALIDATE_BOOLEAN);
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
//Upfront_Server_ResponsiveServer::serve();
add_action('init', array('Upfront_Server_ResponsiveServer', 'serve'));


class Upfront_Server_ThemeFontsServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_update_theme_fonts', array($this, 'update_theme_fonts'));
		}
	}

  public function update_theme_fonts() {
  	if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

    $theme_fonts = isset($_POST['theme_fonts']) ? $_POST['theme_fonts'] : array();
		if (upfront_is_builder_running()) {
			do_action('upfront_update_theme_fonts', $theme_fonts);
		} else {
			update_option('upfront_' . get_stylesheet() . '_theme_fonts', json_encode($theme_fonts));
		}

		$this->_out(new Upfront_JsonResponse_Success(get_stylesheet() . ' theme fonts updated'));
  }
}
//Upfront_Server_ThemeFontsServer::serve();
add_action('init', array('Upfront_Server_ThemeFontsServer', 'serve'));

class Upfront_Server_ThemeColorsServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) upfront_add_ajax('upfront_get_theme_color', array($this, 'get'));
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) upfront_add_ajax('upfront_update_theme_colors', array($this, 'update'));
	}

	public function get() {
		$theme_colors = get_option('upfront_' . get_stylesheet() . '_theme_colors');
		if (empty($theme_colors)) $theme_colors = array();
		$this->_out(new Upfront_JsonResponse_Success($theme_colors));
	}

	public function update() {
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$theme_colors = isset($_POST['theme_colors']) ? $_POST['theme_colors'] : array();
		$range = isset($_POST['range']) ? $_POST['range'] : 0;

		$data = array(
			"colors" => $theme_colors,
			"range" => $range
		);

		if (upfront_is_builder_running()) {
			do_action('upfront_update_theme_colors', $data, upfront_get_builder_stylesheet());
		} else {
			update_option('upfront_' . get_stylesheet() . '_theme_colors', json_encode($data));
		}

		$this->_out(new Upfront_JsonResponse_Success(get_stylesheet() . ' theme colors updated'));
	}
}
//Upfront_Server_ThemeColorsServer::serve();
add_action('init', array('Upfront_Server_ThemeColorsServer', 'serve'));
