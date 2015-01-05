<?php

class Upfront_Posts_Model {

	const DEFAULT_LIST_TYPE = 'taxonomy';

	public static function get_posts ($data) {
		$class_name = self::_get_model_class($data);
		return call_user_func(array($class_name, 'get_posts'), $data); //$class_name::get_posts($data);
	}


	/**
	 * Returs a hash of meta fields (in key=>value format) for a post.
	 *
	 * @param int $post_id The ID of the post to search
	 * @return array A hash of meta fields.
	*/
	public static function get_all_post_meta_fields ($post_id=false) {
		if (empty($post_id) || !is_numeric($post_id)) return array();
		global $wpdb;
		$fields = $wpdb->get_results(
			$wpdb->prepare("SELECT DISTINCT meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id=%d", $post_id),
			ARRAY_A
		);
		return $fields;
	}

	/**
	 * Returns a hash of requested key/value pairs for a post.
	 *
	 * @param int $post_id The ID of the post to search
	 * @param array $fields A list of fields to search for
	 * @return array
	*/
	public static function get_post_meta_fields ($post_id=false, $fields=array()) {
		if (empty($post_id) || !is_numeric($post_id)) return array();
		if (empty($fields) || !is_array($fields)) return array();

		$safe_fields = array();
		foreach ($fields as $field) {
			$field = trim(preg_replace('/[^-_a-z.0-9]/i', '', $field));
			if (!in_array($field, $safe_fields)) $safe_fields[] = $field;
		}
		if (empty($safe_fields)) return array();
		$in = join("','", $safe_fields);

		global $wpdb;
		$fields = $wpdb->get_results(
			$wpdb->prepare("SELECT DISTINCT meta_key, meta_value FROM {$wpdb->postmeta} WHERE post_id=%d AND meta_key IN('{$in}')", $post_id),
			ARRAY_A
		);
		return $fields;
	}

	public static function get_meta_fields ($data) {
		$posts = self::get_posts($data);
		if (empty($posts)) return array();

		$post_ids = array();
		foreach ($posts as $post) {
			if (empty($post->ID)) continue;
			$post_ids[] = $post->ID;
		}
		if (empty($post_ids)) return array();

		global $wpdb;
		$in = join("', '", $post_ids);
		$fields = $wpdb->get_col(
			"SELECT DISTINCT meta_key FROM {$wpdb->postmeta} WHERE post_id IN('{$in}')"
		);
		return $fields;
	}

	public static function spawn_query ($data) {
		$class_name = self::_get_model_class($data);
		return call_user_func(array($class_name, 'spawn_query'), $data); //$class_name::spawn_query($data);
	}

	private static function _get_model_class ($data) {
		$list_type = !empty($data['list_type']) ? $data['list_type'] : self::DEFAULT_LIST_TYPE;
		$class_name = get_class() . '_' . ucfirst($list_type);
		if (!class_exists($class_name)) $class_name = get_class() . '_' . ucfirst(self::DEFAULT_LIST_TYPE);
		return $class_name;
	}

	/**
	 * Are we to show one post (single)? Or multiple ones (list)?
	 * @param array $data The properties data array
	 * @return bool If we're showing a single item
	 */
	public static function is_single ($data) {
		return !empty($data['display_type']) && 'single' === $data['display_type'];
	}

	/**
	 * Get the posts limit, also taking into account the display type
	 * @param array $data The properties data array
	 * @return int Posts limit
	 */
	public static function get_limit ($data) {
		$limit = !empty($data['limit']) && is_numeric($data['limit'])
			? (int)$data['limit']
			: 5
		;
		return self::is_single($data)
			? 1
			: $limit
		;
	}

	/**
	 * Gets the post list offset (ie. how many posts to skip off the top of the list)
	 * taking into account the pagination, as offset breaks pagination.
	 * @param array $data The properties data array
	 * @return int Number of posts to skip.
	 */
	public static function get_offset ($data) {
		$offset = !empty($data['offset']) && is_numeric($data['offset'])
			? (int)$data['offset']
			: 0
		;
		return !empty($data['pagination'])
			? 0
			: $offset
		;
	}
}


class Upfront_Posts_Model_Generic extends Upfront_Posts_Model {

	public static function spawn_query ($data) {
		$query = array();
		if (empty($data['query'])) {
			global $wp_query;
			$query = json_decode(json_encode($wp_query), true);
		} else $query = $data['query'];

		$args = array();
		$args['posts_per_page'] = self::get_limit($data);

		if (empty($data['pagination'])) {
			// Generic queries don't do offset setting - just fetch the paged value
			//$offset = self::get_offset($data);
			//if (!empty($offset)) $args['offset'] = $offset;
		} else {
			if (!empty($query['query_vars']['paged'])) $args['paged'] = $query['query_vars']['paged'];
		}

		// Misc queries: time, search...
		foreach (array('year', 'monthnum', 'w', 'day', 's') as $q) {
			if (!empty($query['query_vars'][$q])) $args[$q] = $query['query_vars'][$q];
		}

		// Tax queries
		if (!empty($query['tax_query']['queries'])) {
			$args['tax_query'] = $query['tax_query']['queries'];
		}
		$args['post_status'] = 'publish'; // double-ensure for AJAX requests

		return new WP_Query($args);
	}

	public static function get_posts ($data) {
		$query = self::spawn_query($data);
		return $query->posts;
	}
}


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
			'ignore_sticky_posts' => true
		);
		$args['post_status'] = 'publish'; // double-ensure for AJAX requests
		if (self::is_single($data)) {
			$args['posts_per_page'] = 1;
		}
		return new WP_Query($args);
	}
	public static function get_posts ($data) {
		$query = self::spawn_query($data);
		if (empty($query)) return array();
		return $query->posts;
	}
}


class Upfront_Posts_Model_Taxonomy extends Upfront_Posts_Model {
	public static function spawn_query ($data) {
		$args = array();

		$args['posts_per_page'] = self::get_limit($data);
		$offset = self::get_offset($data);
		if (!empty($offset)) $args['offset'] = $offset;

		$args['tax_query'] = array();
		$tax_query = array();
		if (!empty($data['taxonomy'])) $tax_query['taxonomy'] = $data['taxonomy'];
		if (!empty($data['term'])) $tax_query['terms'] = array($data['term']);

		if (!empty($tax_query)) $args['tax_query'][] = $tax_query;
		$args['post_status'] = 'publish'; // double-ensure for AJAX requests

		return new WP_Query($args);
	}
	public static function get_posts ($data) {
		$query = self::spawn_query($data);
		return $query->posts;
	}
}