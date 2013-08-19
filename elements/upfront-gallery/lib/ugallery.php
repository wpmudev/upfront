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
		'labelFilters' => 0,
		'urlIcon' => 0,
		'disableLightbox' => 0,
		'thumbProportions' => '1_1', // 'theme' | '1_1' | '2_3' | '4_3' | 'free'
		'thumbWidth' => 140,
		'thumbHeight' => 140,
		'showTitle' => 0,
		'showDescription' => 0,
		'lbTitle' => 1,
		'lbDescription' => 1,
		'lbLoop' => 0

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
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}

	public function add_js_defaults($data){
		$data['ugallery'] = array(
			'defaults' => $this->defaults,
			'template' => upfront_get_template_url('ugallery', upfront_element_url('tpl/ugallery.html', dirname(__FILE__)))
		);
		return $data;
	}

	public static function add_styles_scripts () {
		wp_enqueue_style('ugallery-style', upfront_element_url('css/ugallery.css', dirname(__FILE__)));
	}
}