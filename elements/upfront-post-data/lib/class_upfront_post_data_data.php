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

}
