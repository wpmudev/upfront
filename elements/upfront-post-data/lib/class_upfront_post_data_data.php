<?php

class Upfront_Post_Data_Data {
	
	/**
	 * List of available data_type
	 */
	protected static $data_types = array(
		'post_data',
		'author',
		'taxonomy',
		'featured_image',
		'comments'
	);

	/**
	 * Fetch all default values for properties.
	 * @return array Default element properties
	 */
	public static function get_defaults ($data_type = '') {
		$defaults = array(
			'type' => 'PostDataModel',
			'view_class' => 'PostDataView',
			'has_settings' => 1,
			'class' => 'c24 upost-data-object',
			'id_slug' => 'post-data',

			'data_type' => ''
		);
		
		if ( $data_type ){
			$type_parts = Upfront_Post_Data_PartView::get_default_parts(array('data_type' => $data_type));
			$defaults['data_type'] = $data_type;
			$defaults['type_parts'] = $type_parts;
			$defaults['class'] .= ' upost-data-object-' . $data_type;
			
			switch ( $data_type ){
				case 'post_data':
					$defaults['date_posted_format'] = get_option('date_format') . ' ' . get_option('time_format');
					break;
				case 'author':
					break;
				case 'taxonomy':
					$defaults['categories_limit'] = 3;
					$defaults['tags_limit'] = 3;
					break;
				case 'featured_image':
					$defaults['resize_featured'] = '1';
					$defaults['gravatar_size'] = 200;
					break;
				case 'comments':
					$defaults['comment_count_hide'] = 0;
					break;
			}

			foreach ($type_parts as $part) {
				$key = self::_slug_to_part_key($part);
				$defaults[$key] = self::get_template($part);
			}
		}

		return $defaults;
	}

	/**
	 * Fetch all default values for post part properties.
	 * @return array Default post part properties
	 */
	public static function get_part_defaults () {
		static $part_defaults;
		if (!empty($part_defaults)) return $part_defaults;

		$part_defaults = array(
			'type' => 'PostDataPartModel',
			'view_class' => 'PostDataPartView',
			'has_settings' => 0,
			'class' => 'c24 upost-data-part-object',
			'id_slug' => 'post-data-part',

			'part_type' => ''
		);

		return $part_defaults;
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

		return upfront_get_template("post-data-{$slug}", $data, dirname(dirname(__FILE__)) . '/tpl/parts/post-data-' . $slug . '.php');
	}

	public static function add_js_defaults ($data) {
		if (!empty($data['upfront_post_data'])) return $data;

		$data['upfront_post_data'] = self::get_defaults();
		foreach ( self::$data_types as $data_type ){
			$data['upfront_post_data_' . $data_type] = self::get_defaults($data_type);
		}
		$data['upfront_post_data_part'] = self::get_part_defaults();

		return $data;
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['post_data_element'])) return $strings;
		$strings['post_data_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'loading' => __('Loading', 'upfront'),
			'error' => __('Oops, something went wrong', 'upfront'),
			'post_parts' => __('Post Parts', 'upfront'),
			'post_parts_picker' => __('Pick Post Parts to Display', 'upfront'),
			'post_parts_sorter' => __('Drag to re-order Post Parts', 'upfront'),
            'resize_featured' => __('Re-size featured image to fit container', 'upfront'),

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
			'part_comment_form' => __('Comment form', 'upfront'),
			'part_comments' => __('Comments', 'upfront'),
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
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}
