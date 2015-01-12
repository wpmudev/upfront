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
			$out = Upfront_MacroCodec::expand($out, "date_{$part}", date($fmt, $time));
			$part++;
		}
		$out = Upfront_MacroCodec::expand($out, "datetime", date($date_format, $time));
		$out = Upfront_MacroCodec::expand($out, "timestamp", $time);

		return $out;
	}

	public function expand_author_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		$url = get_author_posts_url($author);

		$out = $this->_get_template('author');

		$out = Upfront_MacroCodec::expand($out, "name", esc_html($name));
		$out = Upfront_MacroCodec::expand($out, "url", esc_url($url));

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

		$out = Upfront_MacroCodec::expand($out, "name", esc_html($name));
		$out = Upfront_MacroCodec::expand($out, "gravatar", $gravatar);

		return $out;
	}

	public function expand_comment_count_template () {
		$hide_empty = isset($this->_data['comment_count_hide'])
			? (int)$this->_data['comment_count_hide']
			: (int)Upfront_Posts_PostsData::get_default('comment_count_hide')
		;

		if ($hide_empty && empty($this->_post->comment_count)) return '';

		$out = $this->_get_template('comment_count');

		$out = Upfront_MacroCodec::expand($out, "comment_count", (int)($this->_post->comment_count));

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

		$out = Upfront_MacroCodec::expand($out, "thumbnail", $thumbnail);
		$out = Upfront_MacroCodec::expand($out, "resize", $resize_featured);

		return $out;
	}

	public function expand_title_template () {
		if (empty($this->_post->post_title)) return '';

		$title = esc_html(apply_filters('the_title', $this->_post->post_title));
		$permalink = get_permalink($this->_post->ID);

		$out = $this->_get_template('title');

		$out = Upfront_MacroCodec::expand($out, "permalink", $permalink);
		$out = Upfront_MacroCodec::expand($out, "title", $title);

		return $out;
	}

	public function expand_content_template () {
		$length = isset($this->_data['content_length'])
        	? (int)$this->_data['content_length']
        	: (int)Upfront_Posts_PostsData::get_default('content_length')
        ;
		$content = $this->_get_content_value($length);

		$out = $this->_get_template('content');

		$out = Upfront_MacroCodec::expand($out, "content", $content);

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

		$out = Upfront_MacroCodec::expand($out, "tags", $tags);

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

		$out = Upfront_MacroCodec::expand($out, "categories", $categories);

		return $out;
	}

	public function expand_read_more_template () {
		if (empty($this->_post->ID)) return '';
		if (!empty($this->_data['content']) && 'content' === $this->_data['content']) return ''; // Only for excerpts

		$permalink = get_permalink($this->_post->ID);

		$out = $this->_get_template('read_more');

		$out = Upfront_MacroCodec::expand($out, "permalink", $permalink);

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

		return Upfront_MacroCodec_Postmeta::expand_all($out, $this->_post);
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


/**
 * Standardized macro expansion hub.
 */
abstract class Upfront_MacroCodec {
	const OPEN = '{{';
	const CLOSE = '}}';

	protected static $_open;
	protected static $_close;

	/**
	 * Returns opening macro delimiter, unescaped.
	 * @return string Opening macro delimiter
	 */
	public static function open () {
		return !empty(self::$_open)
			? self::$_open
			: self::OPEN
		;
	}

	/**
	 * Returns closing macro delimiter, unescaped.
	 * @return string Closing macro delimiter
	 */
	public static function close () {
		return !empty(self::$_close)
			? self::$_close
			: self::CLOSE
		;
	}

	/**
	 * Returns compiled, preg_escape'd macro regex
	 * @param  string $part String part of the macro (macro name)
	 * @return string Final macro regex
	 */
	public static function get_regex ($part) {
		return '/' . preg_quote(self::open() . $part . self::close(), '/') . '/';
	}

	/**
	 * Extract all the macro tags from a string
	 * @param  string $content String to check
	 * @return array Collected macro tags
	 */
	public static function get_tags ($content) {
		$tags = $matches = array();
		if (empty($content)) return $tags;

		preg_match_all('/' . preg_quote(self::open(), '/') . '(.*)' . preg_quote(self::close(), '/') . '/', $content, $matches);
		if (!empty($matches[1])) $tags = $matches[1];

		return $tags;
	}

	/**
	 * Generic single macro expansion method
	 * @param  string $content Content to act on
	 * @param  string $tag Raw macro tag (name) to work with
	 * @param  string $value Value to replace macro with
	 * @return string Compiled content
	 */
	public static function expand ($content, $tag, $value) {
		if (empty($content)) return $content;
		if (empty($tag)) return $content;

		$macro = self::get_regex($tag);
		return preg_replace($macro, $value, $content);
	}
}

/**
 * Postmeta codec implementation.
 */
class Upfront_MacroCodec_Postmeta extends Upfront_MacroCodec {

	/**
	 * Expand known postmeta macros in the content
	 *
	 * Very literal, it will treat all the macros as postmeta macros.
	 *
	 * @param  string $content Content to expand macros in
	 * @param  mixed $post Post to fetch metas for
	 * @return string Expanded content
	 */
	public static function expand_all ($content, $post) {
		if (empty($content)) return $content;
		if (empty($post)) return $content;

		$tags = self::get_tags($content);
		if (empty($tags)) return $content;

		$post_id = false;
		if (!is_object($post) && is_numeric($post)) {
			$post_id = $post;
			$post = get_post($post_id);
		} else {
			$post_id = !empty($post->ID) ? $post->ID : false;
		}

		$metadata = Upfront_PostmetaModel::get_post_meta_fields($post_id, $tags);

		foreach ($metadata as $item) {
			if (empty($item['meta_key'])) continue;

			$key = $item['meta_key'];
			$value = isset($item['meta_value']) ? $item['meta_value'] : '';

			$value = apply_filters('upfront-postmeta-value',
				apply_filters("upfront-postmeta-{$key}-value", $value, $post_id),
				$value, $post_id, $key
			);

			$content = preg_replace(self::get_regex($key), $value, $content);
		}

		// Re-iterate through tags and null out empty replacement macros.
		foreach ($tags as $tag) {
			$content = preg_replace(self::get_regex($tag), '', $content);
		}

		return $content;
	}
}
