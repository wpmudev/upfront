<?php

class Upfront_ThisPostView extends Upfront_Object {
	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		return "<div class='upfront-output-object upfront-this_post' {$element_id}>" .
			self::get_post_markup(get_the_ID()) .
		"</div>";
	}

	public static function get_post_markup ($post_id, $post_type) {
		if($post_id === 0)
			return self::get_new_post($post_type);

		if (!$post_id || !is_numeric($post_id)) return '';
		
		$post = get_post($post_id);
		if ($post->post_password && !is_user_logged_in()) return ''; // Augment this!

		$title = apply_filters('the_title', $post->post_title);
		$content = apply_filters('the_content', $post->post_content);

		return self::post_template($post->post_type, $title, $content, $post);
	}

	public static function get_new_post($post_type) {

		$title = sprintf(__('Enter your new %s title here', 'upfront'), $post_type);
		$content = sprintf(__('Your %s content goes here. Have fun writing :)', 'upfront'), $post_type);

		$post = Upfront_PostModel::create($post_type, $title, $content);

		return self::post_template($post_type, $title, $content, $post);
	}

	public static function post_template($post_type, $title, $content, $post) {
		return '<article id="post-{{id}}" data-post_id="{{id}}">' . 
			apply_filters('upfront_this_post_post_markup', 
				'<h3 class="post_title"><a href="{{link}}">{{title}}</a></h3>' .
				'<div class="post_content">{{content}}</div>', $post) .
		'</article>';
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
		
		$this->_out(new Upfront_JsonResponse_Success(array(
			"filtered" => Upfront_ThisPostView::get_post_markup($data['post_id'], $data['post_type'])
		)));
	}
}
Upfront_ThisPostAjax::serve();