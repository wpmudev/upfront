<?php

class Upfront_MediaItem extends Upfront_Media {

	private $_post;

	public function __construct ($post) {
		$this->_post = $post;
	}

	public function to_php () {
		$label_objs = wp_get_object_terms($this->_post->ID, 'media_label');
		$labels = array();
		foreach ($label_objs as $label) {
			if (!is_object($label)) continue;
			$labels[] = $label->term_id;
		}
		$sizes = array();
		foreach(get_intermediate_image_sizes() as $info) {
			$size = is_array($info) && !empty($info['width']) && !empty($info['height'])
				? array($info['width'], $info['height'])
				: $info
			;
			$img = wp_get_attachment_image_src($this->_post->ID, $size);
			$sizes[] = array(
				"src" => $img[0],
				"width" => $img[1],
				"height" => $img[2],
				"resized" => $img[3],
			);
		}
		$image_data = wp_get_attachment_image_src($this->_post->ID, 'full');
		return array(
			'ID' => $this->_post->ID,
			'post_title' => $this->_post->post_title,
			'thumbnail' => wp_get_attachment_image($this->_post->ID, array(103, 75), true),
			'parent' => $this->_post->post_parent ? get_the_title($this->_post->post_parent) : false,
			'post_content' => $this->_post->post_content ? $this->_post->post_content : false,
			'post_excerpt' => $this->_post->post_excerpt ? $this->_post->post_excerpt : false,
			'original_url' => get_post_meta($this->_post->ID, 'original_url', true),
			'document_url' => esc_url(wp_get_attachment_url($this->_post->ID)),
			'labels' => $labels,
			'image' => array(
				"src" => esc_url($image_data[0]),
				"width" => $image_data[1],
				"height" => $image_data[2],
				"resized" => $image_data[3],
			),
			'additional_sizes' => $sizes,
		);
	}
}