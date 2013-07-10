<?php

class Upfront_LikeBoxView extends Upfront_Object {

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';

        if(get_option('upfront_social_media_global_settings')){

            $global_settings = json_decode(get_option('upfront_social_media_global_settings'));

            foreach ($global_settings as $key => $models) :
                if ($models->name == "facebook_page_url")  :
                    $url = $models->value;
                    $keys = parse_url($url); // parse the url
                    $path = explode("/", $keys['path']); // splitting the path
                    $facebook_page_name = end($path); // get the value of the last element
                    break;
                endif;
            endforeach;

            return "<div class='upfront-output-object upfront-like-box ' {$element_id}>" .
            "<iframe src='//www.facebook.com/plugins/likebox.php?href=https%3A%2F%2Fwww.facebook.com%2F{$facebook_page_name}&amp;width=292&amp;height=258&amp;show_faces=true&amp;colorscheme=light&amp;stream=false&amp;show_border=true&amp;header=false' scrolling='no' frameborder='0' style='border:none; overflow:hidden; width:292px; height:258px;' allowTransparency='true'></iframe>".
            "</div>";
        }else{
            return "<div class='upfront-output-object upfront-like-box ' {$element_id}>" .
            "Whoops! it looks like you need to update your settings".
            "</div>";
        }

    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-like-box', upfront_element_url('css/upfront-like-box-style.css', dirname(__FILE__)));
    }
}

