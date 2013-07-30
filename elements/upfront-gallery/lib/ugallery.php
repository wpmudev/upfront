<?php

/*
	Replace the indentifiers with yours

	class: Upfront_UgalleryView
	domaing: ugallery
*/

class Upfront_UgalleryView extends Upfront_Object {
	public function get_markup () {
		$data = $this->properties_to_array();
		$data['imagesLength'] = sizeof($data['images']);
		$data['editing'] = false;
		return $this->get_template_content($data);
	}

	private function get_template_content($data){
		extract($data);
		ob_start();
		include dirname(dirname(__FILE__)) . '/tpl/ugallery.html';
		$output = ob_get_contents();
		ob_end_clean();
		return $output;
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}

	public static function add_styles_scripts () {
		wp_enqueue_style('ugallery-style', upfront_element_url('css/ugallery.css', dirname(__FILE__)));
	}
}