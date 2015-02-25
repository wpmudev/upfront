<?php


/**
 * Serves registered element stylesheets.
 */
class Upfront_ElementStyles extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (defined('UPFRONT_EXPERIMENTS_ON') && UPFRONT_EXPERIMENTS_ON) {
			add_filter('upfront-experiments-styles-debounce_dependency_load', array($this, 'add_style_load_url'));
			add_filter('upfront-experiments-scripts-debounce_dependency_load', array($this, 'add_script_load_url'));
		} else {
			add_action('upfront-layout-applied', array($this, 'load_styles'));
			add_action('upfront-layout-applied', array($this, 'load_scripts'));
		}
		

		upfront_add_ajax('upfront-element-styles', array($this, 'serve_styles'));
		upfront_add_ajax_nopriv('upfront-element-styles', array($this, 'serve_styles'));

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
				//$path = upfront_element_dir($frags[0], $frags[1]);
				//if (file_exists($path)) $cache .= "/* {$key} */\n" . file_get_contents($path) . "\n";
				if (empty($frags)) continue;
				$style = $this->_get_style_contents($frags);
				if (!empty($style))  $cache .= "/* {$key} */\n{$style}\n";
			}
			if (!$this->_debugger->is_active(Upfront_Debug::STYLE)) $cache = Upfront_StylePreprocessor::compress($cache);
			set_transient($cache_key, $cache);
		}

		//wp_enqueue_style('upfront-element-styles', admin_url('admin-ajax.php?action=upfront-element-styles&key=' . $cache_key)); // It'll also work as an AJAX request
		wp_enqueue_style('upfront-element-styles', Upfront_VirtualPage::get_url(join('/', array(
			'upfront-dependencies',
			'styles',
			$raw_cache_key
		))), array(), $this->_get_enqueue_version()); // But let's do pretty instead
	}

	public function add_style_load_url ($urls) {
		$hub = Upfront_PublicStylesheets_Registry::get_instance();
		$styles = $hub->get_all();
		if (empty($styles)) return $urls;

		$raw_cache_key = $this->_get_raw_cache_key($styles);
		$cache_key = "css{$raw_cache_key}";
		$cache = $this->_debugger->is_active() ? false : get_transient($cache_key);
		if (empty($cache)) {
			foreach ($styles as $key => $frags) {
				//$path = upfront_element_dir($frags[0], $frags[1]);
				//if (file_exists($path)) $cache .= "/* {$key} */\n" . file_get_contents($path) . "\n";
				if (empty($frags)) continue;
				$style = $this->_get_style_contents($frags);
				if (!empty($style))  $cache .= "/* {$key} */\n{$style}\n";
			}
			if (!$this->_debugger->is_active(Upfront_Debug::STYLE)) $cache = Upfront_StylePreprocessor::compress($cache);
			set_transient($cache_key, $cache);
		}

		$url = Upfront_VirtualPage::get_url(join('/', array(
			'upfront-dependencies',
			'styles',
			$raw_cache_key
		)));
		$urls[] = $url;
		return $urls;
	}

	/**
	 * Fetching and pre-processing the relative/absolute paths in styles.
	 */
	private function _get_style_contents ($frags) {
		$path = upfront_element_dir($frags[0], $frags[1]);
		$url = upfront_element_url($frags[0], $frags[1]);
		if (!file_exists($path)) return false;

		$style = file_get_contents($path);

		// Obtain the first "../" level
		$base_url = trailingslashit(dirname(dirname($url)));

		// First up, let's build up allowed directories list
		$dirs = explode('/', $base_url);
		$relatives = array();
		$upfront_root = preg_quote(Upfront::get_root_url(), '/');
		while (array_pop($dirs) !== NULL) {
			$rel = join('/', $dirs);
			$relatives[] = $rel;
			if (preg_match('/^' . $upfront_root . '$/', $rel)) break; // Let's not allow relative paths inclusion higher than the Upfront root
		}
		if (empty($relatives)) return $style;

		// Next, let's build the matching patterns list
		$matchers = array();
		foreach ($relatives as $idx => $relpath) {
			$count = $idx+1;
			$matchers[$count] = array(
				'url' => $relpath,
				'pattern' => str_repeat('../', $count)
			);
		}
		$matchers = array_reverse($matchers); // Start with longest match first

		// Lastly, let's actually replace the relative paths
		$slash = preg_quote('/', '/');
		foreach ($matchers as $match) {
			if (empty($match['pattern']) || empty($match['url'])) continue;
			$rx = "/([^{$slash}])" . preg_quote($match['pattern'], '/') . '([^.]{2})/'; // Let's start small
			$rpl = '$1' . trailingslashit($match['url']) . '$2';
			$style = preg_replace($rx, $rpl, $style);
		}

		return $style;
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
		))), array('jquery'), $this->_get_enqueue_version(), true); // Scripts go into footer
	}

	public function add_script_load_url ($urls) {
		$hub = Upfront_PublicScripts_Registry::get_instance();
		$scripts = $hub->get_all();
		if (empty($scripts)) return $urls;

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
		$url = Upfront_VirtualPage::get_url(join('/', array(
			'upfront-dependencies',
			'scripts',
			$raw_cache_key
		)));
		$urls[] = $url;
		return $urls;
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

	private function _get_enqueue_version () {
		return Upfront_ChildTheme::get_version();
	}
}


class Upfront_CoreDependencies_Server extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('upfront-core-inject_dependencies', array($this, 'dispatch_dependencies_output'));
		add_action('wp_head', array($this, 'dispatch_fonts_loading'));
	}

	/**
	 * Dispatch Google fonts loading based on the internal flag state.
	 */
	public function dispatch_fonts_loading () {
		$deps = Upfront_CoreDependencies_Registry::get_instance();
		$fonts = $deps->get_fonts();
		if (defined('UPFRONT_EXPERIMENTS_ON') && UPFRONT_EXPERIMENTS_ON) {
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
		if (defined('UPFRONT_EXPERIMENTS_ON') && UPFRONT_EXPERIMENTS_ON) {
			$fonts = $deps->get_fonts();
			if (!empty($fonts)) $this->_output_experimental_fonts($fonts);
			
			$this->_output_experimental($deps);
		} else {
			$this->_output_normal($deps);
		}
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
		$link_tpl = json_encode('<link rel="stylesheet"  href="%url%" type="text/css" media="all" />');
		

		$script_urls = json_encode(apply_filters('upfront-experiments-scripts-debounce_dependency_load', $deps->get_scripts()));
		$script_tpl = json_encode('<script type="text/javascript" src="%url%"></script>');
		
		echo "<script type='text/javascript'>
			(function ($) {
				var script_urls = {$script_urls},
					script_tpl = {$script_tpl},
					link_urls = {$link_urls},
					link_tpl = {$link_tpl},
					head = $('head')
				;
				$.each(script_urls, function (idx, url) {
					head.append(script_tpl.replace(/%url%/, url));
				});
				$.each(link_urls, function (idx, url) {
					head.append(link_tpl.replace(/%url%/, url));
				});
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