<?php

class Upfront_UcommentView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		return "<div class=' upfront-comment' {$element_id}>" .
			self::get_comment_markup(get_the_ID()) .
		"</div>";
	}

	public static function spawn_random_comments ($post) {
		$fake_comment = array(
			'user_id' => get_current_user_id(),
			'comment_author' => 'Author',
			'comment_author_IP' => '',
			'comment_author_url' => '',
			'comment_author_email' => '',
			'comment_post_ID' => $post->ID,
			'comment_type' => '',
			'comment_date' => current_time('mysql'),
			'comment_date_gmt' => current_time('mysql', 1),
			'comment_approved' => 1,
			'comment_content' => 'test stuff author comment',
			'comment_parent' => 0,
		);
		$comments = array(
			array_merge($fake_comment, array(
				'user_id' => get_current_user_id(),
				'comment_author' => 'Author',
				'comment_content' => 'test stuff author comment',
			)),
			array_merge($fake_comment, array(
				'user_id' => 0,
				'comment_author' => 'Visitor',
				'comment_content' => 'test stuff visitor comment',
			)),
			array_merge($fake_comment, array(
				'user_id' => 0,
				'comment_author' => 'Trackback',
				'comment_type' => 'trackback',
				'comment_content' => 'test stuff visitor trackback',
			)),
			array_merge($fake_comment, array(
				'user_id' => 0,
				'comment_author' => 'Pingback',
				'comment_type' => 'pingback',
				'comment_content' => 'test stuff visitor pingkback',
			)),
		);
		foreach ($comments as $cid => $comment) {
			$comment['comment_ID'] = $cid;
			$comments[$cid] = (object)wp_filter_comment($comment);
		}
		return $comments;
	}

	/**
	 * Check if we have any external comments templates assigned by plugins.
	 *
	 * @param int $post_id Current post ID
	 *
	 * @return mixed (bool)false if nothing found, (string)finished template otherwise
	 */
	private static function _get_external_comments_template ($post_id) {
		if (!is_numeric($post_id)) return false;

		global $post, $wp_query;

		$overriden_template = false;

		// Sooo... override the post globals
		$global_post = is_object($post) ? clone($post) : $post;
		$post = get_post($post_id);

		$global_query = is_object($wp_query) ? clone($wp_query) : $wp_query;
		$wp_query->is_singular = true;
		if (!isset($wp_query->comments)) {
			$wp_query->comments = get_comments("post_id={$post_id}");
			$wp_query->comment_count = count($wp_query->comments);
		}

		$wp_tpl = apply_filters('comments_template', false);

		if (!empty($wp_tpl)) {
			ob_start();
			require_once($wp_tpl);
			$overriden_template = ob_get_clean();
		}
		
		$post = is_object($global_post) ? clone($global_post) : $global_post;
		$wp_query = is_object($global_query) ? clone($global_query) : $global_query;

		return $overriden_template;
	}

	public static function get_comment_markup ($post_id) {
		if (!$post_id) return '';
		if (!is_numeric($post_id)) {
			if (!in_array($post_id, array('fake_post', 'fake_styled_post'))) return '';
		}

		$tpl = self::_get_external_comments_template($post_id);
		if (!empty($tpl)) return $tpl;

        $defaults = self::default_properties();
        $prepend_form = (bool) $defaults['prepend_form'];
        $form_args = array(
        	'comment_field' => self::_get_comment_form_field(),
        );
        $form_args = apply_filters('upfront_comment_form_args', array_filter($form_args));
        
        $comments = array();
        $post = false;
		if (is_numeric($post_id)) {
			$post = get_post($post_id);
			$comment_args = array(
				'post_id' => $post->ID,
				'order'   => 'ASC',
				'orderby' => 'comment_date_gmt',
				'status'  => 'approve',
			);
			$commenter = wp_get_current_commenter();
			$user_id = get_current_user_id();
			
			if (!empty($user_id)) $comment_args['include_unapproved'] = array($user_id);
			else if (!empty($commenter['comment_author_email'])) $comment_args['include_unapproved'] = array($commenter['comment_author_email']);

			$comments = get_comments($comment_args);
		} else {
			$posts = get_posts(array('orderby' => 'rand', 'posts_per_page' => 1));
			if (!empty($posts[0])) {
				$post = $posts[0];
				$comments = self::spawn_random_comments($post);
				add_filter('comments_open', '__return_true');
			}
			else return '';
		}

		if (empty($post) || !is_object($post)) return '';
		if (post_password_required($post->ID)) return '';

		// ... aaand start with comments fields rearrangement for WP4.4
		add_filter('comment_form_fields', array('Upfront_UcommentView', 'rearrange_comment_form_fields'));

		ob_start();

        if ($prepend_form) { 
            comment_form($form_args, $post->ID);
        }
		// Load comments
		if ($comments && sizeof($comments)) {
			echo '<ol class="upfront-comments">';
			wp_list_comments(array('callback' => array('Upfront_UcommentView', 'list_comment'), 'style' => 'ol'), $comments);
			echo '</ol>';
		}
		// Load comment form
        if (!$prepend_form) {
            comment_form($form_args, $post->ID);
        }

        // Clean up after ourselves
        remove_filter('comment_form_fields', array('Upfront_UcommentView', 'rearrange_comment_form_fields'));

		return ob_get_clean();
	}

	/**
	 * Get the actual input form field markup.
	 * Yanked directly from wp-includes/comment-template.php
	 * because that's where it's hardcoded. Yay for hardcoding stuff.
	 *
	 * @return string
	 */
	private static function _get_comment_form_field () {
		return '<p class="comment-form-comment">' .
			'<label for="comment">' . _x( 'Comment', 'noun' ) . '</label>' .
			' ' .
			'<textarea placeholder="' . esc_attr(__('Leave a Reply')) . '" id="comment" name="comment" cols="45" rows="8" aria-describedby="form-allowed-tags" aria-required="true" required="required"></textarea>' .
		'</p>';
	}

	/**
	 * Re-arrange comment form fields.
	 *
	 * At the moment just to revert the WP 4.4 fields order change,
	 * but can be used to apply custom order down the line
	 *
	 * @param array $fields Comment form fields
	 *
	 * @return array
	 */
	public static function rearrange_comment_form_fields ($fields) {
		if (!is_array($fields) || empty($fields['comment'])) return $fields;
		
		$result = array();
		foreach ($fields as $key => $field) {
			if ('comment' === $key) continue;
			$result[$key] = $field;
		}
		$result['comment'] = $fields['comment'];

		return $result;
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
			"class" => "c24 upfront-comment",
			'has_settings' => 1,
            "prepend_form" => false
		);
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['comments_element'])) return $strings;
		$strings['comments_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Comment', 'upfront'),
			'error_permissions' => __('You can not do this', 'upfront'),
			'loading' => __('Loading', 'upfront'),
			'loading_error' => __("Error loading comment", 'upfront'),
			'discussion_settings' => __('Discussion Settings', 'upfront'),
			'settings_disabled' => __('Discussion Settings are disabled', 'upfront'),
			'avatars' => __('Avatars', 'upfront'),
			'ok' => __('OK', 'upfront'),
			'please_wait' => __('Please, wait', 'upfront'),
			'avatar_settings' => __('Avatar Settings', 'upfront'),
			'show_avatars' => __('Show avatars', 'upfront'),
			'max_rating' => __('Maximum rating', 'upfront'),
			'settings' => __('Settings', 'upfront'),
			'main_panel' => __('Main', 'upfront'),
			'rating' => array(
				'g' => __('Suitable for all audiences', 'upfront'),
				'pg' => __('Possibly offensive, usually for audiences 13 and above', 'upfront'),
				'r' => __('Intended for adult audiences above 17', 'upfront'),
				'x' => __('Even more mature than R', 'upfront'),
			),
			'default_avatar' => __('Default Avatar', 'upfront'),
			'article' => array(
				'label' => __('Default Article Settings', 'upfront'),
				'pingback' => __('Attempt to notify any blogs linked to from the article', 'upfront'),
				'ping_status' => __('Allow link notifications from other blogs (pingbacks and trackbacks)', 'upfront'),
				'comment_status' => __('Allow people to post comments on new articles<br />(These settings may be overridden for individual articles.)', 'upfront'),
				'attachments' => __('Allow attachments in comments', 'upfront'),
				'email' => __('Show email subscription field', 'upfront'),
			),
			'other' => array(
				'label' => __('Other Comment Settings', 'upfront'),
				'require_name_email' => __('Comment author must fill out name and e-mail', 'upfront'),
				'comment_registration' => __('Users must be registered and logged in to comment', 'upfront'),
				'autoclose' => __('Automatically close comments on articles older than {{subfield}} days', 'upfront'),
				'thread_comments' => __('Enable threaded (nested) comments {{subfield}} levels deep', 'upfront'),
				'page_comments' => __('Paginate comments after {{depth}} top level comments and display {{page}} page by default', 'upfront'),
				'last' => __('last', 'upfront'),
				'first' => __('first', 'upfront'),
				'order' => __('Comments should be displayed with the these comments at the top of each page', 'upfront'),
				'older' => __('older', 'upfront'),
				'newer' => __('newer', 'upfront'),
				'email_me' => __('E-mail me whenever', 'upfront'),
				'comments_notify' => __('Anyone posts a comment', 'upfront'),
				'moderation_notify' => __('A comment is held for moderation', 'upfront'),
				'before_comment_appears' => __('Before a comment appears', 'upfront'),
				'comment_moderation' => __('An administrator must always approve the comment', 'upfront'),
				'comment_whitelist' => __('Comment author must have a previously approved comment', 'upfront'),
				'moderation_label' => __('Comment Moderation', 'upfront'),
				'max_links' => __('Hold a comment in the queue if it contains {{field}} or more links. (A common characteristic of comment spam is a large number of hyperlinks.)', 'upfront'),
				'moderation_keys' => __('When a comment contains any of these words in its content, name, URL, e-mail, or IP, it will be held in the moderation queue. One word or IP per line. It will match inside words, so “press” will match “WordPress”.', 'upfront'),
				'blacklist_keys' => __('When a comment contains any of these words in its content, name, URL, e-mail, or IP, it will be marked as spam. One word or IP per line. It will match inside words, so “press” will match “WordPress”.', 'upfront'),
			),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}

class Upfront_UcommentAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		//add_action('wp_ajax_ucomment_get_comment_markup', array($this, "load_markup"));
		upfront_add_ajax('ucomment_get_comment_markup', array($this, "load_markup"));
		
		//add_action('wp_ajax_upfront-discussion_settings-get', array($this, "get_settings"));
		upfront_add_ajax('upfront-discussion_settings-get', array($this, "get_settings"));
		
		add_action('wp_ajax_upfront-discussion_settings-settings-save', array($this, "save_discussion_settings"));
		add_action('wp_ajax_upfront-discussion_settings-avatars-save', array($this, "save_avatars_settings"));
	}

	public function load_markup () {
		$data = json_decode(stripslashes($_POST['data']), true);
		if (empty($data['post_id'])) die('error');
		//if (!is_numeric($data['post_id'])) die('error');

		$this->_out(new Upfront_JsonResponse_Success(Upfront_UcommentView::get_comment_markup($data['post_id'])));
	}

	public function save_discussion_settings () {
		if (!Upfront_Permissions::current(Upfront_Permissions::OPTIONS)) $this->_out(new Upfront_JsonResponse_Error("You can not do this"));
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
		if (!Upfront_Permissions::current(Upfront_Permissions::OPTIONS)) $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('error_permissions')));
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
		if (!Upfront_Permissions::current(Upfront_Permissions::OPTIONS)) $this->_out(new Upfront_JsonResponse_Error(self::_get_l10n('error_permissions')));
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
				"icon" => preg_replace("/src='(.+?)'/", "src='\$1&amp;forcedefault=1'", get_avatar($current_user->user_email, 32, $key)),
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

