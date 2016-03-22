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
		'comments',
		'meta',
	);

	/**
	 * Preset ID getter
	 *
	 * @param array $data Data to parse for preset
	 *
	 * @return string Preset ID, or default
	 */
	public static function get_preset_id ($data) {
		if (empty($data['preset'])) $data['preset'] = 'default';
		return $data['preset'];
	}

	/**
	 * Augment parsed data with preset info
	 *
	 * @param array $data Data hash
	 *
	 * @return array Augmented data
	 */
	public static function apply_preset ($data) {
		$data['preset'] = self::get_preset_id($data);

		if (!empty($data['preset']) && !empty($data['data_type'])) {
			$pserver = Upfront_PostData_Elements_Server::get_instance($data['data_type']);
			$preset = !empty($pserver)
				? $pserver->get_preset_by_id($data['preset'])
				: false
			;
			if (!empty($preset)) {
				foreach ($preset as $idx => $value) {
					if ("name" === $idx || "id" === $idx) continue;
					$data[$idx] = $value;
				}
			}
		}

		return $data;
	}

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
					$defaults['content'] = 'content';
					break;
				case 'author':
					$defaults['gravatar_size'] = 200;
					break;
				case 'taxonomy':
					$defaults['categories_limit'] = 3;
					$defaults['tags_limit'] = 3;
					break;
				case 'featured_image':
					$defaults['full_featured_image'] = '0';
					$defaults['hide_featured_image'] = '0';
					$defaults['fallback_image'] = '0';
					$defaults['fallback_color'] = '#f00';
					$defaults['fallback_hide'] = 0;
					$defaults['fallback_option'] = 'hide';
					break;
				case 'comments':
					$defaults['comment_count_hide'] = 0;
					$defaults['disable_showing'] = array(
						'trackbacks',
					);
					$defaults['disable'] = array(
						'trackbacks',
						'comments',
					);
					$defaults['order'] = 'comment_date_gmt';
					$defaults['direction'] = 'oldest' === get_option('default_comments_page') ? 'ASC' : 'DESC';
					$defaults['limit'] = (int)get_option('comments_per_page');
					$defaults['paginated'] = (int)get_option('page_comments');
					break;
				case 'meta':
					$defaults['meta'] = 0;
					break;
			}

			foreach ($type_parts as $part) {
				$key = self::_slug_to_part_key($part);
				$defaults[$key] = self::get_template($part);
			}

		}

		$defaults = self::apply_preset($defaults);
		if ('comments' === $data_type) {
			// Preset has nothing to do with this
			$defaults['paginated'] = (int)get_option('page_comments');
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

	public static function get_data_types () {
		return self::$data_types;
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
			'edit_post_parts' => __('Edit post parts', 'upfront'),

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
				'post_data_date_label' => __('Date', 'upfront'),
				'post_data_date_info' => __('The layer that contains publish date', 'upfront'),
				'post_data_title_label' => __('Title Wrapper', 'upfront'),
				'post_data_title_info' => __('The layer that contains post title', 'upfront'),
				'post_data_title_h1_label' => __('Title Wrapper', 'upfront'),
				'post_data_title_h1_info' => __('The layer that contains post title', 'upfront'),
				'post_data_content_label' => __('Content', 'upfront'),
				'post_data_content_info' => __('The layer that contains post content', 'upfront'),
				'post_data_content_p_label' => __('Content Paragraph', 'upfront'),
				'post_data_content_p_info' => __('The layer that contains post content', 'upfront'),
				'author_author_label' => __('Author Wrapper', 'upfront'),
				'author_author_info' => __('The layer that contains post author username', 'upfront'),
				'author_author_link_label' => __('Author Links', 'upfront'),
				'author_author_link_info' => __('Author Links', 'upfront'),
				'author_gravatar_label' => __('Gravatar', 'upfront'),
				'author_gravatar_info' => __('The layer that contains gravatar image', 'upfront'),
				'author_email_label' => __('Author Email Wrapper', 'upfront'),
				'author_email_info' => __('The layer that contains author email', 'upfront'),
				'author_url_label' => __('Author URL Wrapper', 'upfront'),
				'author_url_info' => __('The layer that contains author url', 'upfront'),
				'author_email_link_label' => __('Author Email', 'upfront'),
				'author_email_link_info' => __('Author Email', 'upfront'),
				'author_url_link_label' => __('Author URL', 'upfront'),
				'author_url_link_info' => __('Author URL', 'upfront'),
				'author_bio_label' => __('Author Bio', 'upfront'),
				'author_bio_info' => __('The layer that contains author biography', 'upfront'),
				'taxonomy_tags_label' => __('Tags Wrapper', 'upfront'),
				'taxonomy_tags_info' => __('The layer that contains all post tags', 'upfront'),
				'taxonomy_category_label' => __('Categories Wrapper', 'upfront'),
				'taxonomy_category_info' => __('The layer that contains all post categories', 'upfront'),
				'taxonomy_tags_link_label' => __('Tag Link', 'upfront'),
				'taxonomy_tags_link_info' => __('Tag link', 'upfront'),
				'taxonomy_category_link_label' => __('Category Link', 'upfront'),
				'taxonomy_category_link_info' => __('Category Link', 'upfront'),
				'featured_thumbnail_label' => __('Thumbnail Wrapper', 'upfront'),
				'featured_thumbnail_info' => __('The layer that contains featured image', 'upfront'),
				'featured_thumbnail_img_label' => __('Thumbnail Image', 'upfront'),
				'featured_thumbnail_img_info' => __('Featured image', 'upfront'),
				'post_meta_label' => __('Meta Wrapper', 'upfront'),
				'post_meta_info' => __('The layer that contains all meta contents', 'upfront'),
				'comment_count_label' => __('Comment Count', 'upfront'),
				'comment_count_info' => __('The layer that contains meta count', 'upfront'),
				'comments_label' => __('Comments', 'upfront'),
				'comments_info' => __('The layer that contains all comments', 'upfront'),
				'comments_pagination_label' => __('Pagination', 'upfront'),
				'comments_pagination_info' => __('The layer that contains pagination links', 'upfront'),
				'comment_form_label' => __('Form', 'upfront'),
				'comment_form_info' => __('The layer that contains comments form', 'upfront'),
				'comments_label' => __('Comments Wrapper', 'upfront'),
				'comments_info' => __('The layer that contains all comments', 'upfront'),
				'comment_label' => __('Comment LI', 'upfront'),
				'comment_info' => __('The LI that contains comment data', 'upfront'),
				'comment_wrapper_label' => __('Comment', 'upfront'),
				'comment_wrapper_info' => __('The layer that contains comment data', 'upfront'),
				'comment_avatar_label' => __('Avatar', 'upfront'),
				'comment_avatar_info' => __('The layer that contains comment avatar', 'upfront'),
				'comment_avatar_image_label' => __('Avatar Image', 'upfront'),
				'comment_avatar_image_info' => __('Avatar Image', 'upfront'),
				'comment_meta_label' => __('Meta', 'upfront'),
				'comment_meta_info' => __('The layer that contains comment meta', 'upfront'),
				'comment_athor_label' => __('Meta Author', 'upfront'),
				'comment_author_info' => __('Comment author link', 'upfront'),
				'comment_time_label' => __('Meta Time', 'upfront'),
				'comment_time_info' => __('The layer that contains publis time', 'upfront'),
				'comment_content_label' => __('Content', 'upfront'),
				'comment_content_info' => __('The layer that contains comment content', 'upfront'),
				'comment_content_p_label' => __('Content Paragraph', 'upfront'),
				'comment_content_p_info' => __('The layer that contains comment text', 'upfront'),
				'edit_link_label' => __('Edit Link', 'upfront'),
				'edint_link_info' => __('Edit link', 'upfront'),
				'meta_actions_label' => __('Actions Wrapper', 'upfront'),
				'meta_actions_info' => __('The layer that contains all action buttons', 'upfront'),
				'comment_reply_label' => __('Reply', 'upfront'),
				'comment_reply_info' => __('Reply button', 'upfront'),

				'reply_title_label' => __('Respond Title', 'upfront'),
				'reply_title_info' => __('Respond Title Heading', 'upfront'),
				'logged_in_label' => __('Logged In Wrapper', 'upfront'),
				'logged_in_info' => __('The layer that contains logged in info', 'upfront'),
				'logged_in_link_label' => __('Logged In Wrapper', 'upfront'),
				'logged_in_link_info' => __('The layer that contains logged in info', 'upfront'),
				'respond_label' => __('Fields Wrapper', 'upfront'),
				'respond_info' => __('The layer that contains all fields to publish comment', 'upfront'),
				'comment_input_label' => __('Input', 'upfront'),
				'comment_input_info' => __('Comment publish inputs', 'upfront'),
				'comment_textarea_label' => __('Textarea', 'upfront'),
				'comment_textarea_info' => __('Comment publish text box', 'upfront'),
				'submit_button' => __('Comment Button', 'upfront'),
				'submit_button' => __('Button to ', 'upfront'),
			),

			'elements' => array(
				'post_data' => __('Post Data', 'upfront'),
				'author' => __('Author', 'upfront'),
				'taxonomy' => __('Categories &amp; Tags', 'upfront'),
				'featured_image' => __('Featured Image', 'upfront'),
				'comments' => __('Comments', 'upfront'),
			),

			'part_date_posted' => __('Date posted', 'upfront'),
			'part_author' => __('Name', 'upfront'),
			'part_gravatar' => __('Gravatar', 'upfront'),
			'part_author_email' => __('Email', 'upfront'),
			'part_author_url' => __('Website', 'upfront'),
			'part_author_bio' => __('Biography', 'upfront'),
			'part_comment_count' => __('Comment count', 'upfront'),
			'part_comment_form' => __('Comment form', 'upfront'),
			'part_comments' => __('Comments', 'upfront'),
			'part_comments_pagination' => __('Comments pagination', 'upfront'),
			'part_featured_image' => __('Featured Image', 'upfront'),
			'part_title' => __('Title', 'upfront'),
			'part_content' => __('Content', 'upfront'),
			'part_read_more' => __('Read More', 'upfront'),
			'part_tags' => __('Tags', 'upfront'),
			'part_categories' => __('Categories', 'upfront'),
			'part_meta' => __('Meta', 'upfront'),

			'edit' => __('Edit', 'upfront'),
			'edit_html' => __('Edit HTML', 'upfront'),
			'edit_template' => __('Edit Template', 'upfront'),
			'custom_markup' => __('Custom Markup', 'upfront'),
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
