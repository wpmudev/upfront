<?php

/**
 * Front-end rendering class.
 */
class Upfront_PostsView extends Upfront_Object {

	public function get_markup () {
		/*
		$data = wp_parse_args(
			$this->_properties_to_array(),
			Upfront_Posts::get_defaults()
		);
		*/
		$data = $this->_properties_to_array();
		if (empty($data)) $data = Upfront_Posts_PostsData::get_defaults();

		if (empty($data['display_type'])) return ''; // Force no render for unselected display type.

		return Upfront_Posts_PostsView::get_markup($data);
	}

	private function _properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop) {
			$out[$prop['name']] = $prop['value'];
		}
		return $out;
	}
}