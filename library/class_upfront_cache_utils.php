<?php

/**
 * Upfront cache helper class
 */
class Upfront_Cache_Utils {
	/**
 	 * Checks cache for query data first.
 	 * If none, makes query and caches it.
 	 * @param string $key The key to the cached data.
 	 * @param array $args The arguments for the query.
 	 * @param int $expire The expiration in seconds (0 means none).
 	 * @return mixed $result
 	 */
	public static function wp_query($key, $args, $group = '', $expire = 180) {
		$cached = wp_cache_get($key, $group);
		// If cached, use that.
		if ($cached) return $cached;

		// Query DB.
		$result = new WP_Query($args);
	
		// Cache results.
		wp_cache_set($key, $result, $group, $expire);
		// Return results.
		return $result;
	}

	/*
 	 * Clear cache by key.
 	 * @param string $key The key to the cached data to delete.
 	 * @return bool The success of deleting the cache.
 	 */
	public static function clear_cache($key, $group = '') {
		return wp_cache_delete($key, $group);
	}

}


