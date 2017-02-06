<?php

class Upfront_ButtonView extends Upfront_Object {

	public static function default_properties(){
		return array(
			"content" => "Click here",
			"href" => "",
			"linkTarget" => "",
			"align" => "center",
			"type" => "ButtonModel",
			"view_class" => "ButtonView",
			"class" => "c24 upfront-button",
			"has_settings" => 1,
			"id_slug" => "ubutton",
			"preset" => "default"
		);
	}

	function __construct($data) {
			$data['properties'] = $this->merge_default_properties($data);
			parent::__construct($data);
	}

	protected function merge_default_properties($data){
			$flat = array();
			if(!isset($data['properties']))
					return $flat;

			foreach($data['properties'] as $prop) {
				// Button throws some funny notice about missing value...
				if (isset($prop['value']) === false) continue;
				$flat[$prop['name']] = $prop['value'];
			}

			$flat = array_merge(self::default_properties(), $flat);

			$properties = array();
			foreach($flat as $name => $value)
					$properties[] = array('name' => $name, 'value' => $value);

			return $properties;
	}

	public function clear_preset($preset) {
		$preset = str_replace(' ', '-', $preset);
		return preg_replace('/[^A-Za-z0-9\-]/', '', $preset);
	}

	public function get_markup () {
		// This data is passed on to the template to precompile template
		$data = $this->properties_to_array();
		if (isset($data['link'])) {
			$data['href'] = $data['link']['url'];
			$data['linkTarget'] = $data['link']['target'];
		}
		if(isset($data['currentpreset']) && empty($data['preset'])) {
			$data['preset'] = $data['currentpreset'];
		}
		$data['preset'] = isset($data['preset']) ? $this->clear_preset($data['preset']) : 'default';

		$markup = upfront_get_template('ubutton', $data, dirname(dirname(__FILE__)) . '/tpl/ubutton.html');

		upfront_add_element_script('ubutton_script', array('js/ubutton-front.js', dirname(__FILE__)));
		return $markup;
	}

	public static function add_js_defaults($data){
		$data['ubutton'] = array(
			'defaults' => self::default_properties(),
			'template' => upfront_get_template_url('ubutton', upfront_element_url('tpl/ubutton.html', dirname(__FILE__)))
		);
		return $data;
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
				$out[$prop['name']] = $prop['value'];
		return $out;
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['button_element'])) return $strings;
		$strings['button_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Button', 'upfront'),
			'css' => array(
				'container_label' => __('Text container', 'upfront'),
				'container_info' => __('The layer that contains all the text of the element.', 'upfront'),
				'p_label' => __('Text paragragh', 'upfront'),
				'p_info' => __('The paragragh that contains all the text of the element.', 'upfront'),
			),
			'edit_link' => __('Link button', 'upfront'),
			'visit_link' => __('Visit link', 'upfront'),
			'dbl_click' => __('Click here', 'upfront'),
			'appearance' => __('Textbox Appearance', 'upfront'),
			'settings' => array(
				'label' => __('Settings', 'upfront'),
				'colors_label' => __('Colors', 'upfront'),
				'typography_label' => __('Typography', 'upfront'),
				'button_bg_label' => __('Button Background', 'upfront'),
			)
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

	public static  function add_styles_scripts() {
		upfront_add_element_style('ubutton', array('css/upfront-button.css', dirname(__FILE__)));
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_element_style('ubutton_editor', array('css/upfront-button-editor.css', dirname(__FILE__)));
		}

	}

}
