<?php


/**
 * Individual post item markup generation.
 * Takes care of the post parts template expanstion.
 */
class Upfront_Posts_PostView {

	private $_data = array();
	private $_post;

	// Order is significant
	private static $_parts = array(
		0 => 'date_posted',
		1 => 'author',
		//2 => 'gravatar',
		2 => 'comment_count',
		3 => 'featured_image',
		4 => 'title',
		5 => 'content',
		6 => 'read_more',
		7 => 'tags',
		8 => 'categories',
		9 => 'meta',
	);

	public function __construct ($data=array()) {
		$this->_data = $data;
	}
	
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
	 * Get post parts from preset
	 *
	 * @param array $data Data hash
	 *
	 * @return array enabled_post_parts
	 */
	public static function get_post_parts ($data) {
		$preset_id = self::get_preset_id($data);
		
		// If we have post parts from AJAX call use it
		if (isset($data['preset_post_parts']) && !empty($data['preset_post_parts'])) {
			return $data['preset_post_parts'];
		}
			
		if (!empty($preset_id)) {
			$preset_server = Upfront_Posts_Presets_Server::get_instance();
			$preset = !empty($preset_server)
				? $preset_server->get_preset_by_id($preset_id)
				: false
			;
			if (!empty($preset) && isset($preset['enabled_post_parts'])) {
				return $preset['enabled_post_parts'];
			}
		}

		$post_parts = $data['post_parts'];
		$enabled_post_parts = $data['enabled_post_parts'];
		if (!is_array($post_parts)) $post_parts = $enabled_post_parts;
		if ( is_array($post_parts) ) return $post_parts;

		return array();
	}

	/**
	 * Main public method.
	 * Expands each part of the post parts and constructs markup string,
	 * then wraps it in post wrapper.
	 * @param object WP_Post object instance
	 * @return string Rendered post markup
	 */
	public function get_markup ($post) {
		$parts = $this->get_parts_markup($post);

		$out = '';
		foreach ($parts as $part) {
			$out .= $part;
		}

		return $this->_wrap_post($out, $post);
	}

	/**
	 * Get individual parts markup separately
	 * Expands each part of the post parts and constructs markup string,
	 * return it in array of markup string for each parts
	 * @param object WP_Post object instance
	 * @return array|bool Array of rendered parts markup
	 */
	public function get_parts_markup ($post) {
		if (empty($post)) return false;
		$this->_post = $post;

		$post_parts = self::get_post_parts($this->_data);

		$parts = array();
		foreach ($post_parts as $part) {
			$method = "expand_{$part}_template";
			if (method_exists($this, $method)) $parts[$part] = $this->$method();
			else $parts[$part] = apply_filters('upfront_posts-' . $method, '', $post);
		}

		// Also expand postmeta codes outside the meta element
		foreach ( $parts as $part => $value ) {
			$parts[$part] = Upfront_Codec::get('postmeta')->expand_all($value, $post);
		}

		return $parts;
	}

	/**
	 * Fetches array of supported post parts.
	 * @return array A list of known parts.
	 */
	public static function get_default_parts () {
		return self::$_parts;
	}

	public function expand_date_posted_template () {
		if (empty($this->_post->post_date)) return '';

		$time = strtotime($this->_post->post_date);
		if (empty($time)) return '';

		$date_format = !empty($this->_data['date_posted_format'])
			? $this->_data['date_posted_format']
			: Upfront_Posts_PostsData::get_default('date_posted_format')
		;
		$format = explode(' ', $date_format);

		$out = $this->_get_template('date_posted');

		$part = 1;
		foreach ($format as $fmt) {
			$out = Upfront_Codec::get()->expand($out, "date_{$part}", date($fmt, $time));
			$part++;
		}
		$out = Upfront_Codec::get()->expand($out, "datetime", date($date_format, $time));
		$out = Upfront_Codec::get()->expand($out, "timestamp", $time);

		$out = Upfront_Codec::get()->expand($out, "date", date(get_option('date_format'), $time));
		$out = Upfront_Codec::get()->expand($out, "time", date(get_option('time_format'), $time));

		$out = Upfront_Codec::get()->expand($out, "permalink", get_permalink($this->_post->ID));

		return $out;
	}

	public function expand_author_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		$url = get_author_posts_url($author);

		$out = $this->_get_template('author');

		$out = Upfront_Codec::get()->expand($out, "name", esc_html($name));
		$out = Upfront_Codec::get()->expand($out, "url", esc_url($url));

		return $out;
	}

	public function expand_gravatar_template () {
		if (empty($this->_post->post_author)) return '';

		$gravatar_size = !empty($this->_data['gravatar_size'])
			? $this->_data['gravatar_size']
			: Upfront_Posts_PostsData::get_default('gravatar_size')
		;

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		$gravatar = get_avatar($author, $gravatar_size, null, $name);

		$out = $this->_get_template('gravatar');

		$out = Upfront_Codec::get()->expand($out, "name", esc_html($name));
		$out = Upfront_Codec::get()->expand($out, "gravatar", $gravatar);

		return $out;
	}

	public function expand_comment_count_template () {
		$hide_empty = isset($this->_data['comment_count_hide'])
			? (int)$this->_data['comment_count_hide']
			: (int)Upfront_Posts_PostsData::get_default('comment_count_hide')
		;

		if ($hide_empty && empty($this->_post->comment_count)) return '';

		$out = $this->_get_template('comment_count');

		$out = Upfront_Codec::get()->expand($out, "comment_count", (int)($this->_post->comment_count));

		return $out;
	}

	public function expand_featured_image_template () {
		if (empty($this->_post->ID)) return '';
		
		$thumbnail_size = isset($this->_data['thumbnail_size'])
			? $this->_data['thumbnail_size']
			: Upfront_Posts_PostsData::get_default('thumbnail_size')
		;
		
		$thumbnail = upfront_get_edited_post_thumbnail($this->_post->ID, false, $thumbnail_size);
		if (empty($thumbnail)) return '';

        $resize_featured = isset($this->_data['resize_featured'])
        	? (int)$this->_data['resize_featured']
        	: (int)Upfront_Posts_PostsData::get_default('resize_featured')
        ;
        $resize_featured = $resize_featured ? 0 : 1; // Reverse the logic, as per: https://app.asana.com/0/11140166463836/75256787123017

		$out = $this->_get_template('featured_image');

		$out = Upfront_Codec::get()->expand($out, "thumbnail", $thumbnail);
		$out = Upfront_Codec::get()->expand($out, "resize", $resize_featured);
		$out = Upfront_Codec::get()->expand($out, "permalink", get_permalink($this->_post->ID));

		return $out;
	}

	public function expand_title_template () {
		if (empty($this->_post->post_title)) return '';

		$title = esc_html(apply_filters('the_title', $this->_post->post_title));
		$permalink = get_permalink($this->_post->ID);

		$out = $this->_get_template('title');

		$out = Upfront_Codec::get()->expand($out, "permalink", $permalink);
		$out = Upfront_Codec::get()->expand($out, "title", $title);

		return $out;
	}

	public function expand_content_template () {
		$length = isset($this->_data['content_length'])
        	? (int)$this->_data['content_length']
        	: (int)Upfront_Posts_PostsData::get_default('content_length')
        ;
		$content = $this->_get_content_value($length);
		$content_type = $this->_get_content_type();

		$out = $this->_get_template('content');

		$out = Upfront_Codec::get()->expand($out, "content", $content);
		$out = Upfront_Codec::get()->expand($out, "content_type", $content_type);

		return $out;
	}

	public function expand_tags_template () {
		if (empty($this->_post->ID)) return '';

		$tags = get_the_tag_list('', ', ', '', $this->_post->ID);
		if (empty($tags)) return '';

		$length = isset($this->_data['tags_limit'])
        	? (int)$this->_data['tags_limit']
        	: (int)Upfront_Posts_PostsData::get_default('tags_limit')
        ;

        if ($length) {
			$list = array_map('trim', explode(',', $tags));
			$tags = join(', ', array_slice($list, 0, $length));
		}


		$out = $this->_get_template('tags');

		$out = Upfront_Codec::get()->expand($out, "tags", $tags);

		return $out;
	}

	public function expand_categories_template () {
		if (empty($this->_post->ID)) return '';

		$categories = get_the_category_list(', ', '', $this->_post->ID);
		if (empty($categories)) return '';

		$length = isset($this->_data['categories_limit'])
        	? (int)$this->_data['categories_limit']
        	: (int)Upfront_Posts_PostsData::get_default('categories_limit')
        ;

        if ($length) {
			$list = array_map('trim', explode(',', $categories));
			$categories = join(', ', array_slice($list, 0, $length));
		}

		$out = $this->_get_template('categories');

		$out = Upfront_Codec::get()->expand($out, "categories", $categories);

		return $out;
	}

	public function expand_read_more_template () {
		if (empty($this->_post->ID)) return '';
		if (!empty($this->_data['content']) && 'content' === $this->_data['content']) return ''; // Only for excerpts

		$permalink = get_permalink($this->_post->ID);

		$out = $this->_get_template('read_more');

		$out = Upfront_Codec::get()->expand($out, "permalink", $permalink);

		return $out;
	}

	/**
	 * Expands post meta values.
	 *
	 * @return string Compiled expression
	 */
	public function expand_meta_template () {
		if (empty($this->_post->ID)) return '';

		$out = $this->_get_template('meta');
		if (empty($out)) return $out;

		return Upfront_Codec::get('postmeta')->expand_all($out, $this->_post);
	}

	/**
	 * Return content type (full, user-set excerpt or auto-generated excerpt)
	 *
	 * @return string Content type
	 */
	private function _get_content_type () {
		if (!empty($this->_data['content']) && 'content' === $this->_data['content']) return 'full';
		return !empty($this->_post->post_excerpt)
			? 'excerpt'
			: 'generated-excerpt'
		;
	}

	/**
	 * Return either full content or excerpt, based on data state.
	 * @return string Content or excerpt
	 */
	private function _get_content_value ($length) {
		return !empty($this->_data['content']) && 'content' === $this->_data['content']
			? $this->_get_content()
			: $this->_get_excerpt($length)
		;
	}

	/**
	 * Returns post full content, with filters applied.
	 * @return string Final post full content.
	 */
	private function _get_content () {
		return apply_filters('the_content', $this->_post->post_content);
	}

	/**
	 * Returns post excerpt.
	 * If a post doesn't have one, generates it with preset limit.
	 * @param int $length Length in words
	 * @return string Post excerpt
	 */
	private function _get_excerpt ($length) {
		if (!empty($this->_post->post_excerpt)) return wpautop($this->_post->post_excerpt);

		$content = $this->_post->post_content;

		// Detect `more` tag and act on it
		if (preg_match('/(<!--more(.*?)?-->)/', $content, $matches)) {
			$mtc = explode($matches[0], $content, 2);
			$content = reset($mtc);
		}

		$excerpt = preg_replace('/\s+/', ' ', // Collapse potential multiple consecutive whitespaces
			str_replace(array("\n", "\r"), ' ',  // Normalize linebreaks to spaces - no block-level stuff in excerpts
				strip_shortcodes( // No shortcodes in excerpts
					wp_strip_all_tags($content) // Also no HTML tags - allowing that together with limit parsing might end up with broken HTML
				)
			)
		);

		$length = (int)$length;
		if (!empty($length)) {
			$words = explode(' ', $excerpt, $length+1);
			$excerpt = join(' ', array_slice($words, 0, $length));
		}

		return wpautop($excerpt);
	}

	/**
	 * Wraps post in appropriate markup.
	 * @param $out Generated post markup.
	 * @param WP_Post $post
	 *
	 * @return string Wrapped final post markup.
	 */
	protected function _wrap_post ($out, WP_Post $post) {
		$class = is_sticky( $post->ID ) ? "uf-post uf-post-sticky" : "uf-post";
		if (!empty($post->ID) && !has_post_thumbnail($post->ID)) {
			$class .= " noFeature";
		}
		return "<li class='{$class}'><article>{$out}</article></li>";
	}

	/**
	 * Loads post part template from a file.
	 * @param string $slug Post part template slug
	 * @return string Loaded template
	 */
	private function _get_template ($slug) {
		return Upfront_Posts_PostsData::get_template($slug, $this->_data);
	}
}
