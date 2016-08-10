<?php

if (!class_exists('Upfront_Presets_Server')) {
	require_once Upfront::get_root_dir() . '/library/servers/class_upfront_presets_server.php';
}

class Upfront_Login_Presets_Server extends Upfront_Presets_Server {

	private static $instance;

	public function get_element_name() {
		return 'login';
	}

	public static function serve () {
		self::$instance = new self;
		self::$instance->_add_hooks();
		add_filter( 'get_element_preset_styles', array(self::$instance, 'get_preset_styles_filter')) ;
	}

	public static function get_instance() {
		return self::$instance;
	}

	public function get_preset_styles_filter($style) {
		$style .= ' ' . self::$instance->get_presets_styles();
		return $style;
	}

	/**
	 * @return array saved presets
	 */
	public function get_presets() {
		$presets = parent::get_presets();

		return $presets;
	}

	protected function get_style_template_path() {
		return realpath(Upfront::get_root_dir() . '/elements/upfront-login/tpl/preset-style.html');
	}

	public static function get_preset_defaults() {
		return array(
			'part_style' => 'form_wrapper',
			'form_wrapper_use_border' => '',
			'form_wrapper_border_width' => 1,
			'form_wrapper_border_type' => 'solid',
			'form_wrapper_border_color' => 'rgb(0, 0, 0)',
			'form_wrapper_use_radius' => '',
			'form_wrapper_border_radius_lock' => 'yes',
			'form_wrapper_radius' => '',
			'form_wrapper_radius_number' => '',
			'form_wrapper_border_radius1' => 5,
			'form_wrapper_border_radius2' => 5,
			'form_wrapper_border_radius3' => 5,
			'form_wrapper_border_radius4' => 5,
			'field_labels_font_face' => 'Arial',
			'field_labels_font_style' => '400 normal',
			'field_labels_weight' => '400',
			'field_labels_style' => 'normal',
			'field_labels_font_size' => 14,
			'field_labels_line_height' => 1,
			'field_labels_color' => 'rgb(0, 0, 0)',
			'field_labels_use_typography' => '',
			'input_fields_font_face' => 'Arial',
			'input_fields_font_style' => '400 normal',
			'input_fields_weight' => '400',
			'input_fields_style' => 'normal',
			'input_fields_font_size' => 14,
			'input_fields_line_height' => 1,
			'input_fields_color' => 'rgb(0, 0, 0)',
			'input_fields_use_typography' => '',
			'input_fields_use_border' => '',
			'input_fields_border_width' => 1,
			'input_fields_border_type' => 'solid',
			'input_fields_border_color' => 'rgb(0, 0, 0)',
			'input_fields_use_radius' => '',
			'input_fields_border_radius_lock' => 'yes',
			'input_fields_radius' => '',
			'input_fields_radius_number' => '',
			'input_fields_border_radius1' => 5,
			'input_fields_border_radius2' => 5,
			'input_fields_border_radius3' => 5,
			'input_fields_border_radius4' => 5,
			'button_font_face' => 'Arial',
			'button_font_style' => '400 normal',
			'button_weight' => '400',
			'button_style' => 'normal',
			'button_font_size' => 14,
			'button_line_height' => 1,
			'button_color' => 'rgb(0, 0, 0)',
			'button_use_typography' => '',
			'button_use_border' => '',
			'button_border_width' => 1,
			'button_border_type' => 'solid',
			'button_border_color' => 'rgb(0, 0, 0)',
			'button_use_radius' => '',
			'button_border_radius_lock' => 'yes',
			'button_radius' => '',
			'button_radius_number' => '',
			'button_border_radius1' => 5,
			'button_border_radius2' => 5,
			'button_border_radius3' => 5,
			'button_border_radius4' => 5,
			'lost_password_text_font_face' => 'Arial',
			'lost_password_text_font_style' => '400 normal',
			'lost_password_text_weight' => '400',
			'lost_password_text_style' => 'normal',
			'lost_password_text_font_size' => 14,
			'lost_password_text_line_height' => 1,
			'lost_password_text_color' => 'rgb(0, 0, 0)',
			'lost_password_text_use_typography' => '',
			'login_trigger_font_face' => 'Arial',
			'login_trigger_font_style' => '400 normal',
			'login_trigger_weight' => '400',
			'login_trigger_style' => 'normal',
			'login_trigger_font_size' => 14,
			'login_trigger_line_height' => 1,
			'login_trigger_color' => 'rgb(0, 0, 0)',
			'login_trigger_use_typography' => '',
			'login_trigger_use_border' => '',
			'login_trigger_border_width' => 1,
			'login_trigger_border_type' => 'solid',
			'login_trigger_border_color' => 'rgb(0, 0, 0)',
			'login_trigger_use_radius' => '',
			'login_trigger_border_radius_lock' => 'yes',
			'login_trigger_radius' => '',
			'login_trigger_radius_number' => '',
			'login_trigger_border_radius1' => 5,
			'login_trigger_border_radius2' => 5,
			'login_trigger_border_radius3' => 5,
			'login_trigger_border_radius4' => 5,
			'logout_link_font_face' => 'Arial',
			'logout_link_font_style' => '400 normal',
			'logout_link_weight' => '400',
			'logout_link_style' => 'normal',
			'logout_link_font_size' => 14,
			'logout_link_line_height' => 1,
			'logout_link_color' => 'rgb(0, 0, 0)',
			'logout_link_use_typography' => '',
			'logout_link_use_border' => '',
			'logout_link_border_width' => 1,
			'logout_link_border_type' => 'solid',
			'logout_link_border_color' => 'rgb(0, 0, 0)',
			'logout_link_use_radius' => '',
			'logout_link_border_radius_lock' => 'yes',
			'logout_link_radius' => '',
			'logout_link_radius_number' => '',
			'logout_link_border_radius1' => 5,
			'logout_link_border_radius2' => 5,
			'logout_link_border_radius3' => 5,
			'logout_link_border_radius4' => 5,
			'hover_field_labels_font_face' => 'Arial',
			'hover_field_labels_font_style' => '400 normal',
			'hover_field_labels_weight' => '400',
			'hover_field_labels_style' => 'normal',
			'hover_field_labels_font_size' => 14,
			'hover_field_labels_line_height' => 1,
			'hover_field_labels_color' => 'rgb(0, 0, 0)',
			'hover_field_labels_use_typography' => '',
			'hover_input_fields_font_face' => 'Arial',
			'hover_input_fields_font_style' => '400 normal',
			'hover_input_fields_weight' => '400',
			'hover_input_fields_style' => 'normal',
			'hover_input_fields_font_size' => 14,
			'hover_input_fields_line_height' => 1,
			'hover_input_fields_color' => 'rgb(0, 0, 0)',
			'hover_input_fields_use_typography' => '',
			'hover_input_fields_use_border' => '',
			'hover_input_fields_border_width' => 1,
			'hover_input_fields_border_type' => 'solid',
			'hover_input_fields_border_color' => 'rgb(0, 0, 0)',
			'hover_input_fields_use_radius' => '',
			'hover_input_fields_border_radius_lock' => 'yes',
			'hover_input_fields_radius' => '',
			'hover_input_fields_radius_number' => '',
			'hover_input_fields_border_radius1' => 5,
			'hover_input_fields_border_radius2' => 5,
			'hover_input_fields_border_radius3' => 5,
			'hover_input_fields_border_radius4' => 5,
			'hover_button_font_face' => 'Arial',
			'hover_button_font_style' => '400 normal',
			'hover_button_weight' => '400',
			'hover_button_style' => 'normal',
			'hover_button_font_size' => 14,
			'hover_button_line_height' => 1,
			'hover_button_color' => 'rgb(0, 0, 0)',
			'hover_button_use_typography' => '',
			'hover_button_use_border' => '',
			'hover_button_border_width' => 1,
			'hover_button_border_type' => 'solid',
			'hover_button_border_color' => 'rgb(0, 0, 0)',
			'hover_button_use_radius' => '',
			'hover_button_border_radius_lock' => 'yes',
			'hover_button_radius' => '',
			'hover_button_radius_number' => '',
			'hover_button_border_radius1' => 5,
			'hover_button_border_radius2' => 5,
			'hover_button_border_radius3' => 5,
			'hover_button_border_radius4' => 5,
			'hover_lost_password_text_font_face' => 'Arial',
			'hover_lost_password_text_font_style' => '400 normal',
			'hover_lost_password_text_weight' => '400',
			'hover_lost_password_text_style' => 'normal',
			'hover_lost_password_text_font_size' => 14,
			'hover_lost_password_text_line_height' => 1,
			'hover_lost_password_text_color' => 'rgb(0, 0, 0)',
			'hover_lost_password_text_use_typography' => '',
			'hover_login_trigger_font_face' => 'Arial',
			'hover_login_trigger_font_style' => '400 normal',
			'hover_login_trigger_weight' => '400',
			'hover_login_trigger_style' => 'normal',
			'hover_login_trigger_font_size' => 14,
			'hover_login_trigger_line_height' => 1,
			'hover_login_trigger_color' => 'rgb(0, 0, 0)',
			'hover_login_trigger_use_typography' => '',
			'hover_login_trigger_use_border' => '',
			'hover_login_trigger_border_width' => 1,
			'hover_login_trigger_border_type' => 'solid',
			'hover_login_trigger_border_color' => 'rgb(0, 0, 0)',
			'hover_login_trigger_use_radius' => '',
			'hover_login_trigger_border_radius_lock' => 'yes',
			'hover_login_trigger_radius' => '',
			'hover_login_trigger_radius_number' => '',
			'hover_login_trigger_border_radius1' => 5,
			'hover_login_trigger_border_radius2' => 5,
			'hover_login_trigger_border_radius3' => 5,
			'hover_login_trigger_border_radius4' => 5,
			'hover_logout_link_font_face' => 'Arial',
			'hover_logout_link_font_style' => '400 normal',
			'hover_logout_link_weight' => '400',
			'hover_logout_link_style' => 'normal',
			'hover_logout_link_font_size' => 14,
			'hover_logout_link_line_height' => 1,
			'hover_logout_link_color' => 'rgb(0, 0, 0)',
			'hover_logout_link_use_typography' => '',
			'hover_logout_link_use_border' => '',
			'hover_logout_link_border_width' => 1,
			'hover_logout_link_border_type' => 'solid',
			'hover_logout_link_border_color' => 'rgb(0, 0, 0)',
			'hover_logout_link_use_radius' => '',
			'hover_logout_link_border_radius_lock' => 'yes',
			'hover_logout_link_radius' => '',
			'hover_logout_link_radius_number' => '',
			'hover_logout_link_border_radius1' => 5,
			'hover_logout_link_border_radius2' => 5,
			'hover_logout_link_border_radius3' => 5,
			'hover_logout_link_border_radius4' => 5,
			'focus_field_labels_font_face' => 'Arial',
			'focus_field_labels_font_style' => '400 normal',
			'focus_field_labels_weight' => '400',
			'focus_field_labels_style' => 'normal',
			'focus_field_labels_font_size' => 14,
			'focus_field_labels_line_height' => 1,
			'focus_field_labels_color' => 'rgb(0, 0, 0)',
			'focus_field_labels_use_typography' => '',
			'focus_input_fields_font_face' => 'Arial',
			'focus_input_fields_font_style' => '400 normal',
			'focus_input_fields_weight' => '400',
			'focus_input_fields_style' => 'normal',
			'focus_input_fields_font_size' => 14,
			'focus_input_fields_line_height' => 1,
			'focus_input_fields_color' => 'rgb(0, 0, 0)',
			'focus_input_fields_use_typography' => '',
			'focus_input_fields_use_border' => '',
			'focus_input_fields_border_width' => 1,
			'focus_input_fields_border_type' => 'solid',
			'focus_input_fields_border_color' => 'rgb(0, 0, 0)',
			'focus_input_fields_use_radius' => '',
			'focus_input_fields_border_radius_lock' => 'yes',
			'focus_input_fields_radius' => '',
			'focus_input_fields_radius_number' => '',
			'focus_input_fields_border_radius1' => 5,
			'focus_input_fields_border_radius2' => 5,
			'focus_input_fields_border_radius3' => 5,
			'focus_input_fields_border_radius4' => 5,
			'focus_button_font_face' => 'Arial',
			'focus_button_font_style' => '400 normal',
			'focus_button_weight' => '400',
			'focus_button_style' => 'normal',
			'focus_button_font_size' => 14,
			'focus_button_line_height' => 1,
			'focus_button_color' => 'rgb(0, 0, 0)',
			'focus_button_use_typography' => '',
			'focus_button_use_border' => '',
			'focus_button_border_width' => 1,
			'focus_button_border_type' => 'solid',
			'focus_button_border_color' => 'rgb(0, 0, 0)',
			'focus_button_use_radius' => '',
			'focus_button_border_radius_lock' => 'yes',
			'focus_button_radius' => '',
			'focus_button_radius_number' => '',
			'focus_button_border_radius1' => 5,
			'focus_button_border_radius2' => 5,
			'focus_button_border_radius3' => 5,
			'focus_button_border_radius4' => 5,
			'focus_lost_password_text_font_face' => 'Arial',
			'focus_lost_password_text_font_style' => '400 normal',
			'focus_lost_password_text_weight' => '400',
			'focus_lost_password_text_style' => 'normal',
			'focus_lost_password_text_font_size' => 14,
			'focus_lost_password_text_line_height' => 1,
			'focus_lost_password_text_color' => 'rgb(0, 0, 0)',
			'focus_lost_password_text_use_typography' => '',
			'focus_login_trigger_font_face' => 'Arial',
			'focus_login_trigger_font_style' => '400 normal',
			'focus_login_trigger_weight' => '400',
			'focus_login_trigger_style' => 'normal',
			'focus_login_trigger_font_size' => 14,
			'focus_login_trigger_line_height' => 1,
			'focus_login_trigger_color' => 'rgb(0, 0, 0)',
			'focus_login_trigger_use_typography' => '',
			'focus_login_trigger_use_border' => '',
			'focus_login_trigger_border_width' => 1,
			'focus_login_trigger_border_type' => 'solid',
			'focus_login_trigger_border_color' => 'rgb(0, 0, 0)',
			'focus_login_trigger_use_radius' => '',
			'focus_login_trigger_border_radius_lock' => 'yes',
			'focus_login_trigger_radius' => '',
			'focus_login_trigger_radius_number' => '',
			'focus_login_trigger_border_radius1' => 5,
			'focus_login_trigger_border_radius2' => 5,
			'focus_login_trigger_border_radius3' => 5,
			'focus_login_trigger_border_radius4' => 5,
			'focus_logout_link_font_face' => 'Arial',
			'focus_logout_link_font_style' => '400 normal',
			'focus_logout_link_weight' => '400',
			'focus_logout_link_style' => 'normal',
			'focus_logout_link_font_size' => 14,
			'focus_logout_link_line_height' => 1,
			'focus_logout_link_color' => 'rgb(0, 0, 0)',
			'focus_logout_link_use_typography' => '',
			'focus_logout_link_use_border' => '',
			'focus_logout_link_border_width' => 1,
			'focus_logout_link_border_type' => 'solid',
			'focus_logout_link_border_color' => 'rgb(0, 0, 0)',
			'focus_logout_link_use_radius' => '',
			'focus_logout_link_border_radius_lock' => 'yes',
			'focus_logout_link_radius' => '',
			'focus_logout_link_radius_number' => '',
			'focus_logout_link_border_radius1' => 5,
			'focus_logout_link_border_radius2' => 5,
			'focus_logout_link_border_radius3' => 5,
			'focus_logout_link_border_radius4' => 5,
			'id' => 'default',
			'name' => self::$instance->get_l10n('default_preset')
		);
	}
}

Upfront_Login_Presets_Server::serve();
