<?php

if (!class_exists('UploadHandler')) require_once('class_upload_handler.php');

class Upfront_UploadHandler extends UploadHandler {

	public function __construct () {
		$uploads = wp_upload_dir();
		parent::__construct(array(
			'script_url' => admin_url('admin-ajax.php?action=upfront-media-upload'),
			'upload_dir' => trailingslashit($uploads['path']),
			'upload_url' => trailingslashit($uploads['url']),
			'param_name' => 'media',
		), false);
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
}