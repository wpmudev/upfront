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
		add_action('wp_ajax_upfront_build_preview', array($this, "build_preview"));
		add_action('wp_ajax_upfront_update_layout_element', array($this, "update_layout_element"));
	}

	// STUB LOADING
	function load_layout () {
		$layout_ids = $_POST['data'];
		$post_type = isset($_POST['new_post']) ? $_POST['new_post'] : false;
		$parsed = false;
		$string = '';

		if (empty($layout_ids))
			$this->_out(new Upfront_JsonResponse_Error("No such layout"));

		if(is_string($layout_ids)){
			$string = $layout_ids;
			$layout_ids = Upfront_EntityResolver::ids_from_url($layout_ids);
			$parsed = true;
		}

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
			'layout' => $layout->to_php(),
			'cascade' => $layout_ids
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

	function update_layout_element() {
		$data = !empty($_POST) ? stripslashes_deep($_POST) : false;

		if(!$data)
			return $this->_out(new Upfront_JsonResponse_Error("No data"));
		if(empty($data['layout']))
			return $this->_out(new Upfront_JsonResponse_Error("No layout id given"));
		if(empty($data['element']))
			return $this->_out(new Upfront_JsonResponse_Error("No element data given"));

		$element = json_decode($data['element'], true);

		$layout = Upfront_Layout::from_entity_ids($data['layout']);
		if(empty($layout))
			return $this->_out(new Upfront_JsonResponse_Error("Unkown layout"));

		$updated = $layout->set_element_data($element);
		if(!$updated)
			return $this->_out(new Upfront_JsonResponse_Error("Error updating the layout"));

		$layout->save();
		$this->_out(new Upfront_JsonResponse_Success("Layout updated"));
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
      "ueditor" => 'scripts/redactor/ueditor'
		);
		$paths = apply_filters('upfront-settings-requirement_paths', $paths + $registered);

    $shim = array(
      'underscore' => array('exports' => '_'),
      'backbone' => array( 'deps' => array('underscore'), 'exports' => 'Backbone')
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

		$application_modes = json_encode(array(
			"LAYOUT" => "layout",
			"CONTENT" => "content",
			"DEFAULT" => (current_user_can("manage_options") ? "layout" : "content"),
			"ALLOW" => (current_user_can("manage_options") ? "layout,content" : "content")
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
		add_filter('upfront_regions', array($this, 'intercept_layout_loading'), 999, 2);
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
	 */
	public function intercept_layout_loading ($layout, $cascade) {
		if (!self::is_preview()) return $layout;
		$key = $_GET[self::HOOK];
		$raw = $this->_data->get_revision($key);
		if (!empty($raw)) {
			$new_layout = Upfront_Layout::from_php($raw);
		}

		return empty($raw["regions"])
			? $layout
			: $raw["regions"]
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
