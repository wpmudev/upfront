<?php

/**
 * Object implementation for Search entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UsearchView extends Upfront_Object {
	public function get_markup(){
		$data = $this->properties_to_array();
		$data['action'] = home_url('/');
		$data['iconClass'] = $data['label'] == '__image__' ? 'icon' : 'text';

		return upfront_get_template('usearch', $data, dirname(dirname(__FILE__)) . '/tpl/usearch.html');
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}

	public static function add_js_defaults($data){
		$data['usearch'] = array(
			'defaults' => self::default_properties(),
		 );
		return $data;
	}

	//Defaults for properties
	public static function default_properties(){
		return array(
			'type' => 'UsearchModel',
			'view_class' => 'UsearchView',
			'class' => 'c24 upfront-search',
			'has_settings' => 1,
			'id_slug' => 'usearch',

			'placeholder' => self::_get_l10n('placeholder'),
			'label' => self::_get_l10n('custom'),
			'is_rounded' => 0,
			'color' => ''
		);
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['search_element'])) return $strings;
		$strings['search_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Search', 'upfront'),
			'placeholder' => __('Search', 'upfront'),
			'custom' => __('Custom text', 'upfront'),
			'css' => array(
				'container_label' => __('Search container', 'upfront'),
				'container_info' => __('The container that wraps search field and search button', 'upfront'),
				'field_label' => __('Search field', 'upfront'),
				'field_info' => __('The search input field', 'upfront'),
				'button_label' => __('Search button', 'upfront'),
				'button_info' => __('The search button', 'upfront'),
			),
			'settings' => __('Search Settings', 'upfront'),
			'placeholder_label' => __('Placeholder text:', 'upfront'),
			'field' => __('Field', 'upfront'),
			'field_settings' => __('Field settings', 'upfront'),
			'btn_content' => __('Button content', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}
