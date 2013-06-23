<?php

class Upfront_SocialMediaView extends Upfront_Object {

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';

        $panel_settings = json_decode($this->_get_property("social_media_panel_settings"));

        switch ($panel_settings->layoutStyle) {
            case 0:
                return "Please select an option from backend";
                break;
            case 1:
                return self::like_follow_plus_one($panel_settings);
                break;
            case 2:
                return self::fan_follower_count($panel_settings);
                break;
            case 3:
                return self::call_to_action($panel_settings);
                break;
        }

    }

    public static function like_follow_plus_one($social_services){
        $output = '<div class="upfront-like-follow-plusone-box">';
        foreach($social_services->likeSocialMediaServices as $service) :
            $output .= '<div data-id="upfront-icon-'.$service->id.'" class="upfront-social-icon">';
            $output .= $service->name;
            $output .= '</div>';
        endforeach;
        $output .= '</div>';
        return $output;
    }

    public static function fan_follower_count($social_services){
        $output = '<div class="upfront-fan-follower-count-box">';
        foreach($social_services->fanSocialMediaServices as $service) :
            $output .= '<div data-id="upfront-icon-'.$service->id.'" class="upfront-social-icon">';
            $output .= '<a href="'.$service->url.'">';
            $output .= $service->name;
            $output .= '<span> 666</span>';
            $output .= '</a>';
            $output .= '</div>';
        endforeach;
        $output .= '</div>';
        return $output;
    }

    public static function call_to_action($social_services){
        $output = '<div class="upfront-call-to-action-box">';
        foreach($social_services->calToActionSocialMediaServices as $service) :
            $output .= '<div data-id="upfront-icon-'.$service->id.'" class="upfront-social-icon">';
            $output .= '<a href="'.$service->url.'">';
            $output .= $service->name;
            $output .= '<span> 666</span>';
            $output .= '</a>';
            $output .= '</div>';
        endforeach;
        $output .= '</div>';
        return $output;
    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-social-media', upfront_element_url('css/upfront-social-media-style.css', dirname(__FILE__)));
        wp_enqueue_script(array('jquery-ui-sortable'));
        wp_enqueue_script(array('jquery-ui-sortable'));
    }
}

/**
 * Serves menu setting
 */
class Upfront_SocialMedia_Setting extends Upfront_Server {
    public static function serve () {
        $me = new self;
        $me->_add_hooks();
    }

    private function _add_hooks () {
        add_action('wp_ajax_upfront_save_social_media_global_settings', array($this, "save_social_media_global_settings"));
        add_action('wp_ajax_upfront_get_social_media_global_settings', array($this, "get_social_media_global_settings"));
    }

    public function save_social_media_global_settings () {

        $social_media_global_settings = isset($_POST['data']) ? stripslashes($_POST['data']) : false;

        if ($social_media_global_settings){

            $option_name = 'upfront_social_media_global_settings' ;
            $new_value = $social_media_global_settings;

            if ( get_option( $option_name ) != $new_value ) {
                $response = update_option( $option_name, $new_value );
            } else {
                $response = add_option( 'upfront_social_media_global_settings', $new_value, '', 'yes' );
            }

            $this->_out(new Upfront_JsonResponse_Success($response));
        }
        $this->_out(new Upfront_JsonResponse_Error('Settings not found'));
    }

    public function get_social_media_global_settings () {

            $this->_out(new Upfront_JsonResponse_Success( get_option('upfront_social_media_global_settings') ));

    }

}

Upfront_SocialMedia_Setting::serve();
