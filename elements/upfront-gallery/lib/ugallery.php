<?php

/*
	Replace the indentifiers with yours

	class: Upfront_UgalleryView
	domaing: ugallery
*/

class Upfront_UgalleryView extends Upfront_Object {
	var $defaults = array(
		'type' => 'UgalleryModel',
		'view_class' => 'UgalleryView',
		'has_settings' => 1,
		'class' => 'c34 upfront-gallery',

		'status' => 'starting',
		'images' => array(), // Convert to new UgalleryImages() for using
		'elementSize' => array( 'width' => 0, 'height' => 0),
		'labelFilters' => array(), //Since checkboxes fields return an array
		'urlIcon' => array(), 
		'disableLightbox' => array(), 
		'thumbProportions' => '1', // 'theme' | '1' | '0.66' | '1.33'
		'thumbWidth' => 140,
		'thumbHeight' => 140,
		'showTitle' => array(), 
		'showDescription' =>array(), 
		'lbTitle' => array(true), //This is a checked checkbox
		'lbDescription' => array(true),
		'lbLoop' => array(),
		'lockThumbProportions' => true
	);

	public function get_markup () {
		//Lightbox
		wp_enqueue_style('magnific');
		wp_enqueue_script('magnific');

		//Front script
		upfront_add_element_script('ugallery', array('js/ugallery-front.js', dirname(__FILE__)));

		$data = $this->properties_to_array();
		$data['imagesLength'] = sizeof($data['images']);
		$data['editing'] = false;

		$markup = upfront_get_template('ugallery', $data, dirname(dirname(__FILE__)) . '/tpl/ugallery.html');

		if(! $data['disableLightbox']){
			$magnific_options = array(
				'type' => 'image',
				'delegate' => 'a',
				'gallery' => array(
					'enabled' => 'true'
				)
			);
			$markup .= '
				<script type="text/javascript">
					if(typeof ugallery == "undefined")
						ugalleries = [];
					ugalleries["' . $data['element_id'] . '"] = ' . json_encode($magnific_options) . ';
				</script>
			';
		}
		else {
			$markup .= '<!-- No lightbox -->';
		}

		return $markup;
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
		foreach($this->_data['properties'] as $prop){
			$out[$prop['name']] = $prop['value'];
			if(is_array($prop['value']) && $prop['name'] != 'images')
				$out[$prop['name']]['length'] = sizeof($prop['value']);
		}
		return $out;
	}

	public function add_js_defaults($data){
		$post_types = get_post_types(array('public' => true), 'objects');
		$data['ugallery'] = array(
			'defaults' => $this->defaults,
			'template' => upfront_get_template_url('ugallery', upfront_element_url('tpl/ugallery.html', dirname(__FILE__))),
			'postTypes' => $post_types
		);
		return $data;
	}

	public static function add_styles_scripts () {
		wp_enqueue_style('ugallery-style', upfront_element_url('css/ugallery.css', dirname(__FILE__)));
	}
}