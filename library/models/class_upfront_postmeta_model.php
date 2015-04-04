<?php

class Upfront_PostmetaModel {
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

	/**
	 * Get all common meta fields for a list of posts
	 * @param  array $posts A list of WP_Post instances
	 * @return array A list of common meta keys
	 */
	public static function get_meta_fields ($posts) {
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
}