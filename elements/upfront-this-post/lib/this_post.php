<?php

class Upfront_ThisPostView extends Upfront_Object {
	public function get_markup () {
		global $post;
		$element_id = $this->_get_property('element_id');
		return
			'<div class=" upfront-this_post" id="' . $element_id . '">' .
				self::get_post_markup(get_the_ID(), $post->post_type, $this->properties_to_array()) .
			'</div>';
	}

	public static function get_post_markup ($post_id, $post_type, $properties=array()) {
		if($post_id === 0)
			return self::get_new_post($post_type);

		if (!$post_id || !is_numeric($post_id)) {
			$post = self::get_new_post($post_type, array(), false);
		} else {
			$post = get_post($post_id);
		}
		if ($post->post_password && !is_user_logged_in() || $post->post_status != 'publish' && !is_user_logged_in())
			return ''; // Augment this!

		if(!$properties['post_data'])
			$properties['post_data'] = array();

		$properties['featured_image'] = array_search('featured_image', $properties['post_data']) !== FALSE;

		return self::post_template($post, $properties);
	}

	public static function get_new_post($post_type = 'post', $properties=array(), $query_override=true) {

		$title = sprintf(__('Enter your new %s title here', 'upfront'), $post_type);
		$content = sprintf(__('Your %s content goes here. Have fun writing :)', 'upfront'), $post_type);

		$post_arr = array(
			'ID' => 0,
			'post_title' => $title,
			'post_content' => $content,
			'post_type' => $post_type,
			'filter' => 'raw',
			'post_author' => get_current_user_id()
		);
		$post_obj = new stdClass();
		foreach($post_arr as $key => $value)
			$post_obj->$key = $value;

		$post = new WP_Post($post_obj);

		if ($query_override) {
			query_posts( 'post_type=' . $post_type . '&posts_per_page=1');
			if(have_posts())
				the_post();
			$post_id = get_the_ID();
			if($post_id)
				query_posts('p=' . $post_id);
		}

		return self::post_template($post, $properties);
	}

	public static function post_template($this_post, $properties=array()) {
		global $post;
		$post = $this_post;
		setup_postdata($post);

		global $wp_query, $more;

		$in_the_loop = $wp_query->in_the_loop;
		// This below with post query rewrite is an inline fix for WP not sanity checking before iteration: https://core.trac.wordpress.org/ticket/26321
		$old_query_posts = $wp_query->posts;

		//Make sure we show the whole post content
		$more = 1;

		$wp_query->is_single = true;
		$wp_query->in_the_loop = true;
		$wp_query->posts = array();
		$data = upfront_get_template('this-post', array('post' => $post, 'properties' => $properties), dirname(dirname(__FILE__)) . '/tpl/this-post.php');
		$wp_query->in_the_loop = $in_the_loop;
		$wp_query->posts = $old_query_posts;

		return $data;
	}

	public static function default_properties(){
		return array(
			'type' => 'ThisPostModel',
			'view_class' => 'ThisPostView',
			'class' => 'c22 upfront-this_post',
			'has_settings' => 1,
			'id_slug' => 'this_post',

			'post_data' => array('author', 'date', 'comments_count', 'featured_image') // also: categories,  tags
		);
	}

	public static function add_js_defaults($data){
		$data['thisPost'] = array('defaults' => self::default_properties());
		return $data;
	}

	/**
	 * Checks the editor selectors presence and injects defaults
	 * if nothing better is found.
	 */
	public static function add_fallback_selectors ($selectors) {
		$selectors = !empty($selectors) ? $selectors : array();
		$types = wp_list_pluck($selectors, 'type');

		if (!in_array('title', $types)) {
			$selectors[] = array(
				'type' => 'title',
				'selector' => 'h1.post_title',
			);
		}
		if (!in_array('content', $types)) {
			$selectors[] = array(
				'type' => 'content',
				'selector' => 'div.post_content',
			);
		}
		if (!in_array('thumbnail', $types)) {
			$selectors[] = array(
				'type' => 'thumbnail',
				'selector' => '.post_thumbnail',
			);
		}
		if (!in_array('date', $types)) {
			$selectors[] = array(
				'type' => 'date',
				'selector' => 'post_date',
			);
		}
		if (!in_array('author', $types)) {
			$selectors[] = array(
				'type' => 'author',
				'selector' => '.post_author',
			);
		}

		return $selectors;
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
class Upfront_ThisPostAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_this_post-get_markup', array($this, "load_markup"));
	}

	public function load_markup () {
		$data = json_decode(stripslashes($_POST['data']), true);
		if (!is_numeric($data['post_id'])) die('error');

		$content = '';

		if($data['post_id']){
			$post = get_post($data['post_id']);
			if(!$post)
				return $this->_out(new Upfront_JsonResponse_Error('Unknown post.'));

			if($post->post_status == 'trash')
				$content = '<div class="ueditor_deleted_post ueditable upfront-ui">This ' . $post->post_type . ' has been deleted. To edit it, <a class="ueditor_restore">restore the ' . $post->post_type . '</a>.</div>';
			else
				$content = Upfront_ThisPostView::get_post_markup($data['post_id'], null, $data['properties']);
		}
		else if($data['post_type'])
			$content = Upfront_ThisPostView::get_new_post($data['post_type'], $data['properties']);
		else
			$this->_out(new Upfront_JsonResponse_Error('Not enough data.'));


		$this->_out(new Upfront_JsonResponse_Success(array(
			"filtered" => $content
		)));
	}
}
Upfront_ThisPostAjax::serve();