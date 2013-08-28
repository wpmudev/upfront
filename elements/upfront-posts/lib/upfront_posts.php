<?php

/**
 * Object implementation for Search entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UpostsView extends Upfront_Object {

	public function get_markup () {
		global $wp_query;
		$args = array();
		$element_id = $this->_get_property('element_id');

		$post_type = $this->_get_property('post_type');
		$taxonomy = $this->_get_property('taxonomy');
		$term = $this->_get_property('term');
		$limit = $this->_get_property('limit');
		$content_type = $this->_get_property('content_type');
		$featured_image = $this->_get_property('featured_image');

		if (empty($post_type) && empty($taxonomy) && empty($term)) { // All empty, use whatever is global
			$args = $wp_query->query_vars;
		}

		$post_type = !empty($post_type) ? $post_type : get_query_var('post_type');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		$args['post_type'] = $post_type;
		if (!empty($taxonomy) && !empty($term)) {
			$args['tax_query'] = array(array(
				'taxonomy' => $taxonomy,
				'terms' => $term,
			));
		} else if (!empty($wp_query->tax_query->queries)) {
			$args['tax_query'] = $wp_query->tax_query->queries;
		}
		if (!empty($limit) && is_numeric($limit)) {
			$args['posts_per_page'] = $limit;
		}
		$query = new WP_Query($args);

		upfront_add_element_style('upfront-posts', array('css/style.css', dirname(__FILE__)));
		
		return self::get_template($args, $this->properties_to_array());
	}

	public static function get_template($query_args, $properties) {
		global $wp_query;
		$temp_query = clone $wp_query;

		query_posts($query_args);

		$markup = upfront_get_template(
			'uposts', 
			array('properties' => $properties), 
			dirname(dirname(__FILE__)) . '/tpl/uposts.php'
		);

		$wp_query = $temp_query;

		return "<div class='upfront-output-object upfront-posts' id='" .  $properties['element_id'] . "'>" .
			$markup .
		"</div>";
	}


	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
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

		if (is_user_logged_in()) add_action('wp_footer', array($this, 'pickle_query'), 99);
	}

	public function pickle_query () {
		global $wp_query;
		$request = clone($wp_query);
		unset($request->post);
		unset($request->posts);
		unset($request->request);
		echo '<script>window._upfront_get_current_query=window._upfront_get_current_query||function () {return' . json_encode($request) . ';};</script>';
	}

	public function load_initial_info () {
		$raw_post_types = get_post_types(array(
			'public' => true,
		), 'objects');
		$raw_taxonomies = get_taxonomies(array(
			'public' => true,
		), 'objects');
		$data = array(
			"post_types" => array('' => __('Default')),
			"taxonomies" => array('' => __('Default')),
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
		$post_type = !empty($data['post_type']) ? $data['post_type'] : (!empty($data['query']['post_type']) ? $data['query']['post_type'] : 'post');

		if (empty($data['post_type']) && empty($data['taxonomy']) && empty($data['term'])) { // All empty, use whatever is pickled
			$args = $data['query']['query_vars'];
		}

		$args['post_type'] = $post_type;
		if (!empty($data['taxonomy']) && !empty($data['term'])) {
			$args['tax_query'] = array(array(
				'taxonomy' => $data['taxonomy'],
				'terms' => $data['term'],
			));
			$args['post_status'] = 'publish'; // This is because the posts list will revert to "any" for taxonomy query - on admin (i.e. AJAX) that means drafts, future etc
		} else if (!empty($data['query']['tax_query']['queries'])) {
			$args['tax_query'] = $data['query']['tax_query']['queries'];
			$args['post_status'] = 'publish'; // This is because the posts list will revert to "any" for taxonomy query - on admin (i.e. AJAX) that means drafts, future etc
		}
		if (!empty($data['limit']) && is_numeric($data['limit'])) {
			$args['posts_per_page'] = $data['limit'];
		}

		$query = new WP_Query($args);

		$this->_out(new Upfront_JsonResponse_Success(Upfront_UpostsView::get_template($args, $data)));
	}
}
Upfront_UpostsAjax::serve();