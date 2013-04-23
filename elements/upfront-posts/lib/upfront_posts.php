<?php

/**
 * Object implementation for Search entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UpostsView extends Upfront_Object {

	public function get_markup () {
		$args = array();
		$element_id = $this->_get_property('element_id');

		$post_type = $this->_get_property('post_type');
		$taxonomy = $this->_get_property('taxonomy');
		$term = $this->_get_property('term');
		$limit = $this->_get_property('limit');
		$content_type = $this->_get_property('content_type');
		$featured_image = $this->_get_property('featured_image');

		$post_type = !empty($post_type) ? $post_type : 'post';
		$element_id = $element_id ? "id='{$element_id}'" : '';
		
		$args['post_type'] = $post_type;
		if (!empty($taxonomy) && !empty($term)) {
			$args['tax_query'] = array(array(
				'taxonomy' => $taxonomy,
				'terms' => $term,
			));
		}
		if (!empty($limit) && is_numeric($limit)) {
			$args['posts_per_page'] = $limit;
		}
		$query = new WP_Query($args);

		return "<div class='upfront-output-object upfront-posts' {$element_id}>" .
			self::get_posts_markup($query, $content_type, $featured_image) .
		"</div>";
	}

	// Template function
	public static function get_posts_markup ($query, $content_type, $featured_image) {
		$ret = '';
		foreach ($query->posts as $post) {
			$content = $title = $thumbnail = $thumb_id = false;

			if (!empty($featured_image) && function_exists('get_post_thumbnail_id')) {
				$thumb_id = get_post_thumbnail_id($post->ID);
				$thumbnail = $thumb_id
					? wp_get_attachment_image_src($thumb_id, 'thumbnail')
					: ''
				;
				if (!empty($thumbnail[0])) {
					$src = $thumbnail[0];
					$width = !empty($thumbnail[1]) ? 'width="' . $thumbnail[1] . '"' : '';
					$height = !empty($thumbnail[2]) ? 'height="' . $thumbnail[2] . '"' : '';
					$thumbnail = "<img src='{$src}' {$height} {$width} />";
				}
			}

			$content = apply_filters('the_content', $post->post_content);
			if ('excerpt' == $content_type) $content = wp_strip_all_tags($content) . '... read more';

			$title = apply_filters('the_title', $post->post_title);

			$link = get_permalink($post->ID);

			$ret .= "<li class='uposts-post'>" .
				"<span class='uposts-tumbnail_container'>{$thumbnail}</span>" .
				"<h3><a href='{$link}'>{$title}</a></h3>" .
				"<div>{$content}</div>" .
			"</li>";
		}
		return "<ul class='uposts-posts'>{$ret}</ul>";
	}

	// Inject style dependencies
	public static function add_public_style () {
		wp_enqueue_style('upfront-posts', upfront_element_url('css/style.css', dirname(__FILE__)));
	}
}


/**
 * Posts AJAX response implementation.
 */
class Upfront_UpostsAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_uposts_list_initial_info', array($this, "load_initial_info"));
		add_action('wp_ajax_upost_get_taxonomy_terms', array($this, "load_taxonomy_terms"));
		add_action('wp_ajax_uposts_get_markup', array($this, "load_markup"));
	}

	public function load_initial_info () {
		$raw_post_types = get_post_types(array(
			'public' => true,
		), 'objects');
		$raw_taxonomies = get_taxonomies(array(
			'public' => true,
		), 'objects');
		$data = array(
			"post_types" => array(),
			"taxonomies" => array(),
		);
		foreach ($raw_post_types as $type => $obj) {
			$data["post_types"][$type] = $obj->labels->name;
		}
		foreach ($raw_taxonomies as $tax => $obj) {
			$data['taxonomies'][$tax] = $obj->labels->name;
		}
		$this->_out(new Upfront_JsonResponse_Success($data));
	}

	public function load_taxonomy_terms () {
		$taxonomy = !empty($_POST['taxonomy']) ? $_POST['taxonomy'] : false;
		if (!$taxonomy) $this->_out(new Upfront_JsonResponse_Error("Missing taxonomy"));
		$raw_terms = get_terms($taxonomy, array(
			'hide_empty' => false,
		));
		$data = array();
		foreach ($raw_terms as $term) {
			$data[$term->term_id] = $term->name;
		}
		$this->_out(new Upfront_JsonResponse_Success($data));
	}

	public function load_markup () {
		$args = array();
		$data = json_decode(stripslashes($_POST['data']), true);
		$post_type = !empty($data['post_type']) ? $data['post_type'] : 'post';
		$args['post_type'] = $post_type;
		if (!empty($data['taxonomy']) && !empty($data['term'])) {
			$args['tax_query'] = array(array(
				'taxonomy' => $data['taxonomy'],
				'terms' => $data['term'],
			));
		}
		if (!empty($data['limit']) && is_numeric($data['limit'])) {
			$args['posts_per_page'] = $data['limit'];
		}
		$query = new WP_Query($args);
		
		$this->_out(new Upfront_JsonResponse_Success(Upfront_UpostsView::get_posts_markup($query, $data['content_type'], $data['featured_image'])));
	}
}
Upfront_UpostsAjax::serve();