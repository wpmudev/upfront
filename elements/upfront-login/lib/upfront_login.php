<?php

class Upfront_LoginView extends Upfront_Object {

	public function get_markup () {
		
		// We're registering the styles as it turns out we'll need them
		upfront_add_element_style('upfront_login', array('css/public.css', dirname(__FILE__)));
		upfront_add_element_script('upfront_login', array('js/public.js', dirname(__FILE__)));
		// They'll get concatenated and cached later on, we're done with this. Get the actual markup.

		$properties = !empty($this->_data['properties']) ? $this->_data['properties'] : array();
		return is_user_logged_in ()
			? self::fake_upfront_init()
			: self::get_element_markup($properties)
		;
	}

	public static function fake_upfront_init () {
		return !current_user_can('manage_options')
			? ''
			: upfront_boot_editor_trigger()
		;
	}

	public static function get_element_markup ($properties=array()) {
		$properties = self::_normalize_properties($properties);

		$click = !empty($properties['behavior']) && "click" == $properties['behavior'];
		$hover = !empty($properties['behavior']) && "hover" == $properties['behavior'];
		$block = !$click && !$hover;

		$icon = !empty($properties['appearance']) && "icon" == $properties['appearance'];
		$label = !empty($properties['label_text']) ? $properties['label_text'] : __('Click to login', 'upfront');

		$class = array();
		if ($click) $class[] = 'upfront_login-click';
		if ($hover) $class[] = 'upfront_login-hover';
		if ($block) $class[] = 'upfront_login-block';

		$trigger = '';
		if (!$block) {
			$icon_class = $icon ? 'upfront_login-trigger-icon' : '';
			$trigger = '<div class="upfront_login-trigger ' . $icon_class . '"><span class="upfront_login-label">' . 
				($icon ? '<img src="' . upfront_element_url('/img/icon.png', dirname(__FILE__)) . '" />' : esc_html($label)) . 
			'</span></div>';
		}

		return '<div class="upfront_login ' . join(' ', $class) . '">' . 
			$trigger .
			'<div class="upfront_login-form-wrapper"><div class="upfront_login-form">' .
				wp_login_form(array(
					'echo' => false,
					'remember' => true,
				)) . 
			'<p>Lost Password? <a href="' . 
				wp_lostpassword_url( $redirect ) .
			'">Click here</a></p></div>' .
		'</div></div>';
	}

	private static function _normalize_properties ($raw_properties) {
		$to_map = array('behavior', 'appearance', 'label_text');
		$properties = array();
		foreach ($raw_properties as $prop) {
			if (in_array($prop['name'], $to_map)) $properties[$prop['name']] = $prop['value'];
		}
		return $properties;
	}
}

class Upfront_LoginAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_upfront-login_element-get_markup', array($this, "json_get_markup"));
	}

	public function json_get_markup () {
		$markup = Upfront_LoginView::get_element_markup($_POST['properties']);
		$this->_out(new Upfront_JsonResponse_Success($markup));
	}
}
Upfront_LoginAjax::serve();

function upfront_login_add_login_local_url ($data) {
	$data['upfront_login'] = array(
		"root_url" => trailingslashit(upfront_element_url('/', dirname(__FILE__)))
	);
	return $data;
}
add_filter('upfront_data', 'upfront_login_add_login_local_url');