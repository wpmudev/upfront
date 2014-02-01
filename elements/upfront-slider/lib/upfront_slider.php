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
		$data['slides'] = $slides;
		$data['rotate'] = sizeof($data['rotate']);

		$data['dots'] = array_search($data['controls'], array('dots', 'both')) !== false;
		$data['arrows'] = array_search($data['controls'], array('arrows', 'both')) !== false;

		$data['slidesLength'] = sizeof($slides);

		$data['imageWidth'] = $data['style'] == 'right' ? floor($data['rightImageWidth'] / $data['rightWidth'] * 100) . '%': '';
		$data['textWidth'] = $data['style'] == 'right' ? floor(($data['rightWidth'] - $data['rightImageWidth']) / $data['rightWidth'] * 100) . '%' : '';

		$data['production'] = true;
		$data['startingSlide'] = 0;

		$markup = upfront_get_template('uslider', $data, dirname(dirname(__FILE__)) . '/tpls/uslider.html');
		
		return $markup;
	}

	public static function add_styles_scripts () {
		wp_enqueue_style( 'uslider_css', upfront_element_url('css/uslider.css', dirname(__FILE__)), array(), "0.1" );
		wp_enqueue_style( 'uslider_settings_css', upfront_element_url('css/uslider_settings.css', dirname(__FILE__)), array(), "0.1" );
		wp_enqueue_script('uslider-front', upfront_element_url('js/uslider-front.js', dirname(__FILE__)), array('jquery'));
	}
	
	public static function add_js_defaults($data){
		$data['uslider'] = array(
			'defaults' => self::default_properties(),
			'slideDefaults' => self::slide_defaults(),
			'template' => upfront_get_template_url('uslider', upfront_element_url('tpls/uslider.html', dirname(__FILE__)))
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
			"class" => "c22 upfront-uslider",
			'has_settings' => 1,

			'primaryStyle' => 'notext', // notext, below, over, side, onlytext

			'style' => 'bottomOver', // nocaption, below, above, right, bottomOver, topOver, bottomCover, middleCover, topCover

			'controls' => 'both', // both, arrows, dots, none
			'controlsWhen' => 'always', // always, hover

			'rotate' => array('true'),
			'rotateTime' => 5,

			'transition' => 'crossfade', // crossfade, slide-left, slide-right, slide-bottom, slide-top
			'slides' => array(), // Convert to Uslider_Slides to use, and to Object to store

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
			'text' => 'Slider description.',
			'margin' => array('left' => 0, 'top' => 0),
			'captionColor' => apply_filters('upfront_slider_caption_color', '#ffffff'),
			'captionBackground' => apply_filters('upfront_slider_caption_background', '#000000')
		);
	}
}