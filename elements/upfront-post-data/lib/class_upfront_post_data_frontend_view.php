<?php

/**
 * Front-end rendering class.
 */
class Upfront_PostDataView extends Upfront_Object_Group {

	protected $post_markups = array();
	
	public function get_post_markup () {
		if ( !empty($this->post_markups) ) return $this->post_markups;
		
		$data = $this->_properties_to_array();
		if (empty($data)) $data = Upfront_Post_Data_Data::get_defaults();
		$data['objects'] = $this->_data['objects'];
		
		$this->post_markups = Upfront_Post_Data_View::get_post_markup($data);
		return $this->post_markups;
	}
	
	public function get_css_class () {
		$classes = parent::get_css_class();
		
		$data = $this->_properties_to_array();
		if (empty($data)) $data = Upfront_Post_Data_Data::get_defaults();
		$post = Upfront_Post_Data_Model::get_post($data);
		
		$classes .= is_sticky( $post->ID ) ? " uf-post-data uf-post-data-sticky" : " uf-post-data";
		if (!empty($post->ID) && !has_post_thumbnail($post->ID)) {
			$classes .= " noFeature";
		}
		return $classes;
	}
	
	public function instantiate_child ($child_data, $idx) {
		return new Upfront_PostDataPartView($child_data, $this->_data, $this);
	}

	private function _properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop) {
			$out[$prop['name']] = $prop['value'];
		}
		return $out;
	}

	public static function default_properties () {
		return Upfront_Post_Data_Data::get_defaults();
	}
}


class Upfront_PostDataPartView extends Upfront_Object {
	
	public function __construct ($data, $parent_data = '', $parent_obj = false) {
		parent::__construct($data, $parent_data);
		if ( $parent_obj !== false )
			$this->parent = $parent_obj;
	}

	public function get_markup () {
		$post_markups = $this->parent->get_post_markup();
		$type = $this->_get_property('part_type');
		return isset($post_markups[$type]) ? $post_markups[$type] : '';
	}
	
}
