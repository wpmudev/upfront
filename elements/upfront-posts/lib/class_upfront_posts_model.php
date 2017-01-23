<?php

/**
 * Posts model factory class.
 */
class Upfront_Posts_Model {

	const DEFAULT_LIST_TYPE = 'taxonomy';

	/**
	 * Fetch a list of post instances, according to parameters in data.
	 * Will delegate to appropriate model implementation.
	 *
	 * @param  array $data Raw data (element properties)
	 *
	 * @return array List of posts
	 */
	public static function get_posts ($data) {
		$class_name = self::_get_model_class($data);
		return call_user_func(array($class_name, 'get_posts'), $data); //$class_name::get_posts($data);
	}

	/**
	 * Fetch a list of available meta fields
	 * Will delegate to post list fetching, which is then inspected for common meta fields.
	 *
	 * @param  array $data Raw data (element properties)
	 *
	 * @return array List of meta fields
	 */
	public static function get_meta_fields ($data) {
		$posts = self::get_posts($data);
		return Upfront_PostmetaModel::get_meta_fields($posts);
	}

	/**
	 * Spawns a new WP_Query instance, according to parameters in data.
	 *
	 * @param  array $data Raw data (element properties)
	 *
	 * @return object A new WP_Query instance
	 */
	public static function spawn_query ($data) {
		$class_name = self::_get_model_class($data);
		return call_user_func(array($class_name, 'spawn_query'), $data); //$class_name::spawn_query($data);
	}

	/**
	 * Utility method for selecting the appropriate posts model implementation class from raw data.
	 *
	 * @param  array $data Raw data (element properties)
	 *
	 * @return string Final model class name.
	 */
	private static function _get_model_class ($data) {
		$list_type = !empty($data['list_type']) ? $data['list_type'] : self::DEFAULT_LIST_TYPE;
		$class_name = get_class() . '_' . ucfirst($list_type);
		if (!class_exists($class_name)) $class_name = get_class() . '_' . ucfirst(self::DEFAULT_LIST_TYPE);
		return $class_name;
	}

	/**
	 * Are we to show one post (single)? Or multiple ones (list)?
	 *
	 * @param array $data The properties data array
	 *
	 * @return bool If we're showing a single item
	 */
	public static function is_single ($data) {
		return !empty($data['display_type']) && 'single' === $data['display_type'];
	}

	/**
	 * Get the posts limit, also taking into account the display type
	 *
	 * @param array $data The properties data array
	 * @param int $default Default fallback limit value
	 *
	 * @return int Posts limit
	 */
	public static function get_limit ($data, $default=false) {
		$default = !empty($default) && is_numeric($default) 
			? (int)$default 
			: 5
		;
		$limit = !empty($data['limit']) && is_numeric($data['limit'])
			? (int)$data['limit']
			: $default
		;
		if (empty($limit)) $limit = $default;

		return self::is_single($data)
			? 1
			: $limit
		;
	}

	/**
	 * Gets the post list offset (ie. how many posts to skip off the top of the list)
	 * taking into account the pagination, as offset breaks pagination.
	 *
	 * @param array $data The properties data array
	 *
	 * @return int Number of posts to skip.
	 */
	public static function get_offset ($data) {
		$offset = !empty($data['offset']) && is_numeric($data['offset'])
			? (int)$data['offset']
			: 0
		;
		return !empty($data['pagination'])
			? 0
			: ($offset > 0 ? $offset-1 : $offset)
		;
	}

	public static function filter_force_home ($what, $query) {
		$query->is_home = true;
		return $what;
	}

	/**
	 * Applies common setup, deals with stickies and spawns a WP_Query instance.
	 *
	 * @param array $args Arguments to be passed to WP_Query constructor
	 * @param array $data Element properties
	 *
	 * @return WP_Query Query instance
	 */
	protected static function _spawn_query ($args, $data) {
		$args['post_status'] = 'publish'; // double-ensure for AJAX requests

		// Determine sticky posts behavior
		$args['ignore_sticky_posts'] = empty($data['sticky']); // Ignore by default

		$has_pages = !empty($args['paged']) && $args['paged'] > 1;

		// Exclude if requested
		if (
			!empty($data['sticky']) && 'exclude' === $data['sticky'] 
			|| 
			!empty($data['sticky']) && 'prepend' === $data['sticky'] && $has_pages // If we're prepending stickies, drop them on subsequent pages
		) {
			$args['post__not_in'] = get_option('sticky_posts');
		}

		// Prepend if requested
		if (!empty($data['sticky']) && 'prepend' === $data['sticky'] && !$has_pages) {
			// Hack: force `is_home` property so WP does what it does to sticky stuff
			add_filter('posts_clauses', array('Upfront_Posts_Model', 'filter_force_home'), 10, 2);
		}

		// Sanity-check the post type first
		if (!empty($args['post_type']) && '*' === $args['post_type']) {
			$args['post_type'] = false;
		}
		// Check if we have tax_query and no post type
		if (!empty($args['tax_query']) && empty($args['post_type'])) {
			$args['post_type'] = 'any';
		}

		$query = new WP_Query($args);

		// Drop the hack as soon as we're done
		if (!empty($data['sticky']) && 'prepend' === $data['sticky'] && !$has_pages) {
			remove_filter('posts_clauses', array('Upfront_Posts_Model', 'filter_force_home'), 10, 2);
		}

		return $query;
	}
}

/**
 * Generic list type posts model
 * This list type will inherit most of its query parameters from current query.
 * Useful for things such as generic archives, searches and such.
 */
class Upfront_Posts_Model_Generic extends Upfront_Posts_Model {

	public static function spawn_query ($data) {
		$query = array();
		if (empty($data['query'])) {
			global $wp_query;
			$query = json_decode(json_encode($wp_query), true);
		} else $query = $data['query'];

		$args = array();

		if (empty($data['pagination'])) {
			// Generic queries don't do offset setting - just fetch the paged value
			//$offset = self::get_offset($data);
			//if (!empty($offset)) $args['offset'] = $offset;
		} else {
			if (!empty($query['query_vars']['paged'])) $args['paged'] = $query['query_vars']['paged'];
			if (!empty($query['query_vars']['page'])) $args['paged'] = $query['query_vars']['page'];
		}

		// Misc queries: time, search...
		foreach (array('year', 'monthnum', 'w', 'day', 's', 'author_name') as $q) {
			if (!empty($query['query_vars'][$q])) $args[$q] = $query['query_vars'][$q];
		}

		// Tax queries
		if (!empty($query['tax_query']['queries'])) {
			$args['tax_query'] = $query['tax_query']['queries'];
		}

		// Now let's safeguard the posts per page setting
		
		if (self::is_single($data)) {
			// If single we need only one post
			$data['limit'] = $args['posts_per_page'] = 1;
		} else {
			if (!empty($query['posts_per_page']) && is_numeric($query['posts_per_page'])) {
				$per_page = (int)$query['posts_per_page'];
				$old_limit = self::get_limit($data);
				$data['limit'] = $per_page;
				$args['posts_per_page'] = self::get_limit($data, $old_limit);
			}
		}
		
		return self::_spawn_query($args, $data);
	}

	public static function get_posts ($data) {
		$query = self::spawn_query($data);
		return $query->posts;
	}
}

/**
 * Custom (hand-picked) posts list type.
 * This list type will show a hand-picked list of posts.
 */
class Upfront_Posts_Model_Custom extends Upfront_Posts_Model {
	public static function spawn_query ($data) {
		$raw_list = !empty($data['posts_list']) ? rawurldecode($data['posts_list']) : false;
		if (empty($raw_list)) return array();

		$posts_hash = json_decode($raw_list, true);
		if (empty($posts_hash)) return array();

		$posts = array();
		foreach ($posts_hash as $item) {
			if (empty($item['id']) || !is_numeric($item['id'])) continue;
			$posts[] = intval($item['id']);
		}
		if (empty($posts)) return array();

		$args = array(
			'post__in' => $posts,
			'post_type' => get_post_types(array('public' => true)),
		);

		if (self::is_single($data)) {
			$args['posts_per_page'] = 1;
		}

		return self::_spawn_query($args, $data);
	}
	public static function get_posts ($data) {
		$query = self::spawn_query($data);
		if (empty($query)) return array();
		return $query->posts;
	}
}

/**
 * Taxonomy list type (default)
 * This list type is the most complex one, it will spawn a query
 * according to the data stored in element properties.
 * In common WP, this will create a "custom loop"
 */
class Upfront_Posts_Model_Taxonomy extends Upfront_Posts_Model {
	public static function spawn_query ($data) {
		$args = array();

		if (empty($data['query'])) {
			global $wp_query;
			$query = json_decode(json_encode($wp_query), true);
		} else $query = $data['query'];
		
		// Let's deal with the pagination here
		if (empty($data['pagination'])) {
			$offset = self::get_offset($data);
			if (!empty($offset)) $args['offset'] = $offset;
		} else {
			if (!empty($query['query_vars']['paged'])) $args['paged'] = $query['query_vars']['paged'];
			if (!empty($query['query_vars']['page'])) $args['paged'] = $query['query_vars']['page'];
		}
		$args['posts_per_page'] = self::get_limit($data);

		$args['tax_query'] = array();
		$tax_query = array();
		if (!empty($data['taxonomy'])) $tax_query['taxonomy'] = $data['taxonomy'];
		if (!empty($data['term'])) $tax_query['terms'] = array($data['term']);

		if (!empty($tax_query)) $args['tax_query'][] = $tax_query;

		if (!empty($data['post_type'])) $args['post_type'] = $data['post_type'];

		if (!empty($data['post_type']) && empty($data['term'])) unset($args['tax_query']);


		return self::_spawn_query($args, $data);
	}
	public static function get_posts ($data) {
		$query = self::spawn_query($data);
		return $query->posts;
	}
}
