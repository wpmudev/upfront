<?php

class Upfront_Post_Data_PartView_Comments extends Upfront_Post_Data_PartView {
	
	protected static $_parts = array(
		0 => 'comment_count',
		1 => 'comments',
		2 => 'comments_pagination',
		3 => 'comment_form'
	);

	/**
	 * Converts the comment count part into markup.
	 *
	 * Supported macros:
	 *    {{comment_count}} - Number of comments for current post
	 *
	 * Part template: post-data-comment_count
	 *
	 * @return string
	 */
	public function expand_comment_count_template () {
		$is_fake_data = $this->_is_fake_data();
		$hide_empty = isset($this->_data['comment_count_hide'])
			? (int)$this->_data['comment_count_hide']
			: (int)Upfront_Posts_PostsData::get_default('comment_count_hide')
		;
		$skip = !empty($this->_data['disable_showing'])
			? $this->_data['disable_showing']
			: Upfront_Posts_PostsData::get_default('disable_showing')
		;
		if (!$is_fake_data) {
			$comment_count = $this->_post->comment_count;
		}
		else {
			$post = $this->_get_random_post();
			if (false !== $post) {
				$comments = self::spawn_random_comments($post, $skip);
				$comment_count = count($comments);
			}
		}

		if ($hide_empty && empty($comment_count)) return '';

		$out = $this->_get_template('comment_count');

		$out = Upfront_Codec::get()->expand($out, "comment_count", (int)($comment_count));

		return $out;
	}

	/**
	 * Converts the comment form part into markup.
	 *
	 * Doesn't do anything in overridden comments template environment.
	 *
	 * Supported macros:
	 *    {{comment_form}} - Standard WP comment form
	 *
	 * Part template: post-data-comment_form
	 *
	 * @return string
	 */
	public function expand_comment_form_template () {
		$is_fake_data = $this->_is_fake_data();
		if (!$is_fake_data && empty($this->_post->ID)) return '';

		$tpl = $this->_get_external_comments_template();
		if (!empty($tpl)) return ''; // We already have a form included with the comments

        $form_args = array(
        	'comment_field' => $this->_get_comment_form_field(),
        );

        /**
         * Filter the default WP form arguments
         *
         * @param array default form arguments
         */
        $form_args = apply_filters('upfront_comment_form_args', array_filter($form_args));

		if (!$is_fake_data) {
			$post = $this->_post;
		}
		else {
			$post = $this->_get_random_post();
		}

		// ... aaand start with comments fields rearrangement for WP4.4
		add_filter('comment_form_fields', array('Upfront_Post_Data_PartView_Comments', 'rearrange_comment_form_fields'));

        ob_start();
        comment_form($form_args, $post->ID);
        $comment_form = ob_get_clean();

        // Clean up after ourselves
        remove_filter('comment_form_fields', array('Upfront_Post_Data_PartView_Comments', 'rearrange_comment_form_fields'));

        $out = $this->_get_template('comment_form');

        $out = Upfront_Codec::get()->expand($out, "comment_form", $comment_form);

        return $out;
	}

	/**
	 * Converts the comments pagination part into markup.
	 *
	 * Doesn't do anything in overridden comments template environment.
	 *
	 * Supported macros:
	 *    {{pagination}} - Comments pagination links
	 *
	 * Part template: post-data-comments_pagination
	 *
	 * @return string
	 */
	public function expand_comments_pagination_template () {
		if (!$this->_is_fake_data()) {
			if (empty($this->_post->ID)) return '';
			if (empty($this->_post->comment_count)) return '';
		}

		// If we have plugin-overridden template, then assume it'll take care of itself
		$tpl = $this->_get_external_comments_template();
		if (!empty($tpl)) return '';

		$pagination = $this->_get_pagination();
		if (empty($pagination)) return '';
		
		$out = $this->_get_template('comments_pagination');

        $out = Upfront_Codec::get()->expand($out, "pagination", $pagination);

        return $out;
	}

	/**
	 * Converts the comments list part into markup.
	 *
	 * In overridden comments template environment, it falls back to using the template.
	 *
	 * Supported macros:
	 *    {{comments}} - Comments list markup
	 *    {{pagination}} - Comments pagination links
	 *
	 * Part template: post-data-comments
	 *
	 * @return string
	 */
	public function expand_comments_template () {
		$is_fake_data = $this->_is_fake_data();
		if (!$is_fake_data && empty($this->_post->ID)) return '';
		if (!$is_fake_data && empty($this->_post->comment_count)) return '';

		// If we have plugin-overridden template, then yeah... go with that
		$tpl = $this->_get_external_comments_template();
		if (!empty($tpl)) return $tpl;

        $comments = array();
        $post = false;
		$skip = !empty($this->_data['disable_showing'])
			? $this->_data['disable_showing']
			: Upfront_Posts_PostsData::get_default('disable_showing')
		;
		if (is_numeric($this->_post->ID) && !$is_fake_data) {
			$post = $this->_post;
			$comment_args = array(
				'post_id' => $this->_post->ID,
				'order'   => $this->_get_order(),
				'orderby' => $this->_get_order_by(),
				'status'  => 'approve',
				'type__not_in' => array(),
			);
			$commenter = wp_get_current_commenter();
			$user_id = get_current_user_id();
			
			if (!empty($user_id)) $comment_args['include_unapproved'] = array($user_id);
			else if (!empty($commenter['comment_author_email'])) $comment_args['include_unapproved'] = array($commenter['comment_author_email']);

			if (!empty($skip)) {
				if (in_array('comments', $skip)) $comment_args['type__not_in'][] = 'comment';
				if (in_array('trackbacks', $skip)) $comment_args['type__not_in'][] = 'pings';
			}

			$comments = get_comments($comment_args);
		} else {
			$post = $this->_get_random_post();
			if (false !== $post) {
				$comments = self::spawn_random_comments($post, $skip);
			}
			else return '';
		}

		if (empty($post) || !is_object($post)) return '';
		if (post_password_required($post->ID)) return '';
		
		ob_start();

		// Load comments
		if ($comments && sizeof($comments)) {
			echo '<ol class="upfront-comments">';
			wp_list_comments(array(
				'callback' => array('Upfront_Post_Data_PartView_Comments', 'list_comment'), 
				'per_page' => $this->_get_limit(),
				'page' => (int)get_query_var('cpage'),
				'style' => 'ol'), 
			$comments);
			echo '</ol>';
		}

		$comments = ob_get_clean();

		$pagination = $this->_get_pagination();

		$out = $this->_get_template('comments');

		$out = Upfront_Codec::get()->expand($out, "comments", $comments);
		$out = Upfront_Codec::get()->expand($out, "pagination", $pagination);

		return $out;
	}

	/**
	 * Callback for `wp_list_comments`
	 */
	public static function list_comment ($comment, $args, $depth) {
		$GLOBALS['comment'] = $comment;
		echo upfront_get_template('upfront-comment-list', array( 'comment' => $comment, 'args' => $args, 'depth' => $depth ), upfront_element_dir('tpl/upfront-comment-list.php', dirname(__DIR__)));
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

	/**
	 * Generate random comments for use with builder
	 *
	 * @param $post object WP_Post object
	 * @param $skip array Array of comment type to skip
	 * @return array
	 */
	public static function spawn_random_comments ($post, $skip = array()) {
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
		$comments = array();
		if (!in_array('comments', $skip)) {
			for ($i=0; $i<5; $i++) {
				$comments[] = array_merge($fake_comment, array(
					'user_id' => get_current_user_id(),
					'comment_author' => 'Author',
					'comment_content' => 'test stuff author comment',
				));
				$comments[] = array_merge($fake_comment, array(
					'user_id' => 0,
					'comment_author' => 'Visitor',
					'comment_content' => 'test stuff visitor comment',
				));
			}
		}
		if (!in_array('trackbacks', $skip)) {
			$comments[] = array_merge($fake_comment, array(
				'user_id' => 0,
				'comment_author' => 'Trackback',
				'comment_type' => 'trackback',
				'comment_content' => 'test stuff visitor trackback',
			));
			$comments[] = array_merge($fake_comment, array(
				'user_id' => 0,
				'comment_author' => 'Pingback',
				'comment_type' => 'pingback',
				'comment_content' => 'test stuff visitor pingkback',
			));
		}
		foreach ($comments as $cid => $comment) {
			$comment['comment_ID'] = $cid;
			$comments[$cid] = (object)wp_filter_comment($comment);
		}

		return $comments;
	}

	/**
	 * Check if we are on builder and need dummy comments
	 */
	private function _is_fake_data () {
		return (
			$this->_editor
			&&
			!is_numeric($this->_data['post_id'])
			&&
			in_array($this->_data['post_id'], array('fake_post', 'fake_styled_post'))
		);
	}

	/**
	 * Get random post to use for dummy comments
	 */
	private function _get_random_post () {
		if ( isset($this->_rand_post) ) return $this->_rand_post;
		$posts = get_posts(array('orderby' => 'rand', 'posts_per_page' => 1));
		if (!empty($posts[0])) {
			$this->_rand_post = $posts[0];
			add_filter('comments_open', '__return_true');
			return $this->_rand_post;
		}
		return false;
	}

	/**
	 * Get the actual input form field markup.
	 * Yanked directly from wp-includes/comment-template.php
	 * because that's where it's hardcoded. Yay for hardcoding stuff.
	 *
	 * @return string
	 */
	private function _get_comment_form_field () {
		return '<p class="comment-form-comment">' .
			'<label for="comment">' . _x( 'Comment', 'noun' ) . '</label>' .
			' ' .
			'<textarea placeholder="' . esc_attr(__('Leave a Reply')) . '" id="comment" name="comment" cols="45" rows="8" aria-describedby="form-allowed-tags" aria-required="true" required="required"></textarea>' .
		'</p>';
	}

	/**
	 * Check if we have any external comments templates assigned by plugins.
	 *
	 * @return mixed (bool)false if nothing found, (string)finished template otherwise
	 */
	private function _get_external_comments_template () {
		if (!is_numeric($this->_post->ID)) return false;

		// Instantiate the markup registry and go with that.
		$registry = Upfront_Global_Registry::get_instance();
		$regkey = "comments_template_{$this->_post->ID}";
		$tpl = $registry->get($regkey);
		if (!empty($tpl)) return $tpl;

		global $post, $wp_query;

		$overriden_template = false;

		// Sooo... override the post globals
		$global_post = is_object($post) ? clone($post) : $post;
		$post = get_post($this->_post);

		$global_query = is_object($wp_query) ? clone($wp_query) : $wp_query;
		$wp_query->is_singular = true;
		if (!isset($wp_query->comments)) {
			$wp_query->comments = get_comments("post_id={$this->_post->ID}");
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

		if (!empty($overriden_template)) {
			$registry->set($regkey, $overriden_template);
		}

		return $overriden_template;
	}

	/**
	 * Determine if the comments should be paginated
	 *
	 * @return bool
	 */
	private function _is_paginated () {
		return (bool)get_option('page_comments');
	}

	/**
	 * Pagination markup getter.
	 *
	 * Implemented as separate method, so we can have it in macro expansion,
	 * as well as separate part.
	 *
	 * @return string Comment pagination links.
	 */
	private function _get_pagination () {
		if (!$this->_is_fake_data()) {
			if (empty($this->_post->ID)) return '';
			if (empty($this->_post->comment_count)) return '';
		}

		// No pagination
		if (!$this->_is_paginated()) return '';

		$post = $this->_post;
		$comment_count = $this->_post->comment_count;
		if ($this->_is_fake_data()) {
			$post = $this->_get_random_post();
			$comments = self::spawn_random_comments($post);
			$post->comment_count = count($comments);
			$comment_count = $post->comment_count;
		}

		$total = (int)$comment_count / $this->_get_limit();
		if ((int)$comment_count % $this->_get_limit()) $total++; // Fix trailing comment offset

		if (defined('DOING_AJAX') && DOING_AJAX) {
			// Admin area override when doing AJAX preview (editor/builder)
			global $wp_query;
			$wp_query->is_singular = true;
			if ($this->_is_fake_data()) $wp_query->max_num_comment_pages = $total;
		}
		
		$out = paginate_comments_links(array(
			'total' => $total,
			'echo' => false,
		));

		if (defined('DOING_AJAX') && DOING_AJAX && isset($wp_query)) {
			// Clean up
			$wp_query->is_singular = false;
		}

		return $out;
	}

	/**
	 * Determine the number of displayed comments per page.
	 *
	 * Only applicable if comments pagination is allowed
	 *
	 * @return int
	 */
	private function _get_limit () {
		if (!$this->_is_paginated()) return 0;

		$opt = (int)get_option('comments_per_page');
		
		$limit = !empty($this->_data['limit']) && is_numeric($this->_data['limit'])
			? (int)$this->_data['limit']
			: $opt
		;

		return $limit;
	}

	/**
	 * Determine the sort ordering direction.
	 *
	 * Falls back to whatever is set in Settings > Discussion.
	 *
	 * @return string Always either ASC or DESC.
	 */
	private function _get_order () {
		$allowed = array('ASC', 'DESC');
		// Defaults first
		$opt = get_option('default_comments_page') === 'oldest' ? 'ASC' : 'DESC';
		
		$direction = !empty($this->_data['direction']) && in_array(strtoupper($this->_data['direction']), $allowed)
			? strtoupper($this->_data['direction'])
			: $opt
		;
		
		return $direction;
	}

	/**
	 * Determine the field used for sorting.
	 *
	 * Falls back to comment date.
	 *
	 * @return string Field to sort the comments by
	 */
	private function _get_order_by () {
		$allowed = array(
			'comment_date_gmt',
			'comment_karma',
			'comment_parent',
		);
		// Defaults first
		$opt = 'comment_date_gmt';
		
		$order = !empty($this->_data['order']) && in_array($this->_data['order'], $allowed)
			? $this->_data['order']
			: $opt
		;

		return $order;
	}
}
