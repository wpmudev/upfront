<?php

class Upfront_LikeBoxView extends Upfront_Object {

    public function get_markup () {
        $element_size = $this->_get_property('element_size');
		$url = $this->_get_property('facebook_url');
        $global_settings = Upfront_SocialMedia_Setting::get_globals();

		if($url=='' && $global_settings){
            $services = $global_settings['services'];
            $url = false;

            foreach($services as $s){
                if($s->id == 'facebook')
                    $url = $s->url;
            }

            if(!$url)
                return $this->wrap('You need to set a Facebook URL in your global social settings.');
		}
        if($url) {
			$parts = parse_url($url);
            $fbname = end(explode('/', $parts['path']));

            return $this->wrap(
                "<iframe src='//www.facebook.com/plugins/likebox.php?href=https%3A%2F%2Fwww.facebook.com%2F{$fbname}&amp;width={$element_size['width']}&amp;height={$element_size['height']}&amp;show_faces=true&amp;colorscheme=light&amp;stream=false&amp;show_border=true&amp;header=false' scrolling='no' frameborder='0' style='border:none; overflow:hidden; height:{$element_size['height']}px;' allowTransparency='true'></iframe>"
            );
        }
        else{
            return $this->wrap('You need to set a Facebook URL in your global social settings 2.');
        }
    }

    protected function wrap($content){
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';
        return "<div class=' upfront-like-box ' {$element_id}>" . $content . "</div>";

    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-like-box', upfront_element_url('css/upfront-like-box-style.css', dirname(__FILE__)));
    }
    public static function add_js_defaults($data){
        $data['ulikebox'] = array(
            'defaults' => self::default_properties(),
        );
        return $data;
    }

    public static function default_properties(){
        return array(
            'id_slug' => 'Like-box-object',
            'type' => "LikeBox",
            'view_class' => "LikeBoxView",
            "class" => "c24 upfront-like-box",
            'has_settings' => 1,
            'element_size' => array(
                'width' => 278,
                'height' => 270
            )
        );
    }
}

