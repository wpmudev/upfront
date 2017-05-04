<?php

// Get cache utilities class.
require_once dirname(dirname(__FILE__)) . "/class_upfront_cache_utils.php";

class Upfront_LayoutRevisions {

	const REVISION_TYPE = 'upfront_layout_rvsn';
	const REVISION_STATUS = 'rvsn';

	public function __construct () {}

	public static function to_string ($array) {
		if (!is_array($array)) return '';
		return join('::', $array);
	}

	public static function to_hash ($what) {
		return md5(serialize($what));
	}

	/**
	 * Saves the layout and returns the layout ID key.
	 * Layout ID key is *not* the same as layout ID,
	 * it's a hash used to resolve this particular layout.
	 * @param Upfront_Layout $layout layout to store
	 * @return mixed (bool)false on failure, (string)layout ID key on success
	 */
	public function save_revision ($layout) {
		$cascade = $layout->get_cascade();
		$store = $layout->to_php();
		$layout_id_key = self::to_hash($store);

		$existing_revision = $this->get_revision($layout_id_key);
		if (!empty($existing_revision)) return $layout_id_key;

		$post_id = wp_insert_post(array(
			"post_content" => base64_encode(serialize($store)),
			"post_title" => self::to_string($cascade),
			"post_name" => $layout_id_key,
			"post_type" => self::REVISION_TYPE,
			"post_status" => self::REVISION_STATUS,
			"post_author" => get_current_user_id(),
		));
		return !empty($post_id) && !is_wp_error($post_id)
			? $layout_id_key
			: false
		;
	}

	/**
	 * Fetches a single revision, as determined by supplied layout ID key.
	 * @param string $layout_id_key Requested revision key
	 * @return mixed (Upfront_Layout)revision on success, (bool)false on failure
	 */
	public function get_revision ($layout_id_key) {
		$query = Upfront_Cache_Utils::wp_query(
			$layout_id_key, 
			array(
				"name" => $layout_id_key,
				"post_type" => self::REVISION_TYPE,
				"posts_per_page" => 1,
				'suppress_filters' => true,
			),
			'upfront_revisions'
		);
		return !empty($query->posts[0]) && !empty($query->posts[0]->post_content)
			? unserialize(base64_decode($query->posts[0]->post_content))
			: false
		;
	}

	/**
	 * Fetches a list of revisions in store for the particular entity cascade.
	 * @param array $entity_cascade Entity cascade to be matched for
	 * @param array $args Optional additional arguments list (boundaries)
	 * @return mixed (array)List of revisions
	 */
	public function get_entity_revisions ($entity_cascade, $args=array()) {
		$args = wp_parse_args($args, array(
			'posts_per_page' => 10,
			'post_type' => self::REVISION_TYPE,
			'post_status' => self::REVISION_STATUS,
		));
		$args["title"] = self::to_string($entity_cascade);
		$query = Upfront_Cache_Utils::wp_query($entity_cascade, $args, 'upfront_revisions'); 
		return $query->posts;
	}

	/**
	 * Fetches a list of deprecated revisions.
	 * This list includes *all* revisions, it's not entity-specific.
	 * @param array $args Optional additional arguments list (boundaries)
	 * @return mixed (array)List of deprecated revisions
	 */
	public function get_all_deprecated_revisions ($args=array()) {
		$args = wp_parse_args($args, array(
			'posts_per_page' => -1,
			'post_type' => self::REVISION_TYPE,
			'post_status' => self::REVISION_STATUS,
			'date_query' => array(array(
				'before' => "-1 day",
			)),
		));
		$query = new WP_Query($args);
		return $query->posts;
	}

	/**
	 * Deletes the requested revision.
	 * Also validated we have actually deleted a revision.
	 * @param int $revision_id Revision post ID to remove
	 * @return bool
	 */
	public function drop_revision ($revision_id) {
		if (empty($revision_id) || !is_numeric($revision_id)) return false;
		$rev = get_post($revision_id);
		if (self::REVISION_TYPE !== $rev->post_type) return false;
		return (bool)wp_delete_post($revision_id, true);
	}
}
