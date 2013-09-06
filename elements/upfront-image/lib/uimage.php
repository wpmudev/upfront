<?php
/**
 * Image element for Upfront
 */
class Upfront_UimageView extends Upfront_Object {
	var $defaults = array(
		'src' => false,
		'srcFull' => false,
		'srcOriginal' => false,
		'image_title' => '',
		'alternative_text' => '',
		'when_clicked' => 'do_nothing',
		'image_link' => '',
		'include_image_caption' => false,
		'image_caption' => '',
		'caption_position' => 'below_image',
		'caption_alignment' => 'top',
		'caption_trigger' => 'always_show',
		'image_status' => 'starting',
		'size' =>  array('width' => '100%', 'height' => 'auto'),
		'fullSize' => array('width' => 0, 'height' => 0),
		'position' => array('top' => 0, 'left' => 0),
		'element_size' => array('width' => '100%', 'height' => 250),
		'rotation' => 0,
		'color' => '#ffffff',
		'background' => '#000000',
		'image_id' => 0,
		'align' => 'left',
		'stretch' => false,

		'type' => 'UimageModel',
		'view_class' => 'UimageView',
		'has_settings' => 1,
		'class' =>  'c34 upfront-image'
	);

	function __construct($data) {
		$data['properties'] = $this->merge_default_properties($data);
		parent::__construct($data);
	}

	protected function merge_default_properties($data){
		$flat = array();
		if(!isset($data['properties']))
			return $flat;

		foreach($data['properties'] as $prop)
			$flat[$prop['name']] = $prop['value'];

		$flat = array_merge($this->defaults, $flat);

		$properties = array();
		foreach($flat as $name => $value)
			$properties[] = array('name' => $name, 'value' => $value);

		return $properties;
	}

	public function get_markup () {
		$data = $this->properties_to_array();

		if($data['when_clicked'] == 'show_larger_image'){
			wp_enqueue_style('magnific');
			wp_enqueue_script('magnific');
		}
		
		$url = false;
		if($data['when_clicked'] == 'open_link')
			$url = $data['image_link'];
		else if($data['when_clicked'] == 'show_larger_image')
			$url = $data['srcFull'];
		$data['url'] = $url;

		if(is_numeric($data['size']['width']))
			$data['size']['width'] .= '%';
		if(is_numeric($data['size']['height']))
			$data['size']['height'] .= '%';

		$data['wrapper_id'] = str_replace('image-object-', 'wrapper-', $data['element_id']);


		$data['wrapper_id'] = 'hello_up';
		
		if($data['stretch'])
			$data['imgWidth'] = '100%';
		else
			$data['imgWidth'] = '';
		
		$markup = upfront_get_template('uimage', $data, dirname(dirname(__FILE__)) . '/tpl/image.html');

		if($data['when_clicked'] == 'show_larger_image'){
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
			'defaults' => $this->defaults,
			'template' => upfront_get_template_url('uimage', upfront_element_url('tpl/image.html', dirname(__FILE__)))
		);
		return $data;
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}
	
	public static function add_styles_scripts () {
		wp_deregister_script('jquery-form');
		wp_register_script('jquery-form', upfront_element_url('js/jquery.form.min.js', dirname(__FILE__)), array('jquery'), '3.36.0');
		wp_enqueue_script('jquery-form');

		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_style('uimage-style', upfront_element_url('css/uimage.css', dirname(__FILE__)));
		wp_enqueue_script('wp-color-picker');
		
		//Lightbox
		//wp_enqueue_style('magnific');
		//wp_enqueue_script('magnific');
	}
}

class Upfront_Uimage_Server extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}
	private function _add_hooks() {
		add_action('wp_ajax_upfront-media-image_sizes', array($this, "get_image_sizes"));
		add_action('wp_ajax_upfront-media-image-create-size', array($this, "create_image_size"));
	}

	function create_image_size(){
		$data = stripslashes_deep($_POST);

		if(! $data['id'])
			return $this->_out(new Upfront_JsonResponse_Error("Invalid image ID"));

		if(!current_user_can('edit_post', $data['id']) )
			wp_die( -1 );

		$rotate = isset($data['rotate']) && is_numeric($data['rotate']) ? $data['rotate'] : false;
		$resize = isset($data['resize']) ? $data['resize'] : false;
		$crop = isset($data['crop']) ? $data['crop'] : false;

		if(!$rotate && !$resize && !$crop)
			return $this->_out(new Upfront_JsonResponse_Error("No modifications"));

		$img = wp_get_image_editor( _load_image_to_edit_path( $data['id'] ) );

	    if ( is_wp_error( $img ) )
			return $this->_out(new Upfront_JsonResponse_Error("Invalid image ID"));

		
		
		if($rotate && !$img->rotate(-$rotate))
			return $this->_out(new Upfront_JsonResponse_Error("There was an error editing the image."));

		$full_size = $img->get_size();
		//Cropping for resizing allows to make the image bigger
		if($resize && !$img->crop(0, 0, $full_size['width'], $full_size['height'], $resize['width'], $resize['height'], false))
			return $this->_out(new Upfront_JsonResponse_Error("There was an error editing the image."));

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
		$path = get_attached_file($data['id']);
		$path_parts = pathinfo( $path );
		$filename = $path_parts['filename'] . '-' . $img->get_suffix() . '-' . rand(1000, 9999);
		$imagepath = $path_parts['dirname'] . '/' . $filename . '.' . $path_parts['extension'];


		$img->set_quality(90);
		$saved = $img->save($imagepath);

		if ( is_wp_error( $img ) )
			return $this->_out(new Upfront_JsonResponse_Error("There was an error saving the edited image."));

		$urlOriginal = wp_get_attachment_image_src($data['id'], 'full');
		$urlOriginal = $urlOriginal[0];
		$url  = str_replace($path_parts['filename'], $filename, $urlOriginal);

		if($rotate){
			//We must do a rotated version of the full size image
			$fullsizename = $path_parts['filename'] . '-r' . $rotate ;
			$fullsizepath = $path_parts['dirname'] . '/' . $fullsizename . '.' . $path_parts['extension'];
			if(!file_exists($fullsizepath)){
				$full = wp_get_image_editor( _load_image_to_edit_path( $data['id'] ) );
				$full->rotate(-$rotate);
				$full->set_quality(90);
				$full->save($fullsizepath);
			}
			$urlOriginal = str_replace($path_parts['filename'], $fullsizename, $urlOriginal);
		}		

		return $this->_out(new Upfront_JsonResponse_Success(array('url' => $url, 'urlOriginal' => $urlOriginal, 'full' => $full_size, 'crop' => $img->get_size())));
	}

	function get_image_sizes() {
        $data = stripslashes_deep($_POST);
        
        $item_id = !empty($data['item_id']) ? $data['item_id'] : false;
        if (!$item_id) 
        	$this->_out(new Upfront_JsonResponse_Error("Invalid image ID"));

        $ids = json_decode($item_id);

        if(is_null($ids) || !is_array($ids))
        	$this->_out(new Upfront_JsonResponse_Error("Invalid image ID"));

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
}
Upfront_Uimage_Server::serve();