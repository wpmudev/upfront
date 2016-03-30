<?php


/**
 * Serves registered element stylesheets.
 */
class Upfront_ElementStyles extends Upfront_Server {

	const TYPE_SCRIPT = 'js';
	const TYPE_STYLE = 'css';

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		$this->_cache = Upfront_Cache::get_instance(Upfront_Cache::TYPE_LONG_TERM);

		if (Upfront_Behavior::compression()->has_experiments()) {
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

	/**
	 * Loads element style dependencies in normal execution mode.
	 * @uses wp_enqueue_style
	 */
	public function load_styles () {
		$raw_cache_key = $this->_get_cached_styles();
		if (!empty($raw_cache_key)) wp_enqueue_style('upfront-element-styles', $this->_get_enqueueing_url(self::TYPE_STYLE, $raw_cache_key), array(), $this->_get_enqueue_version()); // But let's do pretty instead
	}

	/**
	 * Queue up element style dependencies for deferred loading in experiments mode.
	 */
	public function add_style_load_url ($urls) {
		$raw_cache_key = $this->_get_cached_styles();
		if (empty($raw_cache_key)) return $urls;

		$url = $this->_get_enqueueing_url(self::TYPE_STYLE, $raw_cache_key);
		$urls[] = $url;
		return $urls;
	}

	/**
	 * Use unified cache population scheme.
	 *
	 * @return string Raw cache key to be used in URL construction.
	 */
	private function _get_cached_styles () {
		$hub = Upfront_PublicStylesheets_Registry::get_instance();
		$styles = $hub->get_all();
		if (empty($styles)) return false;

		$ckey = $this->_cache->key(self::TYPE_STYLE, $styles);

		$raw_cache_key = $ckey->get_hash();
		$cache = $this->_debugger->is_active() ? false : $this->_cache->get($ckey);

		if (empty($cache)) {
			foreach ($styles as $key => $frags) {
				if (empty($frags)) continue;
				$style = $this->_get_style_contents($frags);
				if (!empty($style))  $cache .= "/* ~~~~~ [STYLE DEBUG]: {$key} ~~~~~ */\n{$style}\n";
			}
			if (!$this->_debugger->is_active(Upfront_Debug::STYLE)) {
				$cache = Upfront_StylePreprocessor::compress($cache);
			}

			/**
			 * Filter the cache just before we place it for later usage
			 *
			 * @param string $cache Gathered and pre-processed cache to deal with
			 * @param string $raw_cache_key Cache key used for storage
			 */
			$cache = apply_filters('upfront-dependencies-cache-styles', $cache, $raw_cache_key);

			$this->_cache->set($ckey, $cache);
		}

		return $raw_cache_key;
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

	/**
	 * Loads element script dependencies in normal execution mode.
	 * @uses wp_enqueue_script
	 */
	public function load_scripts () {
		$raw_cache_key = $this->_get_cached_scripts();
		if (!empty($raw_cache_key)) wp_enqueue_script('upfront-element-scripts', $this->_get_enqueueing_url(self::TYPE_SCRIPT, $raw_cache_key), array('jquery'), $this->_get_enqueue_version(), true); // Scripts go into footer
	}

	/**
	 * Queue up element script dependencies for deferred loading in experiments mode.
	 */
	public function add_script_load_url ($urls) {
		$raw_cache_key = $this->_get_cached_scripts();
		if (empty($raw_cache_key)) return $urls;

		$url = $this->_get_enqueueing_url(self::TYPE_SCRIPT, $raw_cache_key);
		$urls[] = $url;
		return $urls;
	}

	/**
	 * Use unified cache population scheme.
	 *
	 * @return string Raw cache key to be used in URL construction.
	 */
	private function _get_cached_scripts () {
		$hub = Upfront_PublicScripts_Registry::get_instance();
		$scripts = $hub->get_all();
		if (empty($scripts)) return false;

		$ckey = $this->_cache->key(self::TYPE_SCRIPT, $scripts);

		$raw_cache_key = $ckey->get_hash();
		$cache = $this->_debugger->is_active() ? false : $this->_cache->get($ckey);

		if (empty($cache)) {
			foreach ($scripts as $key => $frags) {
				$path = upfront_element_dir($frags[0], $frags[1]);
				if (file_exists($path)) $cache .= "/* {$key} */\n" . file_get_contents($path) . "\n";
			}

			/**
			 * Filter the cache just before we place it for later usage
			 *
			 * @param string $cache Gathered and pre-processed cache to deal with
			 * @param string $raw_cache_key Cache key used for storage
			 */
			$cache = apply_filters('upfront-dependencies-cache-scripts', $cache, $raw_cache_key);

			$this->_cache->set($ckey, $cache);
		}

		return $raw_cache_key;
	}

	/**
	 * Serve layout element styles according to the requested key.
	 */
	public function serve_styles () {
		$key = $this->_cache->key(self::TYPE_STYLE);
		$key->set_hash(stripslashes($_REQUEST['key']));

		$cache = $this->_cache->get($key);
		$response = empty($cache)
			? new Upfront_CssResponse_Error('')
			: new Upfront_CssResponse_Success($cache)
		;

		$this->_out($response, true);
	}
	
	public function get_closeset_breakpoints($width, $breakpoints) {
		$next_width = 0;
		$prev_width = 0;
		foreach ( $breakpoints as $name => $point ){
			$point_width = $point->get_width();
			if ( $point_width > $width && ( $point_width < $next_width || $next_width == 0) ){
				$next = $point;
				$next_width = $point_width;
			}
			else if ( $point_width < $width && ( $point_width > $prev_width || $prev_width == 0 ) ){
				$prev = $point;
				$prev_width = $point_width;
			}
		}

		return array(
			'prev' => $prev_width,
			'next' => $next_width
		);
	}
	
	/**
	 * Serve breakpoint widths array.
	 */
	public function serve_breakpoints_array () {
		$js_return = '';
		$breakpoints_array = array();
		$breakpoints = Upfront_Grid::get_grid()->get_breakpoints();
		foreach ( $breakpoints as $name => $point ){
			$min_width = $max_width = 0;
			$width = $point->get_width();
			$closest = $this->get_closeset_breakpoints($width, $breakpoints);
			
			if ( $closest['prev'] ){
				$min_width = $width;
			}
			if ( $closest['next'] ){
				$max_width = $closest['next'] - 1;
			}
			
			$breakpoints_array[$point->get_id()] = array(
				'min_width' => $min_width,
				'max_width' => $max_width
			);
		}
		
		$js_return .= "jQuery(function($){\n";
		$js_return .= "window.get_breakpoint_ie8 = function(width) {\n";
		foreach($breakpoints_array as $id => $breakpoint) {
			if($breakpoint['max_width'] > 0) {
				$js_return .= "if(width >= ".$breakpoint['min_width']." && width <= ".$breakpoint['max_width'].") {\n";
			} else {
				$js_return .= "if(width >= ".$breakpoint['min_width'].") {\n";
			}
			$js_return .= "return '".$id."';\n";
			$js_return .= "}\n";
		}
		$js_return .= "}\n";
		$js_return .= "});\n";
		
		return $js_return;
	}

	/**
	 * Serve layout element scripts according to the requested key.
	 */
	function serve_scripts () {
		$key = $this->_cache->key(self::TYPE_SCRIPT);
		$key->set_hash(stripslashes($_REQUEST['key']));

		$cache = $this->_cache->get($key);
		
		$breakpoints = $this->serve_breakpoints_array();
		

		if(!empty($breakpoints)) {
			$cache = $breakpoints . $cache;
		}

		$response = empty($cache)
			? new Upfront_JavascriptResponse_Error('')
			: new Upfront_JavascriptResponse_Success($cache)
		;

		$this->_out($response, true);
	}

	/**
	 * Obtain the enqueueing cache breaking version.
	 *
	 * @return string Child theme version info
	 */
	private function _get_enqueue_version () {
		return Upfront_ChildTheme::get_version();
	}

	/**
	 * Determine the endpoint URL format to use for dependencies.
	 *
	 * @param string $type Dependency (and endpoint) type
	 * @param string $key Raw cache key used for temporary storage
	 *
	 * @return string Final dependency URL
	 */
	private function _get_enqueueing_url ($type, $key) {
		$url = false;
		$endpoint = self::TYPE_SCRIPT === $type
			? 'scripts'
			: 'styles'
		;
		if (Upfront_Behavior::debug()->is_active(Upfront_Debug::DEPENDENCIES)) {
			$url = admin_url("admin-ajax.php?action=upfront-element-{$endpoint}&key={$key}");
		} else {
			$url = Upfront_VirtualPage::get_url(join('/', array(
				'upfront-dependencies',
				$endpoint,
				$key
			)));
		}
		return $url;
	}

}


/**
 * Minification listener.
 * Takes care of dependency minification.
 */
class Upfront_MinificationServer implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (version_compare(PHP_VERSION, '5.3.1') < 0) return false; // We require PHPv5.3 for this

		/*
		// Currently not in use, because the performance overhead trumps the gains in request size
		add_filter('upfront-dependencies-cache-styles', array($this, 'minify_css'));
		add_filter('upfront-dependencies-main-styles', array($this, 'minify_css'));
		add_filter('upfront-dependencies-grid-styles', array($this, 'minify_css'));
		*/
		add_filter('upfront-dependencies-cache-scripts', array($this, 'minify_js'));
	}

	/**
	 * Processes styles just before they get output or hit cache.
	 * Currently not in use, as what we do to styles by default is way faster, and
	 * with just a little bit more weight in processed styles.
	 *
	 * @param string $what Stylesheet to process
	 *
	 * @return string Minified CSS
	 */
	public function minify_css ($what) {
		return $what;
	}

	/**
	 * Processes scripts just before they hit cache.
	 * @uses JShrink_Minifier::minify Adapted JShrink mnifier (https://github.com/tedious/JShrink)
	 *
	 * @param string $what Scripts to process
	 *
	 * @return string Minified javascript
	 */
	public function minify_js ($what) {
		if (!Upfront_Behavior::compression()->has_experiments()) return $what; // Only do this within the compression mode ON

		require_once dirname(dirname(__FILE__)) . '/external/jshrink/src/JShrink/Minifier.php';
		return JShrink_Minifier::minify($what);
	}
}
Upfront_MinificationServer::serve();


/**
 * Smush listener.
 * Passes off custom image sizing requests to the Smush plugin, if present
 */
class Upfront_SmushServer implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks() {
		if ( ! class_exists( 'WpSmush' ) ) {
			return false;
		} // Do we have Smush plugin?
		global $WpSmush;
		if ( ! defined( 'WpSmush::API_SERVER' ) && ( is_object( $WpSmush ) && ! $WpSmush->api_server ) ) {
			return false;
		} // Is it ours?

		add_action('upfront-media-images-image_changed', array($this, 'pass_over_to_smush'), 10, 5);
	}

	public function pass_over_to_smush ($path, $url, $saved, $meta, $imageData ) {
		if ( empty( $path ) || empty( $url ) || ! is_readable( $path ) ) {
			return false;
		}

		global $WpSmush;
		if ( ! is_callable( array( $WpSmush, 'do_smushit' ) ) ) {
			return false;
		}

		//Smush Image and Get the response
		$res = $WpSmush->do_smushit( $path, $url );

		//If the smushing was succesful, store a flag in meta
		if ( ! is_wp_error( $res ) && ! empty( $res['data'] ) ) {

			//Get the post id and element id
			$id         = ! empty( $imageData['id'] ) ? $imageData['id'] : '';
			$element_id = ! empty( $imageData['element_id'] ) ? $imageData['element_id'] : '';

			//If we have all the params and meta is set for element
			if ( ! empty( $id ) && ! empty( $element_id ) && isset( $meta[ $element_id ] ) ) {
				$meta[ $element_id ]['is_smushed'] = 1;
				update_post_meta( $id, 'upfront_used_image_sizes', $meta );
			}
		}

		return $res;
	}
}
Upfront_SmushServer::serve();
