<?php

class Upfront_MediaServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		$this->augment_attachments();
		$this->serve_custom_size();
		$this->serve_extra_large_size();

		// Fix WP srcset creation
		add_filter('wp_calculate_image_srcset', array($this, 'fix_srcset'));

		add_filter('upfront_l10n', array($this, 'add_l10n_strings'));

		// Do not show media labels in posts taxonomy selection list
		add_filter('upfront_posts-list-skip_taxonomy-media_label', '__return_true');

		upfront_add_ajax('upfront-media-list_media', array($this, "list_media"));
		upfront_add_ajax('upfront-media-get_item', array($this, "get_item"));

		upfront_add_ajax('upfront-media_get_image_labels', array($this, "get_image_labels"));
		upfront_add_ajax('upfront-media-get_labels', array($this, "list_labels"));

		if (Upfront_Permissions::current(Upfront_Permissions::UPLOAD)) {
			upfront_add_ajax('upfront-media-remove_item', array($this, "remove_item"));
			upfront_add_ajax('upfront-media-remove_theme_item', array($this, "remove_theme_item"));
			upfront_add_ajax('upfront-media-update_media_item', array($this, "update_media_item"));
			upfront_add_ajax('upfront-media-upload', array($this, "upload_media"));
			upfront_add_ajax('upfront-save-video-info', array($this, "save_video_info"));
			upfront_add_ajax('upfront-get-video-info', array($this, "get_video_info"));
			upfront_add_ajax('upfront-upload-icon-font', array($this, "upload_icon_font"));
			upfront_add_ajax('upfront_update_active_icon_font', array($this, "update_active_icon_font"));
			upfront_add_ajax('upfront_remove_icon_font_file', array($this, "remove_icon_font_file"));

			upfront_add_ajax('upfront-media-list_theme_images', array($this, "list_theme_images"));
			upfront_add_ajax('upfront-media-upload-theme-image', array($this, "upload_theme_image"));

			upfront_add_ajax('upfront-media-add_label', array($this, "add_label"));
			upfront_add_ajax('upfront-media-associate_label', array($this, "associate_label"));
			upfront_add_ajax('upfront-media-disassociate_label', array($this, "disassociate_label"));
		}

		if (Upfront_Permissions::current(Upfront_Permissions::EMBED)) {
			upfront_add_ajax('upfront-media-embed', array($this, "embed_media"));
			upfront_add_ajax('upfront-media-get_embed_raw', array($this, "get_embed_raw"));
		}
	}

	/**
	 * Fix srcset sources not being escaped.
	 *
	 * @param array $sources Array of srcset sources, as exposed by `wp_calculate_image_srcset` filter
	 *
	 * @return array
	 */
	public function fix_srcset ($sources) {
		if (empty($sources)) return $sources; // Short out if we can

		foreach ($sources as $idx => $src) {
			if (empty($src['url'])) continue;
			$src['url'] = esc_url($src['url']);
			$sources[$idx] = $src;
		}

		return $sources;
	}

	public function add_l10n_strings ($strings) {
		if (!empty($strings['media'])) return $strings;
		$strings['media'] = $this->_get_l10n();
		return $strings;
	}

	private function _get_l10n ($key=false) {
		$l10n = array(
			'clear_all_filters' => __('Clear all filters', 'upfront'),
			'all' => __('All', 'upfront'),
			'none' => __('None', 'upfront'),
			'select' => __('Select', 'upfront'),
			'del_command' => __('Delete', 'upfront'),
			'size_full' => __('Full size', 'upfront'),
			'item_in_use_nag' => __("The selected media file is already in use. Are you sure?", 'upfront'),
			'files_selected' => __('%d files selected', 'upfront'),
			'media_title' => __("Media Title", 'upfront'),
			'media_alt' => __("Media Alt", 'upfront'),
			'natural_size' => __("Natural Size", 'upfront'),
			'px_label' => __("px", 'upfront'),
			'width_label' => __("W", 'upfront'),
			'height_label' => __("H", 'upfront'),
			'add_labels' => __("Add Label(s)", 'upfront'),
			'current_labels' => __("Current Label(s)", 'upfront'),
			'additional_sizes' => __("Additional sizes", 'upfront'),
			'url' => __("URL", 'upfront'),
			'add' => __("+Add", 'upfront'),
			'search' => __("Search", 'upfront'),
			'clear_search' => __("Clear search", 'upfront'),
			'showing_total_results' => __("Showing {{total}} results for", 'upfront'),
			'active_filters' => __("Active filters", 'upfront'),
			'filter_label' => __("Filter Media by:", 'upfront'),
			'select_filter' => __("Select Filter", 'upfront'),
			'media_type' => __("Media type", 'upfront'),
			'date' => __("Date", 'upfront'),
			'file_name' => __("File Name", 'upfront'),
			'recent' => __("Recent", 'upfront'),
			'labels' => __("Labels", 'upfront'),
			'please_select_labels' => __("Please, select labels...", 'upfront'),
			'library' => __("Library", 'upfront'),
			'embed' => __("Embed", 'upfront'),
			'upload' => __("Upload Media", 'upfront'),
			'insertion_question' => __('How would you like to insert those images?', 'upfront'),
			'plain_images' => __('plain images', 'upfront'),
			'image_slider' => __('image slider', 'upfront'),
			'image_gallery' => __('image gallery', 'upfront'),
			'ok' => __('OK', 'upfront'),
			'loading_embeddable_preview' => __('Loading embeddable preview...', 'upfront'),
			'loading_media_files' => __('Loading media files...', 'upfront'),
			'applied_labels' => __('Applied labels:', 'upfront'),
			'video_recommendation_nag' => __('We recommend using services like YouTube, Vimeo or Soundcloud to store rich media files. You can then embed it easily into your site. Find out more here.', 'upfront'),
			'keep_file' => __('Keep file', 'upfront'),
			'remove_file' => __('Remove file', 'upfront'),
			'media_url' => __('URL of the media', 'upfront'),
			'image_title' => __('Image Title', 'upfront'),
			'your_image_title' => __('Your image title', 'upfront'),
			'n_of_x' => _x("of", "N of X", 'upfront'),
			'entity_list_info' => __('{{items}} Media Files', 'upfront'),
			'filter' => array(
				'images' => __('Images', 'upfront'),
				'videos' => __('Videos', 'upfront'),
				'audios' => __('Audios', 'upfront'),
				'all' => __('All', 'upfront'),
				'newest' => __('Newest', 'upfront'),
				'oldest' => __('Oldest', 'upfront'),
				'a_z' => __('A » Z', 'upfront'),
				'z_a' => __('Z » A', 'upfront'),
			),
			'media_labels' => __('Media Labels', 'upfront'),
			'media_label' => __('Media Label', 'upfront'),
			'disabled' => __('This functionality has been disabled', 'upfront'),
			'insert_options' => __('Insert Options', 'upfront'),
			'image_inserts' => __('Image Inserts', 'upfront'),
			'wp_default' => __('WP Default', 'upfront'),
			'confirm_delete_items' => __("Are you sure you want to delete selected items?", 'upfront'),
			'on_this_page' => __("on this page", 'upfront'),
			'display' => __('Display', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

	/**
	 * Augment the default attachments - add labels and such.
	 */
	public function augment_attachments () {
		register_taxonomy(
			'media_label',
			'attachment',
			array(
				'labels' => array(
					'name' => $this->_get_l10n('media_labels'),
					'singular_name' => $this->_get_l10n('media_label'),
				),
				'hierarchical' => false,
				'public' => true,
			)
		);
	}

	/**
	 * Serve thumbnail custom sizes if was set on Uposts element
	 */
	public function serve_custom_size () {
		$custom_size = get_option('upfront_custom_thumbnail_size', array());

		if ( !empty($custom_size) ) {
			$thumbnail_size = json_decode($custom_size);

			add_image_size(
				$thumbnail_size->name,
				intval($thumbnail_size->thumbnail_width),
				intval($thumbnail_size->thumbnail_height)
			);
		}
	}

	/**
	 * Serve 1920 image size when uploading 4k images
	 */
	public function serve_extra_large_size () {
		if ( !in_array('upfront_extra_large', get_intermediate_image_sizes()) )
			add_image_size('upfront_extra_large', 1920, 1920);
	}

	public function list_labels () {
		$labels = get_terms('media_label', array('hide_empty' => false));
		$this->_out(new Upfront_JsonResponse_Success($labels));
	}

	public function add_label () {
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		$post_ids = !empty($data['post_ids']) ? array_map('intval', $data['post_ids']) : array();

		if ($post_id) {
			$post_ids[] = $post_id;
		}

		$term = !empty($data['term']) ? $data['term'] : false;
		if (!$term) $this->_out(new Upfront_JsonResponse_Error("No term"));

		$res = wp_insert_term($term, 'media_label');
		if (is_wp_error($res)) $this->_out(new Upfront_JsonResponse_Error("Something went wrong"));

		if ($post_ids) {
			$result = array();
			foreach ($post_ids as $post_id) {
				$label_objs = wp_get_object_terms($post_id, 'media_label');
				$labels = array();
				foreach ($label_objs as $label) {
					$labels[] = (int)$label->term_id;
				}
				$labels[] = (int)$res['term_id'];
				$result[$post_id] = wp_set_object_terms($post_id, $labels, 'media_label');
			}
			$this->_out(new Upfront_JsonResponse_Success($result));
		} else {
			$this->_out(new Upfront_JsonResponse_Success($res));
		}
	}

	public function associate_label () {
		$data = stripslashes_deep($_POST);

		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		$post_ids = !empty($data['post_ids']) ? array_map('intval', $data['post_ids']) : array();
		if (!$post_id && !$post_ids) $this->_out(new Upfront_JsonResponse_Error("No post_id"));

		if ($post_id) {
			$post_ids[] = $post_id;
		}

		$term = !empty($data['term']) ? $data['term'] : false;
		if (!$term) $this->_out(new Upfront_JsonResponse_Error("No term"));

		$res = array();
		foreach ($post_ids as $post_id) {
			$label_objs = wp_get_object_terms($post_id, 'media_label');
			$labels = array();
			foreach ($label_objs as $label) {
				$labels[] = (int)$label->term_id;
			}
			$labels[] = (int)$term;
			$res[$post_id] = wp_set_object_terms($post_id, $labels, 'media_label');
		}

		$this->_out(new Upfront_JsonResponse_Success($res));
	}

	public function disassociate_label () {
		$data = stripslashes_deep($_POST);

		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		$post_ids = !empty($data['post_ids']) ? array_map('intval', $data['post_ids']) : array();
		if (!$post_id && !$post_ids) $this->_out(new Upfront_JsonResponse_Error("No post_id"));

		if ($post_id) {
			$post_ids[] = $post_id;
		}

		$term = !empty($data['term']) ? $data['term'] : false;
		if (!$term) $this->_out(new Upfront_JsonResponse_Error("No term"));

		$res = array();
		foreach ($post_ids as $post_id) {
			$label_objs = wp_get_object_terms($post_id, 'media_label');
			$labels = array();
			foreach ($label_objs as $label) {
				if ($label->term_id != $term) $labels[] = (int)$label->term_id;
			}
			$res[$post_id] = wp_set_object_terms($post_id, $labels, 'media_label');
		}

		$this->_out(new Upfront_JsonResponse_Success($res));
	}

	public function get_image_labels() {
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		$post_ids = !empty($data['post_ids']) ? array_map('intval', $data['post_ids']) : array();
		if (!$post_id && !$post_ids) $this->_out(new Upfront_JsonResponse_Error("No post_id"));

		if ($post_id) {
			$post_ids[] = $post_id;
		}

		$res = array();
		foreach ($post_ids as $post_id) {
			$labels = get_the_terms($post_id, 'media_label');
			$res[$post_id] = !$labels || is_wp_error($labels) ? array() : $labels;
		}

		$this->_out(new Upfront_JsonResponse_Success($res));
	}

	private function _media_to_clean_url ($media) {
		$media_url = $media;
		// Alright now, so first up drop query strings for extension check
		if (false !== strpos($media, '?')) {
			$media_url = array_shift(explode('?', $media));
		}
		return $media_url;
	}

	private function _image_url_to_attachment ($media, $preferred_filename=false) {
		 // Yes. Import into library
		$request = wp_remote_get($media, array(
			'ssl' => false
		));
		if(is_wp_error($request)) $this->_out(new Upfront_JsonResponse_Error("Request error"));
		if (wp_remote_retrieve_response_code($request) != 200) $this->_out(new Upfront_JsonResponse_Error("Response error"));
		$image = wp_remote_retrieve_body($request);


		// Validate if it's an image we're working with
		if (!empty($preferred_filename)) {
			$filename = preg_replace('/[^-_.a-z0-9]/i', '', basename($preferred_filename));
			$filename .= '.' . pathinfo(parse_url($media, PHP_URL_PATH), PATHINFO_EXTENSION);
		} else {
			$filename = basename($this->_media_to_clean_url($media));
		}
		$wp_upload_dir = wp_upload_dir();
		$pfx = !empty($wp_upload_dir['path']) ? trailingslashit($wp_upload_dir['path']) : '';
		while (file_exists("{$pfx}{$filename}")) {
			$filename = rand() . $filename;
		}

		// Clean up the file name
		$raw_filename = $filename;
		$filename = Upfront_UploadHandler::to_clean_file_name($filename);

		file_put_contents("{$pfx}{$filename}", $image);
		$data = getimagesize("{$pfx}{$filename}");
		if (empty($data['mime']) || !preg_match('/^image\//i', $data['mime'])) {
			@unlink("{$pfx}{$filename}");
			$this->_out(new Upfront_JsonResponse_Error("Not an image"));
		}

		if (!function_exists('wp_generate_attachment_metadata')) require_once(ABSPATH . 'wp-admin/includes/image.php');
		$wp_filetype = wp_check_filetype(basename($filename), null);
		$attachment = array(
			'guid' => $wp_upload_dir['url'] . '/' . basename($filename),
			'post_mime_type' => $wp_filetype['type'],
			'post_title' => preg_replace('/\.[^.]+$/', '', basename($raw_filename)),
			'post_content' => '',
			'post_status' => 'inherit'
		);
		$attach_id = wp_insert_attachment($attachment, "{$pfx}{$filename}");
		$attach_data = wp_generate_attachment_metadata( $attach_id, "{$pfx}{$filename}" );
		wp_update_attachment_metadata( $attach_id, $attach_data );
		return $attach_id;
	}

	public function embed_media () {
		if (!$this->_check_valid_request_level(Upfront_Permissions::EMBED)) $this->_out(new Upfront_JsonResponse_Error("You can't do this."));
		$data = stripslashes_deep($_POST);
		$media = !empty($data['media']) ? $data['media'] : false;
		if (!$media) $this->_out(new Upfront_JsonResponse_Error("Invalid media"));

		$media_url = $this->_media_to_clean_url($media);

		// Is it an image?
		if (preg_match('/\.(jpe?g|gif|png)$/i', trim($media_url))) {
			$attach_id = $this->_image_url_to_attachment($media);

			// Now, update the attachment post
			update_post_meta($attach_id, 'original_url', $media);

			$result = new Upfront_MediaItem(get_post($attach_id));
			$this->_out(new Upfront_JsonResponse_Success($result->to_php()));
		} else {
			// Is it oEmbeddable?
			$oembed = new Upfront_Oembed($media);
			$data = $oembed->get_info();
			if (!empty($data)) {
				$attach_id = $this->_image_url_to_attachment($data->thumbnail_url, $data->title);

				// Now, update the attachment post
				wp_update_post(array(
					'ID' => $attach_id,
					'post_title' => $data->title,
					'post_content' => $data->html,
					'post_excerpt' => (!empty($data->description) ? $data->description : ''),
					'post_mime_type' => 'import',
				));
				update_post_meta($attach_id, 'original_url', $media);
				update_post_meta($attach_id, 'oembed_type', $data->type);

				$result = new Upfront_MediaItem(get_post($attach_id));
				$this->_out(new Upfront_JsonResponse_Success($result->to_php()));
			} else $this->_out(new Upfront_JsonResponse_Error("Not an image file or embeddable item"));
		}
	}

	public function get_embed_raw () {
		$data = stripslashes_deep($_POST);
		$media = !empty($data['media']) ? $data['media'] : false;
		if (!$media) $this->_out(new Upfront_JsonResponse_Error("Invalid media"));

		$oembed = new Upfront_Oembed($media);
		$oembed_data = $oembed->get_info();
		if (!empty($oembed_data)) {
			$this->_out(new Upfront_JsonResponse_Success($oembed_data));
		} else $this->_out(new Upfront_JsonResponse_Error("Not an image file or embeddable item"));

	}

	public function list_media () {
		$data = stripslashes_deep($_POST);
		$data['type'] = !empty($data['type']) ? $data['type'] : array('images');
		$query = Upfront_MediaCollection::apply_filters($data);
		$results = $query->to_php();

		if (in_array('videos',  $data['type'])) {
			foreach($results['items'] as $index=>$video) {
				$video_info = get_post_meta(intval($video['ID']), 'videoinfo', true);
				if (is_array($video_info) && $video_info['cover'] !== '') {
					$results['items'][$index]['thumbnail'] = '<img class="media-library-video-thumbnail" src="' . esc_url($video_info['cover']) . '" />';
				}
			}
		}
		$this->_out(new Upfront_JsonResponse_Success($results));
	}

	public function list_theme_images () {
		$images = array();
		$relpath = false;
		$supported_relpaths = array('ui');
		foreach ($supported_relpaths as $testpath) {
			if (!is_dir(trailingslashit(get_stylesheet_directory()) . $testpath)) continue;
			$relpath = $testpath;
			break;
		}
		if (empty($relpath)) $this->_out(new Upfront_JsonResponse_Error("No theme images directory"));

		$dirPath = trailingslashit(get_stylesheet_directory()) . $relpath;
		$dirUrl = trailingslashit(get_stylesheet_directory_uri()) . trailingslashit($relpath);
		$i = 0;
		if($dir = opendir($dirPath)) {
			while (false !== ($file = readdir($dir))) {
				if(is_dir($dirPath . '/' . $file))
					continue;

				if(preg_match('/\.(jpg|jpeg|gif|svg|png)$/i', $file)) {
					$imageWidth = 0;
					$imageHeight = 0;
					$imageSize = getimagesize($dirUrl .$file);
					if ( $imageSize ) {
						$imageWidth = isset($imageSize[0]) ? $imageSize[0] : $imageWidth;
						$imageHeight = isset($imageSize[1]) ? $imageSize[1] : $imageHeight;
					}
					$images[] = array(
						'ID' => $i++,
						'thumbnail' => '<img style="max-height: 75px; max-width: 75px" src="' . $dirUrl . $file . '">',
						'post_title' => $file,
						'labels' => array(),
						'original_url' => $dirUrl . $file,
						'image' => array(
							'src' => $dirUrl . $file,
							'width' => $imageWidth,
							'height' => $imageHeight,
							'resized' => false
						)
					);
				}
			}
		}
		$meta = array('max_pages' => 1);
		if (sizeof($images))
			$this->_out(new Upfront_JsonResponse_Success(array('items' => $images, 'meta' => $meta)));
		else
			$this->_out(new Upfront_JsonResponse_Error("No items"));
	}

	public function upload_theme_image () {
		if (!$this->_check_valid_request_level(Upfront_Permissions::UPLOAD)) $this->_out(new Upfront_JsonResponse_Error("You can't do this."));
		if(!isset($_FILES['media']))
			$this->_out(new Upfront_JsonResponse_Error("No file to upload"));

		$file = $_FILES['media'];
		$filename = $file['name'];

		if(!preg_match('/\.(jpg|jpeg|gif|svg|png)$/i', $filename))
			$this->_out(new Upfront_JsonResponse_Error("The file is not an image."));

		$relpath = false;
		$supported_relpaths = array('ui');
		foreach ($supported_relpaths as $testpath) {
			if (!is_dir(trailingslashit(get_stylesheet_directory()) . $testpath)) continue;
			$relpath = $testpath;
			break;
		}
		if (empty($relpath)) $this->_out(new Upfront_JsonResponse_Error("No theme images directory"));

		$dirPath = trailingslashit(trailingslashit(get_stylesheet_directory()) . $relpath);
		$dirUrl = trailingslashit(get_stylesheet_directory_uri()) . trailingslashit($relpath);

		// Clean up the file name
		$raw_filename = $filename;
		$filename = Upfront_UploadHandler::to_clean_file_name($filename);

		$destination = $dirPath . $filename;
		move_uploaded_file($file["tmp_name"], $destination);
		if (!preg_match('/\.svg$/i', $filename)) {
			$data = getimagesize($destination);
			if (empty($data['mime']) || !preg_match('/^image\//i', $data['mime'])) {
				@unlink($destination);
				$this->_out(new Upfront_JsonResponse_Error("Not an image"));
			}
		}

		$this->_out(new Upfront_JsonResponse_Success(array(
			'ID' => rand(1111,9999), //Whatever high number is ok
			'original_url' => $dirUrl . $filename,
			'thumbnail' => '<img style="max-height: 75px; max-width: 75px" src="' . $dirUrl . $filename . '">',
			'post_title' => $raw_filename,
			'labels' => array()
		)));
	}

	public function get_item () {
		$data = stripslashes_deep($_POST);

		$item_id = !empty($data['item_id']) ? $data['item_id'] : false;
		if (!$item_id) $this->_out(new Upfront_JsonResponse_Error("Invalid item ID"));

		$item = new Upfront_MediaItem(get_post($item_id));
		$this->_out(new Upfront_JsonResponse_Success($item->to_php()));
	}

	public function remove_item () {
		$data = stripslashes_deep($_POST);

		$post_id = !empty($data['item_id']) ? $data['item_id'] : false;
		$post_ids = !empty($data['post_ids']) ? array_map('intval', $data['post_ids']) : array();
		if (!$post_id && !$post_ids) $this->_out(new Upfront_JsonResponse_Error("No post_id"));

		if ($post_id) {
			$post_ids[] = $post_id;
		}


		foreach ($post_ids as $post_id) {
			if (!current_user_can('delete_post', $post_id)) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
			if (!wp_delete_attachment($post_id)) $this->_out(new Upfront_JsonResponse_Error("Error deleting media"));
		}
		$this->_out(new Upfront_JsonResponse_Success("All good, media removed"));
	}

	// Same as remove_item but for theme/UI images.
	public function remove_theme_item () {
		$data = stripslashes_deep($_POST);

		$post_id = !empty($data['item_id']) ? $data['item_id'] : false;
		$post_ids = !empty($data['post_ids']) ? $data['post_ids'] : array();
		if (!$post_id && !$post_ids) $this->_out(new Upfront_JsonResponse_Error("No post_id"));

		if (!empty($post_id)) {
			$post_ids[] = $post_id;
		}

		// Paths for theme images.
		$supported_relpaths = array('ui');
		foreach ($supported_relpaths as $testpath) {
			if (!is_dir(trailingslashit(get_stylesheet_directory()) . $testpath)) continue;
			$relpath = $testpath;
			break;
		}
		if (empty($relpath)) $this->_out(new Upfront_JsonResponse_Error("No theme images directory"));

		$dirPath = trailingslashit(trailingslashit(get_stylesheet_directory()) . $relpath);

		foreach ($post_ids as $post_id) {
			// Check permissions before allowing to delete file.
			if (!current_user_can('upload_files')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));

			// Clean up the file name
			$filename = Upfront_UploadHandler::to_clean_file_name($post_id);

			// Full path to file to delete.
			$destination = $dirPath . $filename;
			// Delete file.
			@unlink($destination);
		}
		$this->_out(new Upfront_JsonResponse_Success("All good, media removed"));
	}

	public function update_media_item () {
		$request = stripslashes_deep($_POST);
		$data = !empty($request['data']) ? $request['data'] : false;
		if (!$data) $this->_out(new Upfront_JsonResponse_Error("Invalid request"));

		$id = !empty($data['ID']) ? $data['ID'] : false;
		if (!$id) $this->_out(new Upfront_JsonResponse_Error("Invalid item ID"));

		$updated = wp_update_post($data);
		if (!empty($updated)) $this->_out(new Upfront_JsonResponse_Success($updated));
		else $this->_out(new Upfront_JsonResponse_Error("Error updating the media item"));
	}

	public function upload_icon_font() {
		do_action('upfront_upload_icon_font');

		if (has_action('upfront_upload_icon_font')) {
			return;// already handled
		}
		// Intended behavior is to not have uploads enabled outside of theme builder
		// in future we may add here upload handling when builder is not running i.e.
		// allow end user to upload more icon fonts
	}

	/**
	 * AJAX media handler to dispatch the icon font activation action
	 */
	public function update_active_icon_font() {
		do_action('upfront_update_active_icon_font');
		die;
	}

	/**
	 * AJAX handler to dispatch the icon font file removal action
	 */
	public function remove_icon_font_file() {
		do_action('upfront_remove_icon_font_file');
		die;
	}

	public function upload_media () {
		if (!$this->_check_valid_request_level(Upfront_Permissions::UPLOAD)) $this->_out(new Upfront_JsonResponse_Error("You can't do this."));
		$upload = new Upfront_UploadHandler;
		$result = $upload->handle();
		if (empty($result['media'])) $this->_out(new Upfront_JsonResponse_Error(__("Error uploading the media item", 'upfront')));

		if (!function_exists('wp_generate_attachment_metadata')) require_once(ABSPATH . 'wp-admin/includes/image.php');
		$wp_upload_dir = wp_upload_dir();
		$pfx = !empty($wp_upload_dir['path']) ? trailingslashit($wp_upload_dir['path']) : '';
		$new_ids = array();

		$mb = 1024 * 1024;
		$space_used = function_exists('get_space_used')
			? (int)get_space_used() * $mb
			: 0
		;
		$space_allowed = function_exists('get_space_allowed')
			? (int)get_space_allowed() * $mb
			: 0
		;

		foreach ($result['media'] as $media) {
			if (!empty($media->error)) {
				// We have an error happening!
				@unlink("{$pfx}{$filename}");
				$this->_out(new Upfront_JsonResponse_Error(sprintf(__("Error uploading the media item: %s", 'upfront'), $media->error)));
			}

			$filename = $media->name;

			$file_size = !empty($media->size)
				? (int)$media->size
				: 0
			;
			// If upload space is restricted and upload is too large, display an error.
			if ($space_allowed && $file_size && $file_size + $space_used > $space_allowed && !get_site_option('upload_space_check_disabled')) {
				// Upload quota exceeded
				@unlink("{$pfx}{$filename}");
				$this->_out(new Upfront_JsonResponse_Error(__("Error uploading the media item: allocated space quota exceeded", 'upfront')));
			}

			if(!preg_match('/\.(jpg|jpeg|gif|svg|png|mp4|webm)$/i', $filename)) {
				// We have an error happening!
				@unlink("{$pfx}{$filename}");
				$this->_out(new Upfront_JsonResponse_Error(__("Sorry, this file type is not permitted for security reasons.", 'upfront')));
			}

			// Clean up the file name
			$raw_filename = $filename;
			$filename = Upfront_UploadHandler::to_clean_file_name($filename);

			$wp_filetype = wp_check_filetype(basename($filename), null);
			$attachment = array(
					'guid' => $wp_upload_dir['url'] . '/' . basename($filename),
					'post_mime_type' => $wp_filetype['type'],
					'post_title' => preg_replace('/\.[^.]+$/', '', basename($raw_filename)),
					'post_content' => '',
					'post_status' => 'inherit'
			);
			$attach_id = wp_insert_attachment($attachment, "{$pfx}{$filename}");
			$attach_data = wp_generate_attachment_metadata( $attach_id, "{$pfx}{$filename}" );
			wp_update_attachment_metadata( $attach_id, $attach_data );
			$new_ids[] = $attach_id;
		}

		// Drop transients for quotas et al
		if (is_multisite()) {
			delete_transient('dirsize_cache');
		}

		$this->_out(new Upfront_JsonResponse_Success($new_ids));
	}

	public function save_video_info () {
		$new_ids = array();

		// if (!$this->_check_valid_request_level(Upfront_Permissions::UPLOAD)) $this->_out(new Upfront_JsonResponse_Error("You can't do this."));
		$request = stripslashes_deep($_POST);

		$videoId = !empty($request['videoId']) ? intval($request['videoId']) : false;
		if (!$videoId) $this->_out(new Upfront_JsonResponse_Error("Invalid video id"));

		$base64image = !empty($request['base64image']) ? $request['base64image'] : false;
		if (!$base64image) $this->_out(new Upfront_JsonResponse_Error("Invalid base64 image"));

		$thumbname = !empty($request['thumbname']) ? $request['thumbname'] : false;
		if (!$thumbname) $this->_out(new Upfront_JsonResponse_Error("Invalid thumbnail name"));

		$embed = !empty($request['embed']) ? $request['embed'] : false;
		if (!$embed) $this->_out(new Upfront_JsonResponse_Error("Embed is required"));

		$width = !empty($request['width']) ? $request['width'] : false;
		if (!$width) $this->_out(new Upfront_JsonResponse_Error("Width is required"));

		$height = !empty($request['height']) ? $request['height'] : false;
		if (!$height) $this->_out(new Upfront_JsonResponse_Error("Height is required"));

		$aspect = !empty($request['aspect']) ? $request['aspect'] : false;
		if (!$aspect) $this->_out(new Upfront_JsonResponse_Error("Aspect is required"));

		if (!function_exists('wp_generate_attachment_metadata')) require_once(ABSPATH . 'wp-admin/includes/image.php');

		$tempdir = get_temp_dir();

		// $mb = 1024 * 1024;
		// $space_used = function_exists('get_space_used')
			// ? (int)get_space_used() * $mb
			// : 0
		// ;
		// $space_allowed = function_exists('get_space_allowed')
			// ? (int)get_space_allowed() * $mb
			// : 0
		// ;

		$base64image = explode(',', $base64image);

		$image = base64_decode($base64image[1]);

		$filepath = $tempdir . $thumbname;

		file_put_contents($filepath, $image);
		$file_size = getimagesize($filepath);

		// if ($space_allowed && $file_size && $file_size + $space_used > $space_allowed) {
			// // Upload quota exceeded
			// @unlink("{$pfx}{$filename}");
			// $this->_out(new Upfront_JsonResponse_Error(__("Error uploading the media item: allocated space quota exceeded", 'upfront')));
		// }

		// array based on $_FILE as seen in PHP file uploads
		$file = array(
			'name' => $thumbname, // ex: wp-header-logo.png
			'type' => 'image/jpg',
			'tmp_name' => $filepath,
			'error' => 0,
			'size' => filesize($filepath),
		);

		$overrides = array(
			'test_form' => false,
			'test_size' => true,
			'test_upload' => true,
		);

		// move the temporary file into the uploads directory
		$results = wp_handle_sideload( $file, $overrides );

		if (!empty($results['error'])) {
			die('Could not upload thumbnail');
		} else {

			// $filename = $results['file']; // full path to the file
			// $local_url = $results['url']; // URL to the file in the uploads dir
			// $type = $results['type']; // MIME type of the file

			// Drop transients for quotas et al
			if (is_multisite()) {
				delete_transient('dirsize_cache');
			}

			// Save video info for video
			add_post_meta($videoId, 'videoinfo', array(
					'id' => $videoId,
					'embed' => $embed,
					'cover' => $results['url'],
					'width' => $width,
					'height' => $height,
					'aspect' => $aspect
				)
			);

			$this->_out(new Upfront_JsonResponse_Success(array("thumburl" => $results['url'])));
		}
	}

	function get_video_info() {
		$data = stripslashes_deep($_POST);

		$video_id = !empty($data['video_id']) ? intval($data['video_id']) : false;
		if (!$video_id) $this->_out(new Upfront_JsonResponse_Error(Upfront_UimageView::_get_l10n('invalid_id')));

		$meta_info = get_post_meta($video_id, 'videoinfo', true);
		if (empty($meta_info)) {
			$meta_info = array(
				'id' => $video_id,
				'embed' => Upfront_Uimage_Server::get_video_html($video_id),
				'cover' => false,
				'width' => false,
				'height' => false,
				'aspect' => false,
			);
		}

		return $this->_out(new Upfront_JsonResponse_Success(
			array(
				'videoinfo' => $meta_info,
			)
		));
	}


	private function _check_valid_request_level ($level) {
		if (!Upfront_Permissions::current($level)) return false;

		$ref = !empty($_REQUEST[Upfront_UploadHandler::REF]) ? $_REQUEST[Upfront_UploadHandler::REF] : false;

		return Upfront_Permissions::is_nonce($level, $ref);
	}
}
add_action('init', array('Upfront_MediaServer', 'serve'));

function upfront_media_file_upload () {
	if (!Upfront_Permissions::current(Upfront_Permissions::UPLOAD)) return false; // Do not inject for users that can't use this
	$base_url = Upfront::get_root_url();

	$deps = Upfront_CoreDependencies_Registry::get_instance();

	if( Upfront_Debug::get_debugger()->is_dev() ){
		$deps->add_script("{$base_url}/scripts/file_upload/jquery.fileupload.js");
		$deps->add_script("{$base_url}/scripts/file_upload/jquery.iframe-transport.js");
	}else{
		$deps->add_script("{$base_url}/build/file_upload/jquery.fileupload.js");
		$deps->add_script("{$base_url}/build/file_upload/jquery.iframe-transport.js");
	}


	echo '<script>var _upfront_media_upload=' . json_encode(array(
		'normal' => Upfront_UploadHandler::get_action_url('upfront-media-upload'),
		'theme' => Upfront_UploadHandler::get_action_url('upfront-media-upload-theme-image'),
		'embed_ref' => Upfront_UploadHandler::get_ref(Upfront_Permissions::EMBED),
		'image_ref' => Upfront_UploadHandler::get_ref(Upfront_Permissions::UPLOAD),
	)) . ';</script>';
}
add_action('wp_head', 'upfront_media_file_upload', 99);
