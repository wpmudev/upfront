<?php


class Upfront_MediaCollection extends Upfront_Media {

	private $_args = array(
		'post_type' => 'attachment',
		'post_status' => 'any', // Required for attachment
		'posts_per_page' => 20, // Paginate at most LIMIT items
	);
	private $_query = array();

	private function __construct () {}

	private function _spawn () {
		$this->_query = new WP_Query(
			apply_filters('upfront-media-query', $this->_args)
		);
	}

	public function to_collection () {
		if ($this->is_empty()) return array();
		$ret = array();
		foreach ($this->_query->posts as $post) {
			$ret[] = new Upfront_MediaItem($post);
		}
		return $ret;
	}

	public function to_php () {
		$collection = $this->to_collection();
		$ret = array();
		foreach ($collection as $item) {
			$ret[] = $item->to_php();
		}
		$meta = array(
			"max_pages" => $this->_query->max_num_pages + 1,
			"max_items" => (int)$this->_query->found_posts,
		);
		return array(
			'items' => $ret,
			'meta' => $meta,
		);
	}

	public function is_empty () {
		return empty($this->_query) || empty($this->_query->posts);
	}

	private function _set_type_arguments ($types) {
		$mimes = array();
		foreach ($types as $type) {
			$type = defined('Upfront_Media::MIME_TYPE_' . strtoupper($type)) ? constant('Upfront_Media::MIME_TYPE_' . strtoupper($type)) : Upfront_Media::MIME_TYPE_IMAGES;
			$mimes = array_merge(
				$mimes,
				array_unique(array_map('trim', explode(',', $type)))
			);
		}
		$mimes = apply_filters('upfront-media-arguments-post_mime_type', $mimes);
		if (!in_array(Upfront_Media::MIME_TYPE_OTHER, $mimes)) {
			$this->_args['post_mime_type'] = $mimes;
		}

		// Also get oEmbed fake imports
		if (in_array('videos', $types)) {
			$this->_oembed_video_filter = true;
		}
		if (in_array('audios', $types)) {
			$this->_oembed_audio_filter = true;
		}
	}

/* ----- Factory methods ----- */

	public static function apply_filters ($filters) {
		$args = array();
		$collection = new self;

		if (!empty($filters['type'])) $collection->_set_type_arguments($filters['type']);
		
		if (!empty($filters['media_limit'])) {
			$collection->_args['posts_per_page'] = intval($filters['media_limit']);
		}

		$order = $orderby = false;
		if (!empty($filters['order'])) {
			$raw_order = end($filters['order']);
			list($orderby, $order) = explode('_', $raw_order, 2);
			$collection->_args['orderby'] = $orderby;
			$collection->_args['order'] = strtoupper($order);
		}

		if (!empty($filters['recent'])) {
			$recent = end($filters['recent']);
			$time = date('Y-m-d', strtotime("-{$recent} days"));
			$recent_callback = create_function('$where', 'global $wpdb; return $where .= " AND {$wpdb->posts}.post_date > \'' . $time . '\'";');
			add_filter('posts_where', $recent_callback);
		}

		if (!empty($filters['label'])) {
			$collection->_args['tax_query'] = array(array(
				'taxonomy' => 'media_label',
				'field' => 'id',
				'terms' => $filters['label'],
			));
		}

		if (!empty($filters['search'])) {
			$collection->_args['s'] = $filters['search'][0];
		}

		if (!empty($filters['page']) && is_numeric($filters['page'])) {
			$collection->_args['paged'] = (int)$filters['page'];
		}

		$collection->_spawn();

		if (!empty($filters['recent']) && !empty($recent_callback)) {
			remove_filter('posts_where', $recent_callback);
		}

		if (!empty($collection->_oembed_video_filter)) {
			$video_oembed = new self;
			$video_oembed->_args['meta_query'] = array(array(
				'key' => 'oembed_type',
				'value' => 'video',
			));
			if ($order) $video_oembed->_args['order'] = strtoupper($order);
			if ($orderby) $video_oembed->_args['orderby'] = $orderby;
			if (!empty($filters['label'])) {
				$video_oembed->_args['tax_query'] = array(array(
					'taxonomy' => 'media_label',
					'field' => 'id',
					'terms' => $filters['label'],
				));
			}
			if (!empty($filters['search'])) {
				$video_oembed->_args['s'] = $filters['search'][0];
			}
			if (!empty($filters['page']) && is_numeric($filters['page'])) {
				$video_oembed->_args['paged'] = (int)$filters['page'];
			}
			$video_oembed->_spawn();
			$collection->_query->posts = array_merge(
				$collection->_query->posts,
				$video_oembed->_query->posts
			);
			if ($video_oembed->_query->max_num_pages > $collection->_query->max_num_pages) $collection->_query->max_num_pages = $video_oembed->_query->max_num_pages;
			$collection->_query->found_posts = (int)$collection->_query->found_posts + (int)$video_oembed->_query->found_posts;
		}
		if (!empty($collection->_oembed_audio_filter)) {
			$audio_oembed = new self;
			$audio_oembed->_args['meta_query'] = array(array(
				'key' => 'oembed_type',
				'value' => 'rich',
			));
			if ($order) $audio_oembed->_args['order'] = strtoupper($order);
			if ($orderby) $audio_oembed->_args['orderby'] = $orderby;
			if (!empty($filters['label'])) {
				$audio_oembed->_args['tax_query'] = array(array(
					'taxonomy' => 'media_label',
					'field' => 'id',
					'terms' => $filters['label'],
				));
			}
			if (!empty($filters['search'])) {
				$audio_oembed->_args['s'] = $filters['search'][0];
			}
			if (!empty($filters['page']) && is_numeric($filters['page'])) {
				$audio_oembed->_args['paged'] = (int)$filters['page'];
			}
			$audio_oembed->_spawn();
			$collection->_query->posts = array_merge(
				$collection->_query->posts,
				$audio_oembed->_query->posts
			);
			if ($audio_oembed->_query->max_num_pages > $collection->_query->max_num_pages) $collection->_query->max_num_pages = $audio_oembed->_query->max_num_pages;
			$collection->_query->found_posts = (int)$collection->_query->found_posts + (int)$audio_oembed->_query->found_posts;
		}
		return $collection;
	}
}