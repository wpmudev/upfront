<?php

class Upfront_CoreDependencies_Server extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('upfront-core-inject_dependencies', array($this, 'dispatch_dependencies_output'));
		add_action('wp_head', array($this, 'dispatch_fonts_loading'));

		upfront_add_ajax('wp_scripts', array($this, 'wp_scripts_load'));
	}

	/**
	 * Dispatch Google fonts loading based on the internal flag state.
	 */
	public function dispatch_fonts_loading () {
		$deps = Upfront_CoreDependencies_Registry::get_instance();
		$fonts = $deps->get_fonts();
		if (Upfront_OutputBehavior::has_experiments()) {
			if (!empty($fonts)) $deps->add_script('//ajax.googleapis.com/ajax/libs/webfont/1.5.10/webfont.js');
			return false;
		}
		$this->_output_normal_fonts($fonts);
	}

	/**
	 * Dispatches loading scripts and styles based on internal flag state.
	 */
	public function dispatch_dependencies_output () {
		$deps = Upfront_CoreDependencies_Registry::get_instance();
		if (Upfront_OutputBehavior::has_experiments()) {
			$fonts = $deps->get_fonts();
			if (!empty($fonts)) $this->_output_experimental_fonts($fonts);
			
			$this->_output_experimental($deps);
		} else {
			$this->_output_normal($deps);
		}
	}

	public function wp_scripts_load () {
		// Do the enqueueing action
		do_action('upfront-core-wp_dependencies');

		$deps = Upfront_CoreDependencies_Registry::get_instance();
		$wps = new WP_Scripts();
		$scripts = $deps->get_wp_scripts();

		$srcs = array();
		foreach ($scripts as $script) {
			if (!empty($wps->registered[$script])) $srcs[] = wp_normalize_path(ABSPATH . $wps->registered[$script]->src);
		}

		$out = '';
		foreach ($srcs as $src) {
			if (file_exists($src)) $out .= file_get_contents($src);
		}

		$response = empty($out)
			? new Upfront_JavascriptResponse_Error("Dependencies not found")
			: new Upfront_JavascriptResponse_Success($out)
		;
		$this->_out($response);
	}

	/**
	 * Output "normal" (non-optimized) script and style dependencies.
	 *
	 * @param Upfront_CoreDependencies_Registry $deps Dependencies registry
	 */
	private function _output_normal ($deps) {
		$styles = $deps->get_styles();
		$link_tpl = '<link rel="stylesheet"  href="%url%" type="text/css" media="all" />';
		foreach ($styles as $style) {
			echo preg_replace('/%url%/', $style, $link_tpl);
		}

		$scripts = $deps->get_scripts();
		$script_tpl = '<script type="text/javascript" src="%url%"></script>';
		foreach ($scripts as $script) {
			echo preg_replace('/%url%/', $script, $script_tpl);	
		}
	}

	/**
	 * Output experimental, request-optimized script and style dependencies.
	 *
	 * @param Upfront_CoreDependencies_Registry $deps Dependencies registry
	 */
	private function _output_experimental ($deps) {

		$link_urls = json_encode(apply_filters('upfront-experiments-styles-debounce_dependency_load', $deps->get_styles()));
		$debug = $this->_debugger->is_active(Upfront_Debug::STYLE) ? 'class="upfront-debounced"' : '';
		$link_tpl = json_encode('<link rel="stylesheet"  href="%url%" type="text/css" media="all" ' . $debug . ' />');

		$script_urls = json_encode(apply_filters('upfront-experiments-scripts-debounce_dependency_load', $deps->get_scripts()));
		$debug = $this->_debugger->is_active(Upfront_Debug::JS_TRANSIENTS) ? 'class="upfront-debounced"' : '';
		$script_tpl = json_encode('<script type="text/javascript" src="%url%" ' . $debug . '></script>');

		$callback_wrap_start = $callback_wrap_end = '';
		$injection_root = 'head';
		if (Upfront_OutputBehavior::has_experiments_level(Upfront_OutputBehavior::LEVEL_DEFAULT)) {
			$callback_wrap_start = '$(function () {';
			$callback_wrap_end = '});';
		}
		if (Upfront_OutputBehavior::has_experiments_level(Upfront_OutputBehavior::LEVEL_AGGRESSIVE)) {
			$callback_wrap_start = '$(function () { setTimeout(function () {';
			$callback_wrap_end = '}, 500);});';
			$injection_root = 'body';
		}
		
		$injection_root = esc_js($injection_root);
		echo "<script type='text/javascript'>
			(function ($) {
			{$callback_wrap_start}
				var script_urls = {$script_urls},
					script_tpl = {$script_tpl},
					link_urls = {$link_urls},
					link_tpl = {$link_tpl},
					head = $('{$injection_root}')
				;
				$.each(link_urls, function (idx, url) {
					head.append(link_tpl.replace(/%url%/, url));
				});
				$.each(script_urls, function (idx, url) {
					head.append(script_tpl.replace(/%url%/, url));
				});
			{$callback_wrap_end}
			})(jQuery);
		</script>";
	}

	/**
	 * Use normal link element to set up fonts in one go.
	 *
	 * @param array $fonts Hash map of fonts to include in request.
	 */
	private function _output_normal_fonts ($fonts=array()) {
		if (empty($fonts)) return false;
		
		$request = $this->_to_font_request_array($fonts);
		if (empty($request)) return false;
		
		
		echo '<link rel="stylesheet" type="text/css" media="all" href="//fonts.googleapis.com/css?family=' . esc_attr(join('|', $request)) . '" />';
	}

	/**
	 * Output registered fonts in an experimentally optimized way using web fonts loader.
	 *
	 * @param array $fonts Hash map of fonts to include in request.
	 */
	private function _output_experimental_fonts ($fonts=array()) {
		if (empty($fonts)) return false;
		
		$request = $this->_to_font_request_array($fonts, false);
		if (empty($request)) return false;

		$request = json_encode($request);
		$debug = '';
		if ($this->_debugger->is_active(Upfront_Debug::WEB_FONTS)) {
			$debug .= ',loading: function () { console.log("Loading web fonts..."); }';
			$debug .= ',active: function () { console.log("Web fonts loaded."); }';
			$debug .= ',inactive: function () { console.log("Web fonts loading failed."); }';
		}

		echo "<script type='text/javascript'>
			WebFontConfig = {
				google: {
					families: {$request}
				}
				{$debug}
			};
		</script>";
	}

	/**
	 * Processes the registered fonts and returns a regular array containing request families
	 *
	 * @param array $fonts Registered fonts hash
	 * @param bool $cleanup_family Whether to escape family names or not
	 *
	 * @return mixed Array of requests ready for processing or false if something went wrong.
	 */
	private function _to_font_request_array ($fonts, $cleanup_family=true) {
		if (empty($fonts)) return false;
		foreach ($fonts as $family => $variants) {
			if (empty($family)) continue;
			if ($cleanup_family) $family = preg_replace('/\s/', '+', $family);

			if (!empty($variants)) $variants = ':' . join(',', array_filter(array_unique(array_map('trim', $variants))));
			else $variants = '';
			
			$request[] = $family . $variants;
		}
		$request = array_filter(array_unique(array_map('trim', $request)));
		return empty($request)
			? false
			: $request
		;
	}

}
Upfront_CoreDependencies_Server::serve();






class Upfront_OutputBehavior {

	const LEVEL_AGGRESSIVE = 'aggressive';
	const LEVEL_DEFAULT = 'default';
	const LEVEL_LOW = 'low';

	private static $_compression;
	private static $_experiments;
	
	private function __construct () {}
	private function __clone () {}

	private static function _parse_compression () {
		if (empty(self::$_compression)) {
			if (defined('UPFRONT_COMPRESS_RESPONSE') && UPFRONT_COMPRESS_RESPONSE) self::$_compression = true;
		}
	}

	private static function _parse_experiments () {
		if (empty(self::$_experiments) && defined('UPFRONT_EXPERIMENTS_ON') && UPFRONT_EXPERIMENTS_ON) {
			$level = UPFRONT_EXPERIMENTS_ON;
			if (in_array($level, array(1, '1', true), true)) self::$_experiments = self::LEVEL_DEFAULT;
			else self::$_experiments = $level;
		}
	}

	private static function _init () {
		self::_parse_compression();
		self::_parse_experiments();
	}

	/**
	 * Whether or not the compression has been enabled.
	 *
	 * @return bool True if it actually is, false otherwise
	 */
	public static function has_compression () { 
		self::_init();
		return (bool)self::$_compression; 
	}
	
	/**
	 * Whether or not the load experiments has been enabled at all
	 *
	 * @return bool True if they are, false otherwise
	 */
	public static function has_experiments () {
		self::_init();
		return (bool)self::$_experiments;
	}

	/**
	 * Check if the particular experiments level is active.
	 *
	 * @param bool $level Level (see constants map) to check
	 * @return bool
	 */
	public static function has_experiments_level ($level=false) {
		$level = empty($level) ? self::LEVEL_DEFAULT : $level;
		if (!self::has_experiments()) return false;

		return self::$_experiments === $level;
	}
}
