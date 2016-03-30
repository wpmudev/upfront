<?php


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

		$is_ssl = !empty($_GET['ssl']);

		$root = Upfront::get_root_url();
		$ajax = admin_url('admin-ajax.php');
		$site = home_url();
		$includes_url = includes_url();
		$current_theme_url = get_stylesheet_directory_uri();

		if (empty($is_ssl) && is_ssl()) {
			$root = preg_replace('/^https:/', 'http:', $root);
			$includes_url = preg_replace('/^https:/', 'http:', $includes_url);
			$ajax = preg_replace('/^https:/', 'http:', $ajax);
			$site = preg_replace('/^https:/', 'http:', $site);
			$current_theme_url = preg_replace('/^https:/', 'http:', $current_theme_url);
		}

		$admin = admin_url();
		$upfront_data_url = $ajax . '?action=upfront_data';

		$entities = Upfront_Entity_Registry::get_instance();
		$registered = $entities->get_all();

		$child_instance = Upfront_ChildTheme::get_instance();

		$paths = array(
			"backbone" => $includes_url . "js/backbone.min",
			"underscore" => $includes_url . "js/underscore.min",
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
			"bg-settings" => "scripts/upfront/bg-settings/bg-settings",
			"spectrum" => "scripts/spectrum/spectrum",
			"responsive" => "scripts/responsive",
			"redactor_plugins" => 'scripts/redactor/plugins',
			"redactor" => 'scripts/redactor/redactor',
			"jquery-df" => 'scripts/jquery/jquery-dateFormat.min',
			"jquery-simulate" => 'scripts/jquery/jquery.simulate',
			"ueditor" => 'scripts/redactor/ueditor',
			"chosen" => "scripts/chosen/chosen.jquery.min",
			"findandreplace" => "scripts/findandreplace/findAndReplaceDOMText"
		);
		$paths = apply_filters('upfront-settings-requirement_paths', $paths + $registered);

		$shim = array(
			'underscore' => array('exports' => '_'),
			'redactor' => array('redactor_plugins'),
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

		// Deal with caches
		if (class_exists('Upfront_Compat') && is_callable(array('Upfront_Compat', 'get_upfront_core_version'))) {
			$core_version = Upfront_Compat::get_upfront_core_version();
			if (!empty($core_version)) $require_config['urlArgs'] = 'ufver=' . urlencode($core_version);
		}

		// Absolute cache breaker
		if ($this->_debugger->is_active(Upfront_Debug::CACHED_RESPONSE)) {
			$require_config['urlArgs'] = 'nocache=' . urlencode(microtime(true));
		}

		$require_config = json_encode(apply_filters('upfront-settings-require_js_config', $require_config));


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
		$theme_info = apply_filters('upfront_get_responsive_settings', $theme_info);
		if (is_array($theme_info)) {
			$theme_info = json_encode($theme_info);
		}

		if (empty($theme_info) || $theme_info === '[]') {
			// Add defaults
			$defaults = Upfront_Grid::get_grid()->get_breakpoints_data();
			$theme_info = json_encode(array('breakpoints' => $defaults));
		}

		$theme_fonts = get_option('upfront_' . get_stylesheet() . '_theme_fonts');
		$theme_fonts = apply_filters(
			'upfront_get_theme_fonts',
			$theme_fonts,
			array(
				'json' => true
			)
		);
    	if (empty($theme_fonts)) $theme_fonts = json_encode(array());

		$icon_fonts = get_option('upfront_' . get_stylesheet() . '_icon_fonts');
		$icon_fonts = apply_filters(
			'upfront_get_icon_fonts',
			$icon_fonts,
			array(
				'json' => true
			)
		);
    	if (empty($icon_fonts)) $icon_fonts = json_encode(array());

		$additional_fonts = $child_instance ? $child_instance->getAdditionalFonts() : json_encode(array());

		$current_user = wp_get_current_user();
		$user_done_font_intro = in_array($current_user->user_login, get_option('upfront_users_done_font_intro', array())) ?
			'true' : 'false';


		$theme_colors = get_option('upfront_' . get_stylesheet() . '_theme_colors');
		$theme_colors = apply_filters(
			'upfront_get_theme_colors',
			$theme_colors,
			array(
				'json' => true
			)
		);

    	if (empty($theme_colors)) $theme_colors = json_encode(array());

		$post_image_variants = get_option('upfront_' . get_stylesheet() . '_post_image_variants');
		$post_image_variants = apply_filters(
			'upfront_get_post_image_variants',
			$post_image_variants,
			array(
				'json' => true
			)
		);

		if (empty($post_image_variants)) $post_image_variants = json_encode(array());

		$prev_post_image_variants = apply_filters(
			'upfront_get_prev_post_image_variants',
			array(
				'json' => true
			)
		);
		if (empty($prev_post_image_variants)) $prev_post_image_variants = json_encode(array());
		$other_post_image_variants = apply_filters(
			'upfront_get_other_post_image_variants',
			array(
				'json' => true
			)
		);
		if (empty($other_post_image_variants)) $other_post_image_variants = json_encode(array());

		$registry = Upfront_PresetServer_Registry::get_instance();
		$preset_servers = $registry->get_all();

		$preset_defaults = array();
		$presets = '';
		foreach ($preset_servers as $key => $server) {
			$src = is_object($server) ? get_class($server) : $server;

			//$element_server = $server::get_instance(); // not PHP 5.2 safe
			$callable = array($src, 'get_instance');
			if (!is_callable($callable)) continue; // We have no business continuing
			$element_server = call_user_func($callable);

			$element_presets = $element_server->get_presets_javascript_server();
			$presets .= "{$key}Presets: {$element_presets}, \n";

			//Get preset defaults
			$preset_defaults[$key] = $element_server->get_preset_defaults();
		}

		$preset_defaults = json_encode($preset_defaults);

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
            "CONTENT_STYLE" => "post content style",
			"POSTCONTENT" => "post content",
     		"RESPONSIVE" => "responsive",
			"POSTCONTENT_STYLE" => false,
			//"DEFAULT" => (current_user_can("manage_options") ? "layout" : "content"),
		// These need some finer control over
			"DEFAULT" => (Upfront_Permissions::current(Upfront_Permissions::LAYOUT_MODE) ? "layout" : "content"),
			"ALLOW" => (Upfront_Permissions::current(Upfront_Permissions::LAYOUT_MODE) ? join(',', $allowed_modes) : "content")
		));

		$read_only = json_encode(defined('UPFRONT_READ_ONLY') && UPFRONT_READ_ONLY);
		$allow_revisions = json_encode(Upfront_Permissions::current(Upfront_Permissions::SAVE_REVISION));

		$permissions = json_encode(array(
			'REVISIONS' => (bool)Upfront_Permissions::current(Upfront_Permissions::SAVE_REVISION),
			'OPTIONS' => (bool)Upfront_Permissions::current(Upfront_Permissions::OPTIONS),
			'EMBED' => (bool)Upfront_Permissions::current(Upfront_Permissions::EMBED),
			'UPLOAD' => (bool)Upfront_Permissions::current(Upfront_Permissions::UPLOAD),
			'RESIZE' => (bool)Upfront_Permissions::current(Upfront_Permissions::RESIZE),
			'DEBUG' => (bool)Upfront_Permissions::current(Upfront_Permissions::SEE_USE_DEBUG),
			'SWITCH_PRESET' => (bool)Upfront_Permissions::current(Upfront_Permissions::SWITCH_ELEMENT_PRESETS),
			'MODIFY_PRESET' => (bool)Upfront_Permissions::current(Upfront_Permissions::MODIFY_ELEMENT_PRESETS),
			'DELETE_PRESET' => (bool)Upfront_Permissions::current(Upfront_Permissions::DELETE_ELEMENT_PRESETS),
			'CREATE_POST_PAGE' => (bool)Upfront_Permissions::current(Upfront_Permissions::CREATE_POST_PAGE),
			'EDIT' => (bool)Upfront_Permissions::current(Upfront_Permissions::EDIT),
		));

		$l10n = json_encode($this->_get_l10n_strings());

		$content_settings = array();
		if (Upfront_Permissions::current(Upfront_Permissions::CONTENT_MODE)) {
			$raw_post_types = get_post_types(array(
				'public' => true,
			), 'objects');
			$content_settings["post_types"] = array();
			foreach ($raw_post_types as $type => $obj) {
				if (empty($obj->labels->name)) continue;
				$content_settings["post_types"][] = array(
					"name" => $type,
					"label" => $obj->labels->name,
				);
			}
		}
		$content_settings = json_encode($content_settings);

		/**
		 * Redactor font icons
		 *
		 *
		 */

		// get default font
		$redactor_font_icons = $this->_get_default_font_icons();

		$redactor_font_icons = apply_filters(
			'upfront_get_editor_font_icons',
			$redactor_font_icons,
			array(
				'json' => true
			)
		);

		$menus = json_encode(wp_get_nav_menus());
		$is_rtl = (int) is_rtl();
		$main = <<<EOMainJs
// Set up the global namespace
var Upfront = window.Upfront || {};
Upfront.mainData = {
	requireConfig: $require_config,
	root: '{$root}',
	currentThemeUrl: '{$current_theme_url}',
	ajax: '{$ajax}',
	admin: '{$admin}',
	site: '{$site}',
	debug: {$debug},
	layoutEditorRequirements: {$layout_editor_requirements},
	applicationModes: {$application_modes},
	ALLOW_REVISIONS: {$allow_revisions},
	readOnly: {$read_only},

	PERMS: {$permissions},

	specificity: {$specificity},
	gridInfo: {$grid_info},
	themeInfo: {$theme_info},
	themeFonts: {$theme_fonts},
	iconFonts: {$icon_fonts},
	additionalFonts: {$additional_fonts},
	userDoneFontsIntro: {$user_done_font_intro},
	{$presets}
	presetDefaults: {$preset_defaults},
	themeColors: {$theme_colors},
	postImageVariants: {$post_image_variants},
	prevPostImageVariants: {$prev_post_image_variants},
	otherPostImageVariants: {$other_post_image_variants},
	content: {$content},
	content_settings: {$content_settings},
	l10n: {$l10n},
	font_icons: {$redactor_font_icons},
	menus: {$menus},
	isRTL: {$is_rtl}
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

    /**
     * Returns default font icons
     *
     * @return array
     */
    private function _get_default_font_icons(){
        return json_encode( array(
            "~",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "0",
            "-",
            "+",
            "Q",
            "W",
            "E",
            "R",
            "T",
            "Y",
            "U",
            "I",
            "O",
            "P",
            "{",
            "}",
            "|",
            "A",
            "S",
            "D",
            "F",
            "G",
            "H",
            "J",
            "K",
            "L",
            ":",
            '"',
            "Z",
            "X",
            "C",
            "V",
            "B",
            "N",
            "M",
            "<",
            ">",
            "?",
        ) );
    }
}
