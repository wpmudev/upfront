<?php

class Upfront_FacepileView extends Upfront_Object {

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';

        if(get_option('upfront_social_media_global_settings')){

            $is_show_counts = $this->_get_property("is_show_counts") ? 'true' : 'false';
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

            return "<div class='upfront-output-object upfront-facepile ' {$element_id}>" .
            "<iframe src='//www.facebook.com/plugins/facepile.php?href=https%3A%2F%2Fwww.facebook.com%2F{$facebook_page_name}&amp;app_id&amp;action&amp;max_rows=3&amp;size=medium&amp;show_count={$is_show_counts}&amp;width=256&amp;colorscheme=light' scrolling='no' frameborder='0' style='border:none; overflow:hidden; width:256px;' allowTransparency='true'></iframe>".
            "</div>";
        }else{
            return "<div class='upfront-output-object upfront-facepile ' {$element_id}>" .
            "Whoops! it looks like you need to update your settings".
            "</div>";
        }

    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-facepile', upfront_element_url('css/upfront-facepile-style.css', dirname(__FILE__)));
    }
}

