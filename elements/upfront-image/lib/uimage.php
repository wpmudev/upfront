<?php
/**
 * Image element for Upfront
 */
class Upfront_UimageView extends Upfront_Object {
	public function get_markup () {
		return "Hola";
	}

	public static function add_styles_scripts () {
		wp_enqueue_style('uimage-style', upfront_element_url('css/uimage.css', dirname(__FILE__)));
		wp_enqueue_script('jquery-form');
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

        $item = get_post($item_id);

        if(!$item || $item->post_type != 'attachment' || substr($item->post_mime_type, 0, 5) != 'image')
        	$this->_out(new Upfront_JsonResponse_Error("That is not a image ID"));

        $sizes = get_intermediate_image_sizes();
		$sizes[] = 'full';
		$images = array();

		foreach ( $sizes as $size ) {
			$image = wp_get_attachment_image_src( $item_id, $size);
			if ( !empty( $image ) )
				$images[$size] = $image;
		}

        return $this->_out(new Upfront_JsonResponse_Success($images));
	}
}
Upfront_Uimage_Server::serve();