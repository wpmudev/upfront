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

	var $image_labels = array();
	var $all_labels = array();

	public function get_markup () {
		//Lightbox
		wp_enqueue_style('magnific');
		wp_enqueue_script('magnific');

		//Front script
		upfront_add_element_script('ugallery', array('js/ugallery-front.js', dirname(__FILE__)));

		$data = $this->properties_to_array();
		$data['imagesLength'] = sizeof($data['images']);
		$data['editing'] = false;

		$this->get_labels($data['images']);
		$data['labels'] = $this->all_labels;
		array_unshift($data['labels'], array('id' => '0', 'text' => 'All'));
		$data['labels_length'] = sizeof($data['labels']);
		$data['image_labels'] = $this->image_labels;

		if($data['labelFilters']['length']){
			if(SCRIPT_DEBUG)
				upfront_add_element_script('jquery-shuffle', array('js/jquery.shuffle.js', dirname(__FILE__)));
			else
				upfront_add_element_script('jquery-shuffle', array('js/jquery.shuffle.min.js', dirname(__FILE__)));
		}

		$markup = upfront_get_template('ugallery', $data, dirname(dirname(__FILE__)) . '/tpl/ugallery.html');

		if(! $data['disableLightbox']['length']){
			$magnific_options = array(
				'type' => 'image',
				'delegate' => 'a',
				'gallery' => array(
					'enabled' => 'true'
				)
			);
			$markup .= '
				<script type="text/javascript">
					if(typeof ugalleries == "undefined")
						ugalleries = {};
					ugalleries["' . $data['element_id'] . '"] = {magnific: ' . json_encode($magnific_options) . '};
				</script>
			';
		}
		else {
			$markup .= '<!-- No lightbox -->';
		}

		$gridLabels = array(
			'labels' => $data['labels'],
			'labels_length' => $data['labels_length'],
			'image_labels' => $data['image_labels']
		);
		if($data['labelFilters']['length']){
			$markup .= '
				<script type="text/javascript">
					if(typeof ugalleries == "undefined")
						ugalleries = {};
					if(ugalleries["' . $data['element_id'] . '"])
						ugalleries["' . $data['element_id'] . '"].grid = ' . json_encode($gridLabels) . ';
					else
						ugalleries["' . $data['element_id'] . '"] = {grid: ' . json_encode($gridLabels) . '};
				</script>
			';
		}

		return $markup;
	}

	private function get_labels($images){
		/* Dumb labels
		$this->all_labels = array(
			array('id' => 1, 'text' => 'Casa'),
			array('id' => 2, 'text' => 'Perro'),
			array('id' => 3, 'text' => 'Tecla'),
			array('id' => 4, 'text' => 'Balon')
		);

		foreach($images as $image){
			$this->image_labels[$image['id']] = '"label_0", "label_' . $this->all_labels[rand(0,3)]['id'] . ' ", "label_' .  $this->all_labels[rand(0,3)]['id'] . '"';
		}

		$this->all_labels[] = array('id' => 0, 'text' => 'All');

		usort($this->all_labels, array($this, 'sort_labels'));

		*/
		$label_keys = array_keys($this->all_labels);
		$all_labels = array();
		foreach($images as $image){
			$image_labels = '"label_0"';
			$terms = get_the_terms($image['id'], 'media_label');
			if(is_array($terms)){
				foreach($terms as $label){
					$image_labels .= ', "label_' . $label->term_id . '"';
					if(array_search($label->term_id, $label_keys) === FALSE){
						$label_keys[] = $label->term_id;
						$all_labels[] = array('id' => $label->term_id, 'text' => $label->name);
					}
				}
			}
			$this->image_labels[$image['id']] = $image_labels;
		}
		usort($all_labels, array($this, 'sort_labels'));
		$this->all_labels = $all_labels;
	}

	public function sort_labels($a, $b){
		$texta = strtolower($a['text']);
		$textb = strtolower($b['text']);
		if($textb == $texta)
			return 0;
		return ($textb < $texta) ? 1 : -1;
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
			'postTypes' => $post_types,
			'grids' => array()
		);
		return $data;
	}

	public static function add_styles_scripts () {
		wp_enqueue_style('ugallery-style', upfront_element_url('css/ugallery.css', dirname(__FILE__)));
	}
}