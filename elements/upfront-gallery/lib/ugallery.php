<?php

/*
	Replace the indentifiers with yours

	class: Upfront_UgalleryView
	domaing: ugallery
*/

class Upfront_UgalleryView extends Upfront_Object {

	var $image_labels = array();
	var $all_labels = array();

	public function get_markup () {
		$data = $this->properties_to_array();
		$images = array();
		foreach($data['images'] as $im){
			$images[] = array_merge(self::image_defaults(), $im);
		}
		$data['images'] = $images;

		$data['imagesLength'] = sizeof($images);
		$data['editing'] = false;

		$this->get_labels($data['images']);
		$data['labels'] = $this->all_labels;
		array_unshift($data['labels'], array('id' => '0', 'text' => 'All'));
		$data['labels_length'] = sizeof($data['labels']);
		$data['image_labels'] = $this->image_labels;

		$lbTpl = upfront_get_template('ugallery', $data, dirname(dirname(__FILE__)) . '/tpl/lightbox.html');
		$markup = upfront_get_template('ugallery', $data, dirname(dirname(__FILE__)) . '/tpl/ugallery.html');

		$markup .= '
			<script type="text/javascript">
				if(typeof ugalleries == "undefined")
					ugalleries = {};

				ugalleries["' . $data['element_id'] . '"] = {
					labels: ' . json_encode($data['labels']) . ',
					labels_length: ' . json_encode($data['labels_length']) . ',
					image_labels: ' . json_encode($data['image_labels']) . ',
					grid: ' . $data['labelFilters']['length'] . ',
					useLightbox: '. ($data['linkTo'] == 'image' ? '1' : '0') . '
				};
			</script>
		';

		if( $data['linkTo'] == 'image' ){
			$magnific_options = array(
				'type' => 'image',
				'delegate' => 'a',
				'gallery' => array(
					'enabled' => 'true',
					'tCounter' => '<span class="mfp-counter">%curr% / %total%</span>'
				),
				'image' => array(
					'markup' => upfront_get_template('ugallery', $data, dirname(dirname(__FILE__)) . '/tpl/lightbox.html'),
					'titleSrc' => 'title',
					'verticalFit' => true
				)
			);
			$markup .= '
				<script type="text/javascript">
					ugalleries["' . $data['element_id'] . '"].magnific = ' . json_encode($magnific_options) . ';
				</script>
			';
		}
		else {
			$tplObject = array('markup' => $lbTpl);
			$markup .= '
				<script type="text/javascript">
					ugalleries["' . $data['element_id'] . '"].template = ' . json_encode($tplObject) . ';
				</script>
			';
		}

		return $markup;
	}

	private function get_labels($images){
		$label_keys = array_keys($this->all_labels);
		$all_labels = array();
		foreach($images as $image){
			$image_labels = '"label_0"';
			$terms = get_the_terms($image['id'], 'media_label');
      // Add tags from uploaded images
			if(is_array($terms)){
				foreach($terms as $label){
					$image_labels .= ', "label_' . $label->term_id . '"';
					if(array_search($label->term_id, $label_keys) === FALSE){
						$label_keys[] = $label->term_id;
						$all_labels[] = array('id' => $label->term_id, 'text' => $label->name);
					}
				}
			}
      // Add tags from layouts
      $image_tags = $image['tags'];
      if (!empty($image_tags)) {
        foreach($image['tags'] as $tag) {
					$image_labels .= ', "label_' . $tag . '"';
          if (!in_array($tag, $label_keys)) {
            $label_keys[] = $tag;
            $all_labels[] = array('id' => $tag, 'text' => $tag);
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
		$labels = get_terms('media_label', array('hide_empty' => false));
		$label_names = array();
		$label_ids = array();
		foreach($labels as $label){
			$labels_ids[$label->term_id] = array('id' => $label->term_id, 'text' => $label->name);
			$labels_names[$label->name] = array('id' => $label->term_id, 'text' => $label->name);
		}

		$data['ugallery'] = array(
			'defaults' => self::default_properties(),
			'imageDefaults' => self::image_defaults(),
			'template' => upfront_get_template_url('ugallery', upfront_element_url('tpl/ugallery.html', dirname(__FILE__))),
			'lightboxTpl' => upfront_get_template('lightbox', array(), dirname(dirname(__FILE__)) . '/tpl/lightbox.html'),
			'postTypes' => $post_types,
			'grids' => array(),
			'label_names' => $labels_names,
			'label_ids' => $labels_ids,
			'themeDefaults' => apply_filters('upfront_gallery_defaults', array())
		);
		return $data;
	}

	public static function image_defaults(){
		return array(
			'id' => 0,
			'src' => 'http//imgsrc.hubblesite.org/hu/db/images/hs-2013-12-a-small_web.jpg',
			'srcFull' => 'http//imgsrc.hubblesite.org/hu/db/images/hs-2013-12-a-small_web.jpg',
			'sizes' => array(),
			'size' => array('width' => 0, 'height' => 0),
			'cropSize' => array('width' => 0, 'height' => 0),
			'cropOffset' => array('top' => 0, 'left' => 0),
			'rotation' => 0,
			'link' => 'original',
			'url' => '',
			'title' => 'Image caption',
			'caption' => 'Image description',
			'alt' => '',
			'tags' => array(),
			'margin' => array('left' => 0, 'top' => 0)
		);
	}

	//Defaults for properties
    public static function default_properties(){
        return array(
			'type' => 'UgalleryModel',
			'view_class' => 'UgalleryView',
			'has_settings' => 1,
			'class' => 'c24 upfront-gallery',
			'id_slug' => 'ugallery',

			'status' => 'starting',
			'images' => array(), // Convert to new UgalleryImages() for using
			'elementSize' => array( 'width' => 0, 'height' => 0),
			'labelFilters' => array(), //Since checkboxes fields return an array
			'thumbProportions' => '1', // 'theme' | '1' | '0.66' | '1.33'
			'thumbWidth' => 140,
			'thumbHeight' => 140,
			'captionPosition' => 'below', // 'above' | 'over' | 'nocaption'
			'captionColor' => apply_filters('upfront_gallery_caption_color', '#ffffff'),
			'captionUseBackground' => 0,
			'captionBackground' => apply_filters('upfront_gallery_caption_background', '#000000'),
			'captionWhen' => 'always', // 'always' | 'hover'
			'linkTo' => 'image' // 'url' | 'image'
        );
    }

	public static function add_styles_scripts () {
		wp_enqueue_style('ugallery-style', upfront_element_url('css/ugallery.css', dirname(__FILE__)));


		//Lightbox
		wp_register_script(
			'magnific',
			Upfront::get_root_url() . '/scripts/magnific-popup/magnific-popup.js',
			array('jquery')
		);
		wp_register_style(
			'magnific',
			Upfront::get_root_url() . '/scripts/magnific-popup/magnific-popup.css'
		);
		wp_enqueue_style('magnific');
		wp_enqueue_script('magnific');


		wp_enqueue_script('jquery-shuffle', upfront_element_url('js/jquery.shuffle.js', dirname(__FILE__)), array('jquery'));

		//Front script
		wp_enqueue_script('ugallery', upfront_element_url('js/ugallery-front.js', dirname(__FILE__)), array('magnific', 'jquery-shuffle'));

	}
}
