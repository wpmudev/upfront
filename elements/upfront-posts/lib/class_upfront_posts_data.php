<?php

class Upfront_Posts_PostsData {
	
	public static function get_defaults () {
		return array(
			'type' => 'PostsModel',
			'view_class' => 'PostsView',
			'has_settings' => 1,
			'class' => 'c24 uposts-object',
			'id_slug' => 'posts',

			'display_type' => '', // single, list or '' (initial)
			'list_type' => 'generic', // custom, taxonomy or generic

			// list_type===taxonomy settings
			'offset' => 1, // NR freshest
			'taxonomy' => '', // taxonomy
			'term' => '', // term
			'content' => 'excerpt', // excerpt or content
			'limit' => 5, // Only applicable if 'display_type' <> 'single'
			'pagination' => 'numeric', // '' (none), 'numeric', 'arrows' - only applicable if 'display_type' <> 'single'

			// list_type===custom settings
			'posts_list' => '', // JSON map of id/permalink pairs

			// Post parts
			'post_parts' => Upfront_Posts_PostView::get_default_parts(),
			'enabled_post_parts' => Upfront_Posts_PostView::get_default_parts(),
			
			// These are the default ones
			'default_parts' => Upfront_Posts_PostView::get_default_parts(),
		);
	}

	public static function add_js_defaults ($data) {
		if (!empty($data['upfront_posts'])) return $data;

		$data['upfront_posts'] = self::get_defaults();
		$data['upfront_posts']['post_parts'] = $data['upfront_posts']['default_parts']; // Load all up

		return $data;
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['posts_element'])) return $strings;
		$strings['posts_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Posts', 'upfront'),
			'loading' => __('Loading', 'upfront'),
			'refreshing' => __('Refreshing ...', 'upfront'),
			'here_we_are' => __('Here we are!', 'upfront'),
			'refreshing_post' => __('Refreshing post ...', 'upfront'),
			'query' => __('Query', 'upfront'),
			'query_settings' => __('Query settings', 'upfront'),
			'date_posted' => __('Date posted', 'upfront'),
			'date_modified' => __('Date modified', 'upfront'),
			'comment_count' => __('Comment count', 'upfront'),
			'author' => __('Author', 'upfront'),
			'title' => __('Title', 'upfront'),
			'slug' => __('Slug', 'upfront'),
			'random' => __('Random', 'upfront'),
			'descending' => __('Descending', 'upfront'),
			'ascending' => __('Ascending', 'upfront'),
			'type' => __('Type:', 'upfront'),
			'select_tax' => __('Please, select a taxonomy', 'upfront'),
			'order' => __('Order:', 'upfront'),
			'direction' => __('Direction:', 'upfront'),
			'result_length' => __('Result Length', 'upfront'),
			'yes' => __('Yes', 'upfront'),
			'no' => __('No', 'upfront'),
			'show_featured' => __('Show featured image?', 'upfront'),
			'posts_settings' => __('Posts settings', 'upfront'),


			'taxonomy' => __('Freshest from', 'upfront'),
			'term' => __('by Term', 'upfront'),
			'error' => __('Oops, something went wrong', 'upfront'),
			'single_post' => __('Single post', 'upfront'),
			'post_list' => __('Post list', 'upfront'),
			'continue' => __('Continue', 'upfront'),
			'general' => __('General', 'upfront'),
			'query_settings' => __('Query Settings', 'upfront'),
			'post_parts' => __('Post Parts', 'upfront'),
			'display_type_label' => __('What to display:', 'upfront'),
			'list_type_label' => __('How to display post(s):', 'upfront'),
			'post_list_custom' => __('Custom Posts(s)', 'upfront'),
			'post_list_tax' => __('Post(s) by Taxonomy', 'upfront'),
			'post_list_generic' => __('Generic', 'upfront'),
			'offset' => __('Nr.', 'upfront'),
			'result_length' => __('Result Length', 'upfront'),
			'excerpt' => __('Excerpt', 'upfront'),
			'full_post' => __('Full Post', 'upfront'),
			'limit' => __('Limit to', 'upfront'),
			'pagination' => __('Pagination:', 'upfront'),
			'none' => __('None', 'upfront'),
			'prev_next' => __('Prev. / Next Page', 'upfront'),
			'numeric' => __('Numeric', 'upfront'),
			'post_parts_picker' => __('Pick Post Parts to Display', 'upfront'),
			'post_parts_sorter' => __('Drag to re-order Post Parts', 'upfront'),
			'select_custom_post' => __('Select custom post', 'upfront'),
			'add_custom_post' => __('Add a custom post', 'upfront'),
			
			'part_date_posted' => __('Date posted', 'upfront'),
			'part_author' => __('Author', 'upfront'),
			'part_gravatar' => __('Gravatar', 'upfront'),
			'part_comment_count' => __('Comment count', 'upfront'),
			'part_featured_image' => __('Featured Image', 'upfront'),
			'part_title' => __('Title', 'upfront'),
			'part_content' => __('Content', 'upfront'),
			'part_read_more' => __('Read More', 'upfront'),
			'part_tags' => __('Tags', 'upfront'),
			'part_categories' => __('Categories', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}