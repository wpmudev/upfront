<?php

/**
 * Front-end rendering class.
 */
class Upfront_PostsView extends Upfront_Object {

	public function get_markup () {
		$data = $this->_properties_to_array();
		if (empty($data)) $data = Upfront_Posts_PostsData::get_defaults();

		if (empty($data['display_type'])) return ''; // Force no render for unselected display type.

		$markup = apply_filters('upfront-posts-get_markup-before', false);
		if (!empty($markup)) return $markup;

		return Upfront_Posts_PostsView::get_markup($data);
	}

	private function _properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop) {
			$out[$prop['name']] = $prop['value'];
		}
		return $out;
	}

	public static function default_properties () {
		return Upfront_Posts_PostsData::get_defaults();
	}
}
