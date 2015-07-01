<?php

class Upfront_Post_Data_PartView_Post_data extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'date_posted',
		1 => 'title',
		2 => 'content',
	);

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
		$length = isset($this->_data['content_length'])
        	? (int)$this->_data['content_length']
        	: (int)Upfront_Posts_PostsData::get_default('content_length')
        ;
		$this->_data['content'] = !empty($this->_data['content']) ? $this->_data['content'] : 'content'; // Make sure it's the content we're dealing with
		$content = $this->_get_content_value($length);

		$allow_splitting = !empty($this->_data['allow_splitting'])
			? (int)$this->_data['allow_splitting']
			: false
		;
		$part = !empty($this->_data['content_part'])
			? (int)$this->_data['content_part']
			: false
		;

		if (!empty($allow_splitting) || !empty($part)) {
			if (!empty($part)) {
				if (!$this->_has_content_parts($content) && $part > 1) return ''; // We have a post with no parts, and multiple content
				$content = $this->_get_content_part($part, $content);
			}
		}

		$out = $this->_get_template('content');

		$out = Upfront_Codec::get()->expand($out, "content", $content);

		return $out;
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
		return '<hr />';
	}
}