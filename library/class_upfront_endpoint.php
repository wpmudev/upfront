<?php

abstract class Upfront_VirtualPage extends Upfront_Server {

	protected $_subpages = array();
	protected $_subpage;

	abstract public function get_slug ();
	abstract public function parse ($request);
	abstract public function render ($request);

	protected function _add_hooks () {
		$this->_add_subpages();
		add_action('template_redirect', array($this, "intercept_page"), 0);
	}

	protected function _add_subpages () {}

	public function intercept_page () {
		if (!$this->_parse_request(true)) return false;
	}

	public function parse_page () {
		if (!$this->_parse_request(false)) return false;
		return true;
	}

	public static function redirect ($request) {
		$url = get_option('permalink_structure')
			? home_url($request)
			: home_url() . '?name=' . $request
		;
		wp_safe_redirect($url);
		die;
	}

	private function _parse_request ($render = true) {
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

				if ($render) $subpage->render($request);
				else $subpage->parse($request);

				$this->_subpage = $subpage;
				break;
			}
		} else {
			status_header(200);
			if ($render) $this->render($request);
			else $this->parse($request);
		}
		return true;
	}

	public static function get_url ($request) {
		return get_option('permalink_structure')
			? home_url($request)
			: home_url() . '?name=' . $request
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
	abstract public function parse ($request);
	abstract public function render ($request);
}


// ----- Redirecting to Maintenance Page if enabled on Admin Upfront General
class Upfront_Maintenance_Page_Interceptor {
	
	public static function intercept_page () {
		$maintenance_data = get_option(Upfront_Server::MAINTENANCE_MODE, false);
		if ( $maintenance_data ) {
			$maintenance_data = json_decode($maintenance_data);
			$page_id = (int) $maintenance_data->page_id;
			$current_page_id = is_singular() ? apply_filters('upfront-data-post_id', get_the_ID()) : false;
			$enabled = (isset($maintenance_data->enabled)) ? (int)$maintenance_data->enabled : 0;
			if ( !is_user_logged_in() && $page_id != $current_page_id && $enabled == 1 ) {
				wp_safe_redirect($maintenance_data->permalink);
				die;
			}
			// if maintenance page add robot
			if ( $page_id == $current_page_id ) {
				add_action('wp_head', array('Upfront_Maintenance_Page_Interceptor', 'meta_robot_noindex'), 0);
			}
		}
		return false;
	}
	
	public static function meta_robot_noindex () {
		echo '<meta name="robots" content="noindex,nofollow">';
	}
	
	
	
}
add_action('template_redirect', array('Upfront_Maintenance_Page_Interceptor', 'intercept_page'));

// ----- Implementations
// --- Editors


class Upfront_EditPage_VirtualSubpage extends Upfront_VirtualSubpage {

	public function get_slug () {
		return 'page';
	}

	public function parse ($request) {
		$post_id = end($request);
		global $post, $wp_query;
		$wp_query = new WP_Query(array(
			'page_id' => $post_id,
		));
		add_filter('upfront-data-post_id', create_function('', "return $post_id;"));
	}

	public function render ($request) {
		$this->parse($request);
		$post_id = end($request);
		$template = !empty($post_id)
			? get_post_meta($post_id, '_wp_page_template', true)
			: false
		;
		if (!empty($template)) {
			$template = locate_template($template);
		}

		if (empty($template)) $template = get_single_template();
		load_template($template);
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

	public function parse ($request) {
		$post_id = end($request);
		global $post, $wp_query;
		$wp_query = new WP_Query(array(
			'p' => $post_id,
		));
		add_filter('upfront-data-post_id', create_function('', "return $post_id;"));
	}

	public function render ($request) {
		$this->parse($request);
		add_action('wp_footer', array($this, 'start_editor'), 999);
		load_template(get_single_template());
		die;
	}

	public function get_title () {
		return 'Edit post';
	}

	public function start_editor () {
		echo upfront_boot_editor_trigger();
		echo <<<EOSEJS
<script>
(function ($) {

var this_post = false;

function loaded_layout_ready () {
	setTimeout(function () {
		if ($("#upfront-loading").length) return loaded_layout_ready();
		else {
			if (!this_post) return Upfront.Util.log("NO SUCH POST");
			Upfront.Events.off("upfront:layout:loaded", loaded_layout_ready);
			$("#" + this_post.model.get_property_value_by_name("element_id")).trigger("dblclick");
		}
	}, 200);
}

$(document).on("upfront-load", function () {
	Upfront.Events.on("upfront:layout:loaded", loaded_layout_ready);
	Upfront.Events.on("elements:this_post:loaded", function (post) {
		var el = $("#" + post.model.get_property_value_by_name("element_id")).closest(".upfront-region-shadow");
		if (!el.length) this_post = post;
	});
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
		return $me;
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

	public function parse ($request) {}
	public function render ($request) {}

}
add_action('init', array('Upfront_ContentEditor_VirtualPage', 'serve'));



/* ----- Prettify frontend element dependencies loading ----- */

class Upfront_ElementDependiecies_Styles_VirtualSubpage extends Upfront_VirtualSubpage {

	public function get_slug () { return 'styles'; }

	public function parse ($request) {}

	public function render ($request) {
		if (empty($request)) return false;
		if (empty($request[2])) return false;
		$_REQUEST['key'] = $request[2];
		$action = is_user_logged_in() ? 'wp_ajax_upfront-element-styles' : 'wp_ajax_nopriv_upfront-element-styles';
		do_action($action);
		die;
	}
}

class Upfront_ElementDependiecies_Scripts_VirtualSubpage extends Upfront_VirtualSubpage {

	public function get_slug () { return 'scripts'; }

	public function parse ($request) {}

	public function render ($request) {
		if (empty($request)) return false;
		if (empty($request[2])) return false;
		$_REQUEST['key'] = $request[2];
		$action = is_user_logged_in() ? 'wp_ajax_upfront-element-scripts' : 'wp_ajax_nopriv_upfront-element-scripts';
		do_action($action);
		die;
	}
}

class Upfront_ElementDependencies_VirtualPage extends Upfront_VirtualPage {

	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	protected function _add_subpages () {
		$this->_subpages = array(
			new Upfront_ElementDependiecies_Styles_VirtualSubpage(),
			new Upfront_ElementDependiecies_Scripts_VirtualSubpage(),
		);
	}

	public function get_slug () { return 'upfront-dependencies'; }

	public function parse ($request) { }
	public function render ($request) { die; }

}
add_action('init', array('Upfront_ElementDependencies_VirtualPage', 'serve'));