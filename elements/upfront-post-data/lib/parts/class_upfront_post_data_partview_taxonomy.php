<?php

class Upfront_Post_Data_PartView_Taxonomy extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'tags',
		1 => 'categories'
	);

	/**
	 * Converts the categories part into markup.
	 *
	 * Supported macros:
	 *    {{categories}} - Comma-separated list of categories for the current post
	 *
	 * Part template: post-data-categories
	 *
	 * @return string
	 */
	public function expand_categories_template () {
		if (empty($this->_post->ID)) return '';

		$categories = get_the_category_list(', ', '', $this->_post->ID);
		if (empty($categories)) return '';

		$length = isset($this->_data['categories_limit'])
        	? (int)$this->_data['categories_limit']
        	: (int)Upfront_Posts_PostsData::get_default('categories_limit')
        ;

        $separator = isset($this->_data['categories_separator'])
        	? $this->_data['categories_separator']
        	: ' | '
        ;

        if ($length) {
			$list = array_map('trim', explode(',', $categories));
			$categories = join($separator, array_slice($list, 0, $length));
		}

		$out = $this->_get_template('categories');

		$out = Upfront_Codec::get()->expand($out, "categories", $categories);

		return $out;
	}

	/**
	 * Converts the tags part into markup.
	 *
	 * Supported macros:
	 *    {{tags}} - Comma-separated list of tags for the current post
	 *
	 * Part template: post-data-tags
	 *
	 * @return string
	 */
	public function expand_tags_template () {
		if (empty($this->_post->ID)) return '';

		$tags = get_the_tag_list('', ', ', '', $this->_post->ID);
		if (empty($tags)) return '';

		$length = isset($this->_data['tags_limit'])
        	? (int)$this->_data['tags_limit']
        	: (int)Upfront_Posts_PostsData::get_default('tags_limit')
        ;

        $separator = isset($this->_data['tags_separator'])
        	? $this->_data['tags_separator']
        	: ', '
        ;

        if ($length) {
			$list = array_map('trim', explode(',', $tags));
			$tags = join($separator, array_slice($list, 0, $length));
		}


		$out = $this->_get_template('tags');

		$out = Upfront_Codec::get()->expand($out, "tags", $tags);

		return $out;
	}

}