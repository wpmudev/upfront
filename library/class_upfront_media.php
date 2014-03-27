<?php

abstract class Upfront_Media {

	const MIME_TYPE_IMAGES = 'image/jpeg,image/png,image/gif';
	const MIME_TYPE_AUDIOS = 'audio/mpeg';
	const MIME_TYPE_VIDEOS = 'video/mp4';

	public function to_json () {
		return json_encode($this->to_php());
	}

	abstract public function to_php();

}

class Upfront_Oembed {

    private $_wp_oembed;
    private $_url;

    public function __construct ($url=false) {
        if (!function_exists('_wp_oembed_get_object')) require_once ABSPATH . WPINC . '/class-oembed.php';
        $this->_wp_oembed = _wp_oembed_get_object();
        $this->set_url($url);
    }

    public function set_url ($url) {
        $this->_url = esc_url($url);
    }

    public function get_info () {
        if (!$this->_url) return false;

        // Yay! Tight coupled code, so let's nab
        foreach ( $this->_wp_oembed->providers as $matchmask => $data ) {
            list( $providerurl, $regex ) = $data;

            // Turn the asterisk-type provider URLs into regex
            if ( !$regex ) {
                $matchmask = '#' . str_replace( '___wildcard___', '(.+)', preg_quote( str_replace( '*', '___wildcard___', $matchmask ), '#' ) ) . '#i';
                $matchmask = preg_replace( '|^#http\\\://|', '#https?\://', $matchmask );
            }

            if ( preg_match( $matchmask, $this->_url ) ) {
                $provider = str_replace( '{format}', 'json', $providerurl ); // JSON is easier to deal with than XML
                break;
            }
        }
        // Done nabbing

        if (!$provider) $provider = $this->_wp_oembed->discover($this->_url);
        if (!$provider) return false;
        return $this->_wp_oembed->fetch($provider, $this->_url, array('discover' => true, 'width' => 10000, 'height' => 10000));
    }

    public function get_embed_code () {
        $info = $this->get_info();
        if (empty($info) || !is_object($info) || empty($info->html)) return false;
        return $info->html;
    }
}

class Upfront_MediaCollection extends Upfront_Media {

	private $_args = array(
		'post_type' => 'attachment',
		'post_status' => 'any', // Required for attachment
		'posts_per_page' => 10, // Paginate at most LIMIT items
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
            "max_pages" => $this->_query->max_num_pages,
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
        $this->_args['post_mime_type'] = apply_filters('upfront-media-arguments-post_mime_type', $mimes);

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

        if ($collection->_oembed_video_filter) {
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
        }
        if ($collection->_oembed_audio_filter) {
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
        }
        return $collection;
    }
}

class Upfront_MediaItem extends Upfront_Media {

	private $_post;

	public function __construct ($post) {
		$this->_post = $post;
	}

	public function to_php () {
        $label_objs = wp_get_object_terms($this->_post->ID, 'media_label');
        $labels = array();
        foreach ($label_objs as $label) {
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
            'labels' => $labels,
            'image' => array(
                "src" => $image_data[0],
                "width" => $image_data[1],
                "height" => $image_data[2],
                "resized" => $image_data[3],
            ),
            'additional_sizes' => $sizes,
		);
	}
}

class Upfront_MediaServer extends Upfront_Server {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
        add_action('init', array($this, 'augment_attachments'));

        add_action('wp_ajax_upfront-media-list_media', array($this, "list_media"));
        add_action('wp_ajax_upfront-media-get_item', array($this, "get_item"));
		add_action('wp_ajax_upfront-media-remove_item', array($this, "remove_item"));
		add_action('wp_ajax_upfront-media-update_media_item', array($this, "update_media_item"));
        add_action('wp_ajax_upfront-media-upload', array($this, "upload_media"));
        add_action('wp_ajax_upfront-media-embed', array($this, "embed_media"));
        add_action('wp_ajax_upfront-media-get_embed_raw', array($this, "get_embed_raw"));

        add_action('wp_ajax_upfront-media-list_theme_images', array($this, "list_theme_images"));
        add_action('wp_ajax_upfront-media-upload-theme-image', array($this, "upload_theme_image"));

        add_action('wp_ajax_upfront-media-get_labels', array($this, "list_labels"));
        add_action('wp_ajax_upfront-media-add_label', array($this, "add_label"));
        add_action('wp_ajax_upfront-media-associate_label', array($this, "associate_label"));
        add_action('wp_ajax_upfront-media-disassociate_label', array($this, "disassociate_label"));
        add_action('wp_ajax_upfront-media_get_image_labels', array($this, "get_image_labels"));
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
                    'name' => __('Media Labels', 'upfront'), //UPFRONT_TEXTDOMAIN),
                    'singular_name' => __('Media Label', 'upfront') //UPFRONT_TEXTDOMAIN),
                ),
                'hierarchical' => false,
                'public' => true,
            )
        );
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
            $filename = basename($media);
        }
        $wp_upload_dir = wp_upload_dir();
        $pfx = !empty($wp_upload_dir['path']) ? trailingslashit($wp_upload_dir['path']) : '';
        while (file_exists("{$pfx}{$filename}")) {
            $filename = rand() . $filename;
        }
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
            'post_title' => preg_replace('/\.[^.]+$/', '', basename($filename)),
            'post_content' => '',
            'post_status' => 'inherit'
        );
        $attach_id = wp_insert_attachment($attachment, "{$pfx}{$filename}");
        $attach_data = wp_generate_attachment_metadata( $attach_id, "{$pfx}{$filename}" );
        wp_update_attachment_metadata( $attach_id, $attach_data );
        return $attach_id;
    }

    public function embed_media () {
        $data = stripslashes_deep($_POST);
        $media = !empty($data['media']) ? $data['media'] : false;
        if (!$media) $this->_out(new Upfront_JsonResponse_Error("Invalid media"));

        // Is it an image?
        if (preg_match('/\.(jpe?g|gif|png)$/i', trim($media))) {
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
                    'post_excerpt' => $data->description,
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
		if (!$query->is_empty()) $this->_out(new Upfront_JsonResponse_Success($query->to_php()));
		else $this->_out(new Upfront_JsonResponse_Error("No items"));
	}

    public function list_theme_images () {
        $images = array();
        $dirPath = get_stylesheet_directory() . '/img';
        $dirUrl = get_stylesheet_directory_uri() . '/img/';
        $i = 0;
        if($dir = opendir($dirPath)) {
            while (false !== ($file = readdir($dir))) {
                if(is_dir($dirPath . '/' . $file))
                    continue;

                if(preg_match('/\.(jpg|jpeg|gif|svg|png|bmp)$/i', $file))
                    $images[] = array(
                        'ID' => $i++,
                        'thumbnail' => '<img style="max-height: 75px; max-width: 75px" src="' . $dirUrl . $file . '">',
                        'post_title' => $file,
                        'labels' => array(),
                        'original_url' => $dirUrl . $file
                    );
            }
        }
        if (sizeof($images))
            $this->_out(new Upfront_JsonResponse_Success($images));
        else
            $this->_out(new Upfront_JsonResponse_Error("No items"));
    }

    public function upload_theme_image () {
        if(!isset($_FILES['media']))
            $this->_out(new Upfront_JsonResponse_Error("No file to upload"));

        $file = $_FILES['media'];
        $filename = $file['name'];

        if(!preg_match('/\.(jpg|jpeg|gif|svg|png|bmp)$/i', $filename))
            $this->_out(new Upfront_JsonResponse_Error("The file is not an image."));

        $dirPath = get_stylesheet_directory() . '/img/';
        $dirUrl = get_stylesheet_directory_uri() . '/img/';

        move_uploaded_file($file["tmp_name"], $dirPath . $filename);


        $this->_out(new Upfront_JsonResponse_Success(array(
            'ID' => rand(1111,9999), //Whatever high number is ok
            'original_url' => $dirUrl . $filename,
            'thumbnail' => '<img style="max-height: 75px; max-width: 75px" src="' . $dirUrl . $filename . '">',
            'post_title' => $filename,
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

	public function upload_media () {
		$upload = new Upfront_UploadHandler;
        $result = $upload->handle();
        if (empty($result['media'])) $this->_out(new Upfront_JsonResponse_Error("Error uploading the media item"));

        if (!function_exists('wp_generate_attachment_metadata')) require_once(ABSPATH . 'wp-admin/includes/image.php');
        $wp_upload_dir = wp_upload_dir();
        $pfx = !empty($wp_upload_dir['path']) ? trailingslashit($wp_upload_dir['path']) : '';
        $new_ids = array();
        foreach ($result['media'] as $media) {
            if (!empty($media->error)) {
                // We have an error happening!
                @unlink("{$pfx}{$filename}");
                $this->_out(new Upfront_JsonResponse_Error("Error uploading the media item: {$media->error}"));
            }
            $filename = $media->name;
            $wp_filetype = wp_check_filetype(basename($filename), null);
            $attachment = array(
                'guid' => $wp_upload_dir['url'] . '/' . basename($filename),
                'post_mime_type' => $wp_filetype['type'],
                'post_title' => preg_replace('/\.[^.]+$/', '', basename($filename)),
                'post_content' => '',
                'post_status' => 'inherit'
            );
            $attach_id = wp_insert_attachment($attachment, "{$pfx}{$filename}");
            $attach_data = wp_generate_attachment_metadata( $attach_id, "{$pfx}{$filename}" );
            wp_update_attachment_metadata( $attach_id, $attach_data );
            $new_ids[] = $attach_id;
        }
        $this->_out(new Upfront_JsonResponse_Success($new_ids));
	}
}
Upfront_MediaServer::serve();

function upfront_media_file_upload () {
    if (!is_user_logged_in()) return false;
	$base_url = Upfront::get_root_url();
	wp_enqueue_script('fileupload', "{$base_url}/scripts/file_upload/jquery.fileupload.js", array('jquery'));
	wp_enqueue_script('fileupload-iframe', "{$base_url}/scripts/file_upload/jquery.iframe-transport.js", array('fileupload'));
	echo '<script>var _upfront_media_upload="' . admin_url('admin-ajax.php?action=upfront-media-upload') . '";</script>';
}
add_action('wp_head', 'upfront_media_file_upload', 99);





/*
 * jQuery File Upload Plugin PHP Class 6.7
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

class UploadHandler
{
    protected $options;
    // PHP File Upload error message codes:
    // http://php.net/manual/en/features.file-upload.errors.php
    protected $error_messages = array(
        1 => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
        2 => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form',
        3 => 'The uploaded file was only partially uploaded',
        4 => 'No file was uploaded',
        6 => 'Missing a temporary folder',
        7 => 'Failed to write file to disk',
        8 => 'A PHP extension stopped the file upload',
        'post_max_size' => 'The uploaded file exceeds the post_max_size directive in php.ini',
        'max_file_size' => 'File is too big',
        'min_file_size' => 'File is too small',
        'accept_file_types' => 'Filetype not allowed',
        'max_number_of_files' => 'Maximum number of files exceeded',
        'max_width' => 'Image exceeds maximum width',
        'min_width' => 'Image requires a minimum width',
        'max_height' => 'Image exceeds maximum height',
        'min_height' => 'Image requires a minimum height'
    );

    function __construct($options = null, $initialize = true, $error_messages = null) {
        $this->options = array(
            'script_url' => $this->get_full_url().'/',
            'upload_dir' => dirname($this->get_server_var('SCRIPT_FILENAME')).'/files/',
            'upload_url' => $this->get_full_url().'/files/',
            'user_dirs' => false,
            'mkdir_mode' => 0755,
            'param_name' => 'files',
            // Set the following option to 'POST', if your server does not support
            // DELETE requests. This is a parameter sent to the client:
            'delete_type' => 'DELETE',
            'access_control_allow_origin' => '*',
            'access_control_allow_credentials' => false,
            'access_control_allow_methods' => array(
                'OPTIONS',
                'HEAD',
                'GET',
                'POST',
                'PUT',
                'PATCH',
                'DELETE'
            ),
            'access_control_allow_headers' => array(
                'Content-Type',
                'Content-Range',
                'Content-Disposition'
            ),
            // Enable to provide file downloads via GET requests to the PHP script:
            //     1. Set to 1 to download files via readfile method through PHP
            //     2. Set to 2 to send a X-Sendfile header for lighttpd/Apache
            //     3. Set to 3 to send a X-Accel-Redirect header for nginx
            // If set to 2 or 3, adjust the upload_url option to the base path of
            // the redirect parameter, e.g. '/files/'.
            'download_via_php' => false,
            // Read files in chunks to avoid memory limits when download_via_php
            // is enabled, set to 0 to disable chunked reading of files:
            'readfile_chunk_size' => 10 * 1024 * 1024, // 10 MiB
            // Defines which files can be displayed inline when downloaded:
            'inline_file_types' => '/\.(gif|jpe?g|png)$/i',
            // Defines which files (based on their names) are accepted for upload:
            'accept_file_types' => '/.+$/i',
            // The php.ini settings upload_max_filesize and post_max_size
            // take precedence over the following max_file_size setting:
            'max_file_size' => null,
            'min_file_size' => 1,
            // The maximum number of files for the upload directory:
            'max_number_of_files' => null,
            // Image resolution restrictions:
            'max_width' => null,
            'max_height' => null,
            'min_width' => 1,
            'min_height' => 1,
            // Set the following option to false to enable resumable uploads:
            'discard_aborted_uploads' => true,
            // Set to false to disable rotating images based on EXIF meta data:
            'orient_image' => true,
            'image_versions' => array(
                // Uncomment the following version to restrict the size of
                // uploaded images:
                /*
                '' => array(
                    'max_width' => 1920,
                    'max_height' => 1200,
                    'jpeg_quality' => 95
                ),
                */
                // Uncomment the following to create medium sized images:
                /*
                'medium' => array(
                    'max_width' => 800,
                    'max_height' => 600,
                    'jpeg_quality' => 80
                ),
                */
            /*
                'thumbnail' => array(
                    // Uncomment the following to use a defined directory for the thumbnails
                    // instead of a subdirectory based on the version identifier.
                    // Make sure that this directory doesn't allow execution of files if you
                    // don't pose any restrictions on the type of uploaded files, e.g. by
                    // copying the .htaccess file from the files directory for Apache:
                    //'upload_dir' => dirname($this->get_server_var('SCRIPT_FILENAME')).'/thumb/',
                    //'upload_url' => $this->get_full_url().'/thumb/',
                    // Uncomment the following to force the max
                    // dimensions and e.g. create square thumbnails:
                    //'crop' => true,
                    'max_width' => 80,
                    'max_height' => 80
                )
                */
            )
        );
        if ($options) {
            $this->options = array_merge($this->options, $options);
        }
        if ($error_messages) {
            $this->error_messages = array_merge($this->error_messages, $error_messages);
        }
        if ($initialize) {
            $this->initialize();
        }
    }

    protected function initialize() {
        switch ($this->get_server_var('REQUEST_METHOD')) {
            case 'OPTIONS':
            case 'HEAD':
                $this->head();
                break;
            case 'GET':
                $this->get();
                break;
            case 'PATCH':
            case 'PUT':
            case 'POST':
                $this->post();
                break;
            case 'DELETE':
                $this->delete();
                break;
            default:
                $this->header('HTTP/1.1 405 Method Not Allowed');
        }
    }

    protected function get_full_url() {
        $https = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
        return
            ($https ? 'https://' : 'http://').
            (!empty($_SERVER['REMOTE_USER']) ? $_SERVER['REMOTE_USER'].'@' : '').
            (isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : ($_SERVER['SERVER_NAME'].
            ($https && $_SERVER['SERVER_PORT'] === 443 ||
            $_SERVER['SERVER_PORT'] === 80 ? '' : ':'.$_SERVER['SERVER_PORT']))).
            substr($_SERVER['SCRIPT_NAME'],0, strrpos($_SERVER['SCRIPT_NAME'], '/'));
    }

    protected function get_user_id() {
        @session_start();
        return session_id();
    }

    protected function get_user_path() {
        if ($this->options['user_dirs']) {
            return $this->get_user_id().'/';
        }
        return '';
    }

    protected function get_upload_path($file_name = null, $version = null) {
        $file_name = $file_name ? $file_name : '';
        if (empty($version)) {
            $version_path = '';
        } else {
            $version_dir = @$this->options['image_versions'][$version]['upload_dir'];
            if ($version_dir) {
                return $version_dir.$this->get_user_path().$file_name;
            }
            $version_path = $version.'/';
        }
        return $this->options['upload_dir'].$this->get_user_path()
            .$version_path.$file_name;
    }

    protected function get_query_separator($url) {
        return strpos($url, '?') === false ? '?' : '&';
    }

    protected function get_download_url($file_name, $version = null, $direct = false) {
        if (!$direct && $this->options['download_via_php']) {
            $url = $this->options['script_url']
                .$this->get_query_separator($this->options['script_url'])
                .'file='.rawurlencode($file_name);
            if ($version) {
                $url .= '&version='.rawurlencode($version);
            }
            return $url.'&download=1';
        }
        if (empty($version)) {
            $version_path = '';
        } else {
            $version_url = @$this->options['image_versions'][$version]['upload_url'];
            if ($version_url) {
                return $version_url.$this->get_user_path().rawurlencode($file_name);
            }
            $version_path = rawurlencode($version).'/';
        }
        return $this->options['upload_url'].$this->get_user_path()
            .$version_path.rawurlencode($file_name);
    }

    protected function set_additional_file_properties($file) {
        $file->delete_url = $this->options['script_url']
            .$this->get_query_separator($this->options['script_url'])
            .'file='.rawurlencode($file->name);
        $file->delete_type = $this->options['delete_type'];
        if ($file->delete_type !== 'DELETE') {
            $file->delete_url .= '&_method=DELETE';
        }
        if ($this->options['access_control_allow_credentials']) {
            $file->delete_with_credentials = true;
        }
    }

    // Fix for overflowing signed 32 bit integers,
    // works for sizes up to 2^32-1 bytes (4 GiB - 1):
    protected function fix_integer_overflow($size) {
        if ($size < 0) {
            $size += 2.0 * (PHP_INT_MAX + 1);
        }
        return $size;
    }

    protected function get_file_size($file_path, $clear_stat_cache = false) {
        if ($clear_stat_cache) {
            clearstatcache(true, $file_path);
        }
        return $this->fix_integer_overflow(filesize($file_path));

    }

    protected function is_valid_file_object($file_name) {
        $file_path = $this->get_upload_path($file_name);
        if (is_file($file_path) && $file_name[0] !== '.') {
            return true;
        }
        return false;
    }

    protected function get_file_object($file_name) {
        if ($this->is_valid_file_object($file_name)) {
            $file = new stdClass();
            $file->name = $file_name;
            $file->size = $this->get_file_size(
                $this->get_upload_path($file_name)
            );
            $file->url = $this->get_download_url($file->name);
            foreach($this->options['image_versions'] as $version => $options) {
                if (!empty($version)) {
                    if (is_file($this->get_upload_path($file_name, $version))) {
                        $file->{$version.'_url'} = $this->get_download_url(
                            $file->name,
                            $version
                        );
                    }
                }
            }
            $this->set_additional_file_properties($file);
            return $file;
        }
        return null;
    }

    protected function get_file_objects($iteration_method = 'get_file_object') {
        $upload_dir = $this->get_upload_path();
        if (!is_dir($upload_dir)) {
            return array();
        }
        return array_values(array_filter(array_map(
            array($this, $iteration_method),
            scandir($upload_dir)
        )));
    }

    protected function count_file_objects() {
        return count($this->get_file_objects('is_valid_file_object'));
    }

    protected function create_scaled_image($file_name, $version, $options) {
        $file_path = $this->get_upload_path($file_name);
        if (!empty($version)) {
            $version_dir = $this->get_upload_path(null, $version);
            if (!is_dir($version_dir)) {
                mkdir($version_dir, $this->options['mkdir_mode'], true);
            }
            $new_file_path = $version_dir.'/'.$file_name;
        } else {
            $new_file_path = $file_path;
        }
        if (!function_exists('getimagesize')) {
            error_log('Function not found: getimagesize');
            return false;
        }
        list($img_width, $img_height) = @getimagesize($file_path);
        if (!$img_width || !$img_height) {
            return false;
        }
        $max_width = $options['max_width'];
        $max_height = $options['max_height'];
        $scale = min(
            $max_width / $img_width,
            $max_height / $img_height
        );
        if ($scale >= 1) {
            if ($file_path !== $new_file_path) {
                return copy($file_path, $new_file_path);
            }
            return true;
        }
        if (!function_exists('imagecreatetruecolor')) {
            error_log('Function not found: imagecreatetruecolor');
            return false;
        }
        if (empty($options['crop'])) {
            $new_width = $img_width * $scale;
            $new_height = $img_height * $scale;
            $dst_x = 0;
            $dst_y = 0;
            $new_img = imagecreatetruecolor($new_width, $new_height);
        } else {
            if (($img_width / $img_height) >= ($max_width / $max_height)) {
                $new_width = $img_width / ($img_height / $max_height);
                $new_height = $max_height;
            } else {
                $new_width = $max_width;
                $new_height = $img_height / ($img_width / $max_width);
            }
            $dst_x = 0 - ($new_width - $max_width) / 2;
            $dst_y = 0 - ($new_height - $max_height) / 2;
            $new_img = imagecreatetruecolor($max_width, $max_height);
        }
        switch (strtolower(substr(strrchr($file_name, '.'), 1))) {
            case 'jpg':
            case 'jpeg':
                $src_img = imagecreatefromjpeg($file_path);
                $write_image = 'imagejpeg';
                $image_quality = isset($options['jpeg_quality']) ?
                    $options['jpeg_quality'] : 75;
                break;
            case 'gif':
                imagecolortransparent($new_img, imagecolorallocate($new_img, 0, 0, 0));
                $src_img = imagecreatefromgif($file_path);
                $write_image = 'imagegif';
                $image_quality = null;
                break;
            case 'png':
                imagecolortransparent($new_img, imagecolorallocate($new_img, 0, 0, 0));
                imagealphablending($new_img, false);
                imagesavealpha($new_img, true);
                $src_img = imagecreatefrompng($file_path);
                $write_image = 'imagepng';
                $image_quality = isset($options['png_quality']) ?
                    $options['png_quality'] : 9;
                break;
            default:
                imagedestroy($new_img);
                return false;
        }
        $success = imagecopyresampled(
            $new_img,
            $src_img,
            $dst_x,
            $dst_y,
            0,
            0,
            $new_width,
            $new_height,
            $img_width,
            $img_height
        ) && $write_image($new_img, $new_file_path, $image_quality);
        // Free up memory (imagedestroy does not delete files):
        imagedestroy($src_img);
        imagedestroy($new_img);
        return $success;
    }

    protected function get_error_message($error) {
        return array_key_exists($error, $this->error_messages) ?
            $this->error_messages[$error] : $error;
    }

    function get_config_bytes($val) {
        $val = trim($val);
        $last = strtolower($val[strlen($val)-1]);
        switch($last) {
            case 'g':
                $val *= 1024;
            case 'm':
                $val *= 1024;
            case 'k':
                $val *= 1024;
        }
        return $this->fix_integer_overflow($val);
    }

    protected function validate($uploaded_file, $file, $error, $index) {
        if ($error) {
            $file->error = $this->get_error_message($error);
            return false;
        }
        $content_length = $this->fix_integer_overflow(intval(
            $this->get_server_var('CONTENT_LENGTH')
        ));
        $post_max_size = $this->get_config_bytes(ini_get('post_max_size'));
        if ($post_max_size && ($content_length > $post_max_size)) {
            $file->error = $this->get_error_message('post_max_size');
            return false;
        }
        if (!preg_match($this->options['accept_file_types'], $file->name)) {
            $file->error = $this->get_error_message('accept_file_types');
            return false;
        }
        if ($uploaded_file && is_uploaded_file($uploaded_file)) {
            $file_size = $this->get_file_size($uploaded_file);
        } else {
            $file_size = $content_length;
        }
        if ($this->options['max_file_size'] && (
                $file_size > $this->options['max_file_size'] ||
                $file->size > $this->options['max_file_size'])
            ) {
            $file->error = $this->get_error_message('max_file_size');
            return false;
        }
        if ($this->options['min_file_size'] &&
            $file_size < $this->options['min_file_size']) {
            $file->error = $this->get_error_message('min_file_size');
            return false;
        }
        if (is_int($this->options['max_number_of_files']) && (
                $this->count_file_objects() >= $this->options['max_number_of_files'])
            ) {
            $file->error = $this->get_error_message('max_number_of_files');
            return false;
        }
        list($img_width, $img_height) = @getimagesize($uploaded_file);
        if (is_int($img_width)) {
            if ($this->options['max_width'] && $img_width > $this->options['max_width']) {
                $file->error = $this->get_error_message('max_width');
                return false;
            }
            if ($this->options['max_height'] && $img_height > $this->options['max_height']) {
                $file->error = $this->get_error_message('max_height');
                return false;
            }
            if ($this->options['min_width'] && $img_width < $this->options['min_width']) {
                $file->error = $this->get_error_message('min_width');
                return false;
            }
            if ($this->options['min_height'] && $img_height < $this->options['min_height']) {
                $file->error = $this->get_error_message('min_height');
                return false;
            }
        }
        return true;
    }

    protected function upcount_name_callback($matches) {
        $index = isset($matches[1]) ? intval($matches[1]) + 1 : 1;
        $ext = isset($matches[2]) ? $matches[2] : '';
        return ' ('.$index.')'.$ext;
    }

    protected function upcount_name($name) {
        return preg_replace_callback(
            '/(?:(?: \(([\d]+)\))?(\.[^.]+))?$/',
            array($this, 'upcount_name_callback'),
            $name,
            1
        );
    }

    protected function get_unique_filename($name,
            $type = null, $index = null, $content_range = null) {
        while(is_dir($this->get_upload_path($name))) {
            $name = $this->upcount_name($name);
        }
        // Keep an existing filename if this is part of a chunked upload:
        $uploaded_bytes = $this->fix_integer_overflow(intval($content_range[1]));
        while(is_file($this->get_upload_path($name))) {
            if ($uploaded_bytes === $this->get_file_size(
                    $this->get_upload_path($name))) {
                break;
            }
            $name = $this->upcount_name($name);
        }
        return $name;
    }

    protected function trim_file_name($name,
            $type = null, $index = null, $content_range = null) {
        // Remove path information and dots around the filename, to prevent uploading
        // into different directories or replacing hidden system files.
        // Also remove control characters and spaces (\x00..\x20) around the filename:
        $name = trim(basename(stripslashes($name)), ".\x00..\x20");
        // Use a timestamp for empty filenames:
        if (!$name) {
            $name = str_replace('.', '-', microtime(true));
        }
        // Add missing file extension for known image types:
        if (strpos($name, '.') === false &&
            preg_match('/^image\/(gif|jpe?g|png)/', $type, $matches)) {
            $name .= '.'.$matches[1];
        }
        return $name;
    }

    protected function get_file_name($name,
            $type = null, $index = null, $content_range = null) {
        return $this->get_unique_filename(
            $this->trim_file_name($name, $type, $index, $content_range),
            $type,
            $index,
            $content_range
        );
    }

    protected function handle_form_data($file, $index) {
        // Handle form data, e.g. $_REQUEST['description'][$index]
    }

    protected function imageflip($image, $mode) {
        if (function_exists('imageflip')) {
            return imageflip($image, $mode);
        }
        $new_width = $src_width = imagesx($image);
        $new_height = $src_height = imagesy($image);
        $new_img = imagecreatetruecolor($new_width, $new_height);
        $src_x = 0;
        $src_y = 0;
        switch ($mode) {
            case '1': // flip on the horizontal axis
                $src_y = $new_height - 1;
                $src_height = -$new_height;
                break;
            case '2': // flip on the vertical axis
                $src_x  = $new_width - 1;
                $src_width = -$new_width;
                break;
            case '3': // flip on both axes
                $src_y = $new_height - 1;
                $src_height = -$new_height;
                $src_x  = $new_width - 1;
                $src_width = -$new_width;
                break;
            default:
                return $image;
        }
        imagecopyresampled(
            $new_img,
            $image,
            0,
            0,
            $src_x,
            $src_y,
            $new_width,
            $new_height,
            $src_width,
            $src_height
        );
        // Free up memory (imagedestroy does not delete files):
        imagedestroy($image);
        return $new_img;
    }

    protected function orient_image($file_path) {
        if (!function_exists('exif_read_data')) {
            return false;
        }
        $exif = @exif_read_data($file_path);
        if ($exif === false) {
            return false;
        }
        $orientation = intval(@$exif['Orientation']);
        if ($orientation < 2 || $orientation > 8) {
            return false;
        }
        $image = imagecreatefromjpeg($file_path);
        switch ($orientation) {
            case 2:
                $image = $this->imageflip(
                    $image,
                    defined('IMG_FLIP_VERTICAL') ? IMG_FLIP_VERTICAL : 2
                );
                break;
            case 3:
                $image = imagerotate($image, 180, 0);
                break;
            case 4:
                $image = $this->imageflip(
                    $image,
                    defined('IMG_FLIP_HORIZONTAL') ? IMG_FLIP_HORIZONTAL : 1
                );
                break;
            case 5:
                $image = $this->imageflip(
                    $image,
                    defined('IMG_FLIP_HORIZONTAL') ? IMG_FLIP_HORIZONTAL : 1
                );
                $image = imagerotate($image, 270, 0);
                break;
            case 6:
                $image = imagerotate($image, 270, 0);
                break;
            case 7:
                $image = $this->imageflip(
                    $image,
                    defined('IMG_FLIP_VERTICAL') ? IMG_FLIP_VERTICAL : 2
                );
                $image = imagerotate($image, 270, 0);
                break;
            case 8:
                $image = imagerotate($image, 90, 0);
                break;
            default:
                return false;
        }
        $success = imagejpeg($image, $file_path);
        // Free up memory (imagedestroy does not delete files):
        imagedestroy($image);
        return $success;
    }

    protected function handle_image_file($file_path, $file) {
        if ($this->options['orient_image']) {
            $this->orient_image($file_path);
        }
        $failed_versions = array();
        foreach($this->options['image_versions'] as $version => $options) {
            if ($this->create_scaled_image($file->name, $version, $options)) {
                if (!empty($version)) {
                    $file->{$version.'_url'} = $this->get_download_url(
                        $file->name,
                        $version
                    );
                } else {
                    $file->size = $this->get_file_size($file_path, true);
                }
            } else {
                $failed_versions[] = $version;
            }
        }
        switch (count($failed_versions)) {
            case 0:
                break;
            case 1:
                $file->error = 'Failed to create scaled version: '
                    .$failed_versions[0];
                break;
            default:
                $file->error = 'Failed to create scaled versions: '
                    .implode($failed_versions,', ');
        }
    }

    protected function handle_file_upload($uploaded_file, $name, $size, $type, $error,
            $index = null, $content_range = null) {
        $file = new stdClass();
        $file->name = $this->get_file_name($name, $type, $index, $content_range);
        $file->size = $this->fix_integer_overflow(intval($size));
        $file->type = $type;
        if ($this->validate($uploaded_file, $file, $error, $index)) {
            $this->handle_form_data($file, $index);
            $upload_dir = $this->get_upload_path();
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, $this->options['mkdir_mode'], true);
            }
            $file_path = $this->get_upload_path($file->name);
            $append_file = $content_range && is_file($file_path) &&
                $file->size > $this->get_file_size($file_path);
            if ($uploaded_file && is_uploaded_file($uploaded_file)) {
                // multipart/formdata uploads (POST method uploads)
                if ($append_file) {
                    file_put_contents(
                        $file_path,
                        fopen($uploaded_file, 'r'),
                        FILE_APPEND
                    );
                } else {
                    move_uploaded_file($uploaded_file, $file_path);
                }
            } else {
                // Non-multipart uploads (PUT method support)
                file_put_contents(
                    $file_path,
                    fopen('php://input', 'r'),
                    $append_file ? FILE_APPEND : 0
                );
            }
            $file_size = $this->get_file_size($file_path, $append_file);
            if ($file_size === $file->size) {
                $file->url = $this->get_download_url($file->name);
                list($img_width, $img_height) = @getimagesize($file_path);
                if (is_int($img_width) &&
                        preg_match($this->options['inline_file_types'], $file->name)) {
                    $this->handle_image_file($file_path, $file);
                }
            } else {
                $file->size = $file_size;
                if (!$content_range && $this->options['discard_aborted_uploads']) {
                    unlink($file_path);
                    $file->error = 'abort';
                }
            }
            $this->set_additional_file_properties($file);
        }
        return $file;
    }

    protected function readfile($file_path) {
        $file_size = $this->get_file_size($file_path);
        $chunk_size = $this->options['readfile_chunk_size'];
        if ($chunk_size && $file_size > $chunk_size) {
            $handle = fopen($file_path, 'rb');
            while (!feof($handle)) {
                echo fread($handle, $chunk_size);
                ob_flush();
                flush();
            }
            fclose($handle);
            return $file_size;
        }
        return readfile($file_path);
    }

    protected function body($str) {
        echo $str;
    }

    protected function header($str) {
        header($str);
    }

    protected function get_server_var($id) {
        return isset($_SERVER[$id]) ? $_SERVER[$id] : '';
    }

    protected function generate_response($content, $print_response = true) {
        if ($print_response) {
            $json = json_encode($content);
            $redirect = isset($_REQUEST['redirect']) ?
                stripslashes($_REQUEST['redirect']) : null;
            if ($redirect) {
                $this->header('Location: '.sprintf($redirect, rawurlencode($json)));
                return;
            }
            $this->head();
            if ($this->get_server_var('HTTP_CONTENT_RANGE')) {
                $files = isset($content[$this->options['param_name']]) ?
                    $content[$this->options['param_name']] : null;
                if ($files && is_array($files) && is_object($files[0]) && $files[0]->size) {
                    $this->header('Range: 0-'.(
                        $this->fix_integer_overflow(intval($files[0]->size)) - 1
                    ));
                }
            }
            $this->body($json);
        }
        return $content;
    }

    protected function get_version_param() {
        return isset($_GET['version']) ? basename(stripslashes($_GET['version'])) : null;
    }

    protected function get_file_name_param() {
        return isset($_GET['file']) ? basename(stripslashes($_GET['file'])) : null;
    }

    protected function get_file_type($file_path) {
        switch (strtolower(pathinfo($file_path, PATHINFO_EXTENSION))) {
            case 'jpeg':
            case 'jpg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            default:
                return '';
        }
    }

    protected function download() {
        switch ($this->options['download_via_php']) {
            case 1:
                $redirect_header = null;
                break;
            case 2:
                $redirect_header = 'X-Sendfile';
                break;
            case 3:
                $redirect_header = 'X-Accel-Redirect';
                break;
            default:
                return $this->header('HTTP/1.1 403 Forbidden');
        }
        $file_name = $this->get_file_name_param();
        if (!$this->is_valid_file_object($file_name)) {
            return $this->header('HTTP/1.1 404 Not Found');
        }
        if ($redirect_header) {
            return $this->header(
                $redirect_header.': '.$this->get_download_url(
                    $file_name,
                    $this->get_version_param(),
                    true
                )
            );
        }
        $file_path = $this->get_upload_path($file_name, $this->get_version_param());
        if (!preg_match($this->options['inline_file_types'], $file_name)) {
            $this->header('Content-Description: File Transfer');
            $this->header('Content-Type: application/octet-stream');
            $this->header('Content-Disposition: attachment; filename="'.$file_name.'"');
            $this->header('Content-Transfer-Encoding: binary');
        } else {
            // Prevent Internet Explorer from MIME-sniffing the content-type:
            $this->header('X-Content-Type-Options: nosniff');
            $this->header('Content-Type: '.$this->get_file_type($file_path));
            $this->header('Content-Disposition: inline; filename="'.$file_name.'"');
        }
        $this->header('Content-Length: '.$this->get_file_size($file_path));
        $this->header('Last-Modified: '.gmdate('D, d M Y H:i:s T', filemtime($file_path)));
        $this->readfile($file_path);
    }

    protected function send_content_type_header() {
        $this->header('Vary: Accept');
        if (strpos($this->get_server_var('HTTP_ACCEPT'), 'application/json') !== false) {
            $this->header('Content-type: application/json');
        } else {
            $this->header('Content-type: text/plain');
        }
    }

    protected function send_access_control_headers() {
        $this->header('Access-Control-Allow-Origin: '.$this->options['access_control_allow_origin']);
        $this->header('Access-Control-Allow-Credentials: '
            .($this->options['access_control_allow_credentials'] ? 'true' : 'false'));
        $this->header('Access-Control-Allow-Methods: '
            .implode(', ', $this->options['access_control_allow_methods']));
        $this->header('Access-Control-Allow-Headers: '
            .implode(', ', $this->options['access_control_allow_headers']));
    }

    public function head() {
        $this->header('Pragma: no-cache');
        $this->header('Cache-Control: no-store, no-cache, must-revalidate');
        $this->header('Content-Disposition: inline; filename="files.json"');
        // Prevent Internet Explorer from MIME-sniffing the content-type:
        $this->header('X-Content-Type-Options: nosniff');
        if ($this->options['access_control_allow_origin']) {
            $this->send_access_control_headers();
        }
        $this->send_content_type_header();
    }

    public function get($print_response = true) {
        if ($print_response && isset($_GET['download'])) {
            return $this->download();
        }
        $file_name = $this->get_file_name_param();
        if ($file_name) {
            $response = array(
                substr($this->options['param_name'], 0, -1) => $this->get_file_object($file_name)
            );
        } else {
            $response = array(
                $this->options['param_name'] => $this->get_file_objects()
            );
        }
        return $this->generate_response($response, $print_response);
    }

    public function post($print_response = true) {
        if (isset($_REQUEST['_method']) && $_REQUEST['_method'] === 'DELETE') {
            return $this->delete($print_response);
        }
        $upload = isset($_FILES[$this->options['param_name']]) ?
            $_FILES[$this->options['param_name']] : null;
        // Parse the Content-Disposition header, if available:
        $file_name = $this->get_server_var('HTTP_CONTENT_DISPOSITION') ?
            rawurldecode(preg_replace(
                '/(^[^"]+")|("$)/',
                '',
                $this->get_server_var('HTTP_CONTENT_DISPOSITION')
            )) : null;
        // Parse the Content-Range header, which has the following form:
        // Content-Range: bytes 0-524287/2000000
        $content_range = $this->get_server_var('HTTP_CONTENT_RANGE') ?
            preg_split('/[^0-9]+/', $this->get_server_var('HTTP_CONTENT_RANGE')) : null;
        $size =  $content_range ? $content_range[3] : null;
        $files = array();
        if ($upload && is_array($upload['tmp_name'])) {
            // param_name is an array identifier like "files[]",
            // $_FILES is a multi-dimensional array:
            foreach ($upload['tmp_name'] as $index => $value) {
                $files[] = $this->handle_file_upload(
                    $upload['tmp_name'][$index],
                    $file_name ? $file_name : $upload['name'][$index],
                    $size ? $size : $upload['size'][$index],
                    $upload['type'][$index],
                    $upload['error'][$index],
                    $index,
                    $content_range
                );
            }
        } else {
            // param_name is a single object identifier like "file",
            // $_FILES is a one-dimensional array:
            $files[] = $this->handle_file_upload(
                isset($upload['tmp_name']) ? $upload['tmp_name'] : null,
                $file_name ? $file_name : (isset($upload['name']) ?
                        $upload['name'] : null),
                $size ? $size : (isset($upload['size']) ?
                        $upload['size'] : $this->get_server_var('CONTENT_LENGTH')),
                isset($upload['type']) ?
                        $upload['type'] : $this->get_server_var('CONTENT_TYPE'),
                isset($upload['error']) ? $upload['error'] : null,
                null,
                $content_range
            );
        }
        return $this->generate_response(
            array($this->options['param_name'] => $files),
            $print_response
        );
    }

    public function delete($print_response = true) {
        $file_name = $this->get_file_name_param();
        $file_path = $this->get_upload_path($file_name);
        $success = is_file($file_path) && $file_name[0] !== '.' && unlink($file_path);
        if ($success) {
            foreach($this->options['image_versions'] as $version => $options) {
                if (!empty($version)) {
                    $file = $this->get_upload_path($file_name, $version);
                    if (is_file($file)) {
                        unlink($file);
                    }
                }
            }
        }
        return $this->generate_response(array('success' => $success), $print_response);
    }

}

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