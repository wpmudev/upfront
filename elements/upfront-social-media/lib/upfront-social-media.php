<?php

class Upfront_SocialMediaView extends Upfront_Object {

    public function get_markup () {

        return "Upfront Social Media";
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
