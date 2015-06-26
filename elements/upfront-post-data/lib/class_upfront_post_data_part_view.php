<?php


/**
 * Individual post item markup generation.
 * Takes care of the post parts template expanstion.
 */
abstract class Upfront_Post_Data_PartView extends Upfront_PostPart_View {

	const DEFAULT_DATA_TYPE = 'post_data';
	
	protected $_data = array();
	protected $_post;

	protected static $_parts = array();

	public function __construct ($data=array()) {
		$this->_data = $data;
	}

	/**
	 * Main public method.
	 * Expands each part of the post parts and constructs markup string,
	 * then wraps it in post wrapper.
	 * @param object WP_Post object instance
	 * @return string Rendered post markup
	 */
	public function get_markup ($post) {
		if (empty($post)) return false;
		$this->_post = $post;

		$post_parts = self::get_default_parts($this->_data);
		$enabled_post_parts = $this->_get_parts_from_objects();
		$parts = array();
		foreach ($post_parts as $part) {
			if (!in_array($part, $enabled_post_parts)) continue;
			$method = "expand_{$part}_template";
			if (method_exists($this, $method)) $parts[$part] = $this->$method();
			else $parts[$part] = apply_filters('upfront_postdata-' . $method, '', $post);
		}

		// Also expand postmeta codes outside the meta element
		//$out = Upfront_Codec::get('postmeta')->expand_all($out, $post);

		return $parts;
	}

	public function get_propagated_classes () {
		return array();
	}

	/**
	 * Fetches array of supported post parts.
	 * @return array A list of known parts.
	 */
	public static function get_default_parts ($data) {
		$class_name = self::_get_view_class($data);
		$class_vars = get_class_vars($class_name);
		return $class_vars['_parts'];
	}

	/**
	 * Loads post part template from a file.
	 * @param string $slug Post part template slug
	 * @return string Loaded template
	 */
	protected function _get_template ($slug) {
		return Upfront_Post_Data_Data::get_template($slug, $this->_data);
	}
	
	/**
	 * Find post parts from each child object
	 * @return array Array of post part type (string)
	 */
	protected function _get_parts_from_objects () {
		if ( empty($this->_data['objects']) )
			return array();
		$parts = array();
		foreach ( $this->_data['objects'] as $object ) {
			$part = upfront_get_property_value('part_type', $object);
			$parts[] = $part;
		}
		return $parts;
	}

	/**
	 * Get view class responsible for rendering
	 * @param array $data Data array
	 * @return string The class name
	 */
	public static function _get_view_class ($data) {
		$data_type = !empty($data['data_type']) ? $data['data_type'] : self::DEFAULT_DATA_TYPE;
		$class_name = get_class() . '_' . self::_normalize_type_to_class($data_type);
		if (!class_exists($class_name)) $class_name = get_class() . '_' . self::_normalize_type_to_class(self::DEFAULT_DATA_TYPE);
		return $class_name;
	}
	
	private static function _normalize_type_to_class ($type) {
		$type_strings = explode('_', $type);
		$type_strings = array_map('ucfirst', $type_strings);
		return join('_', $type_strings);
	}
}

class Upfront_Post_Data_PartView_Author extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'author',
		1 => 'gravatar'
	);
}

class Upfront_Post_Data_PartView_Taxonomy extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'tags',
		1 => 'categories'
	);
}

class Upfront_Post_Data_PartView_Featured_Image extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'featured_image',
	);

	public function expand_featured_image_template () {
		if (empty($this->_post->ID)) return '';

		$resize_featured = isset($this->_data['resize_featured'])
			? (int)$this->_data['resize_featured']
			: (int)Upfront_Posts_PostsData::get_default('resize_featured')
		;

		$thumbnail = $this->_get_thumbnail();		

		// Let's deal with the fallback options
		$fallback = false;
		if (empty($thumbnail)) {
			$fallback_option = !empty($this->_data['fallback_option'])
				? $this->_data['fallback_option']
				: Upfront_Posts_PostsData::get_default('fallback_option')
			;

			// Hide fallback
			if (empty($fallback_option) || 'hide' === $fallback_option) {
				return ''; // Naive approach
			}

			// Solid color fallback
			if ('color' === $fallback_option) {
				$color = !empty($this->_data['fallback_color'])
					? $this->_data['fallback_color']
					: Upfront_Posts_PostsData::get_default('fallback_color')
				;
				if (!empty($color) && preg_match('/^(#|rgba?)/', $color)) {
					// Assign some inline CSS to make this happen - the absolute positioning is within relative container.
					$fallback = sprintf('style="background-color: %s;" data-fallback="color"', $color);
				}
			}

			// Image fallback
			if ('image' === $fallback_option) {
				$image = !empty($this->_data['fallback_image'])
					? $this->_data['fallback_image']
					: Upfront_Posts_PostsData::get_default('fallback_image')
				;
				if (!empty($image)) $thumbnail = '<img class="featured-image fallback-image" src="' . esc_url($image) . '" />';
			}
		}

		$out = $this->_get_template('featured_image');

		$out = Upfront_Codec::get()->expand($out, "thumbnail", $thumbnail);
		$out = Upfront_Codec::get()->expand($out, "resize", $resize_featured);
		$out = Upfront_Codec::get()->expand($out, "fallback", $fallback);
		$out = Upfront_Codec::get()->expand($out, "permalink", get_permalink($this->_post->ID));

		return $out;
	}

	/**
	 * Gets the thumbnail in proper size for the current given post
	 *
	 * @return string Thumbnail markup, can also be an empty string
	 */
	private function _get_thumbnail () {
		$full_featured = isset($this->_data['full_featured_image'])
			? (int)$this->_data['full_featured_image']
			: (int)Upfront_Posts_PostsData::get_default('full_featured_image')
		;

		return $full_featured == 1
			? get_the_post_thumbnail($this->_post->ID)
			: upfront_get_edited_post_thumbnail($this->_post->ID)
		;
	}

	/**
	 * Determine if we have some extra classes to propagate.
	 *
	 * @return array List of classes to propagate upwards
	 */
	public function get_propagated_classes () {
		$classes = array();
		$thumbnail = $this->_get_thumbnail();

		if (!empty($thumbnail)) return $classes;

		$classes[] = 'no-featured_image';

		$fallback_option = !empty($this->_data['fallback_option'])
			? $this->_data['fallback_option']
			: Upfront_Posts_PostsData::get_default('fallback_option')
		;
		if (empty($fallback_option)) return array();

		$classes[] = sanitize_html_class("fallback_{$fallback_option}");

		return $classes;
	}
}

class Upfront_Post_Data_PartView_Comments extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'comment_count',
		1 => 'comments',
		2 => 'comment_form'
	);
}

class Upfront_Post_Data_PartView_Meta extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'meta'
	);
}


class Upfront_Post_Data_PartView_Post_data extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'date_posted',
		1 => 'title',
		2 => 'content',
	);

	public function expand_content_template () {
		$length = isset($this->_data['content_length'])
        	? (int)$this->_data['content_length']
        	: (int)Upfront_Posts_PostsData::get_default('content_length')
        ;
		$this->_data['content'] = !empty($this->_data['content']) ? $this->_data['content'] : 'content'; // Make sure it's the content we're dealing with
		$content = $this->_get_content_value($length);

		$part = !empty($this->_data['content_part'])
			? (int)$this->_data['content_part']
			: false
		;

		if (!empty($part)) {
			if (!$this->_has_content_parts($content) && $part > 1) return ''; // We have a post with no parts, and multiple content
			$content = $this->_get_content_part($part, $content);
		}

		$out = $this->_get_template('content');

		$out = Upfront_Codec::get()->expand($out, "content", $content);

		return $out;
	}

	private function _has_content_parts ($content) {
		return count($this->_get_content_parts($content)) > 1;
	}

	private function _get_content_part ($part, $content) {
		$parts = $this->_get_content_parts($content);
		$part -= 1; // Mortals count from 1
		return isset($parts[$part]) ? $parts[$part] : '';

	}
	
	private function _get_content_parts ($content) {
		$separator = $this->_get_content_part_separator();
		$parts = preg_split('/(<p>\s*)?' . preg_quote($separator, '/') . '(\s*<\/p>)/', $content);
		return array_values(array_filter(array_map('trim', $parts)));
	}

	private function _get_content_part_separator () {
		return '!!PART!!';
	}
}