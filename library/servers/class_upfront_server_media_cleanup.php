<?php

/**
 * Periodically boots up to clean up the unused crops, if any are left around.
 */
class Upfront_Server_MediaCleanup implements IUpfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	public static function schedule () {
		$me = new self;
		$me->media_cleanup();
	}

	private function _add_hooks () {
		//add_action('wp', array($this, 'media_cleanup'));
	}

	public function media_cleanup () {
		$media = $this->_get_cleanup_chunk();
		if (empty($media)) return false;

		foreach ($media as $item) $this->_cleanup_item_remnants($item);
	}

	private function _get_cleanup_chunk () {
		$yesterday = strtotime("yesterday");
		$never_cleaned = new WP_Query(array(
			'post_type' => 'attachment',
			'post_status' => 'any',
			'posts_per_page' => -1,
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'upfront_used_image_sizes',
					'compare' => 'EXISTS',
				),
				array(
					'key' => 'upfront_media_cleanup_time',
					'value' => $yesterday, // @see https://core.trac.wordpress.org/ticket/23268
					'compare' => 'NOT EXISTS',
				)
			),
		));
		$old_cleaned = new WP_Query(array(
			'post_type' => 'attachment',
			'post_status' => 'any',
			'posts_per_page' => -1,
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'upfront_used_image_sizes',
					'compare' => 'EXISTS',
				),
				array(
					'key' => 'upfront_media_cleanup_time',
					'value' => $yesterday,
					'compare' => '<',
				)
			),
		));
		return array_merge(
			$never_cleaned->posts,
			$old_cleaned->posts
		);
	}

	private function _cleanup_item_remnants ($item) {
		$used = array();

		// Used by Upfront image-ish elements (image, gallery, slider)
		$sizes = get_post_meta($item->ID, 'upfront_used_image_sizes', true);
		if (!empty($sizes)) foreach ($sizes as $size) {
			$used[] = $size['path'];
		}

		// Root file
		$path = get_attached_file($item->ID);
		if (empty($path)) return false;
		$used[] = $path;

		// Default thumbnails
		$meta = wp_get_attachment_metadata($item->ID);
		if (!empty($meta['sizes'])) foreach ($meta['sizes'] as $thumb) {
			if (empty($thumb['file'])) continue;
			$metapath = trailingslashit(pathinfo($path, PATHINFO_DIRNAME)) . $thumb['file'];
			if (file_exists($metapath)) $used[] = $metapath;
		}

		// Cleanup if duplicates crept in somehow
		$used = array_unique($used);

		$glob_expression = preg_replace('/(' . preg_quote(pathinfo($path, PATHINFO_FILENAME), '/') . ')\.(jpg|jpeg|gif|png)$/i', '$1*.$2', $path);
		$all_files = glob($glob_expression);

		foreach ($all_files as $file) {
			if (in_array($file, $used)) continue;
			// Alright, this could be ripe for removal - EXCEPT, it might also be rotated image...
			if (preg_match('/-r\d+$/', pathinfo($file, PATHINFO_FILENAME))) continue; // Is it?

			// ACTUALLY REMOVE THE IMAGE HERE!!!
			//@unlink($file);
		}
		update_post_meta($item->ID, 'upfront_media_cleanup_time', time());
	}
}
//add_action('init', array('Upfront_Server_MediaCleanup', 'serve'), 0);
//add_action('upfront_hourly_schedule', array('Upfront_Server_MediaCleanup', 'schedule'));