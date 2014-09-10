<?php

class Upfront_ButtonView extends Upfront_Object {

	public function get_markup () {
		$data = array();
		$data['id'] = $this->_get_property('element_id');
		$presets = json_decode(get_option('upfront_' . get_stylesheet() . '_button_presets'), true);
		$preset = false;
		$markup = "";
		foreach($presets as $item) {
			if($item['id'] == $this->_get_property('currentpreset')) {
				$preset = $item;	
				break;
			}
		}
	
		$data['content'] = $this->_get_property('content');
		
		$data['style_static'] = "border: ".$preset['borderwidth']."px ".$preset['bordertype']." ".$preset['bordercolor']."; "."border-radius: ".$preset['borderradius1']."px ".$preset['borderradius2']."px ".$preset['borderradius4']."px ".$preset['borderradius3']."px; "."background-color: ".$preset['bgcolor']."; "."font-size: ".$preset['fontsize']."px; "."font-family: ".$preset['fontface']."; "."color: ".$preset['color']."; ";
		
		$data['style_hover'] = "border: ".$preset['hov_borderwidth']."px ".$preset['hov_bordertype']." ".$preset['hov_bordercolor']."; "."border-radius: ".$preset['hov_borderradius1']."px ".$preset['hov_borderradius2']."px ".$preset['hov_borderradius4']."px ".$preset['hov_borderradius3']."px; "."background-color: ".$preset['hov_bgcolor']."; "."font-size: ".$preset['hov_fontsize']."px; "."font-family: ".$preset['hov_fontface']."; "."color: ".$preset['hov_color']."; ";
		
		
		$markup = upfront_get_template('ubutton', $data, dirname(dirname(__FILE__)) . '/tpl/ubutton.php.html');
		return $markup;
		
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
			'dbl_click' => __('Click here', 'upfront'),
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

	public static  function add_styles_scripts() {
		wp_enqueue_style('ubutton', upfront_element_url('css/upfront-button.css', dirname(__FILE__)));
		if (is_user_logged_in()) {
			wp_enqueue_style('ubutton_editor', upfront_element_url('css/upfront-button-editor.css', dirname(__FILE__)));
		}

	}

	public static function export_content ($export, $object) {
		return upfront_get_property_value('content', $object);
	}
}