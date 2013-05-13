<?php

abstract class Upfront_Endpoint extends Upfront_Server {

	abstract public function create_endpoint ();
	abstract public function apply_endpoint ();


	protected function _add_hooks () {
		add_action('init', array($this, "create_endpoint"));
		add_action('template_redirect', array($this, "apply_endpoint"));
	}

}

abstract class Upfront_VirtualPage extends Upfront_Server {

	protected $_subpages = array();

	abstract public function get_slug ();
	abstract public function render ($request);
	
	protected function _add_hooks () {
		$this->_add_subpages();
		add_action('template_redirect', array($this, "intercept_page"));
	}

	protected function _add_subpages () {}

	public function intercept_page () {
		if (!$this->_parse_request()) return false;
		//if ($this->get_slug() != get_query_var('name')) return false;
		$this->render();
	}

	public static function redirect ($request) {
		$url = get_option('permalink_structure')
			? site_url($request)
			: site_url() . '?name=' . $request
		;
		wp_safe_redirect($url);
		die;
	}

	private function _parse_request () {
		$raw_request = get_option('permalink_structure')
			? $this->_parse_pretty_permalink_request()
			: $this->_parse_default_request()
		;
		if (!$raw_request) return false;
		$request = array_map('trim', explode('/', $raw_request));
		if (empty($request) || empty($request[0])) return false;
		if ($this->get_slug() !== $request[0]) return false;

		if (!empty($request[1]) && !empty($this->_subpages)) {
			foreach($this->_subpages as $subpage) {
				if ($subpage->get_slug() !== $request[1]) continue;
				status_header(200);
				$subpage->render($request);
				break;
			}
		} else {
			status_header(200);
			$this->render($request);
		}
	}

	public static function get_url ($request) {
		return get_option('permalink_structure')
			? site_url($request)
			: site_url() . '?name=' . $request
		;
	}

	private function _parse_pretty_permalink_request () {
		global $wp;
		return $wp->request;
	}

	private function _parse_default_request () {
		return !empty($_GET['name']) ? $_GET['name'] : false;
	}
}

abstract class Virtual_Content_Page extends Upfront_VirtualPage {

	protected function _add_hooks () {
		if (!current_user_can('edit_posts')) return false;
		parent::_add_hooks();
	}

}

abstract class Upfront_VirtualSubpage {
	abstract public function get_slug ();
	abstract public function render ($request);
}

// ----- Implementations

// --- Creators

class Upfront_NewPage_VirtualSubpage extends Upfront_VirtualSubpage {
	
	public function get_slug () {
		return 'page';
	}

	public function render ($request) {
		$page = Upfront_PostModel::create('page', __('Change me, please', 'upfront'), __('Super awesome content', 'upfront'));
		Upfront_VirtualPage::redirect('edit/page/' . $page->ID);
	}
}

class Upfront_NewPost_VirtualSubpage extends Upfront_VirtualSubpage {
	
	public function get_slug () {
		return 'post';
	}

	public function render ($request) {
		$page = Upfront_PostModel::create('post', __('I am a post title - change me, please', 'upfront'), __('Super awesome post content', 'upfront'));
		Upfront_VirtualPage::redirect('edit/post/' . $page->ID);
	}
}

class Upfront_ContentCreator_VirtualPage extends Virtual_Content_Page {
	
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	protected function _add_subpages () {
		$this->_subpages = array(
			new Upfront_NewPage_VirtualSubpage(),
			new Upfront_NewPost_VirtualSubpage(),
		);
	}

	public function get_slug () {
		return 'create';
	}

	public function render ($request) {}

}
Upfront_ContentCreator_VirtualPage::serve();


// --- Editors


class Upfront_EditPage_VirtualSubpage extends Upfront_VirtualSubpage {
	
	public function get_slug () {
		return 'page';
	}

	public function render ($request) {
		$post_id = end($request);
		$post = Upfront_PostModel::get($post_id);
		add_filter('wp_title', array($this, 'get_title'));
		require_once('templates/edit.php');
		die;
	}

	public function get_title () {
		return 'Edit page';
	}
}

class Upfront_EditPost_VirtualSubpage extends Upfront_VirtualSubpage {
	
	public function get_slug () {
		return 'post';
	}

	public function render ($request) {
		$post_id = end($request);
		global $post, $wp_query;
		$wp_query = new WP_Query(array(
			'p' => $post_id,
		));
		//add_filter('wp_title', array($this, 'get_title'));
		add_action('wp_footer', array($this, 'start_editor'), 999);
		load_template(get_single_template());
		die;
	}

	public function get_title () {
		return 'Edit post';
	}

	public function start_editor () {
		echo <<<EOSEJS
<script>
(function ($) {

$(window).load(function () {
	$("body").append("<a class='upfront-edit_layout' />");
	$(".upfront-edit_layout").trigger("click");
});
})(jQuery);
</script>
EOSEJS;
	}
}

class Upfront_ContentEditor_VirtualPage extends Virtual_Content_Page {
	
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	protected function _add_subpages () {
		$this->_subpages = array(
			new Upfront_EditPage_VirtualSubpage(),
			new Upfront_EditPost_VirtualSubpage(),
		);
	}

	public function get_slug () {
		return 'edit';
	}

	public function render ($request) {}

}
Upfront_ContentEditor_VirtualPage::serve();

// --- Save handlers

class Upfront_Editor_Ajax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront-edit-publish', array($this, "publish_post"));
		add_action('wp_ajax_upfront-edit-draft', array($this, "draft_post"));
		
		add_action('wp_ajax_upfront-post-get_taxonomy', array($this, "get_post_taxonomy"));
		add_action('wp_ajax_upfront-post-create_term', array($this, "create_new_term"));
		add_action('wp_ajax_upfront-post-update_terms', array($this, "update_post_terms"));
		
		add_action('wp_ajax_upfront-load-posts', array($this, "get_posts"));
		add_action('wp_ajax_upfront-load-pages', array($this, "get_pages"));
		add_action('wp_ajax_upfront-load-comments', array($this, "get_comments"));
		
		add_action('wp_ajax_upfront-get_page_data', array($this, "get_page_data"));
		add_action('wp_ajax_upfront-get_post_data', array($this, "get_post_data"));
		
		add_action('wp_ajax_upfront-post-update_slug', array($this, "update_post_slug"));
		
		add_action('wp_ajax_upfront-comments-approve', array($this, "approve_comment"));
		add_action('wp_ajax_upfront-comments-unapprove', array($this, "unapprove_comment"));
		add_action('wp_ajax_upfront-comments-thrash', array($this, "thrash_comment"));
		add_action('wp_ajax_upfront-comments-unthrash', array($this, "unthrash_comment"));
		add_action('wp_ajax_upfront-comments-spam', array($this, "spam_comment"));
		add_action('wp_ajax_upfront-comments-unspam', array($this, "unthrash_comment"));
		
		add_action('wp_ajax_upfront-comments-reply_to', array($this, "post_comment"));
		add_action('wp_ajax_upfront-comments-update_comment', array($this, "update_comment"));
	}

	function publish_post () {
		$this->_process_post('publish');
	}

	function draft_post () {
		$this->_process_post('draft');
	}

	private function _process_post ($status) {
		$data = stripslashes_deep($_POST['data']);
		$post_id = !empty($data['id']) ? $data['id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		if (!current_user_can('edit_post', $post_id)) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));

		$post = (array)Upfront_PostModel::get($post_id);
		if (empty($post)) $this->_out(new Upfront_JsonResponse_Error("Invalid post"));

		$post['post_status'] = $status;
		$post['post_title'] = $data['title'];
		$post['post_content'] = $data['body'];

		$updated = Upfront_PostModel::save($post);
		$updated->permalink = get_permalink($updated->ID);
		$this->_out(new Upfront_JsonResponse_Success($updated));
	}

	function update_post_slug () {
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$slug = !empty($data['slug']) ? $data['slug'] : false;
		if (!$slug) $this->_out(new Upfront_JsonResponse_Error("No slug"));

		if (!current_user_can('edit_post', $post_id)) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));

		$post = (array)Upfront_PostModel::get($post_id);
		if (empty($post)) $this->_out(new Upfront_JsonResponse_Error("Invalid post"));
		$post['post_name'] = $slug;

		$updated = Upfront_PostModel::save($post);
		$updated->permalink = get_permalink($updated->ID);
		$this->_out(new Upfront_JsonResponse_Success($updated));
	}

	function get_post_taxonomy () {
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$taxonomy = !empty($data['taxonomy']) ? $data['taxonomy'] : false;
		if (!$taxonomy) $this->_out(new Upfront_JsonResponse_Error("No taxonomy"));

		$tax_info = get_taxonomy($taxonomy);

		$all_terms = get_terms($taxonomy, array(
			'hide_empty' => false,
		));

		$post_terms = get_the_terms($post_id, $taxonomy);

		$this->_out(new Upfront_JsonResponse_Success(array(
			'taxonomy' => $tax_info,
			'all_terms' => $all_terms,
			'post_terms' => $post_terms,
		)));
	}

	function update_post_terms () {
		if (!current_user_can('manage_categories')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$taxonomy = !empty($data['taxonomy']) ? $data['taxonomy'] : false;
		if (!$taxonomy) $this->_out(new Upfront_JsonResponse_Error("No taxonomy"));

		$terms = !empty($data['terms']) ? $data['terms'] : array();
		$terms = array_map('intval', $terms);

		wp_set_object_terms($post_id, $terms, $taxonomy, false);
		$this->_out(new Upfront_JsonResponse_Success(array("status" => true)));
	}

	function create_new_term () {
		if (!current_user_can('manage_categories')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$args = array();
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;

		$taxonomy = !empty($data['taxonomy']) ? $data['taxonomy'] : false;
		if (!$taxonomy) $this->_out(new Upfront_JsonResponse_Error("No taxonomy"));

		$term = !empty($data['term']) ? $data['term'] : false;
		if (!$term) $this->_out(new Upfront_JsonResponse_Error("No term"));

		$parent_id = !empty($data['parent_id']) ? $data['parent_id'] : false;
		if ($parent_id) {
			$args['parent'] = (int)$parent_id;
		}

		$result = wp_insert_term($term, $taxonomy, $args);
		if (empty($result['term_id'])) $this->_out(new Upfront_JsonResponse_Error("Error creating a term"));

		if ($post_id) {
			wp_set_object_terms($post_id, $result['term_id'], $taxonomy, true);
		}
		$this->_out(new Upfront_JsonResponse_Success(array("status" => true)));
	}

	function get_posts () {
		$query = $this->_spawn_query('post', $_POST);
		$limit = isset($_POST['limit']) ? (int)$_POST['limit'] : 10;
		$page = isset($_POST['page']) ? (int)$_POST['page'] : 0;

		$result = array();
		foreach ($query->posts as $post) {
			$user = get_user_by('id', $post->post_author);
			$result[] = array(
				"ID" => $post->ID,
				"post_title" => $post->post_title,
				"post_author" => $user->display_name,
				"post_date" => mysql2date("Y/m/d", $post->post_date, true),
			);
		}

		$this->_out(new Upfront_JsonResponse_Success(array(
			"posts" => $result,
			"pagination" => array(
				"total" => $query->found_posts,
				"page_size" => $limit,
				"page" => $page,
			),
		)));
	}

	function get_pages () {
		$data = array(
			'sort' => 'parent',
			'limit' => -1,
		);
		$query = $this->_spawn_query('page', $data);
		$this->_out(new Upfront_JsonResponse_Success(array(
			"posts" => $query->posts,
		)));
	}

	function get_comments () {
		$for = !empty($_POST['for']) ? $_POST['for'] : false;
		$orderby = !empty($_POST['sort']) ? 'comment_' . $_POST['sort'] : 'comment_date';
		$order = !empty($_POST['direction']) ? $_POST['direction'] : 'ASC';
		$limit = isset($_POST['limit']) ? (int)$_POST['limit'] : 10;
		$page = isset($_POST['page']) ? (int)$_POST['page'] : 0;
		$search = !empty($_POST['search']) ? $_POST['search'] : false;

/*
		$comments = get_comments(array(
			'orderby' => $orderby,
			'order' => $order,
			'post_id' => $for,
			'type' => 'comment',
			'status' => '',
			//'number' => $limit,
			//'offset' => $page * $limit,
			'search' => $search,
		));
*/
		// Using raw query for comments, so we can get spam ones too.
		$search = $search
			? "AND (comment_content LIKE '%$" . esc_sql(like_escape($search)) . "%')"
			: ''
		;
		global $wpdb;
		$comments = $wpdb->get_results(
			$wpdb->prepare("SELECT * FROM {$wpdb->comments} WHERE comment_post_ID=%d AND comment_type='' {$search} ORDER BY {$orderby} {$order} LIMIT %d, %d", $for, ($page*$limit), $limit)
		);

		$result = array();
		foreach ($comments as $idx => $comment) {
			$result[] = array(
				"comment_ID" => $comment->comment_ID,
				"avatar" => get_avatar($comment, 32),
				"comment_author" => $comment->comment_author,
				"comment_approved" => $comment->comment_approved,
				"comment_content" => $comment->comment_content,
				"comment_date" => mysql2date("Y/m/d", $comment->comment_date, true),
			);
		}
		/*
		$comments_count = get_comments(array(
			'post_id' => $for,
			'type' => 'comment',
			'search' => $search,
			'count' => true,
		));
		*/
		$comments_count = $wpdb->get_var(
			$wpdb->prepare("SELECT COUNT(*) FROM {$wpdb->comments} WHERE comment_post_ID=%d AND comment_type='' {$search}", $for)
		);

		$this->_out(new Upfront_JsonResponse_Success(array(
			"comments" => $result,
			"pagination" => array(
				"total" => $comments_count,
				"page_size" => $limit,
				"page" => $page,
			),
		)));
	}

	function get_page_data () {
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));
		
		$post = $this->_get_post_info($post_id);
		$post->all_templates = get_page_templates();
		$post->page_template = get_page_template_slug($post->ID);
		$this->_out(new Upfront_JsonResponse_Success($post));
	}
	
	function get_post_data () {
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));
		
		$post = $this->_get_post_info($post_id);
		$post->post_content = apply_filters('the_content', $post->post_content);
		$post->sample_permalink = get_sample_permalink_html($post_id);
		$this->_out(new Upfront_JsonResponse_Success($post));
	}

	function approve_comment () {
		if (!current_user_can('moderate_comments')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$data = stripslashes_deep($_POST);
		$comment_id = !empty($data['comment_id']) ? $data['comment_id'] : false;
		if (!$comment_id) $this->_out(new Upfront_JsonResponse_Error("No comment id"));
		wp_set_comment_status($comment_id, 'approve');
		$this->_out(new Upfront_JsonResponse_Success(array("status" => true)));
	}
	function unapprove_comment () {
		if (!current_user_can('moderate_comments')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$data = stripslashes_deep($_POST);
		$comment_id = !empty($data['comment_id']) ? $data['comment_id'] : false;
		if (!$comment_id) $this->_out(new Upfront_JsonResponse_Error("No comment id"));
		wp_set_comment_status($comment_id, 'hold');
		$this->_out(new Upfront_JsonResponse_Success(array("status" => true)));
	}
	function thrash_comment () {
		if (!current_user_can('moderate_comments')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$data = stripslashes_deep($_POST);
		$comment_id = !empty($data['comment_id']) ? $data['comment_id'] : false;
		if (!$comment_id) $this->_out(new Upfront_JsonResponse_Error("No comment id"));
		wp_delete_comment($comment_id);
		$this->_out(new Upfront_JsonResponse_Success(array("status" => true)));
	}
	function unthrash_comment () {
		if (!current_user_can('moderate_comments')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$data = stripslashes_deep($_POST);
		$comment_id = !empty($data['comment_id']) ? $data['comment_id'] : false;
		if (!$comment_id) $this->_out(new Upfront_JsonResponse_Error("No comment id"));
		wp_set_comment_status($comment_id, 'hold');
		$this->_out(new Upfront_JsonResponse_Success(array("status" => true)));
	}
	function spam_comment () {
		if (!current_user_can('moderate_comments')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$data = stripslashes_deep($_POST);
		$comment_id = !empty($data['comment_id']) ? $data['comment_id'] : false;
		if (!$comment_id) $this->_out(new Upfront_JsonResponse_Error("No comment id"));
		wp_set_comment_status($comment_id, 'spam');
		$this->_out(new Upfront_JsonResponse_Success(array("status" => true)));
	}

	function post_comment () {
		if (!current_user_can('moderate_comments')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$comment_id = !empty($data['comment_id']) ? $data['comment_id'] : false;
		$text = !empty($data['content']) ? $data['content'] : false;
		if (!$text) $this->_out(new Upfront_JsonResponse_Error("Say something meaningful"));

		$user = wp_get_current_user();

		$status = wp_insert_comment(array(
			'comment_post_ID' => $post_id,
			'comment_author' => $user->display_name,
			'comment_author_email' => $user->user_email,
			'user_id' => $user->ID,
			'comment_date' => current_time('mysql'),
			'comment_approved' => 1,
			'comment_parent' => $comment_id,
			'comment_content' => $text,
		));
		$this->_out(new Upfront_JsonResponse_Success(array("status" => $status)));
	}

	function update_comment () {
		if (!current_user_can('moderate_comments')) $this->_out(new Upfront_JsonResponse_Error("You can't do this"));
		$data = stripslashes_deep($_POST);
		$post_id = !empty($data['post_id']) ? $data['post_id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$comment_id = !empty($data['comment_id']) ? $data['comment_id'] : false;
		if (!$comment_id) $this->_out(new Upfront_JsonResponse_Error("No comment id"));
		$text = !empty($data['content']) ? $data['content'] : false;

		$comment = get_comment($comment_id, ARRAY_A);
		$comment['comment_content'] = $text; 
		$status = wp_update_comment($comment);
		$this->_out(new Upfront_JsonResponse_Success(array("status" => $status)));
	}

	private function _spawn_query ($post_type, $data=array()) {
		$sort = !empty($data['sort']) ? $data['sort'] : 'date';
		$direction = !empty($data['direction']) ? $data['direction'] : 'asc';
		$limit = isset($data['limit']) ? (int)$data['limit'] : 10;
		$page = isset($data['page']) ? (int)$data['page'] + 1 : 1;
		$search = !empty($data['search']) ? $data['search'] : false;

		$args = array(
			'orderby' => $sort,
			'order' => strtoupper($direction),
			'post_type' => $post_type,
			'posts_per_page' => $limit,
			'paged' => $page,
		);
		if ($search) $args['s'] = $search;

		return new WP_Query($args);
	}

	private function _get_post_hierarchy ($post) {
		if ($post->post_parent) return $this->_get_post_info($post->post_parent);
	}

	private function _get_post_featured_image ($post) {
		$image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ) );
		if (!empty($image[0])) return $image[0];
		return 'http://imgsrc.hubblesite.org/hu/db/images/hs-2012-49-a-small_web.jpg';
	}

	private function _get_post_info ($post_id) {
		$post = get_post($post_id);
		$post->permalink = get_permalink($post->ID);
		$post->hierarchy = $this->_get_post_hierarchy($post);
		$post->featured_image = $this->_get_post_featured_image($post);
		return $post;
	}
}
Upfront_Editor_Ajax::serve();