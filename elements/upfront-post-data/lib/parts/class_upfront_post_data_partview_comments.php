<?php

class Upfront_Post_Data_PartView_Comments extends Upfront_Post_Data_PartView {
	protected static $_parts = array(
		0 => 'comment_count',
		1 => 'comments',
		2 => 'comments_pagination',
		3 => 'comment_form'
	);


	/**
	 * Converts the comment form part into markup.
	 *
	 * Supported macros:
	 *    {{comment_form}} - Standard WP comment form
	 *
	 * Part template: post-data-comment_form
	 *
	 * @return string
	 */
	public function expand_comment_form_template () {
		if (empty($this->_post->ID)) return '';

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

        ob_start();
        comment_form($form_args, $this->_post->ID);
        $comment_form = ob_get_clean();

        $out = $this->_get_template('comment_form');

        $out = Upfront_Codec::get()->expand($out, "comment_form", $comment_form);

        return $out;
	}

	/**
	 * Converts the comments pagination part into markup.
	 *
	 * Supported macros:
	 *    {{pagination}} - Comments pagination links
	 *
	 * Part template: post-data-comments_pagination
	 *
	 * @return string
	 */
	public function expand_comments_pagination_template () {
		if (empty($this->_post->ID)) return '';
		if (empty($this->_post->comment_count)) return '';

		$pagination = $this->_get_pagination();
		if (empty($pagination)) return '';
		
		$out = $this->_get_template('comments_pagination');

        $out = Upfront_Codec::get()->expand($out, "pagination", $pagination);

        return $out;
	}

	/**
	 * Converts the comments list part into markup.
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
		if (empty($this->_post->ID)) return '';
		if (empty($this->_post->comment_count)) return '';

		$tpl = $this->_get_external_comments_template();
		if (!empty($tpl)) return $tpl;

        $comments = array();
        $post = false;
		if (is_numeric($this->_post->ID)) {
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

			$skip = !empty($this->_data['disable_showing'])
				? $this->_data['disable_showing']
				: Upfront_Posts_PostsData::get_default('disable_showing')
			;
			if (!empty($skip)) {
				if (in_array('comments', $skip)) $comment_args['type__not_in'][] = 'comment';
				if (in_array('trackbacks', $skip)) $comment_args['type__not_in'][] = 'pings';
			}

			$comments = get_comments($comment_args);
		} else {
			// @TODO: fix/refactor this to work properly in the builder too
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
		if (empty($this->_post->ID)) return '';
		if (empty($this->_post->comment_count)) return '';

		// No pagination
		if (!$this->_is_paginated()) return '';

		$total = (int)$this->_post->comment_count / $this->_get_limit();
		if ((int)$this->_post->comment_count % $this->_get_limit()) $total++; // Fix trailing comment offset

		if (defined('DOING_AJAX') && DOING_AJAX) {
			// Admin area override when doing AJAX preview (editor/builder)
			global $wp_query;
			$wp_query->is_singular = true;
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