<?php

class Upfront_Post_Data_PartView_Featured_Image extends Upfront_Post_Data_PartView {
	
	public $pre_selected_featured_image = '';
	
	protected static $_parts = array(
		0 => 'featured_image',
	);

	/**
	 * Converts the featured image part into markup.
	 *
	 * Supported macros:
	 *    {{thumbnail}} - Featured image markup (`<img />`)
	 *    {{resize}} - Resize boolean
	 *    {{fallback}} - Fallback info (attributes) for cases when we're missing a featured image
	 *    {{permalink}} - Post permalink
	 *
	 * Part template: post-data-featured_image
	 *
	 * @return string
	 */
	public function expand_featured_image_template () {
		
		if (empty($this->_post->ID)) return '';
		
		$data = get_post_meta($this->_post->ID, '_thumbnail_data', true);

		$resize_featured = isset($this->_data['resize_featured'])
			? (int)$this->_data['resize_featured']
			: (int)Upfront_Posts_PostsData::get_default('resize_featured')
		;

		$pre_selected = $this->get_pre_selected();
		$thumbnail = ( !empty($pre_selected) )
			? '<img src="'. $this->get_pre_selected() .'" />'
			: $this->_get_thumbnail()
		;

		// Let's deal with the fallback options
		$fallback = false;
		if (empty($thumbnail)) {
			$fallback_option = !empty($this->_data['fallback_option'])
				? $this->_data['fallback_option']
				: Upfront_Posts_PostsData::get_default('fallback_option')
			;

			// Hide fallback
			if (empty($fallback_option) || 'hide' === $fallback_option) {
				if ( !$this->_editor ) return '';
				$fallback = 'data-fallback="hide"';
			}

			// Solid color fallback
			if ('color' === $fallback_option) {
				$color = !empty($this->_data['fallback_color'])
					? $this->_data['fallback_color']
					: Upfront_Posts_PostsData::get_default('fallback_color')
				;
				if (!empty($color) && preg_match('/^(#|rgba?)/', $color)) {
					// Assign some inline CSS to make this happen - the absolute positioning is within relative container.
					$fallback = sprintf('style="background-color: %s;" data-fallback="color"', $color);
				}
			}

			// Image fallback
			if ('image' === $fallback_option) {
				$image = !empty($this->_data['fallback_image'])
					? $this->_data['fallback_image']
					: Upfront_Posts_PostsData::get_default('fallback_image')
				;
				if (!empty($image)) $thumbnail = '<img class="featured-image fallback-image" src="' . esc_url($image) . '" />';
			}
		}

		$out = $this->_get_template('featured_image');

		$out = Upfront_Codec::get()->expand($out, "thumbnail", $thumbnail);
		$out = Upfront_Codec::get()->expand($out, "resize", $resize_featured);
		$out = Upfront_Codec::get()->expand($out, "fallback", $fallback);
		$out = Upfront_Codec::get()->expand($out, "permalink", get_permalink($this->_post->ID));

		return $out;
	}
	
	public function set_pre_selected ($selected) {
		$this->pre_selected_featured_image = $selected;
	}
	
	public function get_pre_selected () {
		return $this->pre_selected_featured_image;
	}

	/**
	 * Gets the thumbnail in proper size for the current given post
	 *
	 * @return string Thumbnail markup, can also be an empty string
	 */
	private function _get_thumbnail () {
		
		if (empty($this->_post->ID)) return '';
		
		$image_size = '';
		
		$full_featured = isset($this->_data['full_featured_image'])
			? (int)$this->_data['full_featured_image']
			: (int)Upfront_Posts_PostsData::get_default('full_featured_image')
		;
		
		if(empty($_POST)) {
			$image_size = 'uf_post_featured_image';
		}
	
		return $full_featured == 1
			? get_the_post_thumbnail($this->_post->ID)
			: upfront_get_edited_post_thumbnail($this->_post->ID, false, $image_size)
		;
	}

	/**
	 * Determine if we have some extra classes to propagate.
	 *
	 * @return array List of classes to propagate upwards
	 */
	public function get_propagated_classes () {
		$classes = array();
		$thumbnail = $this->_get_thumbnail();

		if (!empty($thumbnail)) return $classes;

		$classes[] = 'no-featured_image';

		$fallback_option = !empty($this->_data['fallback_option'])
			? $this->_data['fallback_option']
			: Upfront_Posts_PostsData::get_default('fallback_option')
		;
		if (empty($fallback_option)) return array();

		$classes[] = sanitize_html_class("fallback_{$fallback_option}");

		return $classes;
	}
}