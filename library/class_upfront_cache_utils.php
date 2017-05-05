<?php

/**
 * Upfront cache helper class
 */
class Upfront_Cache_Utils {

	/*
 	 * The Default Expiration Time in seconds for object cache.
 	 * Note that a value of 0 means no expiration.
 	 */
	public static $expire = 180;

	/**
 	 * Checks cache for query data first.
 	 * If none, makes query and caches it.
 	 * @param string $key The key to the cached data.
 	 * @param array $args The arguments for the query.
 	 * @param int $expire The expiration in seconds (0 means none). Uses default expiration property if not specified.
 	 * @return mixed $result
 	 */
	public static function wp_query($key, $args, $group = '', $expire = null) {
		// Set to default $expire property if not specified.
		$expire = $expire ? $expire : self::$expire; 
		$cached = wp_cache_get($key, $group);
		// If cached, use that.
		if ($cached) return $cached;

		// Query DB.
		$result = new WP_Query($args);
	
		// Cache results if not empty.
		if (!empty($result)) {
			wp_cache_set($key, $result, $group, $expire);
		}
		// Return results.
		return $result;
	}

	/**
 	 * Checks cache for option data first.
 	 * If none, gets option and caches it.
 	 * @param string $key The key to the cached data.
 	 * @param mixed $default The default value to return if no option.
 	 * @return mixed $result
 	 */
	public static function get_option($key, $default = false) {
		$group = 'upfront_options';
		// Use default expiration.
		$expire = self::$expire;
		$cached = wp_cache_get($key, $group);
		// If cached, use that.
		if ($cached) return $cached;

		// Get the option.
		$result = get_option($key, $default);

		// Cache results if not empty.
		if (!empty($result)) {
			wp_cache_set($key, $result, $group, $expire);
		}
	
		// Return results.
		return $result;
	}

	/**
 	 * Deletes cache then updates the option.
 	 * @param string $key The key to the cached data.
 	 * @param mixed $value The value to save as the option.
 	 * @return boolean success of deletion.
 	 */
	public static function update_option($key, $value, $autoload = null) {
		$group = 'upfront_options';
		// Delete the cache.
		self::clear_cache($key, $group);
		// Delete the actual option.
		return update_option($key, $value, $autoload);
	}

	/**
 	 * Deletes cache then deletes the option.
 	 * @param string $key The key to the cached data.
 	 * @return boolean success of deletion.
 	 */
	public static function delete_option($key) {
		$group = 'upfront_options';
		// Delete the cache.
		self::clear_cache($key, $group);
		// Delete the actual option.
		return delete_option($key);
	}

	/**
 	 * Clear cache by key.
 	 * @param string $key The key to the cached data to delete.
 	 * @param string $group The group of the cached data to delete.
 	 * @return bool The success of deleting the cache.
 	 */
	public static function clear_cache($key, $group = '') {
		return wp_cache_delete($key, $group);
	}

}


