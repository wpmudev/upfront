<?php

class Upfront_PlainTxtView extends Upfront_Object {

	public function get_markup () {

		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$content = $this->_get_property('content');

		$matches = array();
		$regex = '/<div class="plaintxt_padding([^>]*)>(.+?)<\/div>/s';
		preg_match($regex, $content, $matches);

		if(sizeof($matches) > 1)
			$content = $matches[2];

		$style = array();
		if($this->_get_property('background_color') && $this->_get_property('background_color')!='')
			$style[] = 'background-color: '.$this->_get_property('background_color');

		if($this->_get_property('border') && $this->_get_property('border')!='')
			$style[] = 'border: '.$this->_get_property('border');

		return "<div>".(sizeof($style)>0 ? "<div class='plaintxt_padding' style='".implode(';', $style)."'>": ''). $content .(sizeof($style)>0 ? "</div>": ''). '</div>';
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['text_element'])) return $strings;
		$strings['text_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Text', 'upfront'),
			'css' => array(
				'container_label' => __('Text container', 'upfront'),
				'container_info' => __('The layer that contains all the text of the element.', 'upfront'),
				'p_label' => __('Text paragragh', 'upfront'),
				'p_info' => __('The paragragh that contains all the text of the element.', 'upfront'),
			),
			'dbl_click' => __('Double click to edit text', 'upfront'),
			'appearance' => __('Textbox Appearance', 'upfront'),
			'border' => __('Border', 'upfront'),
			'none' => __('None', 'upfront'),
			'solid' => __('Solid', 'upfront'),
			'dashed' => __('Dashed', 'upfront'),
			'dotted' => __('Dotted', 'upfront'),
			'width' => __('Width', 'upfront'),
			'color' => __('Color', 'upfront'),
			'bg_color' => __('Background Color', 'upfront'),
			'edit_text' => __('Edit Text', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

	public static function export_content ($export, $object) {
		return upfront_get_property_value('content', $object);
	}
}