<?php

class Upfront_ThisPostView extends Upfront_Object {
	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		return "<div class='upfront-output-object upfront-this_post' {$element_id}>" .
			self::get_post_markup(get_the_ID()) .
		"</div>";
	}

	public static function get_post_markup ($post_id) {
		if (!$post_id || !is_numeric($post_id)) return '';
		
		$post = get_post($post_id);
		if ($post->post_password && !is_user_logged_in()) return ''; // Augment this!
		$permalink = get_permalink($post->ID);
		return "<article id='post-{$post->ID}' data-post_id='{$post->ID}'>" . 
			"<h3 class='post_title'><a href='{$permalink}'>" . apply_filters('the_title', $post->post_title) . '</a></h3>' .
			'<div class="post_content">' . apply_filters('the_content', $post->post_content) . '</div>' .
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
		if (empty($data['post_id'])) die('error');
		if (!is_numeric($data['post_id'])) die('error');

		$post = get_post($data['post_id']);
		
		$this->_out(new Upfront_JsonResponse_Success(array(
			"filtered" => Upfront_ThisPostView::get_post_markup($data['post_id']),
			"raw" => array(
				"title" => $post->post_title,
				"content" => $post->post_content,
				"excerpt" => $post->post_excerpt,
			),
			"post" => $post,
		)));
	}
}
Upfront_ThisPostAjax::serve();