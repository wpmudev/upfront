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

		return $this->_wrap_post($out);
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
		
		$out = $this->_get_template('date_posted');

		$out = preg_replace($this->_get_regex('date'), date(get_option('date_format'), $time), $out);
		$out = preg_replace($this->_get_regex('time'), date(get_option('time_format'), $time), $out);
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

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		$gravatar = get_avatar($author, 32, null, $name);

		$out = $this->_get_template('gravatar');
		
		$out = preg_replace($this->_get_regex('name'), esc_html($name), $out);
		$out = preg_replace($this->_get_regex('gravatar'), $gravatar, $out);

		return $out;
	}

	public function expand_comment_count_template () {
		if (empty($this->_post->comment_count)) return '';

		$out = $this->_get_template('comment_count');

		$out = preg_replace($this->_get_regex('comment_count'), (int)($this->_post->comment_count), $out);
		
		return $out;
	}

	public function expand_featured_image_template () {
		if (empty($this->_post->ID)) return '';

		$thumbnail = get_the_post_thumbnail($this->_post->ID);

		$out = $this->_get_template('thumbnail');
		
		$out = preg_replace($this->_get_regex('thumbnail'), $thumbnail, $out);

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
		$content = $this->_get_content_value();

		$out = $this->_get_template('content');

		$out = preg_replace($this->_get_regex('content'), $content, $out);

		return $out;
	}

	public function expand_tags_template () {
		if (empty($this->_post->ID)) return '';
		
		$tags = get_the_tag_list('', ', ', '', $this->_post->ID);
		if (empty($tags)) return '';

		$out = $this->_get_template('tags');

		$out = preg_replace($this->_get_regex('tags'), $tags, $out);

		return $out;
	}

	public function expand_categories_template () {
		if (empty($this->_post->ID)) return '';
		
		$categories = get_the_category_list(', ', '', $this->_post->ID);
		if (empty($categories)) return '';

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
	private function _get_content_value () {
		return !empty($this->_data['content']) && 'content' === $this->_data['content']
			? $this->_get_content()
			: $this->_get_excerpt()
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
	 * @return string Post excerpt
	 */
	private function _get_excerpt () {
		if (!empty($this->_post->post_excerpt)) return wpautop($this->_post->post_excerpt);
		
		$excerpt = str_replace(array("\n", "\r"), '', strip_shortcodes(wp_strip_all_tags($this->_post->post_content)));
		// Just first 128 chars
		return wpautop(preg_replace('/^(.{128}).*$/mu', '\1', $excerpt));
	}

	/**
	 * Wraps post in appropriate markup.
	 * @param string $post Generated post markup.
	 * @return string Wrapped final post markup.
	 */
	protected function _wrap_post ($post) {
		return "<li class='uf-post'><article>{$post}</article></li>";
	}

	/**
	 * Loads post part template from a file.
	 * @param string $slug Post part template slug
	 * @return string Loaded template
	 */	
	private function _get_template ($slug) {
		$slug = preg_replace('/[^-_a-z0-9]/i', '', $slug);
		return upfront_get_template($slug, $this->_data, dirname(dirname(__FILE__)) . '/tpl/parts/' . $slug . '.php');
	}
}