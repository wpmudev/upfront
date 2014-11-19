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

		// Flag for excluding stuff that is only for editor
		$data['in_editor'] = false;
		$data['even_padding'] = isset($data['even_padding']) ? $data['even_padding'] : array('false');
		$data['thumbPadding'] = isset($data['thumbPadding']) ? $data['thumbPadding'] : 15;

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

		$data['l10n'] = self::_get_l10n('template');

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
					grid: ' . ($data['labelFilters']['length'] ? $data['labelFilters']['length'] : 0) . ',
//                    grid: ' . $data['labelFilters']['length'] . ',
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
		$data['l10n'] = self::_get_l10n('template');
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
		$labels_names = array();
		$labels_ids = array();
		foreach($labels as $label){
			if (!is_object($label)) continue;
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
			'captionType' => 'none', // 'above' | 'over' | 'none'
			'captionColor' => apply_filters('upfront_gallery_caption_color', '#ffffff'),
			'captionUseBackground' => 0,
			'captionBackground' => apply_filters('upfront_gallery_caption_background', '#000000'),
			'showCaptionOnHover' => array( 'true' ),
			'linkTo' => 'image', // 'url' | 'image'
			'even_padding' => array('false'),
			'thumbPadding' => 15
		);
	}

	public static function add_styles_scripts () {
		//wp_enqueue_style('ugallery-style', upfront_element_url('css/ugallery.css', dirname(__FILE__)));
		upfront_add_element_style('upfront_gallery', array('css/ugallery.css', dirname(__FILE__)));
		
		//Lightbox
		//wp_enqueue_style('magnific');
		upfront_add_element_style('magnific', array('/scripts/magnific-popup/magnific-popup.css', false));

		//wp_enqueue_script('magnific');
		upfront_add_element_script('magnific', array('/scripts/magnific-popup/magnific-popup.min.js', false));
		
		upfront_add_element_script('jquery-shuffle', array('js/jquery.shuffle.js', dirname(__FILE__)));

		//Front script
		upfront_add_element_script('ugallery', array('js/ugallery-front.js', dirname(__FILE__)));

	}

		public static function add_l10n_strings ($strings) {
		if (!empty($strings['gallery_element'])) return $strings;
		$strings['gallery_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Gallery', 'upfront'),
			'css' => array(
				'container_label' => __('Gallery container', 'upfront'),
				'container_info' => __('The whole gallery', 'upfront'),
				'elements_label' => __('Gallery elements', 'upfront'),
				'elements_info' => __('The container of every gallery element.', 'upfront'),
				'images_label' => __('Gallery images', 'upfront'),
				'images_info' => __('Every image in the gallery.', 'upfront'),
				'captions_label' => __('Image captions', 'upfront'),
				'captions_info' => __('Every caption of the gallery. Captions may not be available if they are deactivated using the options.', 'upfront'),
				'lblcnt_label' => __('Labels container', 'upfront'),
				'lblcnt_info' => __('The wrapper of the image labels.', 'upfront'),
				'labels_label' => __('Labels', 'upfront'),
				'labels_info' => __('Labels for gallery items filtering.', 'upfront'),
			),
			'ctrl' => array(
				'show_image' => __('Show image', 'upfront'),
				'edit_image' => __('Edit image', 'upfront'),
				'rm_image' => __('Remove image', 'upfront'),
				'image_link' => __('Image link', 'upfront'),
				'edit_labels' => __('Edit labels', 'upfront'),
			),
			'desc_update_success' => __('Image description has been successfully updated.', 'upfront'),
			'loading' => __('Loading...', 'upfront'),
			'personalize' => __('Click to personalize this gallery', 'upfront'),
			'no_labels' => __('This image has no labels', 'upfront'),
			'preparing' => __('Preparing images', 'upfront'),
			'not_all_added' => __('Not all images could be added.', 'upfront'),
			'thumbnail_clicked' => __('When a gallery thumbnail is clicked', 'upfront'),
			'show_larger' => __('show larger image', 'upfront'),
			'go_to_linked' => __('go to linked page', 'upfront'),
			'regenerating' => __('Regenerating images...', 'upfront'),
			'regenerating_done' => __('Wow, those are cool!', 'upfront'),
			'settings' => __('Gallery settings', 'upfront'),
			'panel' => array(
				'sort' => __('Enable label sorting', 'upfront'),
				'even_padding' => __('Even padding'),
				'show_caption' => __('Show Caption:', 'upfront'),
				'never' => __('never', 'upfront'),
				'hover' => __('on hover', 'upfront'),
				'always' => __('always', 'upfront'),
				'caption_style' => __('Caption Style', 'upfront'),
				'none' => __('none', 'upfront'),
				'over' => __('over img', 'upfront'),
				'under' => __('under img', 'upfront'),
				'showCaptionOnHover' => __('Show caption on hover'),
				'caption_bg' => __('Caption Background:', 'upfront'),
				'ok' => __('Ok', 'upfront'),
				'adds_sortable' => __('Adds sortable interface based on the labels given to the images.', 'upfront'),
			),
			'thumb' => array(
				'ratio' => __('Thumbnail Ratio', 'upfront'),
				'theme' => __('Theme', 'upfront'),
				'size' => __('Thumbnail Size', 'upfront'),
				'settings' => __('Thumbnails Settings', 'upfront'),
				'padding' => __('Thumbnails Padding', 'upfront'),
			),
			'template' => array(
				'add_more' => __('Add more', 'upfront'),
				'add_new' => __('Add new images to the Gallery', 'upfront'),
				'no_images' => __('No images in this gallery', 'upfront'),
				'add_img' => __('Add Images', 'upfront'),
				'add_images' => __('Add Images to the Gallery', 'upfront'),
				'drop_images' => __('Drop images here', 'upfront'),
				'select_images' => __('Select images', 'upfront'),
				'max_upload_size' => __('Maximum upload file size: 32MB', 'upfront'),
				'or_browse' => __('or browse your', 'upfront'),
				'media_gallery' => __('media gallery', 'upfront'),
				'uploading' => __('Uploading...', 'upfront'),
				'like' => __('I like that', 'upfront'),
				'upload_different' => __('upload a different image', 'upfront'),
				'upload' => __('Upload', 'upfront'),
				'edit_details' => __('Edit image details', 'upfront'),
				'title' => __('Title', 'upfront'),
				'caption' => __('Caption', 'upfront'),
				'alt' => __('Alternative text', 'upfront'),
				'ok' => __('Ok', 'upfront'),
				'labels' => __('Labels', 'upfront'),
				'wtf' => __('Una etiqueta', 'upfront'),
				'add_new_label' => __('Add a new label', 'upfront'),
				'label_sorting_nag' => __('Turn on \'Label Sorting\' in the settings to display gallery labels.', 'upfront'),
				'add_label' => __('Add', 'upfront'),
			),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

	public static function export_content ($export, $object) {
		$images = upfront_get_property_value('images', $object);
		if (!empty($images)) foreach ($images as $img) {
			if (empty($img['src']) || (empty($img['title']) || empty($img['caption']))) continue;
			$text = array();
			if (!empty($img['title'])) $text[] = $img['title'];
			if (!empty($img['caption'])) $text[] = $img['caption'];
			$export .= $img['src'] . ': ' . join(', ', $text) . "\n";
		}
		return $export;
	}
}
