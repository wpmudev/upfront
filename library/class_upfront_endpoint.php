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
		$post = Upfront_PostModel::get($post_id);
		add_filter('wp_title', array($this, 'get_title'));
		require_once('templates/edit.php');
		die;
	}

	public function get_title () {
		return 'Edit post';
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
	}

	function publish_post () {
		$this->_process_post('publish');
	}

	function draft_post () {
		$this->_process_post('draft');
	}

	private function _process_post ($status) {
		$post_id = !empty($_POST['id']) ? $_POST['id'] : false;
		if (!$post_id) $this->_out(new Upfront_JsonResponse_Error("No post id"));

		$post = (array)Upfront_PostModel::get($post_id);
		if (empty($post)) $this->_out(new Upfront_JsonResponse_Error("Invalid post"));

		$post['post_status'] = $status;
		$post['post_title'] = stripslashes($_POST['title']);
		$post['post_content'] = stripslashes($_POST['body']);

		$updated = Upfront_PostModel::save($post);
		$updated->permalink = get_permalink($updated->ID);
		$this->_out(new Upfront_JsonResponse_Success($updated));
	}
}
Upfront_Editor_Ajax::serve();