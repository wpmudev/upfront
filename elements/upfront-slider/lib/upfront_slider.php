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
		
		return '<div class="XXX">This is it!</div>';
		
		//console.log('in function get_markup');
		
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$label = $this->_get_property("label");
		$label = !empty($label) && '__image__' != $label
			? $label
			: '<i class="icon-search"></i>'
		;

		$placeholder = $this->_get_property("placeholder");
		$placeholder = $placeholder ? "placeholder='{$placeholder}'" : '';

		$rounded = $this->_get_property("is_rounded") ? 'rounded' : '';

		$color = $this->_get_property("color");
		$color = $color ? "style='background-color:{$color};'" : '';

		return "<div class='upfront-output-object upfront-output-search {$rounded}' {$color} {$element_id}>" .
			"<form action='' method='GET'>" .
			"<input type='search' name='s' value='' {$placeholder} /><button>{$label}</button>" .
			'</form>' .
		"</div>";
	}

	public static function add_styles_scripts () {
		wp_enqueue_script('jquery-ui-sortable');	
		wp_enqueue_script('jquery-ui-droppable');	
		wp_enqueue_script('jquery-ui-dialog');	

		// New in WP 3.5.x
		if (function_exists('wp_enqueue_media'))
			wp_enqueue_media();
		
		wp_enqueue_style( 'uslider_css', upfront_element_url('css/uslider.css', dirname(__FILE__)), array(), "0.1" );
		wp_enqueue_style( 'uslider_settings_css', upfront_element_url('css/uslider_settings.css', dirname(__FILE__)), array(), "0.1" );

		// Loads out slider simple framework. http://jquery.malsup.com/cycle/
		wp_enqueue_script( 'jquery.cycle', upfront_element_url('js/jquery.cycle.all.js', dirname(__FILE__)));
		
		// Load translated strings for plugin. 
		require_once (dirname(__FILE__) . '/upfront_slider_i18n.php');
		wp_enqueue_script('uslider_configurations_js', upfront_element_url('js/uslider_configurations.js', dirname(__FILE__)), array('jquery'), "0.1");
		wp_localize_script('uslider_configurations_js', 'uslider_i18n', $uslider_i18n);	

	}

	public static function add_admin_templates(){
		include dirname(dirname(__FILE__)) . '/tpls/backend.php';
	}

	public static function add_js_defaults($data){
		$data['uslider'] = array(
			'defaults' => self::default_properties(),
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

			'style' => 'right', // right, group, tabbed, text
			'slide_text' => 'no', // no, yes
			'text_layout' => 'right', // right, tabbed => [right, left, bottom, split, over], group => [block, individual], text => [text]
			'behaviour' => array(
				'autoStart' => true,
				'hover' => true,
				'interval' => 5,
				'speed' => 1
			),
			'slide_transition' => 'scrollLeft', // scrollLeft, scrollRight, scrollDown, scrollUp, shuffle, fade
			'controls_type' => 'arrows-simple', // arrows-simple, dots, thumbnails, arrows-stacked, none
			'controls_position' => 'inside', // a-simple => [ins+, outs+], dots => [b-out, b-in, top-out, ...], thumbnails => [b+,l+,r+,t+], t-stacked => [left-top, left-bottom, top-left, ...]
			'slides' => array(), // Convert to Uslider_Slides to use, and to Object to store
		);
	}
}