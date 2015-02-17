<?php

class Upfront_LoginView extends Upfront_Object {

	public static function default_properties () {
		return array(
			'style' => 'form',
			'behavior' => 'click',
			'appearance' => 'icon',
			'label_image' => __('Login', 'upfront'),
			'label_text' => __('log in', 'upfront'),
			'logout_link' => __('log out', 'upfront'),
			'trigger_text' => __('Log in', 'upfront'),
			'logged_in_preview' => '',
			'type' => "LoginModel",
			'view_class' => "LoginView",
			"class" => "c24 upfront-login_element-object",
			'has_settings' => 1,
			'id_slug' => 'upfront-login_element',
			'logout_style' => 'link',
		);
	}

	public function get_markup () {

		// We're registering the styles as it turns out we'll need them
		upfront_add_element_style('upfront_login', array('css/public.css', dirname(__FILE__)));
		upfront_add_element_script('upfront_login', array('js/public.js', dirname(__FILE__)));
		// They'll get concatenated and cached later on, we're done with this. Get the actual markup.

		$properties = !empty($this->_data['properties']) ? $this->_data['properties'] : array();

		
		return is_user_logged_in ()
			? self::fake_upfront_init(self::_normalize_properties($properties))
			: self::get_element_markup($properties)
		;
	}

	public static function fake_upfront_init ($properties = array()) {

		$show_logout_link = !empty($properties['logout_style'])?$properties['logout_style']:false;

		if($show_logout_link == 'link') {
			$logout_link = !empty($properties['logout_link'])?$properties['logout_link']:__('log out', 'upfront');
			return '<a class="logout_link" href="'.wp_logout_url().'">'.$logout_link.'</a>';
		} 
		else {
			return " ";
		}
		
		/*
		return !current_user_can('manage_options')
			? ''
			: upfront_boot_editor_trigger()
		;
		*/
	}

	public static function get_element_markup ($properties=array()) {
		$properties = self::_normalize_properties($properties);


		$logged_in_property = is_array($properties['logged_in_preview'])?$properties['logged_in_preview'][0]:$properties['logged_in_preview'];

		$logged_in_preview =!empty($logged_in_property) ? $logged_in_property :false;

		if($logged_in_preview == 'yes') {
			return self::fake_upfront_init($properties);
		}
		
		$block = !empty($properties['style']) && 'form' == $properties['style'];
		$click = !$block && !empty($properties['behavior']) && "click" == $properties['behavior'];
		$hover = !$block && !empty($properties['behavior']) && "hover" == $properties['behavior'];
		//$log_in_label = !empty($properties['login_button'])? $properties['login_button']:
		$icon = !empty($properties['appearance']) && "icon" == $properties['appearance'];
		$label = !empty($properties['label_text'])
			? $properties['label_text']
			: 'Log in';//(!empty($properties['label_image']) && 'icon' == $properties['appearance'] ? $properties['label_image'] : '')	;

		$trigger_label = !empty($properties['trigger_text']) ? $properties['trigger_text']:"$label";

		if ('icon' == $label) $label = '';
		$class = array();

		if ($click) $class[] = 'upfront_login-click';
		if ($hover) $class[] = 'upfront_login-hover';
		if ($block) $class[] = 'upfront_login-block';

		$trigger = '';
		if (!$block) {
			$icon_class = $icon ? 'upfront_login-trigger-icon' : '';
			$trigger = '<div class="upfront_login-trigger ' . $icon_class . '"><span class="upfront_login-label">' . esc_html($trigger_label);
				
			'</span></div>';
		}

		return '<div class="upfront_login ' . join(' ', $class) . '">' .
			$trigger .
			'<div class="upfront_login-form-wrapper"><div class="upfront_login-form">' .
				wp_login_form(array(
					'echo' => false,
					'remember' => true,
					'label_log_in' => $label,
				)) .
			'<p class="login-lostpassword"><small>Lost Password? <br /> <a class="login-lostpassword-link" href="' .
				wp_lostpassword_url( /*$redirect*/ ) .
			'">' . self::_get_l10n('click_here') . '</a></small></p></div>' .
		'</div></div>';
	}

	private static function _normalize_properties ($raw_properties) {
		$to_map = array('style', 'behavior', 'appearance', 'label_text', 'trigger_text', 'logged_in_preview', 'logout_style', 'logout_link', 'label_image');
		$properties = array();
		foreach ($raw_properties as $prop) {
			if (in_array($prop['name'], $to_map)) $properties[$prop['name']] = $prop['value'];
		}
		return $properties;
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['login_element'])) return $strings;
		$strings['login_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Login', 'upfront'),
			'click_here' => __('Click here to reset it', 'upfront'),
			'css' => array(
				'containers' => __('Field containers', 'upfront'),
				'containers_info' => __('Wrapper layer for every field', 'upfront'),
				'labels' => __('Field labels', 'upfront'),
				'labels_info' => __('Labels for the input fields', 'upfront'),
				'inputs' => __('Input fields', 'upfront'),
				'inputs_info' => __('Username and password fields', 'upfront'),
				'button' => __('Login button', 'upfront'),
				'button_info' => __('Login button', 'upfront'),
				'remember' => __('Remember me checkbox', 'upfront'),
				'remember_info' => __('Remember me checkbox input.', 'upfront'),
				'pwd_wrap' => __('Lost password wrapper', 'upfront'),
				'pwd_wrap_info' => __('Container wrapper for the lost pasword function.', 'upfront'),
				'pwd_link' => __('Lost password link', 'upfront'),
				'pwd_link_info' => __('Link for lost passwords', 'upfront'),
				'close' => __('Closed login link', 'upfront'),
				'close_info' => __('The link that allows to open the login when the dropdown or lightbox option is selected.', 'upfront'),
			),
			'hold_on' => __('Please, hold on', 'upfront'),
			'settings' => __("Login settings", 'upfront'),
			'display' => __("Display", 'upfront'),
			'show_on_hover' => __("Show on hover", 'upfront'),
			'show_on_click' => __("Show on click", 'upfront'),
			'behavior' => __("Display behavior", 'upfront'),
			'on_page' => __("Form on page", 'upfront'),
			'dropdown' => __("Drop down form", 'upfront'),
			'in_lightbox' => __("Form in lightbox", 'upfront'),
			'appearance' => __("Display Appearance", 'upfront'),
			'trigger' => __("Trigger", 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
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
		"defaults" => Upfront_LoginView::default_properties(),
		"root_url" => trailingslashit(upfront_element_url('/', dirname(__FILE__)))
	);
	return $data;
}
add_filter('upfront_data', 'upfront_login_add_login_local_url');