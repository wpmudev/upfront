<?php
/**
 * Image element for Upfront
 */
class Upfront_UimageView extends Upfront_Object {

	public function get_markup () {
		$data = $this->properties_to_array();

		if($data['when_clicked'] == 'show_larger_image'){
			wp_enqueue_style('magnific');
			wp_enqueue_script('magnific');
		}

		$data['url'] = $data['when_clicked'] == 'do_nothing' ? false : $data['image_link'];

		$data['wrapper_id'] = str_replace('image-object-', 'wrapper-', $data['element_id']);

		$data['wrapper_id'] = 'hello_up';

		if($data['stretch'])
			$data['imgWidth'] = '100%';
		else
			$data['imgWidth'] = '';

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

		$data['cover_caption'] = $data['caption_position'] != 'below_image'; // array_search($data['caption_alignment'], array('fill', 'fill_bottom', 'fill_middle')) !== FALSE;

		$markup = '<div id="' . $data['element_id'] . '">' . upfront_get_template('uimage', $data, dirname(dirname(__FILE__)) . '/tpl/image.html') . '</div>';

		if($data['when_clicked'] == 'image'){
			//Lightbox
			wp_enqueue_style('magnific');
			wp_enqueue_script('magnific');//Front script
			upfront_add_element_script('uimage', array('js/uimage-front.js', dirname(__FILE__)));

			//
			$magnific_options = array(
				'type' => 'image',
				'delegate' => 'a'
			);
			$markup .= '
				<script type="text/javascript">
					if(typeof ugallery == "undefined")
						uimages = [];
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
			'when_clicked' => false, // false | external | entry | anchor | image | lightbox
			'image_link' => '',
			'include_image_caption' => false,
			'image_caption' => 'My awesome image caption',
			'caption_position' => 'below_image',
			'caption_alignment' => 'top',
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
			'gifImage' => 0,

			'type' => 'UimageModel',
			'view_class' => 'UimageView',
			'has_settings' => 1,
			'class' =>  'upfront-image',
			'id_slug' => 'image'
		);
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}

	public static function add_styles_scripts () {
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_style('uimage-style', upfront_element_url('css/uimage.css', dirname(__FILE__)));
		wp_enqueue_script('wp-color-picker');
	}
}

class Upfront_Uimage_Server extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}
	private function _add_hooks() {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront-media-image_sizes', array($this, "get_image_sizes"));
			upfront_add_ajax('upfront-media-image-create-size', array($this, "create_image_size"));
		}
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront-media-save-images', array($this, "save_resizing"));
		}
	}

	function create_image_size(){
		$data = stripslashes_deep($_POST);

		if(! $data['images'])
			return $this->_out(new Upfront_JsonResponse_Error("No images sent"));

		@ini_set( 'memory_limit', apply_filters( 'upfront_memory_limit', WP_MAX_MEMORY_LIMIT ) );

		$images = array();

		foreach($data['images'] as $imageData){
			if(!$imageData['id'])
				continue;
				//return $this->_out(new Upfront_JsonResponse_Error("Invalid image ID"));

			//if(!current_user_can('edit_post', $imageData['id']) ){
			if (!Upfront_Permissions::current(Upfront_Permissions::RESIZE, $imageData['id'])) {
				$images[$imageData['id']] = array('error' => true, 'msg' => 'Not allowed');
				continue;
				//wp_die( -1 );
			}

			$image = get_post($imageData['id']);
			if($image->post_mime_type == 'image/gif'){ //Gif are not really resized/croped to preserve animations
				$imageAttrs = wp_get_attachment_image_src( $imageData['id'], 'full' );
				$images[$imageData['id']] = $this->get_resized_gif_data($imageData, $imageAttrs);
			}
			else {
				$rotate = isset($imageData['rotate']) && is_numeric($imageData['rotate']) ? $imageData['rotate'] : false;
				$resize = isset($imageData['resize']) ? $imageData['resize'] : false;
				$crop = isset($imageData['crop']) ? $imageData['crop'] : false;

				$images[$imageData['id']] = $this->resize_image($imageData);
			}
		}
		return $this->_out(new Upfront_JsonResponse_Success(array('images' => $images)));
	}

	function get_resized_gif_data($resizeData, $imageAttrs){
		return array(
			'error' => 0,
			'url' => $imageAttrs[0],
			'urlOriginal' => $imageAttrs[0],
			'full' => $resizeData['resize'],
			'crop' => array('width' => $resizeData['crop']['width'], 'height' => $resizeData['crop']['height']),
			'gif' => 1
		);
	}

	function get_image_sizes() {
        $data = stripslashes_deep($_POST);

        $item_id = !empty($data['item_id']) ? $data['item_id'] : false;
        if (!$item_id)
        	$this->_out(new Upfront_JsonResponse_Error("Invalid image ID"));

        $ids = json_decode($item_id);

        if(is_null($ids) || !is_array($ids))
        	$this->_out(new Upfront_JsonResponse_Error("Invalid image ID 2"));

        $custom_size = isset($data['customSize']) && is_array($data['customSize']);

    	$images = array();
    	$intermediate_sizes = get_intermediate_image_sizes();
    	$intermediate_sizes[] = 'full';
    	foreach($ids as $id){
    		$sizes = array();
    		foreach ( $intermediate_sizes as $size ) {
				$image = wp_get_attachment_image_src( $id, $size);
				if($image)
					$sizes[$size] = $image;
			}

			if($custom_size){
				$image_custom_size = $this->calculate_image_resize_data($data['customSize'], array('width' => $sizes['full'][1], 'height' => $sizes['full'][2]));
				$image_custom_size['id'] = $id;
				if (!empty($data['element_id'])) $image_custom_size['element_id'] = $data['element_id'];
				$sizes['custom'] = $this->resize_image($image_custom_size);
				$sizes['custom']['editdata'] =$image_custom_size;
			}
			else
				$sizes['custom'] = $custom_size ? $data['customSize'] : array();

			if(sizeof($sizes) != 0)
				$images[$id] = $sizes;
    	}

        if(sizeof($images) == 0)
        	$this->_out(new Upfront_JsonResponse_Error("No images ids given"));

        $result = array(
        	'given' => sizeof($ids),
        	'returned' => sizeof($ids),
        	'images' => $images
    	);

        return $this->_out(new Upfront_JsonResponse_Success($result));
	}

	function resize_image($imageData) {
		$rotate = isset($imageData['rotate']) && is_numeric($imageData['rotate']) ? $imageData['rotate'] : false;
		$resize = isset($imageData['resize']) ? $imageData['resize'] : false;
		$crop = isset($imageData['crop']) ? $imageData['crop'] : false;

		if(!$rotate && !$resize && !$crop)
			return array('error' => true, 'msg' => 'Not modifications');
		$image_path = isset($imageData['image_path']) ? $imageData['image_path'] : _load_image_to_edit_path( $imageData['id'] );
		$img = wp_get_image_editor( $image_path );

	    if ( is_wp_error( $img ) )
			return array('error' => true, 'msg' => 'Image id not valid');


		if($rotate && !$img->rotate(-$rotate))
			return array('error' => true, 'msg' => 'There was an error editing the image');

		$full_size = $img->get_size();
		//Cropping for resizing allows to make the image bigger
		if($resize && !$img->crop(0, 0, $full_size['width'], $full_size['height'], $resize['width'], $resize['height'], false))
			return array('error' => true, 'msg' => 'There was an error editing the image');

		//$cropped = array(round($crop['left']), round($crop['top']), round($crop['width']), round($crop['height']));

		//Don't let the crop be bigger than the size
		$size = $img->get_size();
		$crop = array('top' => round($crop['top']), 'left' => round($crop['left']), 'width' => round($crop['width']), 'height' => round($crop['height']));

		if($crop['top'] < 0){
			$crop['height'] -= $crop['top'];
			$crop['top'] = 0;
		}
		if($crop['left'] < 0){
			$crop['width'] -= $crop['left'];
			$crop['left'] = 0;
		}

		if($size['height'] < $crop['height'])
			$crop['height'] = $size['height'];
		if($size['width'] < $crop['width'])
			$crop['width'] = $size['width'];


		if($crop && !$img->crop($crop['left'], $crop['top'], $crop['width'], $crop['height']))
		//if($crop && !$img->crop($cropped[0], $cropped[1], $cropped[2], $cropped[3]))
			return $this->_out(new Upfront_JsonResponse_Error("There was an error editing the image."));


		// generate new filename
		$path = $image_path;
		$path_parts = pathinfo( $path );

		$filename = $path_parts['filename'] . '-' . $img->get_suffix();
		if(!isset($imageData['skip_random_filename']))
			$filename .=  '-' . rand(1000, 9999);

		$imagepath = $path_parts['dirname'] . '/' . $filename . '.' . $path_parts['extension'];

		$img->set_quality(90);
		$saved = $img->save($imagepath);

		if ( is_wp_error( $img ) )
			return array('error' => true, 'msg' => 'There was an error saving the edited image');

		$urlOriginal = wp_get_attachment_image_src($imageData['id'], 'full');
		$urlOriginal = $urlOriginal[0];
		$url  = str_replace($path_parts['basename'], $saved['file'], $urlOriginal);

		if($rotate){
			//We must do a rotated version of the full size image
			$fullsizename = $path_parts['filename'] . '-r' . $rotate ;
			$fullsizepath = $path_parts['dirname'] . '/' . $fullsizename . '.' . $path_parts['extension'];
			if(!file_exists($fullsizepath)){
				$full = wp_get_image_editor( _load_image_to_edit_path( $imageData['id'] ) );
				$full->rotate(-$rotate);
				$full->set_quality(90);
				$savedfull = $full->save($fullsizepath);
			}
			$urlOriginal = str_replace($path_parts['basename'], $fullsizename . '.' . $path_parts['extension'], $urlOriginal);
		} // We won't be cleaning up the rotated fullsize images


// *** ALright, so this is the magic cleanup part
		// Drop the old resized image for this element, if any
		$used = get_post_meta($imageData['id'], 'upfront_used_image_sizes', true);
		$element_id = !empty($imageData['element_id']) ? $imageData['element_id'] : 0;
		if (!empty($used[$element_id]['path']) && file_exists($used[$element_id]['path'])) {
			// OOOH, so we have a previos crop!
			@unlink($used[$element_id]['path']); // Drop the old one, we have new stuffs to replace it
		}
		$used[$element_id] = $saved; // Keep track of used elements per element ID
		update_post_meta($imageData['id'], 'upfront_used_image_sizes', $used);
// *** Flags updated, files clear. Moving on

		return array(
			'error' => false,
			'url' => $url,
			'urlOriginal' => $urlOriginal,
			'full' => $full_size,
			'crop' => $img->get_size()
		);
	}

	function calculate_image_resize_data($custom, $full) {
		$image_factor = $full['width'] / $full['height'];
		$custom_factor =  $custom['width'] / $custom['height'];

		$pivot = $image_factor > $custom_factor ? 'height' : 'width';
		$factor = $custom[$pivot] / $full[$pivot];

		$transformations = array(
			'rotate' => 0
		);

		$resize = array(
			'width' => round($full['width'] * $factor),
			'height' => round($full['height'] * $factor)
		);
		$crop = $custom;

		$crop['left'] = $resize['width'] > $crop['width'] ? floor(($resize['width'] - $crop['width']) / 2) : 0;
		$crop['top'] = $resize['height'] > $crop['height'] ? floor(($resize['height'] - $crop['height']) / 2) : 0;

		$transformations['crop'] = $crop;
		$transformations['resize'] = $resize;

		return $transformations;

	}

	function save_resizing() {
		$data = stripslashes_deep($_POST);
		$layout = Upfront_Layout::from_entity_ids($data['layout']);
		return $this->_out(new Upfront_JsonResponse_Success($layout->get_element_data('uslider-object-1388746230599-1180')));
	}
}
Upfront_Uimage_Server::serve();
