<?php

class Upfront_Posts_Model {

	const DEFAULT_LIST_TYPE = 'taxonomy';

	public static function get_posts ($data) {
		$list_type = !empty($data['list_type']) ? $data['list_type'] : self::DEFAULT_LIST_TYPE;
		$class_name = get_class() . '_' . ucfirst($list_type);
		if (!class_exists($class_name)) $class_name = get_class() . '_' . ucfirst(self::DEFAULT_LIST_TYPE);
		
		return $class_name::get_posts($data);
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
	public static function get_posts ($data) {
		$query = array();
		if (empty($data['query'])) {
			global $wp_query;
			$query = json_decode(json_encode($wp_query), true);
		} else $query = $data['query'];

		$args = array();
		$args['posts_per_page'] = self::get_limit($data);
		
		if (empty($data['pagination'])) {
			$offset = self::get_offset($data);
			if (!empty($offset)) $args['offset'] = $offset;
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

		$query = new WP_Query($args);
		return $query->posts;
	}
}


class Upfront_Posts_Model_Custom extends Upfront_Posts_Model {
	public static function get_posts ($data) {
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
		$query = new WP_Query($args);
		return $query->posts;
	}
}


class Upfront_Posts_Model_Taxonomy extends Upfront_Posts_Model {
	public static function get_posts ($data) {
		$args = array();
		
		$args['posts_per_page'] = self::get_limit($data);
		$offset = self::get_offset($data);
		if (!empty($offset)) $args['offset'] = $offset;
		
		$args['tax_query'] = array();
		if (!empty($data['taxonomy'])) $args['tax_query']['taxonomy'] = $data['taxonomy'];
		if (!empty($data['term'])) $args['tax_query']['term'] = $data['term'];
		$args['post_status'] = 'publish'; // double-ensure for AJAX requests

		$query = new WP_Query($args);
		return $query->posts;
	}
}