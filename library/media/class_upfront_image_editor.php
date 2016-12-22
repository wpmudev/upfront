<?php


class Upfront_ImageEditor_Server extends Upfront_Server {
	
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}
	
	private function _add_hooks() {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront-media-image_sizes', array($this, "get_image_sizes"));
			upfront_add_ajax('upfront-media-image-create-size', array($this, "create_image_size"));
			upfront_add_ajax('upfront-media-image-save-sizes', array($this, "save_image_sizes"));
			upfront_add_ajax('upfront-media-video_info', array($this, "get_video_info"));
		}
		add_filter('upfront_l10n', array($this, 'add_l10n_strings'));
	}

	public function add_l10n_strings ($strings) {
		if (!empty($strings['image_editor'])) return $strings;
		$strings['image_editor'] = self::_get_l10n();
		return $strings;
	}

	public static function _get_l10n ($key=false) {
		$l10n = array(
			'no_images' => __("No images sent", 'upfront'),
			'not_allowed' => __("Not allowed", 'upfront'),
			'invalid_id' => __('Invalid image ID', 'upfront'),
			'no_id' => __('No image ID supplied', 'upfront'),
			'not_modifications' => __('Not modifications', 'upfront'), // wtf?
			'edit_error' => __('There was an error editing the image', 'upfront'),
			'save_error' => __('There was an error saving the edited image', 'upfront'),
			'not_found' => __('Images have not been found in local WordPress.', 'upfront'),
			'sel' => array(
				'preparing' => __('Preparing image', 'upfront'),
				'upload_error' => __('There was an error uploading the file. Please try again.', 'upfront'),
			),
			'ctrl' => array(
				'caption_display' => __('Caption visibility', 'upfront'),
				'caption_position_disabled' => __('Caption is disabled for images smaller or narrower than 100px', 'upfront'),
				'more_tools' => __('More tools', 'upfront')
			),
			'btn' => array(
				'fit_label' => __('Fit to Element', 'upfront'),
				'fit_info' => __('Adapt to the mask', 'upfront'),
				'exp_label' => __('IMG 100%', 'upfront'),
				'exp_info' => __('Expand image', 'upfront'),
				'save_label' => __('Ok', 'upfront'),
				'save_info' => __('Save image', 'upfront'),
				'fit_element' => __('Fit to Element', 'upfront'),
				'restore_label' => __('Restore image size', 'upfront'),
				'restore_info' => __('Reset image size', 'upfront'),
				'swap_image' => __('Swap Image', 'upfront'),
				'natural_size' => __('Natural Size', 'upfront'),
				'fit' => __('Fit', 'upfront'),
				'fill' => __('Fill', 'upfront'),
				'image_tooltip' => __('Image Controls', 'upfront'),
			),
			'template' => array(
				'drop_files' => __('Drop files here to upload', 'upfront'),
				'select_files' => __('Upload File', 'upfront'),
				'max_file_size' => sprintf(__('Maximum upload file size: %s', 'upfront'), upfront_max_upload_size_human()),
				'or_browse' => __('or browse your', 'upfront'),
				'media_gallery' => __('Media Gallery', 'upfront'),
				'uploading' => __('Uploading...', 'upfront'),
				'links_to' => __('Links to:', 'upfront'),
				'no_link' => __('No link', 'upfront'),
				'external_link' => __('External link', 'upfront'),
				'post_link' => __('Link to a post or page', 'upfront'),
				'larger_link' => __('Show larger image', 'upfront'),
				'ok' => __('Ok', 'upfront'),
				'move_image_nag' => __('To achieve full-width Image, please first move it so that there are no other elements in the way.', 'upfront'),
				'dont_show_again' => __('Don\'t show this message again', 'upfront'),
			),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

	function create_image_size(){
		$data = stripslashes_deep($_POST);

		if(! $data['images']) {
			return $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('no_images')));
		}

		@ini_set( 'memory_limit', apply_filters( 'upfront_memory_limit', WP_MAX_MEMORY_LIMIT ) );

		$images = array();

		foreach($data['images'] as $imageData){
			if(!$imageData['id']) continue;
			//return $this->_out(new Upfront_JsonResponse_Error("Invalid image ID"));

			//if(!current_user_can('edit_post', $imageData['id']) ){
			//if (!Upfront_Permissions::current(Upfront_Permissions::RESIZE, $imageData['id'])) {
			//	$images[$imageData['id']] = array('error' => true, 'msg' => self::_get_l10n('not_allowed'));
			//	continue;
			//wp_die( -1 );
			//}

			$image = get_post($imageData['id']);
			if( $image instanceof WP_Post && $image->post_mime_type == 'image/gif'){ //Gif are not really resized/croped to preserve animations
				$imageAttrs = wp_get_attachment_image_src( $imageData['id'], 'full' );
				$images[$imageData['id']] = $this->get_resized_gif_data($imageData, $imageAttrs);
			}
			else {
				$rotate = isset($imageData['rotate']) && is_numeric($imageData['rotate']) ? $imageData['rotate'] : false;
				$resize = isset($imageData['resize']) ? $imageData['resize'] : false;
				$crop = isset($imageData['crop']) ? $imageData['crop'] : false;

				$images[$imageData['id']] = self::resize_image($imageData);
			}
		}
		return $this->_out(new Upfront_JsonResponse_Success(array('images' => $images)));
	}
	
	function save_image_sizes() {
		$data = stripslashes_deep($_POST);
		
		if(! $data['images']) {
			return $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('no_images')));
		}

		$element_id = !empty($data['element_id']) ? $data['element_id'] : 0;
		
		if (!$element_id) {
			return $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('invalid_id')));
		}
		
		$images = array();
		$images_to_delete = array();

		// Find the used images and remove it from temporary option that will be cleaned
		foreach($data['images'] as $imageData){
			if(!$imageData['id']) continue;
			if(!$imageData['meta']) continue;
			$images[] = $imageData['meta'];

			// Save the image to list of used images
			$used = get_post_meta($imageData['id'], 'upfront_used_image_sizes', true);
			$used[$element_id] = $imageData['meta'];
			update_post_meta($imageData['id'], 'upfront_used_image_sizes', $used);
			
			// If there is prev url, add this image to delete list
			if (!empty($imageData['prev_url'])) {
				$prev_file = basename($imageData['prev_url']);
				$original_path = _load_image_to_edit_path($imageData['id']);
				$original_path_parts = pathinfo($original_path);
				$prev_filepath = $original_path_parts['dirname'] . '/' . $prev_file;
				if ( $prev_file != $original_path_parts['basename'] && file_exists($prev_filepath) ) {
					$images_to_delete[] = array(
						'path' => $prev_filepath
					);
				}
			}
		}

		// Clean unused images
		$temp_sizes = get_option('upfront_temp_image_sizes');
		if ( !empty($temp_sizes) && !empty($temp_sizes[$element_id]) ) {
			foreach ( $temp_sizes[$element_id] as $i => $image ) {
				$is_used = false;
				foreach ( $images as $used_img ) {
					if ( empty($used_img['path']) ) continue;
					if ( $used_img['path'] == $image['path'] ) {
						$is_used = true;
						break;
					}
				}
				if ( $is_used ) {
					unset($temp_sizes[$element_id][$i]);
					continue;
				}
				$images_to_delete[] = $image;
				unset($temp_sizes[$element_id][$i]);
			}
		}
		update_option('upfront_temp_image_sizes', $temp_sizes);
		
		// Now delete the images
		foreach ( $images_to_delete as $image ) {
			@unlink($image['path']);
			// Post processing hook
			do_action('upfront-media-images-image_deleted', $image['path'], $element_id );
		}
		
		return $this->_out(new Upfront_JsonResponse_Success(array('images' => $images)));
	}

	function get_resized_gif_data($resizeData, $imageAttrs){
		return array(
			'error' => 0,
			'url' => $imageAttrs[0],
			'urlOriginal' => $imageAttrs[0],
			'full' => $resizeData['resize'],
			'crop' => array('width' => $resizeData['crop']['width'], 'height' => $resizeData['crop']['height']),
			'gif' => 1
		);
	}

	function get_image_id_by_filename($filename) {
		global $wpdb;

		// Query post meta because it contains literal filename
		$query = $wpdb->prepare("SELECT post_id FROM $wpdb->postmeta WHERE meta_key = '_wp_attached_file' AND meta_value like '%%%s';", $filename);
		$image = $wpdb->get_col($query);
		if (is_array($image) && isset($image[0])) {
			return $image[0];
		}
		return null;
	}

	function get_image_sizes() {
		$data = stripslashes_deep($_POST);

		$item_id = !empty($data['item_id']) ? $data['item_id'] : false;
		if (!$item_id) $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('invalid_id')));

		$ids = json_decode($item_id);

		if (is_null($ids) || !is_array($ids)) $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('invalid_id')));

		$custom_size = isset($data['customSize']) && is_array($data['customSize']);

		// Try to find images from slider in database.
		if (function_exists('upfront_exporter_is_running') && upfront_exporter_is_running()) {
			// Convert image theme paths to image ids
			$image_ids = array();
			foreach ($ids as $id) {
				// Leave integers alone!
				if (is_numeric($id)) {
					$image_ids[] = $id;
					continue;
				}
				// Check if it really is image path
				if (!is_string($id) || strpos($id, 'images/') === false) {
					continue;
				}

				$slash = preg_quote('/', '/');
				$image_filename = preg_replace("/{$slash}?images{$slash}/", '', $id);
				$image_id = $this->get_image_id_by_filename($image_filename);
				if (!is_null($image_id)) {
					$image_ids[] = $image_id;
				}
				else {
					$full_img_path = get_stylesheet_directory() . DIRECTORY_SEPARATOR . ltrim($id, '/');
					if (file_exists($full_img_path)) {
						$image_ids[] = Upfront_ChildTheme::import_slider_image($id);
					}
				}
			}
			$ids = $image_ids;
			if (empty($ids)) {
				$this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('not_found')));
			}
		}


		$images = array();
		$intermediate_sizes = get_intermediate_image_sizes();
		$intermediate_sizes[] = 'full';
		foreach ($ids as $id) {
			$sizes = array();
			foreach ( $intermediate_sizes as $size ) {
				$image = wp_get_attachment_image_src( $id, $size);
				if ($image) $sizes[$size] = $image;
			}

			if($custom_size){
				$image_custom_size = self::calculate_image_resize_data($data['customSize'], array('width' => $sizes['full'][1], 'height' => $sizes['full'][2]));
				$image_custom_size['id'] = $id;
				if (!empty($data['element_id'])) $image_custom_size['element_id'] = $data['element_id'];
				$sizes['custom'] = $this->resize_image($image_custom_size);
				$sizes['custom']['editdata'] =$image_custom_size;
			}
			else
				$sizes['custom'] = $custom_size ? $data['customSize'] : array();
//			if ($custom_size) {
//				$image_custom_size = $this->calculate_image_resize_data($data['customSize'], array('width' => $sizes['full'][1], 'height' => $sizes['full'][2]));
//				$image_custom_size['id'] = $id;
//				if (!empty($data['element_id'])) {
//					$image_custom_size['element_id'] = $data['element_id'];
//				}
//				$sizes['custom'] = $this->resize_image($image_custom_size);
//				$sizes['custom']['editdata'] = $image_custom_size;
//			} else {
//				$sizes['custom'] = $custom_size ? $data['customSize'] : array();
//			}

			if (sizeof($sizes) != 0) $images[$id] = $sizes;
		}

		if (0 === sizeof($images)) $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('no_id')));

		$result = array(
			'given' => sizeof($ids),
			'returned' => sizeof($ids),
			'images' => $images
		);

		return $this->_out(new Upfront_JsonResponse_Success($result));
	}

	public static function resize_image($imageData) {
		$rotate = isset($imageData['rotate']) && is_numeric($imageData['rotate']) ? $imageData['rotate'] : false;
		$resize = isset($imageData['resize']) ? $imageData['resize'] : false;
		$crop = isset($imageData['crop']) ? $imageData['crop'] : false;

		if (!$rotate && !$resize && !$crop) {
			return array(
				'error' => true,
				'msg' => self::_get_l10n('not_modifications')
			);
		}

		$image_path = isset($imageData['image_path']) ? $imageData['image_path'] : _load_image_to_edit_path( $imageData['id'] );
		$image_editor = wp_get_image_editor( $image_path );

		if (is_wp_error($image_editor)) {
			return array(
				'error' => true,
				'msg' => self::_get_l10n('invalid_id')
			);
		}


		if ($rotate && !$image_editor->rotate(-$rotate)) return array(
			'error' => true,
			'msg' => self::_get_l10n('edit_error')
		);

		$full_size = $image_editor->get_size();
		//Cropping for resizing allows to make the image bigger
		if ($resize && !$image_editor->crop(0, 0, $full_size['width'], $full_size['height'], $resize['width'], $resize['height'], false)) {
			return array(
				'error' => true,
				'msg' => self::_get_l10n('edit_error')
			);
		}

		//$cropped = array(round($crop['left']), round($crop['top']), round($crop['width']), round($crop['height']));

		//Don't let the crop be bigger than the size
		$size = $image_editor->get_size();
		$crop = array(
			'top' => round($crop['top']),
			'left' => round($crop['left']),
			'width' => round($crop['width']),
			'height' => round($crop['height'])
		);

		if ($crop['top'] < 0) {
			$crop['height'] -= $crop['top'];
			$crop['top'] = 0;
		}
		if ($crop['left'] < 0) {
			$crop['width'] -= $crop['left'];
			$crop['left'] = 0;
		}

		if ($size['height'] < $crop['height']) $crop['height'] = $size['height'];
		if ($size['width'] < $crop['width']) $crop['width'] = $size['width'];


		if ($crop && !$image_editor->crop($crop['left'], $crop['top'], $crop['width'], $crop['height'])) {
			//if($crop && !$image_editor->crop($cropped[0], $cropped[1], $cropped[2], $cropped[3]))
			return $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('edit_error')));
		}

		// generate new filename
		$path = $image_path;
		$path_parts = pathinfo( $path );

		$filename = $path_parts['filename'] . '-' . $image_editor->get_suffix();
		if (!isset($imageData['skip_random_filename'])) $filename .=  '-' . rand(1000, 9999);

		$imagepath = $path_parts['dirname'] . '/' . $filename . '.' . $path_parts['extension'];

		$image_editor->set_quality(90);
		$saved = $image_editor->save($imagepath);

		if (is_wp_error( $saved )) {
			return array(
				'error' => true,
				'msg' => 'If images are moved from standard storage (e.g. via plugin that stores uploads to S3) Upfront does not have access. (' . implode('; ', $saved->get_error_messages()) . ')'
			);
		}

		if (is_wp_error($image_editor) || empty($imageData['id'])) {
			return array(
				'error' => true,
				'msg' => self::_get_l10n('save_error')
			);
		}

		$urlOriginal = wp_get_attachment_image_src($imageData['id'], 'full');
		$urlOriginal = $urlOriginal[0];
		$url  = str_replace($path_parts['basename'], $saved['file'], $urlOriginal);

		if ($rotate) {
			//We must do a rotated version of the full size image
			$fullsizename = $path_parts['filename'] . '-r' . $rotate ;
			$fullsizepath = $path_parts['dirname'] . '/' . $fullsizename . '.' . $path_parts['extension'];
			if (!file_exists($fullsizepath)) {
				$full = wp_get_image_editor(_load_image_to_edit_path($imageData['id']));
				$full->rotate(-$rotate);
				$full->set_quality(90);
				$savedfull = $full->save($fullsizepath);
			}
			$urlOriginal = str_replace($path_parts['basename'], $fullsizename . '.' . $path_parts['extension'], $urlOriginal);
		} // We won't be cleaning up the rotated fullsize images


		$element_id = !empty($imageData['element_id']) ? $imageData['element_id'] : 0;
		
		// Store this resizing as temporary crops
		$temp_sizes = get_option('upfront_temp_image_sizes');
		if ( !is_array($temp_sizes) ) $temp_sizes = array();
		if ( !isset($temp_sizes[$element_id]) ) $temp_sizes[$element_id] = array();
		$temp_sizes[$element_id][] = $saved;
		update_option('upfront_temp_image_sizes', $temp_sizes);

// *** ALright, so this is the magic cleanup part
		// Drop the old resized image for this element, if any
		/*$used = get_post_meta($imageData['id'], 'upfront_used_image_sizes', true);
		if (!empty($used) && !empty($used[$element_id]['path']) && file_exists($used[$element_id]['path'])) {
			// OOOH, so we have a previos crop!
			//TODO ok so we don't do this anymore because it causes any element that uses images to
			// have a broken image if user have not saved layout after croping image or resizing thumbnails.
			// This have to be mplemented better so it does not lead to broken images.
			// @unlink($used[$element_id]['path']); // Drop the old one, we have new stuffs to replace it
		}
		$used[$element_id] = $saved; // Keep track of used elements per element ID
		update_post_meta($imageData['id'], 'upfront_used_image_sizes', $used);*/
// *** Flags updated, files clear. Moving on

		if (!empty($imagepath) && !empty($url)) {
			/**
			 * Image has been successfully changed. Trigger any post-processing hook.
			 *
			 * @param string $imagepath Path to the newly created image
			 * @param string $url Newly changed image URL
			 * @param array $saved Processing data
			 * @param array $used Image Metadata
			 * @param array $imageData
			 */
			do_action('upfront-media-images-image_changed', $imagepath, $url, $saved, $used, $imageData );
		}

		return array(
			'error' => false,
			'url' => $url,
			'urlOriginal' => $urlOriginal,
			'meta' => $saved,
			'full' => $full_size,
			'crop' => $image_editor->get_size()
		);
	}

	public static function calculate_image_resize_data($custom, $full) {
		$image_factor = $full['width'] / $full['height'];
		$custom_factor =  $custom['width'] / $custom['height'];

		$pivot = $image_factor > $custom_factor ? 'height' : 'width';
		$factor = $custom[$pivot] / $full[$pivot];

		$transformations = array(
			'rotate' => 0
		);

		$resize = array(
			'width' => round($full['width'] * $factor),
			'height' => round($full['height'] * $factor)
		);
		$crop = $custom;

		$crop['left'] = $resize['width'] > $crop['width'] ? floor(($resize['width'] - $crop['width']) / 2) : 0;
		$crop['top'] = $resize['height'] > $crop['height'] ? floor(($resize['height'] - $crop['height']) / 2) : 0;

		$transformations['crop'] = $crop;
		$transformations['resize'] = $resize;

		return $transformations;

	}


	function get_video_info() {
		$data = stripslashes_deep($_POST);

		$video_id = !empty($data['video_id']) ? intval($data['video_id']) : false;
		if (!$video_id) $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('invalid_id')));

		$video_url = wp_get_attachment_url($video_id);
		$video_html = wp_video_shortcode( array('src' => $video_url) );
		$video_html = preg_replace('#width="\d+"#', 'width="1920"', $video_html);
		$video_html = preg_replace('#height="\d+"#', 'height="1080"', $video_html);
		$video_html = str_replace('preload="metadata"', 'preload="auto"', $video_html);
		$video_html = str_replace('controls="controls"', '', $video_html);

		$result = array(
			'url' => $video_html
		);

		return $this->_out(new Upfront_JsonResponse_Success($result));
	}
}
Upfront_ImageEditor_Server::serve();