<?php
class Upfront_ObjectViewTarget extends Upfront_Object{

	public function get_markup(){
		global $upfront_map_visitor_models;
		if(!isset($upfront_map_visitor_models)){
			$upfront_map_visitor_models = array();
		};

		$name = str_replace('Upfront_', '', get_class($this));
		$element_id = $this->_get_property('element_id') ?  $this->_get_property('element_id') : '';

		$upfront_map_visitor_models[$name][] = array(
			'elementId' => $element_id, 
			'model' => $this->_data['subviewModel'] ? $this->_data['subviewModel'] : array()
		);
		
		wp_enqueue_script(
			'requirejs',
			plugins_url('/upfront-map/js/require.js')
		);
		wp_localize_script( 'requirejs', 'upfrontMap', array('pluginPath'=>ufmap_get_js_url() ) ); 	
		// <<< test this on visitor side

		wp_enqueue_script(
			'visitor-init',
			plugins_url('/upfront-map/js/visitor-init.js'),
			array('jquery', 'backbone', 'underscore')
		);

		wp_enqueue_style(
			'visitor-css',
			plugins_url('/upfront-map/css/visitor.css')
		);

		wp_localize_script( 'visitor-init', 'mapModels', $upfront_map_visitor_models );

		return '<div id="vt-'.$element_id.'"></div>';
	}

}

class Upfront_mapDesc extends Upfront_ObjectViewTarget {
	public function get_markup(){
		//$this->_data['<<<find_correct_key_or_function'] = array('html'=>array('append'=>do_shortcode('[map]')));
		return parent::get_markup();
	}
}
class Upfront_map extends Upfront_ObjectViewTarget {}
?>