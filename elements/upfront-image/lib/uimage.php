<?php
/**
 * Image element for Upfront
 */
class Upfront_UimageView extends Upfront_Object {
	var $defaults = array(
		'src' => 'http://imgsrc.hubblesite.org/hu/db/images/hs-2010-22-a-web.jpg',
		'srcFull' => 'http://imgsrc.hubblesite.org/hu/db/images/hs-2010-22-a-web.jpg',
		'image_title' => '',
		'alternative_text' => '',
		'when_clicked' => 'do_nothing',
		'image_link' => false,
		'include_image_caption' => false,
		'image_caption' => '',
		'caption_position' => '',
		'caption_alignment' => 'top',
		'caption_trigger' => 'always_show',
		'image_status' => 'starting',
		'size' =>  array('width' => '100%', 'height' => 'auto'),
		'position' => array('top' => 0, 'left' => 0),
		'element_size' => array('width' => 250, 'height' => 250),
		'rotation' => 0,
		'color' => '#ffffff',
		'background' => '#000000',
		'imageId' => 0,
		'imageSizes' => false,

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
		if(!$data['properties'])
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
		
		$url = false;
		if($data['when_clicked'] == 'open_link')
			$url = $data['image_link'];
		else if($data['when_clicked'] == 'show_larger_image')
			$url = $data['srcFull'];
		$data['url'] = $url;

		if(is_numeric($data['size']['width']))
			$data['size']['width'] .= 'px';
		if(is_numeric($data['size']['height']))
			$data['size']['height'] .= 'px';
		

		return $this->get_template_content($data);
	}

	public function add_js_defaults($data){
		$data['uimage'] = array(
			'defaults' => $this->defaults
		);
		return $data;
	}

	private function get_template_content($data){
		extract($data);
		ob_start();
		include dirname(dirname(__FILE__)) . '/tpl/image.html';
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

	public static function set_jquery_form () {
		wp_deregister_script('jquery-form');
		wp_register_script('jquery-form', upfront_element_url('js/jquery.form.min.js', dirname(__FILE__)), array('jquery'), '3.36.0');

	}

	public static function add_styles_scripts () {
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_style('uimage-style', upfront_element_url('css/uimage.css', dirname(__FILE__)));
		wp_enqueue_script('jquery-form');
		wp_enqueue_script('wp-color-picker');
		
		//Lightbox
		wp_enqueue_style('magnific');
		wp_enqueue_script('magnific');
	}
}

class Upfront_Uimage_Server extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}
	private function _add_hooks() {
		add_action('wp_ajax_upfront-media-image_sizes', array($this, "get_image_sizes"));
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