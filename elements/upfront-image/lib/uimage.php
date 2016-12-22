<?php
/**
 * Image element for Upfront
 */
class Upfront_UimageView extends Upfront_Object {

	public function get_markup () {
		$data = $this->properties_to_array();

		if (isset($data['usingNewAppearance']) === false) {
			$data['usingNewAppearance'] = false;
		}

		$data['in_editor'] = false;
		if (!isset($data['link']) || $data['link'] === false) {
			$link = array(
				'type' => $data['when_clicked'],
				'target' => isset($data['link_target']) ? $data['link_target'] : '_self',
				'url' => $data['image_link']
			);
		} else {
			$link = $data['link'];
		}

		if (!isset($data['link_target'])) $data['link_target'] = '';

		if($link['type'] == 'image'){
			//wp_enqueue_style('magnific');
			upfront_add_element_style('magnific', array('/scripts/magnific-popup/magnific-popup.css', false));
			//wp_enqueue_script('magnific');
			upfront_add_element_script('magnific', array('/scripts/magnific-popup/magnific-popup.min.js', false));
		}

		$data['url'] = $link['type'] == 'unlink' ? false : $link['url'];

		$data['wrapper_id'] = str_replace('image-object-', 'wrapper-', $data['element_id']);

		$data['wrapper_id'] = 'hello_up';

		if($data['stretch']) {
			$data['imgWidth'] = '100%';
			$data['stretchClass'] = ' uimage-stretch';
		}
		else {
			$data['imgWidth'] = '';
			$data['stretchClass'] = '';
		}

		$data['containerWidth'] = min($data['size']['width'], $data['element_size']['width']);

		if($data['vstretch'])
			$data['marginTop'] = 0;

		$data['gifImage'] = isset($data['gifImage']) && $data['gifImage'] ? ' uimage-gif' : '';
		$data['gifLeft'] = $data['gifImage'] && $data['position']['left'] > 0 ? (-$data['position']['left']) . 'px' : 0;
		$data['gifTop'] = (-$data['position']['top']) . 'px';

		//Don't let the caption be bigger than the image
		$data['captionData'] = array(
			'top' => $data['vstretch'] ? 0 : (-$data['position']['top']) . 'px',
			'left'=> $data['stretch'] ? 0 : (-$data['position']['left']) . 'px',
			'width'=> $data['stretch'] ? '100%' : $data['size']['width'] . 'px',
			'height'=> $data['vstretch'] ? '100%' : $data['size']['height'] . 'px',
			'bottom' => $data['vstretch'] ? '100%' : ($data['element_size']['height'] + $data['position']['top'] - $data['size']['height']) . 'px'
		);

		if(!isset($data['preset'])) {
			$data['preset'] = 'default';
		}

		if ($data['usingNewAppearance'] === true) {
			// Clean up hardcoded image caption color
			$data['image_caption'] = preg_replace('#^<span style=".+?"#', '<span ', $data['image_caption']);
		}

		$data['properties'] = Upfront_Image_Presets_Server::get_instance()->get_preset_properties($data['preset']);

		$data['cover_caption'] = $data['caption_position'] != 'below_image'; // array_search($data['caption_alignment'], array('fill', 'fill_bottom', 'fill_middle')) !== FALSE;

		$data['placeholder_class'] = !empty($data['src']) ? '' : 'uimage-placeholder';

		/*
		* Commented this line because sets background color for captions under image to be always white
		* If this functionallity is needed, we will restore it
		*
		if ($data['caption_position'] === 'below_image') $data['captionBackground'] = false;

		*/
		$data['link_target'] = $link['target'];

		if (!empty($data['src'])) $data['src'] = preg_replace('/^https?:/', '', trim($data['src']));


		// print_r($data);die;
		$markup = '<div>' . upfront_get_template('uimage', $data, dirname(dirname(__FILE__)) . '/tpl/image.html') . '</div>';

		if($link['type'] == 'image'){
			//Lightbox
			//wp_enqueue_style('magnific');
			upfront_add_element_style('magnific', array('/scripts/magnific-popup/magnific-popup.css', false));
			//wp_enqueue_script('magnific');//Front script
			upfront_add_element_script('magnific', array('/scripts/magnific-popup/magnific-popup.min.js', false));

			upfront_add_element_script('uimage', array('js/uimage-front.js', dirname(__FILE__)));

			//
			$magnific_options = array(
				'type' => 'image',
				'delegate' => 'a'
			);
			$markup .= '
				<script type="text/javascript">
					if(typeof uimages == "undefined")
						uimages = {};
					uimages["' . $data['element_id'] . '"] = ' . json_encode($magnific_options) . ';
				</script>
			';
		}

		return $markup;
	}

	public function add_js_defaults($data){
		$data['uimage'] = array(
			'defaults' => self::default_properties(),
			'template' => upfront_get_template_url('uimage', upfront_element_url('tpl/image.html', dirname(__FILE__)))
		);
		return $data;
	}

	public static function default_properties(){
		return array(
			'src' => false,
			'srcFull' => false,
			'srcOriginal' => false,
			'image_title' => '',
			'alternative_text' => '',
			'include_image_caption' => false,
			'image_caption' => self::_get_l10n('image_caption'),
			'caption_position' => false,
			'caption_alignment' => false,
			'caption_trigger' => 'always_show',
			'image_status' => 'starting',
			'size' =>  array('width' => '100%', 'height' => 'auto'),
			'fullSize' => array('width' => 0, 'height' => 0),
			'position' => array('top' => 0, 'left' => 0),
			'marginTop' => 0,
			'element_size' => array('width' => '100%', 'height' => 250),
			'rotation' => 0,
			'color' => apply_filters('upfront_image_caption_color', '#ffffff'),
			'background' => apply_filters('upfront_image_caption_background', '#000000'),
			'captionBackground' => '0',
			'image_id' => 0,
			'align' => 'center',
			'stretch' => false,
			'vstretch' => false,
			'quick_swap' => false,
			'is_locked' => true,
			'gifImage' => 0,
			'placeholder_class' => '',
			'preset' => 'default',
			'display_caption' => 'showCaption',

			'type' => 'UimageModel',
			'view_class' => 'UimageView',
			'has_settings' => 1,
			'class' =>  'upfront-image',
			'id_slug' => 'image',

			'when_clicked' => false, // false | external | entry | anchor | image | lightbox
			'image_link' => '',
			'link' => false
		);
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}

	public static function add_styles_scripts () {
		//wp_enqueue_style( 'wp-color-picker' ); // Why do we need this? Especially for all users!
		upfront_add_element_style('upfront_image', array('css/uimage.css', dirname(__FILE__)));
		//wp_enqueue_style('uimage-style', upfront_element_url('css/uimage.css', dirname(__FILE__)));
		//wp_enqueue_script('wp-color-picker'); // Why do we need this? We surely don't need it at least for visitors
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['image_element'])) return $strings;
		$strings['image_element'] = self::_get_l10n();
		return $strings;
	}

	public static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Image', 'upfront'),
			'process_error' => __('Image failed to process.', 'upfront'),
			'image_caption' => __('My awesome image caption', 'upfront'),
			'css' => array(
				'image_label' => __('Image element', 'upfront'),
				'image_info' => __('The whole image element', 'upfront'),
				'caption_label' => __('Caption panel', 'upfront'),
				'caption_info' => __('Caption layer', 'upfront'),
				'wrapper_label' => __('Image wrapper', 'upfront'),
				'wrapper_info' => __('Image container', 'upfront'),
			),
			'ctrl' => array(
				'caption_position' => __('Caption Location', 'upfront'),
				'over_top' => __('Over image, top', 'upfront'),
				'over_bottom' => __('Over image, bottom', 'upfront'),
				'cover_top' => __('Covers image, top', 'upfront'),
				'cover_middle' => __('Covers image, middle', 'upfront'),
				'cover_bottom' => __('Covers image, bottom', 'upfront'),
				'below' => __('Below the image', 'upfront'),
				'edit_image' => __('Edit image', 'upfront'),
				'image_link' => __('Link image', 'upfront'),
				'add_image' => __('Add Image', 'upfront'),
				'edit_caption' => __('Edit Caption', 'upfront'),
				'add_caption' => __('Add Caption', 'upfront'),
				'lock_image' => __('Unlock image resizing', 'upfront'),
				'unlock_image' => __('Lock image resizing', 'upfront'),
				'swap_image' => __('Swap Image', 'upfront')
			),
			'drop_image' => __('Drop the image here', 'upfront'),
			'external_nag' => __('Image editing it is only suitable for images uploaded to WordPress', 'upfront'),
			'desktop_nag' => __('Image edition is only available in desktop mode.', 'upfront'),
			'settings' => array(
				'label' => __('Image settings', 'upfront'),
				'alt' => __('Alternative Text', 'upfront'),
				'caption' => __('Caption Settings:', 'upfront'),
				'show_caption' => __('Show Captions', 'upfront'),
				'always' => __('Always', 'upfront'),
				'hover' => __('On Hover', 'upfront'),
				'caption_bg' => __('Caption Background', 'upfront'),
				'none' => __('None', 'upfront'),
				'pick' => __('Pick color', 'upfront'),
				'ok' => __('Ok', 'upfront'),
				'padding' => __('Padding Settings:', 'upfront'),
				'no_padding' => __('Do not use theme padding', 'upfront'),
				'image_style_label' => __('Image Style', 'upfront'),
				'image_style_info' => __('Image Element Shape:', 'upfront'),
				'content_area_colors_label' => __('Colors', 'upfront'),
				'caption_text_label' => __('Caption Text', 'upfront'),
				'caption_bg_label' => __('Caption BG', 'upfront'),
			),
			'image_expanded' => __('The image is completely expanded', 'upfront'),
			'cant_expand' => __('Can\'t expand the image', 'upfront'),
			'saving' => __('Saving image...', 'upfront'),
			'saving_done' => __('Here we are', 'upfront')
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}
