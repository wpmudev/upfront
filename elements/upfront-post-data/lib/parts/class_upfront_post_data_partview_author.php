<?php

class Upfront_Post_Data_PartView_Author extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'author',
		1 => 'gravatar',
		2 => 'author_email',
		3 => 'author_url',
		4 => 'author_bio',
	);


	/**
	 * Converts the author part into markup.
	 *
	 * Supported macros:
	 *    {{name}} - Author's `display_name`
	 *    {{url}} - Author's posts URL (link to the author archive on local site)
	 *    {{target}} - Target for the URL
	 *
	 * Part template: post-data-author
	 *
	 * @return string
	 */
	public function expand_author_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;

		$name = get_the_author_meta('display_name', $author);
		if (!empty($this->_data['display_name'])) {	
			if ('first_last' === $this->_data['display_name'] || 'last_first' === $this->_data['display_name']) {
				$first = get_the_author_meta('first_name', $author);
				$last = get_the_author_meta('last_name', $author);
				if (!empty($first) && !empty($last)) {
					$name = 'first_last' === $this->_data['display_name']
						? "{$first} {$last}"
						: "{$last} {$first}"
					;
				}
			}
			
			if ('nickname' === $this->_data['display_name']) {
				$nick = get_the_author_meta('nickname', $author);
				if (!empty($nick)) $name = $nick;
			}

			if ('username' === $this->_data['display_name']) {
				$nick = get_the_author_meta('username', $author);
				if (!empty($nick)) $name = $nick;
			}
		}

		$url = ''; //
		if (!empty($this->_data['link'])) {
			if ('author' === $this->_data['link']) {
				$url = get_author_posts_url($author);
			}
			if ('website' === $this->_data['link']) {
				$link = get_the_author_meta('url', $author);
				if (!empty($link)) $url = $link;
			}
		}

		$target = '';
		if (!empty($this->_data['target'][0])) {
			$target = '_blank';
		}

		$out = $this->_get_template('author');

		$out = Upfront_Codec::get()->expand($out, "name", esc_html($name));
		$out = Upfront_Codec::get()->expand($out, "url", esc_url($url));
		$out = Upfront_Codec::get()->expand($out, "target", esc_attr($target));

		return $out;
	}

	/**
	 * Converts the email part into markup.
	 *
	 * Supported macros:
	 *    {{name}} - Author display_name
	 *    {{email}} - Author email
	 *    {{email_string}} - Email link text
	 *
	 * Part template: post-data-author_email
	 *
	 * @return string
	 */
	public function expand_author_email_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		$email_string = !empty($this->_data['email_link_text'])
			? esc_html(sanitize_text_field($this->_data['email_link_text']))
			: __('Email', 'upfront')
		;
		$email = sanitize_email(get_the_author_meta('user_email', $author));

		if (!is_email($email)) $email = '';

		$out = $this->_get_template('author_email');

		$out = Upfront_Codec::get()->expand($out, "name", esc_html($name));
		$out = Upfront_Codec::get()->expand($out, "email", esc_attr($email));
		$out = Upfront_Codec::get()->expand($out, "email_string", esc_html($email_string));

		return $out;
	}	
	
	/**
	 * Converts the URL part into markup.
	 *
	 * Supported macros:
	 *    {{name}} - Author display_name
	 *    {{url}} - Author's website URL (WP profile field value). Falls back to author's local posts URL
	 *    {{url_string}} - URL link text
	 *
	 * Part template: post-data-author_url
	 *
	 * @return string
	 */
	public function expand_author_url_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$name = get_the_author_meta('display_name', $author);
		$url_string = !empty($this->_data['link_text'])
			? esc_html(sanitize_text_field($this->_data['link_text']))
			: __('Website', 'upfront')
		;
		
		$author_url = get_author_posts_url($author);
		$url = get_the_author_meta('url', $author);
		if (empty($url)) $url = $author_url;

		$out = $this->_get_template('author_url');

		$out = Upfront_Codec::get()->expand($out, "name", esc_html($name));
		$out = Upfront_Codec::get()->expand($out, "url", esc_url($url));
		$out = Upfront_Codec::get()->expand($out, "url_string", esc_html($url_string));

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
	public function expand_author_bio_template () {
		if (empty($this->_post->post_author)) return '';

		$author = $this->_post->post_author;
		$description = get_the_author_meta('description', $author);

		$out = $this->_get_template('author_bio');

		$out = Upfront_Codec::get()->expand($out, "bio", esc_html($description));

		return $out;
	}

}