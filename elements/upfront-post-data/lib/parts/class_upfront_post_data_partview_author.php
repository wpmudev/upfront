<?php

class Upfront_Post_Data_PartView_Author extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'author',
		1 => 'gravatar',
		2 => 'email',
		3 => 'url',
		4 => 'bio',
	);

	/**
	 * Converts the email part into markup.
	 *
	 * Supported macros:
	 *    {{name}} - Author display_name
	 *    {{email}} - Author email
	 *
	 * Part template: post-data-author_email
	 *
	 * @return string
	 */
	public function expand_email_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		$email = sanitize_email(get_the_author_meta('user_email', $author));

		if (!is_email($email)) $email = '';

		$out = $this->_get_template('author_email');

		$out = Upfront_Codec::get()->expand($out, "name", esc_html($name));
		$out = Upfront_Codec::get()->expand($out, "email", esc_attr($email));

		return $out;
	}	
	
	/**
	 * Converts the URL part into markup.
	 *
	 * Supported macros:
	 *    {{name}} - Author display_name
	 *    {{url}} - Author's website URL (WP profile field value). Falls back to author's local posts URL
	 *
	 * Part template: post-data-author_url
	 *
	 * @return string
	 */
	public function expand_url_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		
		$author_url = get_author_posts_url($author);
		$url = get_the_author_meta('url', $author);
		if (empty($url)) $url = $author_url;

		$out = $this->_get_template('author_url');

		$out = Upfront_Codec::get()->expand($out, "name", esc_html($name));
		$out = Upfront_Codec::get()->expand($out, "url", esc_url($url));

		return $out;
	}

	/**
	 * Converts the bio part into markup.
	 *
	 * Supported macros:
	 *    {{bio}} - Author's description (WP profile field value). Does NOT support HTML.
	 *
	 * Part template: post-data-author_bio
	 *
	 * @return string
	 */
	public function expand_bio_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$description = get_the_author_meta('description', $author);

		$out = $this->_get_template('author_bio');

		$out = Upfront_Codec::get()->expand($out, "bio", esc_html($description));

		return $out;
	}

}