<?php

class Upfront_LoginView extends Upfront_Object {

	public static function default_properties () {
		return array(
			'preset' => 'default',
			'style' => 'form',
			'behavior' => 'click',
			'appearance' => 'icon',
			'label_image' => self::_get_l10n('login'),
			'login_button_label' => self::_get_l10n('log_in'),
			'logout_link' => self::_get_l10n('log_out'),
			'trigger_text' => self::_get_l10n('log_in'),
			'logged_in_preview' => '',
			'type' => "LoginModel",
			'view_class' => "LoginView",
			"class" => "c24 upfront-login_element-object",
			'has_settings' => 1,
			'id_slug' => 'upfront-login_element',
			'logout_style' => 'link',
			'top_offset' => 0,
			'left_offset' => 0,
			'username_label' => self::_get_l10n('username_label'),
			'password_label' => self::_get_l10n('password_label'),
			'remember_label' => self::_get_l10n('remember_label'),
			'lost_password_text' => self::_get_l10n('lost_password'),
			'lost_password_link' => self::_get_l10n('click_here'),
		);
	}

	public function get_markup () {

		// We're registering the styles as it turns out we'll need them
		upfront_add_element_style('upfront_login', array('css/public.css', dirname(__FILE__)));
		upfront_add_element_script('upfront_login', array('js/public.js', dirname(__FILE__)));
		// They'll get concatenated and cached later on, we're done with this. Get the actual markup.

		$properties = !empty($this->_data['properties']) ? $this->_data['properties'] : array();

		return is_user_logged_in ()
			? self::get_logout_markup(self::_normalize_properties($properties))
			: self::get_login_markup($properties)
		;
	}

	public static function get_logout_markup ($properties=array()) {
		if (!(!empty($properties['logout_style']) && 'link' === $properties['logout_style'])) return ' ';

		$label = !empty($properties['logout_link'])
			? $properties['logout_link']
			: self::_get_l10n('log_out')
		;
		return upfront_get_template("login-logout", array('label' => $label), dirname(dirname(__FILE__)) . "/tpl/logout.php");
	}

	public static function get_login_markup ($properties=array()) {
		$properties = self::_normalize_properties($properties);

		$logged_in_preview = is_array($properties['logged_in_preview'])
			? !empty($properties['logged_in_preview'][0])
			: !empty($properties['logged_in_preview'])
		;

		if ($logged_in_preview) {
			return self::get_logout_markup($properties);
		}

		$block = !empty($properties['style']) && 'form' == $properties['style'];
		
		$icon = !empty($properties['appearance']) && "icon" == $properties['appearance'];
		$login_button_label = !empty($properties['login_button_label'])
			? $properties['login_button_label']
			: self::_get_l10n('log_in')
		;
		if ('icon' === $login_button_label) $login_button_label = '';

		$trigger_label = !empty($properties['trigger_text']) ? $properties['trigger_text'] : $login_button_label;
		$trigger = empty($block)
			? self::_get_trigger_markup($icon, $trigger_label)
			: ''
		;
		
		$username_label = !empty($properties['username_label'])
			? $properties['username_label']
			: self::_get_l10n('username_label')
		;
		$password_label = !empty($properties['password_label'])
			? $properties['password_label']
			: self::_get_l10n('password_label')
		;
		$remember_label = !empty($properties['remember_label'])
			? $properties['remember_label']
			: self::_get_l10n('remember_label')
		;
		$lost_password_text = !empty($properties['lost_password_text'])
			? $properties['lost_password_text']
			: self::_get_l10n('lost_password')
		;
		$lost_password_link = !empty($properties['lost_password_link'])
			? $properties['lost_password_link']
			: self::_get_l10n('click_here')
		;
		

		$allow_registration = !is_user_logged_in() && get_option('users_can_register');
		// Allow override for in-editor form previews
		if (defined('DOING_AJAX') && DOING_AJAX && Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			$allow_registration = get_option('users_can_register');
		}

		$data = array(
			'trigger' => $trigger,
			'login_button_label' => $login_button_label,
			'allow_registration' => $allow_registration,
			'username_label' => $username_label,
			'password_label' => $password_label,
			'remember_label' => $remember_label,
			'lost_password' => $lost_password_text,
			'lost_password_link' => $lost_password_link,
			'register' => self::_get_l10n('register'),
		);
		
		// top and left offset for hover and click behavior
		$top_offset = ( !empty($properties['top_offset']) )
			? 'top:' . $properties['top_offset'] . 'px;'
			: ''
		;
		$left_offset = ( !empty($properties['left_offset']) )
			? 'left:' . $properties['left_offset'] . 'px;'
			: ''
		;
		$data['offset'] = $top_offset . $left_offset;
		
		$tpl = 'block'; // default
		if (!$block && !empty($properties['behavior'])) {
			$tpl = preg_replace('/[^a-z0-9]/', '', $properties['behavior']);
		}
		return upfront_get_template("login-form-{$tpl}", $data, dirname(dirname(__FILE__)) . "/tpl/form-{$tpl}.php");
	}

	private static function _get_trigger_markup ($icon=false, $trigger_label='') {
		$tpl = !empty($icon) ? 'icon' : 'link';
		return upfront_get_template("login-trigger-{$tpl}", array('label' => $trigger_label), dirname(dirname(__FILE__)) . "/tpl/trigger-{$tpl}.php");
	}

	private static function _normalize_properties ($raw_properties) {
		$to_map = array('style', 'behavior', 'appearance', 'login_button_label', 'trigger_text', 'logged_in_preview', 'logout_style', 'logout_link', 'label_image', 'top_offset', 'left_offset', 'username_label', 'password_label', 'remember_label', 'lost_password_text', 'lost_password_link');
		$properties = upfront_properties_to_array($raw_properties, $to_map);
		return $properties;
	}

	public static function add_data_defaults ($data) {
		$data['upfront_login'] = array(
			"defaults" => self::default_properties(),
			"root_url" => trailingslashit(upfront_element_url('/', dirname(__FILE__)))
		);
		return $data;
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
			'settings' => __("Login Element", 'upfront'),
			'general_settings' => __('General Settings', 'upfront'),
			'display' => __("Display", 'upfront'),
			'show_form_label' => __("Show Form", 'upfront'),
			'show_on_hover' => __("On Hover", 'upfront'),
			'show_on_click' => __("On Click", 'upfront'),
			'behavior' => __("Display behavior", 'upfront'),
			'general_settings_description' => __("To edit Labels, Button or Link text, double-click it like you would with Text Element", 'upfront'),
			'on_page' => __("In a Layout", 'upfront'),
			'dropdown' => __("In a Drop Down", 'upfront'),
			'in_lightbox' => __("Form in lightbox", 'upfront'),
			'appearance' => __("Display Login Form", 'upfront'),
			'trigger' => __("Trigger", 'upfront'),
			'username_label' => __("Username", 'upfront'),
			'password_label' => __("Password", 'upfront'),
			'remember_label' => __("Remember Me", 'upfront'),
			'lost_password' => __("Lost Password?", 'upfront'),
			'login' => __("Login", 'upfront'),
			'log_in' => __("Log in", 'upfront'),
			'log_out' => __("Log out", 'upfront'),
			'logged_in_preview' => __("Logged in Users see", 'upfront'),
			'preview' => __("Preview", 'upfront'),
			'nothing' => __("Nothing", 'upfront'),
			'log_out_link' => __("Log Out Link", 'upfront'),
			'log_out_label' => __("Log Out Link:", 'upfront'),
			'log_in_button' => __("Log In Button:", 'upfront'),
			'log_in_trigger' => __("Log In Trigger:", 'upfront'),
			'register' => __("Register", 'upfront'),
			'top_offset' => __("Top Offset", 'upfront'),
			'left_offset' => __("Left Offset", 'upfront'),
			'px' => __("px", 'upfront'),
			'preset' => array(
				'part_to_style' => __("Part to Style:", 'upfront'),
			)
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}