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
		add_action('upfront-layout-applied', array($this, 'load_styles'));
		add_action('upfront-layout-applied', array($this, 'load_scripts'));

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
		$version = Upfront_ChildTheme::get_instance()?Upfront_ChildTheme::get_instance()->get_version():'1.0';
		return !empty($version) ? $version : '1.0';
	}
}