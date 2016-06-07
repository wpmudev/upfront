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
		
		$featured_data = $featured_class = '';
		
		$data = get_post_meta($this->_post->ID, '_thumbnail_data', true);

		$resize_featured = isset($this->_data['resize_featured'])
			? (int)$this->_data['resize_featured']
			: (int)Upfront_Posts_PostsData::get_default('resize_featured')
		;

		$img_src = $this->get_pre_selected();
		if ( empty($img_src) ) {
			if ( $this->_editor ) { // Always use full size image for editor rendering
				$img_src = $this->_get_full_image();
			}
			else {
				$img_src = $this->_get_thumbnail(true);
				
				// We need this only for front-end
				if (!empty($data) && ($data['imageSize']['width'] < $data['maskSize']['width'] || $data['imageSize']['height'] < $data['maskSize']['height'])) {
					$featured_data = "data-featured-image='{ \"offsetTop\": ". -$data['imageOffset']['top'] .", \"offsetLeft\": ". -$data['imageOffset']['left'] .", \"offsetWidth\": ". $data['maskSize']['width'] .", \"offsetHeight\": ". $data['maskSize']['height'] ." }'";
					$featured_class = 'class="upfront-featured-image-smaller"';
				}
				
				if(empty($data)) {
					$featured_class = 'class="upfront-featured-image-fit-wrapper"';
				}
			}
		}
		$thumbnail = ( !empty($img_src) )
			? '<img src="'. $img_src .'" '.$featured_class.' '.$featured_data.' />'
			: ''
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
	private function _get_thumbnail ($src = false) {
		
		if (empty($this->_post->ID)) return '';
		
		$image_size = '';
		
		$full_featured = isset($this->_data['full_featured_image'])
			? (int)$this->_data['full_featured_image']
			: (int)Upfront_Posts_PostsData::get_default('full_featured_image')
		;
		
		if(empty($_POST) && !$full_featured) {
			$image_size = 'uf_post_featured_image';
		}
	
		return upfront_get_edited_post_thumbnail($this->_post->ID, $src, $image_size);
	}

	/**
	 * Get full featured image for the current given post
	 *
	 * @return string Image src
	 */
	private function _get_full_image () {
		$post_thumbnail_id = get_post_thumbnail_id($this->_post);
		if ( $post_thumbnail_id ) {
			$attachment = wp_get_attachment_image_src($post_thumbnail_id, 'full');
			if ( is_array($attachment) ) return $attachment[0];
		}
		return '';
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