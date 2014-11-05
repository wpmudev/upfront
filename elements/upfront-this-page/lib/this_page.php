<?php
class Upfront_ThisPageView extends Upfront_Object {
	public function get_markup () {
		global $post;

		$element_id = $this->_get_property('element_id');
		$display = $this->_get_property('display');
		return
			'<div class=" upfront-this_page" id="' . $element_id . '">' .
				self::get_page_markup($display, get_the_ID()) .
			'</div>';
	}

	public static function get_page_markup ($display = 'title', $post_id = 0) {
		global $post;
		$post = get_post($post_id);
		setup_postdata($post);
		$data = upfront_get_template('this-page-' . $display, array('post' => $post), dirname(dirname(__FILE__)) . '/tpl/this-page-' . $display . '.php');
		wp_reset_postdata();
		return $data;
	}
	public static function get_new_page ($display) {

	}

	public static function default_properties(){
		return array(
			'type' => 'ThisPageModel',
			'view_class' => 'ThisPageView',
			'class' => 'c24 upfront-this_page',
			'display' => 'title',
			'has_settings' => 0,
			'id_slug' => 'this_page',
		);
	}

	public static function add_js_defaults($data){
		$data['thisPage'] = array('defaults' => self::default_properties());
		return $data;
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['this_page_element'])) return $strings;
		$strings['this_page_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Page', 'upfront'),
			'thrashed_post' => __('This %s has been deleted. To edit it, <a class="ueditor_restore">restore the %s</a>.', 'upfront'),
			'refreshing' => __('Refreshing...', 'upfront'),
			'here_we_are' => __('Here we are!', 'upfront'),
			'title_placeholder' => __('Write a title...', 'upfront'),
			'content_placeholder' => __('Your content goes here ;)', 'upfront'),
			'page_title' => __('Page Title', 'upfront'),
			'page_content' => __('Page Content', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

}


/**
 * Posts AJAX response implementation.
 */
class Upfront_ThisPageAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_this_page-get_markup', array($this, "load_markup"));
	}

	public function load_title_markup () {
		return $this->load_markup('title');
	}

	public function load_content_markup () {
		return $this->load_markup('content');
	}

	public function load_markup () {
		$data = json_decode(stripslashes($_POST['data']), true);
		if (!is_numeric($data['post_id'])) die('error');

		$return = array(
			'content' => '',
			'title' => ''
		);

		if($data['post_id']){
			$post = get_post($data['post_id']);
			if(!$post)
				return $this->_out(new Upfront_JsonResponse_Error('Unknown post.'));

			if($post->post_status == 'trash'){
				$return['content'] = '<div class="ueditor_deleted_post ueditable upfront-ui">' .
					sprintf(Upfront_ThisPageView::_get_l10n('thrashed_post'), $post->post_type, $post->post_type) .
				'</div>';
			}
			else{
				$return['title'] = Upfront_ThisPageView::get_page_markup('title', $data['post_id']);
				$return['content'] = Upfront_ThisPageView::get_page_markup('content', $data['post_id']);
			}
		}
		else if($data['post_type']){
			$return['title'] = Upfront_ThisPageView::get_new_page('title');
			$return['content'] = Upfront_ThisPageView::get_new_page('content');
		}
		else
			$this->_out(new Upfront_JsonResponse_Error('Not enough data.'));


		$this->_out(new Upfront_JsonResponse_Success(array(
			"filtered" => $return
		)));
	}
}
Upfront_ThisPageAjax::serve();