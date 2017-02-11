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

		if (isset($data['usingNewAppearance']) === false) {
			$data['usingNewAppearance'] = false;
		}

		// Flag for excluding stuff that is only for editor
		$data['in_editor'] = false;
		$data['even_padding'] = isset($data['even_padding']) ? $data['even_padding'] : array('false');
		$data['thumbPadding'] = isset($data['thumbPadding']) ? $data['thumbPadding'] : 15;

		if (!empty($data['images'])) {
			foreach($data['images'] as $im){
			if (!empty($im['src'])) $im['src'] = preg_replace('/^https?:/', '', trim($im['src']));
			$images[] = array_merge(self::image_defaults(), $im);
		}
	}


		// Ensure template backward compatibility
		foreach($images as $index=>$image) {
			if (isset($images[$index]['imageLink']) && $images[$index]['imageLink'] !== false) {
				$images[$index]['imageLinkType'] = $image['imageLink']['type'];
				$images[$index]['imageLinkUrl'] = $image['imageLink']['url'];
				$images[$index]['imageLinkTarget'] = $image['imageLink']['target'];
			} else {
				$images[$index]['imageLinkType'] = $image['urlType'];
				$images[$index]['imageLinkUrl'] = $image['url'];
				$images[$index]['imageLinkTarget'] = $image['linkTarget'];
			}
		}
		$data['images'] = $images;

		$data['imagesLength'] = sizeof($images);
		$data['editing'] = false;

		$this->get_labels($data['images']);
		$data['labels'] = $this->all_labels;

		/**
		 * Remove All if we already have one
		 */
		if(($key = array_search(array('id' => 'All', 'text' => 'All'), $data['labels'],  true)) !== false) {
			unset($data['labels'][$key]);
		}

		array_unshift($data['labels'], array('id' => '0', 'text' => 'All'));
		$data['labels_length'] = sizeof($data['labels']);
		$data['image_labels'] = $this->image_labels;

		$data['l10n'] = self::_get_l10n('template');

		if (!isset($data['preset'])) {
			$data['preset'] = 'default';
		}

		$data['properties'] = Upfront_Gallery_Presets_Server::get_instance()->get_preset_properties($data['preset']);

		if (is_array($data['labelFilters']) && $data['labelFilters'][0] === 'true') {
			$data['labelFilters'] = 'true';
		}

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
					grid: ' . ($data['labelFilters'] === 'true' ? 1 : 0) . ',
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
			$terms = wp_get_object_terms(array($image['id']), array('media_label'));
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

		// Sanitize post type objects array
		foreach ($post_types as $ptidx => $ptype) {
			if (empty($ptype->register_meta_box_cb)) continue;
			$ptype->register_meta_box_cb = false;
			$post_types[$ptidx] = $ptype;
		}
		// Whatever we need in the post types array, I am fairly sure metabox callback is *NOT* one of those things...

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
		$l10n = self::_get_l10n('template');

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
			'title' => $l10n['image_caption'],
			'caption' => $l10n['image_description'],
			'alt' => '',
			'tags' => array(),
			'margin' => array('left' => 0, 'top' => 0),

			'imageLink' => false,

			// Deprecated properties, leave for safety
			'linkTarget' => '',
			'link' => 'original',
			'url' => '',
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
			'preset' => 'default',
			'status' => 'starting',
			'images' => array(), // Convert to new UgalleryImages() for using
			'elementSize' => array( 'width' => 0, 'height' => 0),
			'labelFilters' => array(), //Since checkboxes fields return an array
			'thumbProportions' => '1', // 'theme' | '1' | '0.66' | '1.33'
			'thumbWidth' => 140,
			'thumbHeight' => 140,
			'thumbWidthNumber' => 140,
			'captionType' => 'none', // 'above' | 'over' | 'none'
			'captionColor' => apply_filters('upfront_gallery_caption_color', '#ffffff'),
			'captionUseBackground' => 0,
			'captionBackground' => apply_filters('upfront_gallery_caption_background', '#000000'),
			'showCaptionOnHover' => array( 'true' ),
			'fitThumbCaptions' => false,
			'thumbCaptionsHeight' => 20,
			'linkTo' => false, // 'url' | 'image', false is special case meaning type is not selected yet
			'even_padding' => array('false'),
			'thumbPadding' => 15,
			'sidePadding' => 15,
			'showCaptionOnHover' => 0,
			'bottomPadding' => 15,
			'thumbPaddingNumber' => 15,
			'thumbSidePaddingNumber' => 15,
			'thumbBottomPaddingNumber' => 15,
			'lockPadding' => 'yes',
			'lightbox_show_close' => array('true'),
			'lightbox_show_image_count' => array('true'),
			'lightbox_click_out_close' => array('true'),
			'lightbox_active_area_bg' => 'rgba(255,255,255,1)',
			'lightbox_overlay_bg' => 'rgba(0,0,0,0.2)',
			'styles' => ''
		);
	}

	public static function add_styles_scripts () {
		//wp_enqueue_style('ugallery-style', upfront_element_url('css/ugallery.css', dirname(__FILE__)));


		//Lightbox
		//wp_enqueue_style('magnific');
		upfront_add_element_style('magnific', array('/scripts/magnific-popup/magnific-popup.css', false));

		// Place them under the magnific styles so that UF can override magnific
		upfront_add_element_style('upfront_gallery', array('css/ugallery.css', dirname(__FILE__)));
		if (is_user_logged_in()) {
			upfront_add_element_style('ugallery-style-editor', array('css/ugallery-editor.css', dirname(__FILE__)));
		}

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
				'lightbox_close' => __('Close button', 'upfront'),
				'lightbox_content_wrapper' => __('Content wrapper', 'upfront'),
				'lightbox_content_wrapper_info' => __('Container that wraps image and caption.', 'upfront'),
				'lightbox_image_wrapper' => __('Image wrapper', 'upfront'),
				'lightbox_caption_wrapper' => __('Caption wrapper', 'upfront'),
				'lightbox_caption' => __('Caption', 'upfront'),
				'lightbox_arrow_left' => __('Arrow left', 'upfront'),
				'lightbox_arrow_right' => __('Arrow right', 'upfront'),
				'lightbox_image_count' => __('Image counter', 'upfront'),
			),
			'ctrl' => array(
				'show_image' => __('View lightbox', 'upfront'),
				'edit_image' => __('Crop thumbnail', 'upfront'),
				'rm_image' => __('Delete thumbnail', 'upfront'),
				'image_link' => __('Link thumbnail', 'upfront'),
				'edit_labels' => __('Edit labels', 'upfront'),
				'thumbnail_options' => __('Thumbnail options', 'upfront')
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
			'settings' => __('Settings', 'upfront'),
			'toggle_dnd' => __('Toggle drag\'n\'drop sorting of images', 'upfront'),
			'panel' => array(
				'sort' => __('Enable label sorting', 'upfront'),
				'even_padding' => __('Even padding'),
				'show_caption' => __('Show Captions', 'upfront'),
				'never' => __('never', 'upfront'),
				'hover' => __('on hover', 'upfront'),
				'always' => __('always', 'upfront'),
				'caption_location' => __('Caption Location:', 'upfront'),
				'caption_style' => __('Caption Style', 'upfront'),
				'caption_height' => __('Caption Height:', 'upfront'),
				'none' => __('none', 'upfront'),
				'over' => __('over img', 'upfront'),
				'under' => __('under img', 'upfront'),
				'showCaptionOnHover' => __('Show caption on hover'),
				'caption_bg' => __('Caption Background:', 'upfront'),
				'ok' => __('Ok', 'upfront'),
				'auto' => __('Auto', 'upfront'),
				'fixed' => __('Fixed', 'upfront'),
				'adds_sortable' => __('Adds sortable interface based on the labels given to the images.', 'upfront'),
				'fit_thumb_captions' => __('Fit thumbnail captions.', 'upfront'),
				'thumb_captions_height' => __('Height of captions (in px).', 'upfront'),
				'content_area_label' => __('Content Area Colors', 'upfront'),
				'caption_text_label' => __('Caption Text', 'upfront'),
				'caption_bg_label' => __('Caption BG', 'upfront'),
			),
			'thumb' => array(
				'ratio' => __('Thumbnails Shape Ratio:', 'upfront'),
				'theme' => __('Theme', 'upfront'),
				'size' => __('Thumbnails Size', 'upfront'),
				'thumb_settings' => __('Thumbnails Settings', 'upfront'),
				'padding' => __('Thumbnails Padding', 'upfront'),
				'spacing' => __('Thumbnails Spacing', 'upfront'),
				'side_spacing' => __('Side Spacing:', 'upfront'),
				'bottom_spacing' => __('Bottom Spacing:', 'upfront')
			),
			'template' => array(
				'add_more' => __('Add more', 'upfront'),
				'add_new' => __('Add new images to the Gallery', 'upfront'),
				'no_images' => __('No images in this gallery', 'upfront'),
				'add_img' => __('Add Images', 'upfront'),
				'add_images' => __('Add Images to the Gallery', 'upfront'),
				'drop_images' => __('Drop images here', 'upfront'),
				'select_images' => __('Select images', 'upfront'),
				'max_upload_size' => sprintf(__('Maximum upload file size: %s', 'upfront'), upfront_max_upload_size_human()),
				'or_browse' => __('or browse your', 'upfront'),
				'media_gallery' => __('media gallery', 'upfront'),
				'uploading' => __('Uploading...', 'upfront'),
				'like' => __('I like that', 'upfront'),
				'upload_different' => __('upload a different image', 'upfront'),
				'upload' => __('Upload', 'upfront'),
				'edit_details' => __('Edit image details', 'upfront'),
				'title' => __('Title', 'upfront'),
				'caption' => __('Caption', 'upfront'),
				'image_caption' => __('<p>Image caption</p>', 'upfront'),
				'image_description' => __('Image description', 'upfront'),
				'alt' => __('Alternative text', 'upfront'),
				'ok' => __('Ok', 'upfront'),
				'labels' => __('Labels', 'upfront'),
				'wtf' => __('Una etiqueta', 'upfront'),
				'add_new_label' => __('Add a new label', 'upfront'),
				'label_sorting_nag' => __('Turn on \'Label Sorting\' in the settings to display gallery labels.', 'upfront'),
				'add_label' => __('Add', 'upfront'),
				'image_labels' => __('Image labels', 'upfront'),
				'create_label' => __('Create new label', 'upfront'),
				'type_label' => __('Type to create label', 'upfront'),
				'pick_label' => __('Type to pick label', 'upfront'),
			),
			'lightbox' => array(
				'title' => 'Gallery Lightbox',
				'edit_css' => 'Edit Lightbox CSS',
				'show_image_count' => 'Show Image Count',
				'active_area_bg' => 'Active Area BG',
				'overlay_bg' => 'Overlay BG'
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
