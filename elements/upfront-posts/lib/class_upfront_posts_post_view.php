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
		2 => 'gravatar',
		3 => 'comment_count',
		4 => 'featured_image',
		5 => 'title',
		6 => 'content',
		7 => 'read_more',
		8 => 'tags',
		9 => 'categories',
		10 => 'meta',
	);

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

		$post_parts = $this->_data['post_parts'];
		$enabled_post_parts = $this->_data['enabled_post_parts'];
		if (!is_array($post_parts)) $post_parts = $enabled_post_parts;
		$out = '';
		foreach ($post_parts as $part) {
			if (!in_array($part, $enabled_post_parts)) continue;
			$method = "expand_{$part}_template";
			if (method_exists($this, $method)) $out .= $this->$method();
			else $out .= apply_filters('upfront_posts-' . $method, $post);
		}

		return $this->_wrap_post($out, $post);
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
		$format = explode(' ', $date_format, 2);

		$out = $this->_get_template('date_posted');

		$part = 1;
		foreach ($format as $fmt) {
			$out = preg_replace($this->_get_regex('date_' . $part), date($fmt, $time), $out);
			$part++;
		}
		$out = preg_replace($this->_get_regex('datetime'), date($date_format, $time), $out);
		$out = preg_replace($this->_get_regex('timestamp'), $time, $out);

		return $out;
	}

	public function expand_author_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		$url = get_author_posts_url($author);

		$out = $this->_get_template('author');

		$out = preg_replace($this->_get_regex('name'), esc_html($name), $out);
		$out = preg_replace($this->_get_regex('url'), esc_url($url), $out);

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

		$out = preg_replace($this->_get_regex('name'), esc_html($name), $out);
		$out = preg_replace($this->_get_regex('gravatar'), $gravatar, $out);

		return $out;
	}

	public function expand_comment_count_template () {
		$hide_empty = isset($this->_data['comment_count_hide'])
			? (int)$this->_data['comment_count_hide']
			: (int)Upfront_Posts_PostsData::get_default('comment_count_hide')
		;

		if ($hide_empty && empty($this->_post->comment_count)) return '';

		$out = $this->_get_template('comment_count');

		$out = preg_replace($this->_get_regex('comment_count'), (int)($this->_post->comment_count), $out);

		return $out;
	}

	public function expand_featured_image_template () {
		if (empty($this->_post->ID)) return '';

		$thumbnail = get_the_post_thumbnail($this->_post->ID);
		if (empty($thumbnail)) return '';

        $resize_featured = isset($this->_data['resize_featured'])
        	? (int)$this->_data['resize_featured']
        	: (int)Upfront_Posts_PostsData::get_default('resize_featured')
        ;

		$out = $this->_get_template('thumbnail');

		$out = preg_replace($this->_get_regex('thumbnail'), $thumbnail, $out);
        $out = preg_replace($this->_get_regex('resize'), $resize_featured, $out);

		return $out;
	}

	public function expand_title_template () {
		if (empty($this->_post->post_title)) return '';

		$title = esc_html(apply_filters('the_title', $this->_post->post_title));
		$permalink = get_permalink($this->_post->ID);

		$out = $this->_get_template('title');

		$out = preg_replace($this->_get_regex('permalink'), $permalink, $out);
		$out = preg_replace($this->_get_regex('title'), $title, $out);

		return $out;
	}

	public function expand_content_template () {
		$length = isset($this->_data['content_length'])
        	? (int)$this->_data['content_length']
        	: (int)Upfront_Posts_PostsData::get_default('content_length')
        ;
		$content = $this->_get_content_value($length);

		$out = $this->_get_template('content');

		$out = preg_replace($this->_get_regex('content'), $content, $out);

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

		$out = preg_replace($this->_get_regex('tags'), $tags, $out);

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

		$out = preg_replace($this->_get_regex('categories'), $categories, $out);

		return $out;
	}

	public function expand_read_more_template () {
		if (empty($this->_post->ID)) return '';
		if (!empty($this->_data['content']) && 'content' === $this->_data['content']) return ''; // Only for excerpts

		$permalink = get_permalink($this->_post->ID);

		$out = $this->_get_template('read_more');

		$out = preg_replace($this->_get_regex('permalink'), $permalink, $out);

		return $out;
	}

	/**
	 * Expands post meta values.
	 *
	 * @return string Compiled expression
	 */
	public function expand_meta_template () {
		if (empty($this->_post->ID)) return '';

		//$metadata = $this->_get_all_post_meta_fields($this->_post->ID);
		$out = $this->_get_template('meta');

		$tags = $matches = $metadata = array();
		preg_match_all('/' . preg_quote('{{', '/') . '(.*)' . preg_quote('}}', '/') . '/', $out, $matches);
		if (!empty($matches[1])) $tags = $matches[1];

		if (empty($tags)) return $out;

		$metadata = Upfront_Posts_Model::get_post_meta_fields($this->_post->ID, $tags);

		foreach ($metadata as $item) {
			if (empty($item['meta_key'])) continue;
			$key = $item['meta_key'];
			$value = isset($item['meta_value']) ? $item['meta_value'] : '';

			$value = apply_filters('upfront_posts-meta-value',
				apply_filters("upfront_posts-meta-{$key}-value", $value, $this->_post->ID, $this),
				$value, $this->_post->ID, $key, $this
			);

			$out = preg_replace($this->_get_regex($key), $value, $out);
		}

		// Re-iterate through tags and null out empty replacement macros.
		foreach ($tags as $tag) {
			$out = preg_replace($this->_get_regex($tag), '', $out);
		}

		return $out;
	}

	/**
	 * Create an uniform expansion regex.
	 * @param string $part Expansion macro without delimiters
	 * @return string Final regex
	 */
	private function _get_regex ($part) {
		return '/' . preg_quote('{{' . $part . '}}', '/') . '/';
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

		$excerpt = str_replace(array("\n", "\r"), '', strip_shortcodes(wp_strip_all_tags($this->_post->post_content)));

		$length = (int)$length;
		if (!empty($length)) {
			$words = explode(' ', $excerpt, $length+1);
			$excerpt = join(' ', array_slice($words, 0, $length));
		}
		// Just first 128 chars
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
