<?php

// ----- Post Model

abstract class  Upfront_PostModel {

	public static function create ($post_type, $title='', $content='') {
		if (!Upfront_Permissions::current(Upfront_Permissions::CREATE_POST_PAGE)) return false;
		
		$title = (!empty($title) ? $title : 'Write a title...');
		$post_data = apply_filters(
			'upfront-post_model-create-defaults',
			array(
				'post_type' => $post_type,
				'post_status' => 'auto-draft',
				'post_title' => $title,
				'post_content' => (!empty($content) ? $content : 'Your content goes here :)'),
				'post_name' => sanitize_title( $title )
			),
			$post_type
		);
		$post_id = wp_insert_post($post_data);

		$post = self::get($post_id);
		return $post;
	}

	public static function get ($post_id) {
		return get_post($post_id);
	}

	public static function save ($changes) {
		if (!Upfront_Permissions::current(Upfront_Permissions::EDIT)) return false;

		$post_id = wp_insert_post($changes);
		$post = self::get($post_id);
		return $post;
	}

}