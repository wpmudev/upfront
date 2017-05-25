<?php

class Upfront_Post_Data_PartView_Post_data extends Upfront_Post_Data_PartView {

	public $pre_set_title = '',
		$pre_set_content = ''
	;

	protected static $_parts = array(
		0 => 'date_posted',
		1 => 'title',
		2 => 'content',
	);

	/**
	 * Converts the date posted part into markup.
	 *
	 * Supported macros:
	 *    {{timestamp}} - Raw timestamp (UNIX timestamp)
	 *    {{wp_date}} - Date formatted according to raw WP setting
	 *    {{wp_time}} - Date formatted according to raw WP setting
	 *    {{date}} - Date in selected format
	 *    {{date_<N>}} - (where N=1,2,3...) Date part formatted by the portion of format indicated by N. Format is split on whitespace (` `).
	 *
	 * Part template: post-data-date_posted
	 *
	 * @return string
	 */
	public function expand_date_posted_template () {
		if (empty($this->_post->post_date)) return '';

		$time = strtotime($this->_post->post_date);
		if (empty($time)) return '';

		$predefined_format = !empty($this->_data['predefined_date_format'])
			? $this->_data['predefined_date_format']
			: false
		;

		$wp_date = Upfront_Cache_Utils::get_option('date_format');
		$wp_time = Upfront_Cache_Utils::get_option('time_format');
		$date_format = false;
		if (!empty($predefined_format)) {
			$date_format = $predefined_format;
			$date_format = preg_replace('/(^|\b)wp_date(\b|$)/', $wp_date, $date_format);
			$date_format = preg_replace('/(^|\b)wp_time(\b|$)/', $wp_time, $date_format);
		} else {
			$date_format = !empty($this->_data['date_posted_format'])
				? $this->_data['date_posted_format']
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
		$out = Upfront_Codec::get()->expand($out, "date", date_i18n($date_format, $time));
		$out = Upfront_Codec::get()->expand($out, "time", date_i18n($wp_time, $time));

		$out = Upfront_Codec::get()->expand($out, "wp_date", date_i18n($wp_date, $time));
		$out = Upfront_Codec::get()->expand($out, "wp_time", date_i18n($wp_time, $time));

		return $out;
	}

	/**
	 * Converts the title part of the main post data part into markup.
	 *
	 * For real-time title changes even not yet saved.
	 *
	 * @return string
	 */
	public function expand_title_template () {

		$set_title = $this->get_pre_post_title();
		$title = ( empty($set_title) )
			? $this->_post->post_title
			: $this->get_pre_post_title()
		;

		$out = $this->_get_template('title');
		$out = Upfront_Codec::get()->expand($out, "title", $title);

		return $out;
	}

	/**
	 * Sets post title for real-time change.
	 */
	public function set_pre_post_title ($title) {
		$this->pre_set_title = $title;
	}

	/**
	 * Gets real-time value for title.
	 */
	public function get_pre_post_title () {
		return $this->pre_set_title;
	}

	/**
	 * Converts the content part of the main post data part into markup.
	 *
	 * Allows for optional content splitting.
	 *
	 * Supported macros:
	 *    {{content}} - Post content, or content part if splitting allowed
	 *
	 * Part template: post-data-content
	 *
	 * @return string
	 */
	public function expand_content_template () {
/*
// @NOTE: Commented this portion out on 2016-03-03
		$length = isset($this->_data['content_length'])
			? (int)$this->_data['content_length']
			: (int)Upfront_Posts_PostsData::get_default('content_length')
		;
// @NOTE: We don't need content vs excerpt in here, that's the premise
*/
		// @NOTE: no more length detection
		$length = false;
		// @NOTE: also see the JS part in js/modules-post_data.js

		$this->_data['content'] = !empty($length) ? 'excerpt' : 'content';

		$set_content = $this->get_pre_content();

		$content = ( $set_content )
			? $set_content
			: $this->_get_content_value($length)
		;

		$allow_splitting = !empty($this->_data['allow_splitting'])
			? (int)$this->_data['allow_splitting']
			: false
		;
		$part = !empty($this->_data['content_part'])
			? (int)$this->_data['content_part']
			: false
		;
		$trigger_splitters = !empty($this->_data['trigger_splitters'])
			? (int)$this->_data['trigger_splitters']
			: false
		;

		// First, let's auto-convert all the sequences to splitter marks
		if ($trigger_splitters) {
			$content = preg_replace('/<p[^>]+>(<br\s?\/?>|\s+)*?<\/p>/', $this->_get_content_part_separator(), $content);
		}

		if (!empty($allow_splitting) || !empty($part)) {
			if (!empty($part)) {
				if (!$this->_has_content_parts($content) && $part > 1) return ''; // We have a post with no parts, and multiple content
				$content = $this->_get_content_part($part, $content);
			}
		}

		$content = apply_filters('upfront-postdata_get_markup_after', $content, $this->_post);
/*
		$left_indent = !empty($this->_data['left_indent']) && is_numeric($this->_data['left_indent'])
			? (int)$this->_data['left_indent']
			: 0
		;

		$right_indent = !empty($this->_data['right_indent']) && is_numeric($this->_data['right_indent'])
			? (int)$this->_data['right_indent']
			: 0
		;
		if ($right_indent < 0) $right_indent = 0;

		$grid = Upfront_Grid::get_grid();
		$breakpoint = $grid->get_default_breakpoint();
		$col_size = $breakpoint->get_column_width();

		$full = $this->_get_object_col('content');

		$half = (int)(($full - 1) / 2);
		$paddings = array();

		if (!empty($left_indent) &&  $left_indent > 0 && $left_indent <= $half) {
			$paddings['left'] = 'padding-left:' . $left_indent * $col_size . 'px';
		}
		if (!empty($right_indent) && $right_indent > 0 && $right_indent <= $half) {
			$paddings['right'] = 'padding-right:' . $right_indent * $col_size . 'px';
		}
		$content = '<div class="upfront-indented_content" style="' . esc_attr(join(";", $paddings)) . '">' . $content . '</div>';
*/
		$content = '<div class="upfront-indented_content">' . $content . '</div>';
		$out = $this->_get_template('content');

		$out = Upfront_Codec::get()->expand($out, "content", $content);

		return $out;
	}

	/**
	 * Sets post content for real-time change.
	 */
	public function set_pre_content ($content) {
		$this->pre_set_content = $content;
	}

	/**
	 * Gets real-time value for content.
	 */
	public function get_pre_content () {
		return $this->pre_set_content;
	}

	/**
	 * Propagate the role attribute.
	 *
	 * @return string ARIA role attribute for this part
	 */
	public function get_propagated_attr () {
		return 'role="main"';
	}

	/**
	 * Check if the content has any part markers.
	 *
	 * @param string $content Content to check for markers
	 *
	 * @return bool
	 */
	private function _has_content_parts ($content) {
		return count($this->_get_content_parts($content)) > 1;
	}

	/**
	 * Get specific content part
	 *
	 * @param int $part Part to get (in order)
	 * @param string $content Content to process and extract the requested part from
	 *
	 * @return string Requested part or empty string
	 */
	private function _get_content_part ($part, $content) {
		$parts = $this->_get_content_parts($content);
		$part -= 1; // Mortals count from 1
		return isset($parts[$part]) ? $parts[$part] : '';

	}

	/**
	 * Split the content into parts and return all parts
	 *
	 * @param string $content Content to process
	 *
	 * @return array All content parts
	 */
	private function _get_content_parts ($content) {
		$separator = $this->_get_content_part_separator();
		$parts = preg_split(
			'/(<p>\s*)?' . // Optional paragraph start, potentially added by `wpautop`
			preg_quote($separator, '/') .
			'(\s*<\/p>)?/', // Match optional paragraph end
		$content);
		return array_values(array_filter(array_map('trim', $parts)));
	}

	/**
	 * Get the raw content splitting marker
	 *
	 * @return string
	 */
	private function _get_content_part_separator () {
		return '<hr class="content-splitter" />';
	}
}
