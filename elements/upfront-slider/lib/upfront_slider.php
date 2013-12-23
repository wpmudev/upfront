<?php

/**
 * Object implementation for Search entity.
 * A fairly simple implementation, with applied settings.
 */
class Upfront_UsliderView extends Upfront_Object {

	function Upfront_UsliderView() {
		$this->__construct();
	}
	
	function __construct() {
		
	}
	
	public function get_markup () {
		$data = $this->properties_to_array();
		$slides = array();
		foreach($data['slides'] as $slide){
			$slides[] = array_merge(self::slide_defaults(), $slide);
		}
		$data['slides'] = $slides;

		$data['slidesLength'] = sizeof($slides);

		$markup = upfront_get_template('uslider', $data, dirname(dirname(__FILE__)) . '/tpls/uslider.html');
		
		return $markup;
	}

	public static function add_styles_scripts () {		
		wp_enqueue_style( 'uslider_css', upfront_element_url('css/uslider.css', dirname(__FILE__)), array(), "0.1" );
		wp_enqueue_style( 'uslider_settings_css', upfront_element_url('css/uslider_settings.css', dirname(__FILE__)), array(), "0.1" );
	}

	public static function add_admin_templates(){
		include dirname(dirname(__FILE__)) . '/tpls/backend.php';
	}

	public static function add_js_defaults($data){
		$data['uslider'] = array(
			'defaults' => self::default_properties(),
			'slideDefatults' => self::slide_defaults(),
			'template' => upfront_get_template_url('uslider', upfront_element_url('tpls/uslider.html', dirname(__FILE__)))
		);
		return $data;
	}

	public static function default_properties(){
		return array(
			'id_slug' => 'uslider',
			'type' => "USliderModel",
			'view_class' => "USliderView",
			"class" => "c22 upfront-uslider",
			'has_settings' => 1,

			'style' => 'below', // notext, below, right, overBottom, overTop, coverBottom, coverMiddle, coverTop

			'controls' => 'both', // both, arrows, dots, none
			'controlsWhen' => 'always', // always, hover

			'behaviour' => array(
				'autoStart' => true,
				'hover' => true,
				'interval' => 5,
				'speed' => 1
			),
			'transition' => 'crossfade', // crossfade, toleft, toright, tobottom, totop
			'slides' => array(), // Convert to Uslider_Slides to use, and to Object to store
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
			'text' => 'Slide description',
			'margin' => array('left' => 0, 'top' => 0)			
		);
	}
}