<?php

class Upfront_ButtonView extends Upfront_Object {

	public function get_markup () {
		$data = array();

		$link = $this->_get_property('link');
		if ($link === false) {
			$link = array(
				'url' => $this->_get_property('href'),
				'target' => $this->_get_property('linkTarget')
			);
		}
		$data['id'] = $this->_get_property('element_id');
		$button_presets = Upfront_Cache_Utils::get_option('upfront_' . get_stylesheet() . '_button_presets');
		$button_presets = apply_filters(
			'upfront_get_button_presets',
			$button_presets,
			array(
				'json' => true
			)
		);
		$presets = json_decode($button_presets, true);
		$preset = false;
		$markup = "";
		if(is_array($presets)) {
			foreach($presets as $item) {
				if($item['id'] == $this->_get_property('currentpreset')) {
					$preset = $item;
					break;
				}
			}
		}

		$ufc = Upfront_UFC::init();


		$data['content'] = $this->_get_property('content');

		if($data['content'] == '') {
			$default_properties = $this->default_properties();
			$data['content'] = $default_properties['content'];
		}

		$data['href'] = $link['url'];
		$data['align'] = $this->_get_property('align');
		$data['style_static'] = "border: ".$preset['borderwidth']."px ".$preset['bordertype']." ".$ufc->process_colors($preset['bordercolor'])."; "."border-radius: ".$preset['borderradius1']."px ".$preset['borderradius2']."px ".$preset['borderradius4']."px ".$preset['borderradius3']."px; "."background-color: ".$ufc->process_colors($preset['bgcolor'])."; "."font-size: ".$preset['fontsize']."px; "."font-family: ".$preset['fontface']."; "."color: ".$ufc->process_colors($preset['color'])."; "."transition: all ".$preset['hov_duration']."s ".$preset['hov_transition']."; ";


		$data['style_hover']  =  '';
			if(isset($preset['hov_borderwidth']))
				$data['style_hover'] = $data['style_hover'].'border-width: '.$preset['hov_borderwidth'].'px; ';
			if(isset($preset['hov_bordertype']))
				$data['style_hover'] = $data['style_hover'].'border-style: '.$preset['hov_bordertype'].'; ';
			if(isset($preset['hov_bordercolor']))
				$data['style_hover'] = $data['style_hover'].'border-color: '.$ufc->process_colors($preset['hov_bordercolor']).'; ';
			if(isset($preset['hov_borderradius1']))
				$data['style_hover'] = $data['style_hover'].'border-top-left-radius: '.$preset['hov_borderradius1'].'px; ';
			if(isset($preset['hov_borderradius2']))
				$data['style_hover'] = $data['style_hover'].'border-top-right-radius: '.$preset['hov_borderradius2'].'px; ';
			if(isset($preset['hov_borderradius3']))
				$data['style_hover'] = $data['style_hover'].'border-bottom-right-radius: '.$preset['hov_borderradius3'].'px; ';
			if(isset($preset['hov_borderradius4']))
				$data['style_hover'] = $data['style_hover'].'border-bottom-left-radius: '.$preset['hov_borderradius4'].'px; ';
			if(isset($preset['hov_bgcolor']))
				$data['style_hover'] = $data['style_hover'].'background-color: '.$ufc->process_colors($preset['hov_bgcolor']).'; ';
			if(isset($preset['hov_fontsize']))
				$data['style_hover'] = $data['style_hover'].'font-size: '.$preset['hov_fontsize'].'px; ';
			if(isset($preset['hov_fontface']))
				$data['style_hover'] = $data['style_hover'].'font-family: '.$preset['hov_fontsize'].'; ';
			if(isset($preset['hov_color']))
				$data['style_hover'] = $data['style_hover'].'color: '.$ufc->process_colors($preset['hov_color']).'; ';

			$data['linkTarget'] = $link['target'];
		/*
		$data['style_hover'] = "border: ".$preset['hov_borderwidth']."px ".$preset['hov_bordertype']." ".$preset['hov_bordercolor']."; "."border-radius: ".$preset['hov_borderradius1']."px ".$preset['hov_borderradius2']."px ".$preset['hov_borderradius4']."px ".$preset['hov_borderradius3']."px; "."background-color: ".$preset['hov_bgcolor']."; "."font-size: ".$preset['hov_fontsize']."px; "."font-family: ".$preset['hov_fontface']."; "."color: ".$preset['hov_color']."; ";
		*/

		$markup = upfront_get_template('ubutton', $data, dirname(dirname(__FILE__)) . '/tpl/ubutton.php.html');
		return $markup;
	}

	//Defaults for properties
	public static function default_properties(){
		return array(
			"content" => "Click here",
			"href" => "",
			"align" => "center",
			"type" => "ButtonModel",
			"view_class" => "ButtonView",
			"element_id" => "button-object-1410952320306-1435",
			"class" => "c24 upfront-button",
			"has_settings" => 1,
			"id_slug" => "button",

			"link" => false
		);
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
		//wp_enqueue_style('ubutton', upfront_element_url('css/upfront-button.css', dirname(__FILE__)));
		upfront_add_element_style('ubutton', array('css/upfront-button.css', dirname(__FILE__)));
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			//wp_enqueue_style('ubutton_editor', upfront_element_url('css/upfront-button-editor.css', dirname(__FILE__)));
			upfront_add_element_style('ubutton_editor', array('css/upfront-button-editor.css', dirname(__FILE__)));
		}

	}

}
