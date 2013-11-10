<?php

class Upfront_UcommentView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		
		return "<div class='upfront-output-object upfront-comment' {$element_id}>" .
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
		if($comments && sizeof($comments)){
			echo '<ol class="upfront-comments">';
			wp_list_comments(array('callback' => array('Upfront_UcommentView', 'list_comment'), 'style' => 'ol'), $comments);
			echo '</ol>';
		}
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

	public static function add_js_defaults($data){
		$data['ucomments'] = array(
			'defaults' => self::default_properties(),
		);
		return $data;
	}

	public static function default_properties(){
		return array(
			'id_slug' => 'ucomment',
			'type' => "UcommentModel",
			'view_class' => "UcommentView",
			"class" => "c22 upfront-comment",
			'has_settings' => 0
		);
	}
}

class Upfront_UcommentAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_ucomment_get_comment_markup', array($this, "load_markup"));
		add_action('wp_ajax_upfront-discussion_settings-get', array($this, "get_settings"));
		add_action('wp_ajax_upfront-discussion_settings-settings-save', array($this, "save_discussion_settings"));
		add_action('wp_ajax_upfront-discussion_settings-avatars-save', array($this, "save_avatars_settings"));
	}

	public function load_markup () {
		$data = json_decode(stripslashes($_POST['data']), true);
		if (empty($data['post_id'])) die('error');
		if (!is_numeric($data['post_id'])) die('error');
		
		$this->_out(new Upfront_JsonResponse_Success(Upfront_UcommentView::get_comment_markup($data['post_id'])));
	}

	public function save_discussion_settings () {
		if (!current_user_can('manage_options')) $this->_out(new Upfront_JsonResponse_Error("You can not do this"));
		$data = stripslashes_deep($_POST['data']);

		if (isset($data['default_pingback_flag'])) {
			update_option('default_pingback_flag', 1);
		} else {
			update_option('default_pingback_flag', 0);
		}

		if (isset($data['default_ping_status'])) {
			update_option('default_ping_status', 'open');
		} else {
			update_option('default_ping_status', 0);
		}

		if (isset($data['default_comment_status'])) {
			update_option('default_comment_status', 'open');
		} else {
			update_option('default_comment_status', 0);
		}

		if (isset($data['require_name_email'])) {
			update_option('require_name_email', (int)$data['require_name_email']);
		} else {
			update_option('require_name_email', 0);
		}

		if (isset($data['comment_registration'])) {
			update_option('comment_registration', (int)$data['comment_registration']);
		} else {
			update_option('comment_registration', 0);
		}

		if (isset($data['close_comments_for_old_posts'])) {
			update_option('close_comments_for_old_posts', (int)$data['close_comments_for_old_posts']);
		} else {
			update_option('close_comments_for_old_posts', 0);
		}

		if (isset($data['close_comments_days_old'])) {
			update_option('close_comments_days_old', (int)$data['close_comments_days_old']);
		} else {
			update_option('close_comments_days_old', 0);
		}

		if (isset($data['thread_comments'])) {
			update_option('thread_comments', (int)$data['thread_comments']);
		} else {
			update_option('thread_comments', 0);
		}

		if (isset($data['thread_comments_depth'])) {
			update_option('thread_comments_depth', (int)$data['thread_comments_depth']);
		} else {
			update_option('thread_comments_depth', 0);
		}

		if (isset($data['page_comments'])) {
			update_option('page_comments', (int)$data['page_comments']);
		} else {
			update_option('page_comments', 0);
		}

		if (isset($data['default_comments_page'])) {
			if (in_array($data['default_comments_page'], array('newest', 'oldest'))) {
				update_option('default_comments_page', $data['default_comments_page']);
			}
		}

		if (isset($data['comments_per_page'])) {
			update_option('comments_per_page', (int)$data['comments_per_page']);
		} else {
			update_option('comments_per_page', 0);
		}

		if (isset($data['comment_order'])) {
			if (in_array($data['comment_order'], array('asc', 'desc'))) {
				update_option('comment_order', $data['comment_order']);
			}
		}

		if (isset($data['comments_notify'])) {
			update_option('comments_notify', (int)$data['comments_notify']);
		} else {
			update_option('comments_notify', 0);
		}

		if (isset($data['comment_moderation'])) {
			update_option('comment_moderation', (int)$data['comment_moderation']);
		} else {
			update_option('comment_moderation', 0);
		}

		if (isset($data['comment_max_links'])) {
			update_option('comment_max_links', (int)$data['comment_max_links']);
		} else {
			update_option('comment_max_links', 0);
		}

		if (isset($data['comment_whitelist'])) {
			update_option('comment_whitelist', (int)$data['comment_whitelist']);
		} else {
			update_option('comment_whitelist', 0);
		}

		if (isset($data['moderation_keys'])) {
			update_option('moderation_keys', $data['moderation_keys']);
		}

		if (isset($data['blacklist_keys'])) {
			update_option('blacklist_keys', $data['blacklist_keys']);
		}


		$this->_out(new Upfront_JsonResponse_Success('Yay'));
	}

	public function save_avatars_settings () {
		if (!current_user_can('manage_options')) $this->_out(new Upfront_JsonResponse_Error("You can not do this"));
		$data = stripslashes_deep($_POST['data']);

		if (isset($data['show_avatars'])) {
			update_option('show_avatars', 1);
		} else {
			update_option('show_avatars', 0);
		}

		if (isset($data['avatar_rating'])) {
			if (in_array($data['avatar_rating'], array('G', 'PG', 'R', 'X'))) {
				update_option('avatar_rating', $data['avatar_rating']);
			}
		} else {
			update_option('avatar_rating', 'G');
		}

		if (isset($data['avatar_default'])) {
			$avatar_defaults = apply_filters('avatar_defaults', array(
				'mystery' => __('Mystery Man'),
				'blank' => __('Blank'),
				'gravatar_default' => __('Gravatar Logo'),
				'identicon' => __('Identicon (Generated)'),
				'wavatar' => __('Wavatar (Generated)'),
				'monsterid' => __('MonsterID (Generated)'),
				'retro' => __('Retro (Generated)')
			));
			if (in_array($data['avatar_default'], array_keys($avatar_defaults))) {
				update_option('avatar_default', $data['avatar_default']);
			}
		} else {
			update_option('avatar_default', 'mystery');
		}

		$this->_out(new Upfront_JsonResponse_Success('Yay'));
	}

	public function get_settings () {
		if (!current_user_can('manage_options')) $this->_out(new Upfront_JsonResponse_Error("You can not do this"));
		global $current_user;
		$avatar_defaults = apply_filters('avatar_defaults', array(
			'mystery' => __('Mystery Man'),
			'blank' => __('Blank'),
			'gravatar_default' => __('Gravatar Logo'),
			'identicon' => __('Identicon (Generated)'),
			'wavatar' => __('Wavatar (Generated)'),
			'monsterid' => __('MonsterID (Generated)'),
			'retro' => __('Retro (Generated)')
		));

		// Temporary options toggle
		$show_avatars = get_option('show_avatars');
		update_option('show_avatars', "1");

		$avatars = array();
		foreach ($avatar_defaults as $key => $av) {
			$avatars[] = array(
				"value" => $key,
				"label" => $av,
				"icon" => get_avatar($current_user->user_email, 32, $key),
			);
		}
		update_option('show_avatars', $show_avatars);

		$this->_out(new Upfront_JsonResponse_Success(array(
			"properties" => array(
				// Discussion settings
				array("name" => "default_pingback_flag", "value" => get_option('default_pingback_flag')),
				array("name" => "default_ping_status", "value" => get_option('default_ping_status')),
				array("name" => "default_comment_status", "value" => get_option('default_comment_status')),
				array("name" => "require_name_email", "value" => get_option('require_name_email')),
				array("name" => "comment_registration", "value" => get_option('comment_registration')),
				array("name" => "close_comments_for_old_posts", "value" => get_option('close_comments_for_old_posts')),
				array("name" => "close_comments_days_old", "value" => get_option('close_comments_days_old')),
				array("name" => "thread_comments", "value" => get_option('thread_comments')),
				array("name" => "thread_comments_depth", "value" => get_option('thread_comments_depth')),
				array("name" => "page_comments", "value" => get_option('page_comments')),
				array("name" => "default_comments_page", "value" => get_option('default_comments_page')),
				array("name" => "comments_per_page", "value" => get_option('comments_per_page')),
				array("name" => "comment_order", "value" => get_option('comment_order')),
				array("name" => "comments_notify", "value" => get_option('comments_notify')),
				array("name" => "moderation_notify", "value" => get_option('moderation_notify')),
				array("name" => "comment_moderation", "value" => get_option('comment_moderation')),
				array("name" => "comment_max_links", "value" => get_option('comment_max_links')),
				array("name" => "comment_whitelist", "value" => get_option('comment_whitelist')),
				array("name" => "moderation_keys", "value" => esc_textarea(get_option('moderation_keys'))),
				array("name" => "blacklist_keys", "value" => esc_textarea(get_option('blacklist_keys'))),
				// Avatars settings
				array("name" => "show_avatars", "value" => $show_avatars),
				array("name" => "avatar_rating", "value" => get_option('avatar_rating')),
				array("name" => "avatar_default", "value" => get_option('avatar_default')),
			),
			"avatar_defaults" => $avatars
		)));
	}
}
Upfront_UcommentAjax::serve();

