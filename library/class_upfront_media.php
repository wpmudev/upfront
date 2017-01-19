<?php

abstract class Upfront_Media {

	const MIME_TYPE_IMAGES = 'image/jpeg,image/png,image/gif';
	const MIME_TYPE_AUDIOS = 'audio/mpeg';
	const MIME_TYPE_VIDEOS = 'video/mp4,video/webm';
	const MIME_TYPE_OTHER = ':other:';

	public function to_json () {
		return json_encode($this->to_php());
	}

	abstract public function to_php();

}

require_once('media/class_upfront_oembed.php');
require_once('media/class_upfront_media_collection.php');
require_once('media/class_upfront_media_item.php');
require_once('media/class_upfront_media_server.php');
require_once('media/class_upfront_upload_handler.php');
