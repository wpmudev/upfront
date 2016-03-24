<?php

if (!class_exists('UploadHandler')) require_once('class_upload_handler.php');

class Upfront_UploadHandler extends UploadHandler {

	const REF = '_ref';

	public function __construct () {
		$uploads = wp_upload_dir();
		$options = array(
			'script_url' => self::get_action_url('upfront-media-upload'),
			'upload_dir' => trailingslashit($uploads['path']),
			'upload_url' => trailingslashit($uploads['url']),
			'param_name' => 'media',
		);
		if (defined('UPFRONT_SKIP_IMAGE_EXIF_ORIENTATION') && UPFRONT_SKIP_IMAGE_EXIF_ORIENTATION) {
			$options['orient_image'] = false;
		}
		parent::__construct($options, false);
	}
	protected function initialize() {
		switch ($this->get_server_var('REQUEST_METHOD')) {
			case 'OPTIONS':
			case 'HEAD':
				return $this->head();
				break;
			case 'GET':
				return $this->get();
				break;
			case 'PATCH':
			case 'PUT':
			case 'POST':
				return $this->post();
				break;
			case 'DELETE':
				return $this->delete();
				break;
			default:
				$this->header('HTTP/1.1 405 Method Not Allowed');
		}
	}
	public function handle () {
		return $this->initialize();
	}

	protected function generate_response ($content, $out=false) {
		return $content;
	}

	protected function get_file_name($name, $type = null, $index = null, $content_range = null) {
		$filename = parent::get_file_name($name, $type, $index, $content_range);
		return self::to_clean_file_name($filename);
	}

	/**
	 * Cleans up the file name to prevent spaces
	 *
	 * @param string $raw Raw file name
	 *
	 * @return string Fixed file name
	 */
	public static function to_clean_file_name ($raw) {
		return preg_replace('/\s+/', '-', $raw);
	}

	/**
	 * Override the image orientation and try to set memory limit high for this first.
	 *
	 * @param string $file_path
	 *
	 * @return bool
	 */
	protected function orient_image ($file_path) {
		if (!(defined('UPFRONT_SKIP_MEMORY_LIMIT_ADJUSTMENT') && UPFRONT_SKIP_MEMORY_LIMIT_ADJUSTMENT)) {
			@ini_set('memory_limit', '265M');
		}
		parent::orient_image($file_path);
	}

	public static function get_action_url ($action) {
		return add_query_arg(
			array(
				'action' => $action,
				self::REF => Upfront_Permissions::nonce(Upfront_Permissions::UPLOAD),
			), 
			admin_url('admin-ajax.php')
		);
	}

	public static function get_ref ($level) {
		return array(
			self::REF => Upfront_Permissions::nonce($level),
		);
	}
}