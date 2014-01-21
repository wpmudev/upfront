<?php

/**
 * Object implementation for Search entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UpostsView extends Upfront_Object {

	public function get_markup ($page = false) {
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

		$args['posts_per_page'] = !empty($limit) && is_numeric($limit) ?  $limit : 10;
		$args['paged'] = $page ? $page : get_query_var('paged');

		$args['post_status'] = 'publish'; //Making sure, because ajax call reset this to 'any'

		$query = new WP_Query($args);

		upfront_add_element_style('upfront-posts', array('css/style.css', dirname(__FILE__)));
		

		$properties = $this->properties_to_array();
		$properties['editing'] = $editing;
		return self::get_template($args, $properties);
	}

	public static function set_featured_image($html, $post_id){
		$image_data = get_post_meta($post_id, '_thumbnail_data', true);
		if(isset($image_data['src']))
			return str_replace($image_data['srcOriginal'], $image_data['src'], $html);
		return $html;
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
		$init = '';
		/*
		$query = array();
		foreach ($query_args as $key => $value) {
			$query[] = $key . '=' . $value;
		}
		$init = implode('&', $query);
		*/

		return $init . "<div class='upfront-output-object upfront-posts' id='" .  $properties['element_id'] . "'>" .
			$markup .
		"</div>";
	}

	public static function default_properties(){
		return array(
			'type' => 'UpostsModel',
			'view_class' => 'UpostsView',
			'has_settings' => 1,
			'class' => 'c22 uposts-object',
			'id_slug' => 'uposts',

			'post_type' => 'post',
			'taxonomy' => '',
			'term' => '',
			'limit'	=> 10,
			'content_type' => 'excerpt', // 'excerpt' | 'full'
			'featured_image' => 1,

			'pagination' => 0,
			'prev' => 'Next Page »',
			'next' => '',
			
			'post_data' => array('author', 'date', 'comments_count', 'featured_image') // also: categories,  tags
		);
	}

	public static function add_js_defaults($data){
		if(!isset($data['uposts']))
			$data['uposts'] = array();

		$data['uposts']['defaults'] = self::default_properties();

		//Edition bar template
		ob_start();
		include dirname(dirname(__FILE__)) . '/tpl/edition_bar.php';		
		$data['uposts']['barTemplate'] = ob_get_clean();

		//Post excerpt length and read more signs
		$data['uposts']['excerpt'] = self::excerpt_data();

		$data['uposts']['featured_image_height'] = apply_filters('upfront_featured_image_height', 300);

		return $data;
	}

	private static function excerpt_data(){
		$priority = 101;
		add_filter('excerpt_length', array('Upfront_UpostsView', 'get_excerpt_length'), $priority);
		add_filter('excerpt_more', array('Upfront_UpostsView', 'get_excerpt_more'), $priority);
		
		global $post;
		$current_post = $post;

		$post = new WP_Post(new stdClass());

		wp_trim_excerpt('');

		$post = $current_post;

		global $excerpt_length, $excerpt_more;

		remove_filter('excerpt_length', array('Upfront_UpostsView', 'get_excerpt_length'), $priority);
		remove_filter('excerpt_more', array('Upfront_UpostsView', 'get_excerpt_more'), $priority);

		return array('length' => $excerpt_length, 'more' => $excerpt_more);
	}

	public static function get_excerpt_more($more){
		global $excerpt_more;
		$excerpt_more = $more;
		return $more;
	}

	public static function get_excerpt_length($length){
		global $excerpt_length;
		$excerpt_length = $length;
		return $length;
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
		add_action('wp_ajax_uposts_get_markup', array($this, 'load_markup'));
		add_action('wp_ajax_uposts_single_markup', array($this, 'load_single_markup'));

		if (is_user_logged_in()) add_action('wp_footer', array($this, 'pickle_query'), 99);
	}

	public function pickle_query () {
		global $wp_query;
		$request = clone($wp_query);
		unset($request->post);
		unset($request->posts);
		unset($request->request);
		if (!empty($request->queried_object)) {
			unset($request->queried_object->post_title);
			unset($request->queried_object->post_excerpt);
			unset($request->queried_object->post_content);
		}
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
		if (!$taxonomy) 
			$this->_out(new Upfront_JsonResponse_Error("Missing taxonomy"));
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
		$properties = array();
		foreach($data as $name => $value){
			if($name != 'page')
				$properties[] = array('name' => $name, 'value' => $value);
		}

		$view = new Upfront_UpostsView(array('properties' => $properties));

		$this->_out(new Upfront_JsonResponse_Success($view->get_markup($data['page'])));
	}

	public function load_single_markup () {		
		$data = stripslashes_deep($_POST['data']);
		if(!isset($data['post']) || !isset($data['post']['ID']))
			$this->_out(new Upfront_JsonResponse_Error("No post id."));

		$post = get_post($data['post']['ID']);
		if(!$post)
			$this->_out(new Upfront_JsonResponse_Error("Missing post."));

		if($post->post_status == 'trash')
			$this->_out(new Upfront_JsonResponse_Success('<div class="ueditor_deleted_post ueditable">This ' . $post->post_type . ' has been deleted. To edit it, <a class="ueditor_restore">restore the ' . $post->post_type . '</a>.</div>'));

		query_posts('p=' . $post->ID);

		if(have_posts())
			the_post();
		else
			$this->_out(new Upfront_JsonResponse_Error("The post does not exist."));

		$properties = $data['properties'];

		$markup = upfront_get_template(
			'upost', 
			array('properties' => $properties), 
			dirname(dirname(__FILE__)) . '/tpl/upost.php'
		);

		$this->_out(new Upfront_JsonResponse_Success($markup));		
	}
}
Upfront_UpostsAjax::serve();