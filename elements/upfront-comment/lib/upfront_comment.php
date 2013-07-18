<?php

class Upfront_UcommentView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		
		return "<div class='upfront-output-object upfront-comment {$element_id}>" .
			self::get_comment_markup(get_the_ID()) .
		"</div>";
	}
	
	public static function get_comment_markup ($post_id) {
		if (!$post_id || !is_numeric($post_id)) return '';
		
		$post = get_post($post_id);
		if (post_password_required($post->ID)) return '';
		ob_start();
		// Load comments
		$comments = get_comments(array('post_id' => $post->ID));
		echo '<ol class="upfront-comments">';
		wp_list_comments(array('callback' => array('Upfront_UcommentView', 'list_comment'), 'style' => 'ol'), $comments);
		echo '</ol>';
		// Load comment form
		$args = apply_filters('upfront_comment_form_args', array());
		comment_form($args, $post->ID);
		return ob_get_clean();
	}
	
	public static function list_comment ( $comment, $args, $depth ) {
		$GLOBALS['comment'] = $comment;
		echo upfront_get_template('upfront-comment-list', array( 'comment' => $comment, 'args' => $args, 'depth' => $depth ), upfront_element_dir('templates/upfront-comment-list.php', __DIR__));
	}

	public static function add_public_script () {
		if ( is_singular() && comments_open() && get_option( 'thread_comments' ) )
			wp_enqueue_script( 'comment-reply' );
	}
}

class Upfront_UcommentAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_ucomment_get_comment_markup', array($this, "load_markup"));
	}

	public function load_markup () {
		$data = json_decode(stripslashes($_POST['data']), true);
		if (empty($data['post_id'])) die('error');
		if (!is_numeric($data['post_id'])) die('error');
		
		$this->_out(new Upfront_JsonResponse_Success(Upfront_UcommentView::get_comment_markup($data['post_id'])));
	}
}
Upfront_UcommentAjax::serve();

