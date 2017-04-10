<?php

/**
 * Dependency caching middleware
 *
 * Handles dependencies FS caching and resources loading
 */
class Upfront_DependencyCache_Server implements IUpfront_Server {

	const CACHE_DIR = 'upfront-cache';
	const RESOURCE_DIR = 'resources';

	const HOOK_LAST = 999;

	private static $_instance;

	private $_logger;

	/**
	 * Server booted flag
	 *
	 * @var bool
	 */
	private $_is_running = false;

	/**
	 * Public server boot method
	 *
	 * @return bool
	 */
	public static function serve () {
		$me = self::get_instance();
		if (!$me->is_running()) $me->_add_hooks();

		return $me->is_running();
	}

	/**
	 * Instance getter
	 *
	 * @return object Upfront_DependencyCache_Server instance
	 */
	public static function get_instance () {
		if (empty(self::$_instance)) {
			self::$_instance = new self;
		}
		return self::$_instance;
	}

	private function __construct () {
		$this->_logger = Upfront_Log::get(Upfront_Log::FS);
	}

	private function __clone () {
	}

	/**
	 * Checks if server is already booted
	 *
	 * @return bool
	 */
	public function is_running () {
		return !!$this->_is_running;
	}

	/**
	 * Gets the cache validity timespan
	 *
	 * @return int Time during which cache is valid, in seconds
	 */
	public function get_cache_ttl () {
		return HOUR_IN_SECONDS;
	}

	/**
	 * Handles dependencies loading output
	 *
	 * @param bool $hndl Whether the output/enqueue is already handled by now
	 * @param object $deps Dependencies list to enqueue
	 *
	 * @return bool
	 */
	public function handle_cached_output ($hndl, $deps) {
		return false;
	}

	/**
	 * Handles header dependencies loading output
	 *
	 * @param bool $hndl Whether the output/enqueue is already handled by now
	 * @param object $deps Dependencies list to enqueue
	 *
	 * @return bool
	 */
	public function handle_cached_header_output ($hndl, $deps) {
		$resources = $deps->get_header_styles();
		if (!empty($resources)) {
			$cache_url = $this->get_cache_url($resources);
			if (!empty($cache_url)) echo '<link type="text/css" rel="stylesheet" href="' . esc_url($cache_url) . '" />';
			else return false;
		}

		$resources = $deps->get_header_scripts();
		if (!empty($resources)) {
			$cache_url = $this->get_cache_url($resources);
			if (!empty($cache_url)) echo '<script type="text/javascript" src="' . esc_url($cache_url) . '"></script>';
			else return false;
		}

		return true;
	}

	/**
	 * Handles element dependencies URL rewriting
	 *
	 * @param string $url Original eependency source URL
	 * @param string $type Dependency type
	 * @param string $key Dependency raw key
	 *
	 * @return string URL
	 */
	public function handle_cached_eldeps_output ($url, $type, $key) {
		$resource = $this->get_eldeps_resource_url($type, $key);
		$cache_url = $this->get_cache_url(array($resource));

		return !empty($cache_url)
			? $cache_url
			: $url
		;
	}

	/**
	 * Handles main styles partial resource output
	 *
	 * Passthrough filter action, just outputs content if needed
	 *
	 * @param string $styles Styles passed onto hook handler
	 * @param bool $base_only Whether we're loading shortened version or not
	 *
	 * @return string Verbatim styles
	 */
	public function handle_dynamic_styles_cache ($styles, $base_only=false) {
		$qs = !empty($_SERVER['QUERY_STRING'])
			? $_SERVER['QUERY_STRING']
			: false
		;
		if (empty($qs)) return $styles;

		if (!empty($base_only) && empty($_GET['base_only'])) {
			$qs .= '&base_only=1';
		}

		$resource = admin_url("admin-ajax.php?{$qs}");
		if ($this->has_cached_resource($resource)) return $styles;

		$this->_logger->info('Rewriting the main styles cache file');
		$status = $this->set_cached_resource($resource, $styles);

		if (!$status) $this->_logger->error("Something went wrong caching main styles");

		return $styles;
	}

	/**
	 * Element dependency URL getting helper
	 *
	 * This method normalizes the element dependency URL to a dynamic
	 * URL type, as perceived by FS caching (i.e. AJAX URL).
	 * This will only be used for resources caching anyway, so it doesn't really
	 * need to be functional (it will be, though).
	 *
	 * @param string $type Element dependency type
	 * @param string $key Element dependency raw cache key
	 *
	 * @return string URL
	 */
	public function get_eldeps_resource_url ($type, $key) {
		$endpoint = Upfront_ElementStyles::get_endpoint_by_type($type);
		$resource = admin_url("admin-ajax.php?action=upfront-element-{$endpoint}&key={$key}");
		return $resource;
	}

	/**
	 * Actual universal element dependency FS cache generator
	 *
	 * This is where element dependency cache actually gets written.
	 *
	 * @param string $content Dependency content to be cached
	 * @param string $key Element dependency raw cache key
	 * @param string $type Element dependency type
	 *
	 * @return string Unprocessed content
	 */
	public function handle_dynamic_eldeps_cache ($content, $key, $type) {
		$resource = $this->get_eldeps_resource_url($type, $key);
		if ($this->has_cached_resource($resource)) return $content;

		$this->_logger->info('Rewriting cached element dependencies');
		$status = $this->set_cached_resource($resource, $content);

		if (!$status) $this->_logger->error("Something went wrong caching dependencies");

		return $content;
	}

	/**
	 * Element dependencies script wrapper
	 *
	 * Delegates to universal method for actual cache writing
	 *
	 * @param string $content Dependency content to be cached
	 * @param string $key Element dependency raw cache key
	 *
	 * @return string Unprocessed content
	 */
	public function handle_dynamic_eldeps_cache_scripts ($content, $key) {
		return $this->handle_dynamic_eldeps_cache($content, $key, Upfront_ElementStyles::TYPE_SCRIPT);
	}

	/**
	 * Element dependencies style wrapper
	 *
	 * Delegates to universal method for actual cache writing
	 *
	 * @param string $content Dependency content to be cached
	 * @param string $key Element dependency raw cache key
	 *
	 * @return string Unprocessed content
	 */
	public function handle_dynamic_eldeps_cache_styles ($content, $key) {
		return $this->handle_dynamic_eldeps_cache($content, $key, Upfront_ElementStyles::TYPE_STYLE);
	}

	/**
	 * Returns unique caching key for source
	 *
	 * @param string $src Source
	 *
	 * @return string Key
	 */
	public function get_key ($src) {
		return 'ufd-' . $this->get_hash($src);
	}

	/**
	 * Returns hashed string
	 *
	 * @param mixed $str Entity to hash
	 *
	 * @return string Hassh
	 */
	public function get_hash ($str) {
		$str = is_string($str) ? $str : serialize($str);
		return md5($str);
	}

	/**
	 * Gets unique combined key for a list
	 *
	 * @param array $list A list of resource URLs to combine into a key
	 *
	 * @return string Combined key
	 */
	public function get_combined_resources_key ($list) {
		return $this->get_key(serialize($list));
	}

	/**
	 * Gets full path to a cache file
	 *
	 * @param string $combined_key Combined cache key for resources group
	 *
	 * @return string|bool Path, or (bool)false on failure
	 */
	public function get_cache_file_path ($combined_key) {
		if (empty($combined_key) || !preg_match('/[[:alnum:]]/', $combined_key)) return false;
		$cache_dir = $this->get_cache_dir();
		return wp_normalize_path("{$cache_dir}/{$combined_key}");
	}

	/**
	 * Checks if we have a cache file
	 *
	 * @param string $combined_key Combined cache key for resources group
	 *
	 * @return bool
	 */
	public function has_cache_file ($combined_key) {
		$path = $this->get_cache_file_path($combined_key);
		if (!file_exists($path)) return false;

		$status = true;
		$ctime = filectime($path);
		if (false !== $ctime && time() > $ctime + $this->get_cache_ttl()) {
			$this->drop_cache_file($combined_key);
			$status = false;
		}
		return $status;
	}

	/**
	 * Returns cache file content
	 *
	 * @param string $combined_key Combined cache key for resources group
	 *
	 * @return string|bool Cache file content, or (bool)false on failure
	 */
	public function get_cache_file ($combined_key) {
		if (!$this->has_cache_file($combined_key)) return false;

		$path = $this->get_cache_file_path($combined_key);
		return file_get_contents($path);
	}

	/**
	 * Sets cache file content
	 *
	 * @param string $combined_key Combined cache key for resources group
	 * @param string $content Content to cache
	 *
	 * @return bool Status
	 */
	public function set_cache_file ($combined_key, $content) {
		$path = $this->get_cache_file_path($combined_key);
		return !!file_put_contents($path, $content);
	}

	/**
	 * Drops (removes) a cache file
	 *
	 * @param string $combined_key Combined cache key for resources group
	 *
	 * @return bool Status
	 */
	public function drop_cache_file ($combined_key) {
		$path = $this->get_cache_file_path($combined_key);

		if (!file_exists($path) || !is_writable($path)) return false;

		$this->_logger->info("Removing cache group for {$combined_key}");
		return unlink($path);
	}

	/**
	 * Returns cache file path for a resources group
	 *
	 * If cache file doesn't already exist, creates and populates it
	 * as a side-effect.
	 *
	 * @param array $resources List of source URLs
	 *
	 * @return string|bool Cache file path, or (bool)false on failure
	 */
	public function get_cache_path ($resources) {
		$combined = $this->get_combined_resources_key($resources);

		if ($this->has_cache_file($combined)) return $this->get_cache_file_path($combined);

		$this->_logger->info("Building cache file for resouces group {$combined}");

		$output = $this->get_resources_output($resources);
		if (empty($output)) return false;

		$out = '';
		foreach ($output as $key => $content) {
			$out .= "/* {$key} */\n{$content}\n";
		}

		return $this->set_cache_file($combined, $out)
			? $this->get_cache_file_path($combined)
			: false
		;
	}

	/**
	 * Returns cache file URL for a resources group
	 *
	 * @param array $resources List of resource URLs
	 *
	 * @return string|bool Cache URL, or (bool)false on failure
	 */
	public function get_cache_url ($resources) {
		$path = $this->get_cache_path($resources);
		if (false === $path) return false;

		$uploads = wp_upload_dir();
		return preg_replace('/^' . preg_quote($uploads['basedir'], '/') . '/', $uploads['baseurl'], $path);
	}

	/**
	 * Drops cache file for a resources group
	 *
	 * @param array $resources List of source URLs
	 *
	 * @return bool
	 */
	public function drop_cache ($resources) {
		$combined = $this->get_combined_resources_key($resources);
		return $this->drop_cache_file($combined);
	}


	/**
	 * General resource output gathering method
	 *
	 * Gets the content of each listed resource individually
	 *
	 * @param array $list A list of resource URLs to gather
	 *
	 * @return array A map of key:content resource pairs
	 */
	public function get_resources_output ($list) {
		$result = array();
		if (!is_array($list)) return $result;

		foreach ($list as $item) {
			$content = $this->get_content($item);
			if (false === $content) return false; // We errored out on content getting, no cache
			// ^ This is significant, because we need to get to the uncached dynamic
			// URL processing in order to be able to write their fresh final content
			// as resources cache. Hence we forego caching for this request
			$result[$this->get_key($item)] = $this->get_content($item);
		}

		return $result;
	}

	/**
	 * Gets source content, if at all possible
	 *
	 * @param string $src Source identifier
	 *
	 * @return string|bool Source contents, or (bool)false on failure
	 */
	public function get_content ($src) {
		// First, let's check if we already have this thing cached.
		// This is because it could easily be a dynamic resource (AJAX request).
		// If so, we cached it elsewhere.
		if ($this->has_cached_resource($src)) return $this->get_cached_resource($src);

		if ($this->is_dynamic_resource_url($src)) {
			$this->_logger->info("Rejecting dynamic, non-cached resource URL: {$src}");
			return false;
		}

		$path = $this->url_to_path($src);
		if (empty($path) || !is_readable($path)) {
			$this->_logger->warn("Unable to resolve dependency path: {$src}");
			return false;
		}

		return file_get_contents($path);
	}

	/**
	 * Converts resource URL to path
	 *
	 * Only considers Upfront-based resources
	 *
	 * @param string $src Source URL
	 *
	 * @return string|bool Normalized resolved path, or (bool)false on failure
	 */
	public function url_to_path ($src) {
		$home = $this->strip_protocol(Upfront::get_root_url());
		$src = $this->strip_protocol(esc_url($src));

		// Let's not allow relative paths or dynamic resources here
		if (preg_match('/\.\./', $src)) return false;
		if ($this->is_dynamic_resource_url($src)) return false;

		$relpath = preg_replace('/^' . preg_quote($home, '/') . '/', '', $src);
		if ($src === $relpath) return false;

		return wp_normalize_path(Upfront::get_root_dir() . '/' . $relpath);
	}

	/**
	 * Check if a given URL is a dynamic resource
	 *
	 * Dynamic resource being an AJAX URL.
	 *
	 * @param string $src Source URL to check
	 *
	 * @return bool
	 */
	public function is_dynamic_resource_url ($src) {
		$ajax_url = $this->strip_protocol(admin_url('admin-ajax.php'));
		return !!preg_match('/^' . preg_quote($ajax_url, '/') . '/', $this->strip_protocol($src));
	}

	/**
	 * Strips protocol from the URL
	 *
	 * @param string $url URL to process
	 *
	 * @return string processed URL
	 */
	public function strip_protocol ($url) {
		if (!is_string($url)) return '';
		return preg_replace('/^https?:/', '', $url);
	}

	/**
	 * Returns cache root directory
	 *
	 * @return string Path
	 */
	public function get_cache_dir () {
		$uploads = wp_upload_dir();
		$path = wp_normalize_path($uploads['basedir'] . '/' . self::CACHE_DIR);

		if (!file_exists($path)) wp_mkdir_p($path);

		return $path;
	}

	/**
	 * Returns resources subdir
	 *
	 * @return string Path
	 */
	public function get_resource_dir () {
		$cache_dir = $this->get_cache_dir();
		$path = wp_normalize_path($cache_dir . '/' . self::RESOURCE_DIR);

		if (!file_exists($path)) wp_mkdir_p($path);

		return $path;
	}

	/**
	 * Converts source URL to resource path
	 *
	 * @param string $src Source URL
	 *
	 * @return string path
	 */
	public function get_resource_path ($src) {
		$resource_dir = $this->get_resource_dir();
		$fname = $this->get_key($src);

		return wp_normalize_path("{$resource_dir}/{$fname}");
	}

	/**
	 * Checks if a resource is already cached
	 *
	 * @param string $src Source URL
	 *
	 * @return bool Status
	 */
	public function has_cached_resource ($src) {
		$path = $this->get_resource_path($src);
		if (!file_exists($path)) return false;

		$status = true;
		$ctime = filectime($path);
		if (false !== $ctime && time() > $ctime + $this->get_cache_ttl()) {
			$this->drop_cached_resource($src);
			$status = false;
		}
		return $status;
	}

	/**
	 * Gets cached resource contents
	 *
	 * @param string $src Source URL
	 *
	 * @return string|bool Content on success, (bool)false on failure
	 */
	public function get_cached_resource ($src) {
		if (!$this->has_cached_resource($src)) return false;

		$path = $this->get_resource_path($src);
		return file_get_contents($path);
	}

	/**
	 * Actually writes resource URL cache content
	 *
	 * @param string $src Source URL
	 * @param string $content Source URL content
	 *
	 * @return bool
	 */
	public function set_cached_resource ($src, $content) {
		$path = $this->get_resource_path($src);
		return !!file_put_contents($path, $content);
	}

	/**
	 * Removes cached resource
	 *
	 * @param string $src Source URL
	 *
	 * @return bool
	 */
	public function drop_cached_resource ($src) {
		$path = $this->get_resource_path($src);

		if (!file_exists($path) || !is_writable($path)) return false;

		$this->_logger->info("Removing cached resource for {$src}");
		return unlink($path);
	}

	/**
	 * Resource caching wrapper
	 *
	 * @param string $src Source URL
	 *
	 * @return bool
	 */
	public function cache_resource ($src) {
		$content = $this->get_content($src);
		if (false === $content) return false;

		return $this->set_cached_resource($src, $content);
	}

	/**
	 * Bootstraps the cache server
	 */
	private function _add_hooks () {
		// Main dependencies enqueueing replacement (styles, fonts, scripts)
		add_filter('upfront-output-experimental-done', array($this, 'handle_cached_output'), 10, 2);
		// Header dependencies replacement (styles, scripts)
		add_filter('upfront-output-experimental-header-done', array($this, 'handle_cached_header_output'), 10, 2);
		// Element dependencies (styles, scripts)
		add_filter('upfront-dependencies-enqueueing_url', array($this, 'handle_cached_eldeps_output'), 10, 3);

		add_filter('upfront-dependencies-main-styles', array($this, 'handle_dynamic_styles_cache'), self::HOOK_LAST, 2);
		add_filter('upfront-dependencies-grid-styles', array($this, 'handle_dynamic_styles_cache'), self::HOOK_LAST);

		add_filter('upfront-dependencies-cache-styles', array($this, 'handle_dynamic_eldeps_cache_styles'), self::HOOK_LAST, 2);
		add_filter('upfront-dependencies-cache-scripts', array($this, 'handle_dynamic_eldeps_cache_scripts'), self::HOOK_LAST, 2);

		$this->_is_running = true;
	}
}
Upfront_DependencyCache_Server::serve();
