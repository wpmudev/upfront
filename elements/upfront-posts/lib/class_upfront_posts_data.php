<?php

class Upfront_Posts_PostsData {

	/**
	 * Fetch all default values for properties.
	 * @return array Default element properties
	 */
	public static function get_defaults () {
		static $defaults;
		if (!empty($defaults)) return $defaults;

		$default_parts = Upfront_Posts_PostView::get_default_parts();
		$default_parts = apply_filters('upfront_posts-defaults-default_parts', $default_parts);

		// Enabled parts are a subset of default ones
		$enabled_parts = $default_parts;
		$meta = array_search('meta', $enabled_parts);
		if (false !== $meta) {
			unset($enabled_parts[$meta]);
		}
		$enabled_parts = apply_filters('upfront_posts-defaults-enabled_parts', $enabled_parts);

		$defaults = array(
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
			'pagination' => '', // '' (none), 'numeric', 'arrows' - only applicable if 'display_type' <> 'single'
			'sticky' => '', // '' (default - as normal posts), 'exclude', 'prepend'

			// list_type===custom settings
			'posts_list' => '', // JSON map of id/permalink pairs
			
			'thumbnail_size' => 'large', // thumbnail, medium, large, uf_post_featured_image, uf_custom_thumbnail_size
			'custom_thumbnail_width' => 200, 
			'custom_thumbnail_height' => 200, 

			// Post parts
			'post_parts' => $enabled_parts,
			'enabled_post_parts' => $enabled_parts,

			// These are the default ones
			'default_parts' => $default_parts,

			// Part options
			'date_posted_format' => get_option('date_format') . ' ' . get_option('time_format'),
			'categories_limit' => 3,
			'tags_limit' => 3,
			'comment_count_hide' => 0,
			'content_length' => 0,
			'resize_featured' => '1',
			'gravatar_size' => 200,

			// Parts markup goes here
			'preset' => 'default'
		);

		foreach ($default_parts as $part) {
			$key = self::_slug_to_part_key($part);
			$defaults[$key] = self::get_template($part);
		}

		return $defaults;
	}

	/**
	 * Slug sanitization utility method
	 * @param  string $slug Raw slug
	 * @return string Normalized slug
	 */
	private static function _get_normalized_slug ($slug) {
		$slug = preg_replace('/[^-_a-z0-9]/i', '', $slug);
		return $slug;
	}

	/**
	 * Part key creation utility method
	 * @param  string $slug Raw slug
	 * @return string Finished part name
	 */
	private static function _slug_to_part_key ($slug) {
		$slug = self::_get_normalized_slug($slug);
		return "post-part-{$slug}";
	}

	/**
	 * Template fetching method.
	 * The appropriate element template property is checked first and used if present.
	 * Otherwise, we load up stuff from theme template if present, or fall back to default.
	 * @param  string $slug Raw slug for template resolution
	 * @param  array  $data Raw data (element properties)
	 * @return string Template contents
	 */
	public static function get_template ($slug, $data=array()) {
		$slug = self::_get_normalized_slug($slug);

		$data_key = self::_slug_to_part_key($slug);
		if (!empty($data) && isset($data[$data_key])) return $data[$data_key];

		return upfront_get_template("posts-{$slug}", $data, dirname(dirname(__FILE__)) . '/tpl/parts/posts-' . $slug . '.php');
	}

	/**
	 * Fetch one of the default values.
	 * @param  string $key Property key to look for
	 * @param  mixed $fallback Fallback value if the key hasn't been found. Defaults to (bool)false
	 * @return mixed Found value or $fallback
	 */
	public static function get_default ($key, $fallback=false) {
		$defaults = self::get_defaults();
		return isset($defaults[$key])
			? $defaults[$key]
			: $fallback
		;
	}

	public static function add_js_defaults ($data) {
		if (!empty($data['upfront_posts'])) return $data;

		$data['upfront_posts'] = self::get_defaults();

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
			'select_tax' => __('Please, select a taxonomy', 'upfront'),
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
			'display_type_label_initial' => __('What should the element display?', 'upfront'),
			'list_type_label' => __('How to display post(s):', 'upfront'),
			'post_list_custom' => __('Custom Posts(s)', 'upfront'),
			'post_list_tax' => __('Post(s) by Taxonomy', 'upfront'),
			'post_list_generic' => __('Generic', 'upfront'),
			'post_type' => __('Post type', 'upfront'),
			'offset' => __('No.', 'upfront'),
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
            'resize_featured' => __('Re-size featured image to fit container', 'upfront'),
			'general_settings' => __('General Settings', 'upfront'),
			'post_part_settings' => __('Post Parts Settings', 'upfront'),
			
			'modules' => array(
				'element_wrapper' => __('Element Wrapper', 'upfront'),
				'wrappers_label' => __('Wrappers:', 'upfront'),
				'post_wrapper' => __('Post Wrapper', 'upfront'),
				'modules_label' => __('Post Parts:', 'upfront'),
				'categories_title' => __('Categories', 'upfront'),
				'author_title' => __('Author', 'upfront'),
				'comment_count_title' => __('Comment Count', 'upfront'),
				'date_title' => __('Date', 'upfront'),
				'content_title' => __('Excerpt / Content', 'upfront'),
				'featured_image_title' => __('Feat. Img', 'upfront'),
				'tags_title' => __('Tags', 'upfront'),
				'title_title' => __('Title', 'upfront'),
				'read_more_title' => __('Read More', 'upfront'),
			),
			
			'css' => array(
				'container_label' => __('Element container', 'upfront'),
				'container_info' => __('The container for all posts', 'upfront'),
				'post_label' => __('Individual post', 'upfront'),
				'post_info' => __('The container for each individual post', 'upfront'),
				'post_part_label' => __('Post part', 'upfront'),
				'post_part_info' => __('General post part selector', 'upfront'),
				'date_label' => __('Date posted', 'upfront'),
				'date_info' => __('Date posted part', 'upfront'),
				'author_label' => __('Author', 'upfront'),
				'author_info' => __('Author part', 'upfront'),
				'categories_label' => __('Categories', 'upfront'),
				'categories_info' => __('Post categories list part', 'upfront'),
				'comment_count_label' => __('Comment count', 'upfront'),
				'comment_count_info' => __('Comments count part', 'upfront'),
				'content_label' => __('Content', 'upfront'),
				'content_info' => __('Main content part', 'upfront'),
				'gravatar_label' => __('Gravatar', 'upfront'),
				'gravatar_info' => __('Author gravatar part', 'upfront'),
				'read_more_label' => __('Read more', 'upfront'),
				'read_more_info' => __('Read more button part', 'upfront'),
				'post_tags_label' => __('Tags', 'upfront'),
				'post_tags_info' => __('Post tags part', 'upfront'),
				'thumbnail_label' => __('Thumbnail', 'upfront'),
				'thumbnail_info' => __('Featured image part', 'upfront'),
				'title_label' => __('Title', 'upfront'),
				'title_info' => __('Post title part', 'upfront'),
			),

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
			'part_meta' => __('Meta', 'upfront'),

			'edit' => __('Edit', 'upfront'),
			'edit_html' => __('Edit HTML', 'upfront'),
			'format' => __('Format', 'upfront'),
			'max_categories' => __('max. categories', 'upfront'),
			'max_tags' => __('max. tags', 'upfront'),
			'hide_comments' => __('Hide if no comments', 'upfront'),
			'limit_words' => __('Limit words', 'upfront'),
			'resize_to_fit' => __('Re-size to fit container', 'upfront'),
			'size_px' => __('Size in px', 'upfront'),

			'meta_insert' => __('Insert meta field', 'upfront'),
			'meta_toggle' => __('Hide hidden fields', 'upfront'),
			'meta_fields' => __('Available meta fields', 'upfront'),
			
			'sticky_posts' => __('Sticky posts', 'upfront'),
			'sticky_ignore' => __('Ignore sticky posts', 'upfront'),
			'sticky_prepend' => __('Prepend sticky posts', 'upfront'),
			'sticky_exclude' => __('Exclude sticky posts', 'upfront'),
			'thumbnail_size' => __('Thumbnail Size', 'upfront'),
			'thumbnail_size_thumbnail' => __('Thumbnail', 'upfront'),
			'thumbnail_size_medium' => __('Medium', 'upfront'),
			'thumbnail_size_large' => __('Large', 'upfront'),
			'thumbnail_size_post_feature' => __('Post Feature Image', 'upfront'),
			'thumbnail_size_custom' => __('Custom <em>(existing not affected)</em>', 'upfront'),
			'thumbnail_size_custom_width' => __('Custom Width in px', 'upfront'),
			'thumbnail_size_custom_height' => __('Custom Height in px', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}
