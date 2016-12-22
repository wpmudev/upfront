<?php

class Upfront_Compat_AS3CF {
	
	protected $additional_paths = array();

	public function __construct() {
		$this->add_hooks();
	}

	public function add_hooks() {
		if (class_exists('Amazon_S3_And_CloudFront') === false) return;
		
		add_action('upfront-media-images-image_changed', array($this, 'on_image_changed'), 10, 5);
		add_filter('as3cf_attachment_file_paths', array($this, 'add_used_image_paths'), 10, 3);
	}

	/**
	 * This is called when image is resized/cropped in Upfront editor
	 * 
	 * Call wp_update_attachment_metadata as that is what AS3CF plugin hooked when uploading image
	 * 
	 * @param $imagepath
	 * @param $url
	 * @param $saved
	 * @param $used
	 * @param $imageData
	 */
	public function on_image_changed($imagepath, $url, $saved, $used, $imageData) {
		$element_id = !empty($imageData['element_id']) ? $imageData['element_id'] : 0;
		$this->additional_paths[$element_id] = $imagepath;
		
		$data = wp_get_attachment_metadata($imageData['id'], true);
		wp_update_attachment_metadata($imageData['id'], $data);
	}

	/**
	 * Add additional paths from element cropped images
	 * 
	 * @param $paths
	 * @param $attachment_id
	 * @param $meta
	 * @return mixed
	 */
	public function add_used_image_paths($paths, $attachment_id, $meta) {
		foreach ( $this->additional_paths as $element_id => $image ) {
			$paths[$element_id] = $image;
		}
		return $paths;
	}
	
	

}
