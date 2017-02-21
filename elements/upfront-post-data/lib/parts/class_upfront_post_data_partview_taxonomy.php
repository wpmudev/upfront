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

		$categories = is_numeric($this->_post->ID)
			? get_the_category_list(', ', '', $this->_post->ID)
			: $this->_stub_category_list_for_builder()
		;
		if (empty($categories)) return '';

		$length = isset($this->_data['categories_limit'])
			? (int)$this->_data['categories_limit']
		 	: (int)Upfront_Posts_PostsData::get_default('categories_limit')
		 ;

		$separator = isset($this->_data['categories_separator'])
			? $this->_data['categories_separator']
			: ' | '
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

	/**
	 * Spawns a stub categories output for builder
	 *
	 * @return string
	 */
	private function _stub_category_list_for_builder () {
		$cat_ids = get_categories(array(
			'hide_empty' => true,
			'fields' => 'ids',
		));
		if (empty($cat_ids)) return false;

		$query = new WP_Query(array(
			'category__in' => array_filter(array_values($cat_ids)),
			'posts_per_page' => 1,
			'fields' => "ids",
		));
		$post_id = !empty($query->posts[0])
			? $query->posts[0]
			: false
		;
		return $post_id
			? get_the_category_list(', ', '', $post_id)
			: false
		;
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

		$length = isset($this->_data['tags_limit'])
			? (int)$this->_data['tags_limit']
			: (int)Upfront_Posts_PostsData::get_default('tags_limit')
		;

		$separator = isset($this->_data['tags_separator'])
			? $this->_data['tags_separator']
			: ', '
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

	/**
	 * Spawns a stub tags output for builder
	 *
	 * @return string
	 */
	private function _stub_tag_list_for_builder () {
		$tag_ids = get_tags(array(
			'hide_empty' => true,
			'fields' => 'ids',
		));
		if (empty($tag_ids)) return false;

		$query = new WP_Query(array(
			'tag__in' => array_filter(array_values($tag_ids)),
			'posts_per_page' => 1,
			'fields' => "ids",
		));
		$post_id = !empty($query->posts[0])
			? $query->posts[0]
			: false
		;
		return $post_id
			? get_the_tag_list('', ', ', '', $post_id)
			: false
		;
	}

}
