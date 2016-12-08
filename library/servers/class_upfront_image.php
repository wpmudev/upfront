<?php

/**
 * Handling image import
 *
 * @author Jeffri
 */
class Upfront_ImageServer extends Upfront_Server
{

	private static $_instance;
	protected static $_import_list = array();

	public static function get_instance()
	{
		if (!self::$_instance) {
			self::$_instance = new self;
		}
		return self::$_instance;
	}

	public static function serve()
	{
		$me = self::get_instance();
		$me->_add_hooks();
	}

	private function _add_hooks () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_list_import_image', array($this, "list_import_image"));
		}

		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_import_image', array($this, "import_image"));
		}
	}

	/**
	 * AJAX handler to list import image.
	 * Retrieve the list of theme images and return the images status.
	 */
	public function list_import_image () {
		$data = stripslashes_deep($_POST);
		if ( empty($data['images']) ) return $this->_out(new Upfront_JsonResponse_Error(array('error' => 1)));
		$response = array(
			'error' => 0,
			'images' => array()
		);
		foreach ( $data['images'] as $imagepath ) {
			$response['images'][] = $this->_check_image_status($imagepath);
		}
		return $this->_out(new Upfront_JsonResponse_Success($response));
	}

	/**
	 * AJAX handler to actually import image.
	 * Retrieve the list of theme images and return the images status, with missing images imported.
	 */
	public function import_image () {
		$data = stripslashes_deep($_POST);
		if ( empty($data['images']) ) return $this->_out(new Upfront_JsonResponse_Error(array('error' => 1)));
		$response = array(
			'error' => 0,
			'images' => array()
		);
		foreach ( $data['images'] as $imagepath ) {
			$response['images'][] = $this->_check_image_status($imagepath, true); // This will also do import
		}
		return $this->_out(new Upfront_JsonResponse_Success($response));
	}

	/**
	 * Check whether to import image or not.
	 * Won't import if image with the same hash exists.
	 * Import if no image with same hash exists.
	 *
	 * @param $filepath
	 * @return bool|int attachment id or false
	 */
	public function maybe_import_image ($filepath) {
		$full_img_path = $this->_get_child_theme_full_path($filepath);
		$hash = $this->_get_file_hash($full_img_path);
		if ( false === $hash ) return false; // Can't get hash, means image is not readable, abort
		$image = $this->_get_image_by_hash($hash);
		if ( false === $image ) return $this->_import_image($full_img_path);
		return $image->ID;
	}

	/**
	 * Check image status from the filepath.
	 * Pass the $import argument to true to automatically import missing images.
	 *
	 * @param $filepath
	 * @param bool $import
	 * @return array
	 */
	protected function _check_image_status ($filepath, $import = false) {
		$full_img_path = $this->_get_child_theme_full_path($filepath);
		$hash = $this->_get_file_hash($full_img_path);
		if ( false === $hash ) {
			return array(
				'status' => 'unknown',
				'filepath' => $filepath
			);
		}
		$image = $this->_get_image_by_hash($hash);
		if ( false === $image ) {
			if ( $import ) {
				$import_image = $this->_import_image($full_img_path);
				if ( false === $import_image ) {
					return array(
						'status' => 'import_error',
						'filepath' => $filepath
					);
				}
				else {
					$src = wp_get_attachment_image_src($import_image, 'full');
					return array(
						'status' => 'import_success',
						'id' => $import_image,
						'src' => is_array($src) ? $src[0] : '',
						'filepath' => $filepath
					);
				}
			}
			else {
				return array(
					'status' => 'not_exists',
					'filepath' => $filepath
				);
			}
		}
		else {
			$src = wp_get_attachment_image_src($image->ID, 'full');
			return array(
				'status' => 'exists',
				'id' => $image->ID,
				'src' => is_array($src) ? $src[0] : '',
				'filepath' => $filepath
			);
		}
	}

	/**
	 * This method will import image to WP media
	 *
	 * @param $filepath
	 * @return int attachment id
	 */
	protected function _import_image ($filepath) {
		$wp_upload_dir = wp_upload_dir();
		$pfx = !empty($wp_upload_dir['path']) ? trailingslashit($wp_upload_dir['path']) : '';
		if (!function_exists('wp_generate_attachment_metadata')) require_once(ABSPATH . 'wp-admin/includes/image.php');
		$filename = basename($filepath);

		while (file_exists("{$pfx}{$filename}")) {
			$filename = rand() . $filename;
		}

		$raw_filename = $filename;
		$filename = Upfront_UploadHandler::to_clean_file_name($filename);

		$new_filepath = "{$pfx}{$filename}";
		if (!@copy($filepath, $new_filepath)) return false;
		$wp_filetype = wp_check_filetype(basename($filename), null);
		$attachment = array(
			'guid' => $wp_upload_dir['url'] . '/' . basename($filename),
			'post_mime_type' => $wp_filetype['type'],
			'post_title' => preg_replace('/\.[^.]+$/', '', basename($raw_filename)),
			'post_content' => '',
			'post_status' => 'inherit'
		);
		$attach_id = wp_insert_attachment($attachment, $new_filepath);
		$attach_data = wp_generate_attachment_metadata( $attach_id, $new_filepath );
		wp_update_attachment_metadata( $attach_id, $attach_data );

		// Generate hash and add to attachment meta
		$hash = $this->_get_file_hash($new_filepath);
		update_post_meta($attach_id, '_uf_image_hash', $hash);

		return $attach_id;
	}

	/**
	 * @param $hash
	 * @return bool|array
	 */
	protected function _get_image_by_hash ($hash) {
		$args = array(
			'post_type' => 'attachment',
			'post_status' => 'any',
			'meta_key' => '_uf_image_hash',
			'meta_value' => $hash
		);
		$query = new WP_Query($args);
		if ( empty($query->posts) ) return false;
		return $query->posts[0];
	}

	/**
	 * Check if the URL is from child theme
	 *
	 * @param $uri
	 * @return bool
	 */
	protected function _is_child_theme_uri ($uri) {
		return ( strpos($uri, get_stylesheet_directory_uri()) === 0 );
	}

	/**
	 * Get relative filepath from child theme URL
	 *
	 * @param $uri
	 * @return mixed
	 */
	protected function _get_filepath_from_uri ($uri) {
		if ( !$this->_is_child_theme_uri($uri) ) return false;
		$filepath = preg_replace('/^' . preg_quote(get_stylesheet_directory_uri(), '/') . '/', '', $uri);
		return $filepath;
	}

	/**
	 * Get full path of a filepath/URL from child theme
	 *
	 * @param $filepath
	 * @return string absolute directory path of the file
	 */
	protected function _get_child_theme_full_path ($filepath) {
		if ( $this->_is_child_theme_uri($filepath) ) {
			$filepath = $this->_get_filepath_from_uri($filepath);
		}
		return get_stylesheet_directory() . DIRECTORY_SEPARATOR . ltrim($filepath, '/');
	}

	/**
	 * Get file hash, could be used to check against duplicates
	 *
	 * @param $filepath
	 * @return bool|string
	 */
	protected function _get_file_hash ($filepath) {
		if ( !is_file($filepath) ) return false; // Don't even bother if this is a dir
		if ( !is_readable($filepath) ) return false;
		return hash_file('md5', $filepath);
	}


}
add_action('init', array('Upfront_ImageServer', 'serve'));


