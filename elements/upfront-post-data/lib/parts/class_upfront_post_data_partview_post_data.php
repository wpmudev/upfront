<?php

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
		$parts = preg_split('/(<p>\s*)?' . preg_quote($separator, '/') . '(\s*<\/p>)?/', $content);
		return array_values(array_filter(array_map('trim', $parts)));
	}

	private function _get_content_part_separator () {
		return '<hr />';
	}
}