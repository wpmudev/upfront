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
		switch ( $comment->comment_type ){
			case 'pingback':
			case 'trackback':
				break;
			default:
				$comment_meta = apply_filters( 'upfront_comment_list_comment_meta', array(
					'avatar' => get_avatar($comment, 50),
					'author' => '<cite class="fn">' . get_comment_author_link() . '</cite>',
					'time' => 	'<a href="' . get_comment_link($comment->comment_ID) . '" class="comment-time">' . 
	 								'<time datetime="' . get_comment_time('c') . '">' . sprintf('%1$s at %2$s', get_comment_date(), get_comment_time()) . '</time>' . 
	 							'</a>'
				), $comment, $args, $depth );
				$comment_arr = apply_filters( 'upfront_comment_list_comment', array(
					'comment_meta' => '<header class="comment-meta comment-author vcard">%1$s</header>',
					'comment_pending' => '<p class="comment-awaiting-moderation">' . __('Your comment is awaiting moderation.') . '</p>',
					'comment_content' => '<div class="comment-content">%1$s</div>',
					'comment_reply' => '<div class="reply">%1$s</div>'
				), $comment, $args, $depth );
				echo '<li class="' . join(' ', get_comment_class()) . '" id="li-comment-' . get_comment_ID() . '">';
				echo '<article id="comment-' . get_comment_ID() . '" class="comment">';
				foreach ( $comment_arr as $type => $part ) {
					switch ( $type ){
						case 'comment_meta':
							printf($part, join('', $comment_meta));
							break;
						case 'comment_pending':
							if ( '0' == $comment->comment_approved )
								echo $part;
							break;
						case 'comment_content':
							$content = apply_filters( 'comment_text', get_comment_text(), $comment );
							$edit = '<p class="edit-link"><a class="comment-edit-link" href="' . get_edit_comment_link() . '">' . __('Edit') . '</a></p>';
							printf($part, $content . $edit);
							break;
						case 'comment_reply':
							$reply_link = get_comment_reply_link( array_merge( $args, array( 'reply_text' => __('Reply'), 'after' => ' <span>&darr;</span>', 'depth' => $depth, 'max_depth' => $args['max_depth'] ) ) ); 
							printf($part, $reply_link);
							break;
					}
				}
				echo '</article>';
				break;
		}
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

