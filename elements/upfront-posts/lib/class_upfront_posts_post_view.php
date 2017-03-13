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

	public function __construct ($data=array(), $ajax_call = false) {
		// Add presets props to $this->_data if not AJAX call
		if($ajax_call != true) {
			$data = Upfront_Posts_PostsData::apply_preset($data);
		}
		
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
		if (isset($data['enabled_post_parts']) && !empty($data['enabled_post_parts'])) {
			return $data['enabled_post_parts'];
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
		$time = strtotime($this->_post->post_date);
		if (empty($time)) return '';

		$predefined_format = !empty($this->_data['predefined-date-format'])
			? $this->_data['predefined-date-format']
			: false
		;

		$wp_date = get_option('date_format');
		$wp_time = get_option('time_format');
		$date_format = false;
		if (!empty($predefined_format)) {
			$date_format = $predefined_format;
			$date_format = preg_replace('/(^|\b)wp_date(\b|$)/', $wp_date, $date_format);
			$date_format = preg_replace('/(^|\b)wp_time(\b|$)/', $wp_time, $date_format);
		} else {
			$date_format = !empty($this->_data['php-date-format'])
				? $this->_data['php-date-format']
				: Upfront_Posts_PostsData::get_default('date_posted_format')
			;
		}
		$format = explode(' ', $date_format);

		$out = $this->_get_template('date_posted');

		$part = 1;
		foreach ($format as $fmt) {
			$out = Upfront_Codec::get()->expand($out, "date_{$part}", date($fmt, $time));
			$part++;
		}
		$out = Upfront_Codec::get()->expand($out, "timestamp", $time);
		$out = Upfront_Codec::get()->expand($out, "datetime", date_i18n($date_format, $time));
		$out = Upfront_Codec::get()->expand($out, "time", date_i18n($wp_time, $time));

		$out = Upfront_Codec::get()->expand($out, "wp_date", date_i18n($wp_date, $time));
		$out = Upfront_Codec::get()->expand($out, "wp_time", date_i18n($wp_time, $time));

		return $out;
	}

	public function expand_author_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;

		$name = get_the_author_meta('display_name', $author);

		if (!empty($this->_data['gravatar-use'])) {
			$gravatar_size = !empty($this->_data['gravatar-size'])
				? $this->_data['gravatar-size']
				: Upfront_Posts_PostsData::get_default('gravatar_size')
			;

			$gravatar = get_avatar($author, $gravatar_size, null, $name);
		} else {
			$gravatar = '';
		}

		if (!empty($this->_data['author-display-name'])) {	
			if ('first_last' === $this->_data['author-display-name'] || 'last_first' === $this->_data['author-display-name']) {
				$first = get_the_author_meta('first_name', $author);
				$last = get_the_author_meta('last_name', $author);
				if (!empty($first) && !empty($last)) {
					$name = 'first_last' === $this->_data['author-display-name']
						? "{$first} {$last}"
						: "{$last} {$first}"
					;
				}
			}
			
			if ('nickname' === $this->_data['author-display-name']) {
				$nick = get_the_author_meta('nickname', $author);
				if (!empty($nick)) $name = $nick;
			}

			if ('username' === $this->_data['author-display-name']) {
				$nick = get_the_author_meta('username', $author);
				if (!empty($nick)) $name = $nick;
			}
		}

		$url = ''; //
		if (!empty($this->_data['author-link'])) {
			if ('author' === $this->_data['author-link']) {
				$url = get_author_posts_url($author);
			}
			if ('website' === $this->_data['author-link']) {
				$link = get_the_author_meta('url', $author);
				if (!empty($link)) $url = $link;
			}
		}

		$target = '';
		if (!empty($this->_data['author-target'][0])) {
			$target = '_blank';
		}

		$out = $this->_get_template('author');

		$out = Upfront_Codec::get()->expand($out, "name", esc_html($name));
		$out = Upfront_Codec::get()->expand($out, "url", esc_url($url));
		$out = Upfront_Codec::get()->expand($out, "target", esc_attr($target));
		$out = Upfront_Codec::get()->expand($out, "gravatar", $gravatar);		

		return $out;
	}

	public function expand_gravatar_template () {
		// We no longer have gravatar part
		return false;
	}

	public function expand_comment_count_template () {
		$hide_empty = isset($this->_data['comments-hide-if-empty'])
			? (int)$this->_data['comments-hide-if-empty']
			: (int)Upfront_Posts_PostsData::get_default('comment_count_hide')
		;

		if ($hide_empty && empty($this->_post->comment_count)) return '';

		$out = $this->_get_template('comment_count');

		$out = Upfront_Codec::get()->expand($out, "comment_count", (int)($this->_post->comment_count));

		return $out;
	}

	public function expand_featured_image_template () {
		if (empty($this->_post->ID)) return '';

		$thumbnail_size = isset($this->_data['featured-image-size'])
			? $this->_data['featured-image-size']
			: Upfront_Posts_PostsData::get_default('thumbnail_size')
		;
		
		if($thumbnail_size == "custom_size") {
			$custom_width = $this->_data['featured-custom-width'] ? $this->_data['featured-custom-width'] : 0;
			$custom_height = $this->_data['featured-custom-width'] ? $this->_data['featured-custom-width'] : 0;
			$thumbnail_size = array($custom_width, $custom_height);
		}

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

		$title = esc_html(apply_filters('the_title', $this->_post->post_title, $this->_post->ID));
		$permalink = get_permalink($this->_post->ID);

		$out = $this->_get_template('title');

		$out = Upfront_Codec::get()->expand($out, "permalink", $permalink);
		$out = Upfront_Codec::get()->expand($out, "title", $title);

		return $out;
	}

	public function expand_content_template () {
		if(isset($this->_data['content-type']) && $this->_data['content-type'] == "excerpt") {
			$length = isset($this->_data['content-length'])
				? (int)$this->_data['content-length']
				: (int)Upfront_Posts_PostsData::get_default('content-length')
			;
		} else {
			$length = (int)Upfront_Posts_PostsData::get_default('content-length');
		}

		$content = $this->_get_content_value($length);
		$content_type = $this->_get_content_type();

		$out = $this->_get_template('content');

		$out = Upfront_Codec::get()->expand($out, "content", $content);
		$out = Upfront_Codec::get()->expand($out, "content_type", $content_type);

		return $out;
	}

	public function expand_tags_template () {
		if (empty($this->_post->ID)) return '';

		$tags = is_numeric($this->_post->ID)
			? get_the_tag_list('', ', ', '', $this->_post->ID)
			: $this->_stub_tag_list_for_builder()
		;
		if (empty($tags)) return defined('DOING_AJAX') && DOING_AJAX && Upfront_Permissions::current(Upfront_Permissions::BOOT)
			// In editor and no tags output
			? __('This post has no tags assigned', 'upfront')
			// No tags output, but also not in editor
			: ''
		;

		$length = isset($this->_data['tags-show-max'])
			? (int)$this->_data['tags-show-max']
			: (int)Upfront_Posts_PostsData::get_default('tags_limit')
		;

		$separator = isset($this->_data['tags-separator'])
			? '<span>'.$this->_data['tags-separator'].'</span>'
			: ''
		 ;

		$list = array_map('trim', explode(',', $tags));
		$length = (int)$length > 0
			? (int)$length
			: count($list)
		;
		$tags = trim(join($separator, array_slice($list, 0, $length)));

		$out = $this->_get_template('tags');

		$out = Upfront_Codec::get()->expand($out, "tags", $tags);

		return $out;
	}

	public function expand_categories_template () {
		if (empty($this->_post->ID)) return '';

		$categories = is_numeric($this->_post->ID)
			? get_the_category_list(', ', '', $this->_post->ID)
			: $this->_stub_category_list_for_builder()
		;
		
		if (empty($categories)) return '';

		$length = isset($this->_data['category-show-max'])
			? (int)$this->_data['category-show-max']
		 	: (int)Upfront_Posts_PostsData::get_default('categories_limit')
		;

		$separator = isset($this->_data['category-separator'])
			? '<span>' . $this->_data['category-separator']. '</span>'
			: ''
		;

		$list = array_map('trim', explode(',', $categories));
		$length = (int)$length > 0
			? (int)$length
			: count($list)
		;
		$categories = join($separator, array_slice($list, 0, $length));

		$out = $this->_get_template('categories');

		$out = Upfront_Codec::get()->expand($out, "categories", $categories);

		return $out;
	}

	public function expand_read_more_template () {
		if (empty($this->_post->ID)) return '';
		if (!empty($this->_data['content']) && 'content' === $this->_data['content']) return ''; // Only for excerpts

		$permalink = get_permalink($this->_post->ID);

		$title = esc_html(apply_filters('the_title', $this->_post->post_title, $this->_post->ID));

		$out = $this->_get_template('read_more');

		$out = Upfront_Codec::get()->expand($out, "permalink", $permalink);

		$out = Upfront_Codec::get()->expand($out, "title", $title);

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
