<?php

/**
 * Object implementation for Search entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UsliderView extends Upfront_Object {

	public function get_markup () {
		$data = $this->properties_to_array();
		$slides = array();
		foreach($data['slides'] as $slide){
			$slides[] = array_merge(self::slide_defaults(), $slide);
		}

		if (isset($data['usingNewAppearance']) === false) {
			$data['usingNewAppearance'] = false;
		}

		if (!isset($data['preset'])) {
			$data['preset'] = 'default';
		}
		$data['properties'] = Upfront_Slider_Presets_Server::get_instance()->get_preset_properties($data['preset']);

		$data['slides'] = $slides;
		$data['rotate'] = $data['rotate'] ? true : false;

		$data['dots'] = array_search($data['controls'], array('dots', 'both')) !== false;
		$data['arrows'] = array_search($data['controls'], array('arrows', 'both')) !== false;

		$data['slidesLength'] = sizeof($slides);

		$side_style = $data['properties']['primaryStyle'] === 'side';

		$data['imageWidth'] = $side_style ? floor($data['rightImageWidth'] / $data['rightWidth'] * 100) . '%': '100%';
		$data['textWidth'] =  $side_style ? floor(($data['rightWidth'] - $data['rightImageWidth']) / $data['rightWidth'] * 100) . '%' : '100%';

		$data['imageHeight'] = sizeof($slides) ? $slides[0]['cropSize']['height'] : 0;

		$data['production'] = true;
		$data['startingSlide'] = 0;

		// Overwrite properties with preset properties
		if (isset($data['properties']['primaryStyle'])) {
			$data['primaryStyle'] = $data['properties']['primaryStyle'];
		}
		if (isset($data['properties']['captionBackground'])) {
			$data['captionBackground'] = $data['properties']['captionBackground'];
		}


		$markup = upfront_get_template('uslider', $data, dirname(dirname(__FILE__)) . '/tpl/uslider.html');

		return $markup;
	}

	public static function add_styles_scripts () {
		upfront_add_element_style('uslider_css', array('css/uslider.css', dirname(__FILE__)));
		upfront_add_element_style('uslider_settings_css', array('css/uslider_settings.css', dirname(__FILE__)));
		//wp_enqueue_style( 'uslider_css', upfront_element_url('css/uslider.css', dirname(__FILE__)), array(), "0.1" );
		//wp_enqueue_style( 'uslider_settings_css', upfront_element_url('css/uslider_settings.css', dirname(__FILE__)), array(), "0.1" );

		//wp_enqueue_script('uslider-front', upfront_element_url('js/uslider-front.js', dirname(__FILE__)), array('jquery'));
		upfront_add_element_script('uslider-front', array('js/uslider-front.js', dirname(__FILE__)));
	}

	public static function add_js_defaults($data){
		$data['uslider'] = array(
			'defaults' => self::default_properties(),
			'slideDefaults' => self::slide_defaults(),
			'template' => upfront_get_template_url('uslider', upfront_element_url('tpl/uslider.html', dirname(__FILE__)))
		);
		return $data;
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop){
			$out[$prop['name']] = $prop['value'];
		}
		return $out;
	}

	public static function default_properties(){
		return array(
			'id_slug' => 'uslider',
			'type' => "USliderModel",
			'view_class' => "USliderView",
			"class" => "c24 upfront-uslider",
			'has_settings' => 1,
			'preset' => 'default',

			'primaryStyle' => 'notext', // notext, below, over, side, onlytext

			/* TO BE DEPRECATED, it is moved inside the slide */
			'style' => 'bottomOver', // nocaption, below, above, right, bottomOver, topOver, bottomCover, middleCover, topCover

			'controls' => 'both', // both, arrows, dots, none
			'controlsWhen' => 'always', // always, hover

			'rotate' => array('true'),
			'rotateTime' => 5,

			'transition' => 'crossfade', // crossfade, slide-left, slide-right, slide-bottom, slide-top
			'slides' => array(), // Convert to Uslider_Slides to use, and to Object to store

			'captionUseBackground' => '0',
			'captionBackground' => apply_filters('upfront_slider_caption_background', 'transparent'),

			/* TO BE DEPRECATED, it is moved inside the slide */
			'rightImageWidth' => 3,
			'rightWidth' => 6,
		);
	}


	public static function slide_defaults(){
		return array(
			'id' => 0,
			'src' => 'http//imgsrc.hubblesite.org/hu/db/images/hs-2013-12-a-small_web.jpg',
			'srcFull' => 'http//imgsrc.hubblesite.org/hu/db/images/hs-2013-12-a-small_web.jpg',
			'sizes' => array(),
			'size' => array('width' => 0, 'height' => 0),
			'cropSize' => array('width' => 0, 'height' => 0),
			'cropOffset' => array('top' => 0, 'left' => 0),
			'rotation' => 0,
			'url' => '',
			'urlType' => '',
			'text' => '',
			'margin' => array('left' => 0, 'top' => 0),
			'captionColor' => apply_filters('upfront_slider_caption_color', '#ffffff'),
			'captionBackground' => apply_filters('upfront_slider_caption_background', '#000000'),


			'style' => 'bottomOver', // nocaption, below, above, right, bottomOver, topOver, bottomCover, middleCover, topCover
			'rightImageWidth' => 3,
			'rightWidth' => 6
		);
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['slider_element'])) return $strings;
		$strings['slider_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Slider', 'upfront'),
			'css' => array(
				'images_label' => __('Images', 'upfront'),
				'images_info' => __('Slider\'s images', 'upfront'),
				'captions_label' => __('Captions', 'upfront'),
				'captions_info' => __('Slides\' captions', 'upfront'),
				'caption_label' => __('Caption panel', 'upfront'),
				'caption_info' => __('Caption layer', 'upfront'),
				'img_containers_label' => __('Image containers', 'upfront'),
				'img_containers_info' => __('The image wrapper layer', 'upfront'),
				'dots_wrapper_label' => __('Navigation dots wrapper', 'upfront'),
				'dots_wrapper_info' => __('Container of the navigation dots', 'upfront'),
				'dots_label' => __('Navigation dots', 'upfront'),
				'dots_info' => __('Navigation item\'s markers', 'upfront'),
				'dot_current_label' => __('Current navigation dot', 'upfront'),
				'dot_current_info' => __('The dot representing the current slide', 'upfront'),
				'prev_label' => __('Navigation previous', 'upfront'),
				'prev_info' => __('Navigation\'s previous button', 'upfront'),
				'next_label' => __('Navigation next', 'upfront'),
				'next_info' => __('Navigation\'s next button', 'upfront'),
			),
			'settings' => __('Slider Settings', 'upfront'),
			'general' => __('General Settings', 'upfront'),
			'above_img' => __('Above the image', 'upfront'),
			'below_img' => __('Below the image', 'upfront'),
			'slider_behaviour' => __('Slider Behaviour', 'upfront'),
			'image_caption_position' => __('Image &amp; Caption Position:', 'upfront'),
			'slider_transition' => __('Slider Transition:', 'upfront'),
			'no_text' => __('No text', 'upfront'),
			'over_top' => __('Over image, top', 'upfront'),
			'over_bottom' => __('Over image, bottom', 'upfront'),
			'cover_top' => __('Covers image, top', 'upfront'),
			'cover_mid' => __('Covers image, middle', 'upfront'),
			'cover_bottom' => __('Covers image, bottom', 'upfront'),
			'at_right' => __('At the right', 'upfront'),
			'at_left' => __('At the left', 'upfront'),
			'cap_position' => __('Caption position', 'upfront'),
			'edit_img' => __('Edit image', 'upfront'),
			'remove_slide' => __('Remove slide', 'upfront'),
			'img_link' => __('Image link', 'upfront'),
			'preparing_img' => __('Preparing images', 'upfront'),
			'preparing_slides' => __('Preparing slides', 'upfront'),
			'slider_styles' => __('Slider styles', 'upfront'),
			'notxt' => __('no txt', 'upfront'),
			'txtb' => __('txt below', 'upfront'),
			'txto' => __('txt over', 'upfront'),
			'txts' => __('txt on side', 'upfront'),
			'caption_bg' => __('Caption Background', 'upfront'),
			'none' => __('None', 'upfront'),
			'pick_color' => __('Pick color', 'upfront'),
			'rotate_every' => __('Auto-rotate every ', 'upfront'),
			'slide_down' => __('Slide Down', 'upfront'),
			'slide_up' => __('Slide Up', 'upfront'),
			'slide_right' => __('Slide Right', 'upfront'),
			'slide_left' => __('Slide Left', 'upfront'),
			'crossfade' => __('Crossfade', 'upfront'),
			'slider_controls' => __('Slider Controls', 'upfront'),
			'slider_controls_style' => __('Slider Controls Style', 'upfront'),
			'on_hover' => __('Show on hover', 'upfront'),
			'always' => __('Always show', 'upfront'),
			'dots' => __('Dots', 'upfront'),
			'arrows' => __('Arrows', 'upfront'),
			'both' => __('Both', 'upfront'),
			'ok' => __('Ok', 'upfront'),
			'slides_order' => __('Slides order', 'upfront'),
			'slides' => __('Slides', 'upfront'),
			'add_slide' => __('Add Slide', 'upfront'),
			'choose_type' => __('Please choose the type of slider', 'upfront'),
			'can_change' => __('This can later be changed via the settings panel', 'upfront'),
			'img_only' => __('img only', 'upfront'),
			'txt_over_img' => __('txt over img', 'upfront'),
			'txt_below_img' => __('txt below img', 'upfront'),
			'txt_on_side' => __('txt on the side', 'upfront'),
			'txt_only' => __('txt / widget only', 'upfront'),
			'choose_img' => __('Choose Images', 'upfront'),
			'slide_desc' => __('Slide description', 'upfront'),
			'delete_slide_confirm' => __('Are you sure to delete this slide?', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}
