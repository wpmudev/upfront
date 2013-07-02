<?php

class Upfront_SocialMediaView extends Upfront_Object {

    public function __construct() {
        add_filter('the_content', array($this, "my_the_content_filter"));
    }
    const COUNT_ERROR = 'Error';

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';

        //TODO: Inject Social buttons to post top and bottom

        $panel_settings = json_decode($this->_get_property("social_media_panel_settings"));

        switch ($panel_settings->layoutStyle) {
            case 0:
                return "Please select an option from backend";
                break;
            case 1:
                return "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::like_follow_plus_one($panel_settings).
                "</div>";
                break;
            case 2:
                return "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::fan_follower_count($panel_settings).
                "</div>";
                break;
            case 3:
                return "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::call_to_action($panel_settings).
                "</div>";
                break;
        }

    }

    public static function like_follow_plus_one($social_services){
        $counter_options = $social_services->counterOptions;
        $output = '<div class="upfront-like-follow-plusone-box">';

        foreach($social_services->likeSocialMediaServices as $service) :
            if($service->value == 0) return;
            //TODO: Get post url and short content
            $page_url = 'http://furqankhanzada.com/backbonejs/task/';
            $page_content = 'Hi, Here is the test content';

            $output .= '<div data-id="upfront-icon-'.$service->id.'" class="upfront-social-icon">';
            switch ($service->id) {
                case 1:
                    $facebook_button = $counter_options ? "box_count" : "button_count";
                    $facebook_width = $counter_options ? "45" : "72";
                    $facebook_height = $counter_options ? "65" : "20";

                    $output .= "<iframe src='//www.facebook.com/plugins/like.php?".
                    "href=".rawurlencode($page_url)."&amp;".
                    "send=false&amp;".
                    "layout={$facebook_button}&amp;".
                    "width={$facebook_width}&amp;".
                    "show_faces=true&amp;".
                    "font&amp;".
                    "colorscheme=light&amp;".
                    "action=like&amp;".
                    "height={$facebook_height}' ".
                    "scrolling='no' frameborder='0' ".
                    "style='border:none; overflow:hidden; ".
                    "width:{$facebook_width}px; ".
                    "height:{$facebook_height}px;' ".
                    "allowTransparency='true'></iframe>";
                    break;
                case 2:
                    $tweet_button = $counter_options ? "vertical" : "horizontal";
                    $tweet_width = $counter_options ? "60" : "80";
                    $tweet_height = $counter_options ? "63" : "20";

                    $output .= "<iframe allowtransparency='true' frameborder='0' scrolling='no' src='https://platform.twitter.com/widgets/tweet_button.html?".
                        "url=".rawurlencode($page_url)."&amp;".
                        "text={$page_content}&amp;".
                        "count={$tweet_button}&amp;".
                        "size=medium' ".
                        "style='width:{$tweet_width}px; ".
                        "height:{$tweet_height}px;'></iframe>";
                    break;
                case 3:
                    $google_button = $counter_options ? "tall" : "medium";
                    $google_width = $counter_options ? "50" : "72";
                    $output .= "<script type='text/javascript' src='https://apis.google.com/js/plusone.js'></script><g:plusone width='".$google_width."' size='{$google_button}'></g:plusone>";
                    break;

            }
            $output .= '';
            $output .= '</div>';

        endforeach;
        $output .= '</div>';
        return $output;
    }

    public function get_twitter_page_followers () {

        $url = Upfront_SocialMedia_Setting::get_page_url('twitter_page_url');
        if($url){
            $page_url = Upfront_SocialMedia_Setting::get_last_part_of_page_url($url);
        }
        else{
            $page_url = false;
        }

        if ($page_url){
            $page = wp_remote_get("https://twitter.com/users/show/{$page_url}?format=json", array(
                "sslverify" => false,
            ));
            if (200 == wp_remote_retrieve_response_code($page)) {
                $body = @json_decode(wp_remote_retrieve_body($page), true);
                $count = !empty($body['followers_count']) ? (int)$body['followers_count'] : self::COUNT_ERROR;
            } else $count = self::COUNT_ERROR;

            return $count;
        }
        return 'Twitter page not found';
    }

    public function get_google_page_subscriber () {

        $url = Upfront_SocialMedia_Setting::get_page_url('google_page_url');
        if($url){
            $page_url = Upfront_SocialMedia_Setting::get_last_part_of_page_url($url);
        }
        else{
            $page_url = false;
        }

        if ($page_url){
            $page = wp_remote_get('https://plusone.google.com/_/+1/fastbutton?bsv&annotation=inline&hl=it&url=' . urlencode('https://plus.google.com/' . $page_url), array(
                'sslverify' => false,
            ));
            if (200 == wp_remote_retrieve_response_code($page)) {
                $body = wp_remote_retrieve_body($page);
                if (preg_match('/window.__SSR *= *{c: *(\d+)/is', $body, $match) ){
                    $count = $match[1];
                } else $count = self::COUNT_ERROR;
            } else $count = self::COUNT_ERROR;

            return $count;
        }
        return 'Google page not found';
    }

    public function get_facebook_page_likes () {

        $url = Upfront_SocialMedia_Setting::get_page_url('facebook_page_url');
        if($url){
            $page_url = Upfront_SocialMedia_Setting::get_last_part_of_page_url($url);
        }
        else{
            $page_url = false;
        }

        if ($page_url){
            $page = wp_remote_get("https://graph.facebook.com/{$page_url}", array(
                'sslverify' => false,
            ));
            if (200 == wp_remote_retrieve_response_code($page)) {
                $body = @json_decode(wp_remote_retrieve_body($page), true);
                $count = !empty($body['likes']) ? (int)$body['likes'] : self::COUNT_ERROR;
            } else $count = self::COUNT_ERROR;

            return $count;
        }
        return 'Facebook page not found';
    }

    public static function fan_follower_count($social_services){
        $output = '<div class="upfront-fan-follower-count-box">';

        foreach($social_services->fanSocialMediaServices as $service) :
            $output .= '<div data-id="upfront-icon-'.$service->id.'" class="upfront-social-icon">';
            $output .= '<a target="_blank" href="'.$service->url.'">';
            $output .= $service->name;
            $service->id === 1 ? $output .= '<span> '.self::get_facebook_page_likes().' Fans</span>' : '';
            $service->id === 2 ? $output .= '<span> '.self::get_twitter_page_followers().' Followers</span>' : '';
            $service->id === 3 ? $output .= '<span> '.self::get_google_page_subscriber().' Subscribers</span>' : '';
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
            $output .= '<a target="_blank" href="'.$service->url.'">';
            $output .= $service->name;
            $output .= '</a>';
            $output .= '</div>';
        endforeach;
        $output .= '</div>';
        return $output;
    }

    /**
     * Add a icon to the beginning of every post page.
     *
     * @uses is_single()
     */
    public function my_the_content_filter( $content ) {

        if ( is_single() )
            // Add image to the beginning of each page
        $content = sprintf(
            '<img class="post-icon" src="%s/images/post_icon.png" alt="Post icon" title=""/>%s',
            get_bloginfo( 'stylesheet_directory' ),
            $content
        );

        // Returns the content.
        return $content;
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
    const COUNT_ERROR = 'Error';
    private function _add_hooks () {
        add_action('wp_ajax_upfront_save_social_media_global_settings', array($this, "save_social_media_global_settings"));
        add_action('wp_ajax_upfront_get_social_media_global_settings', array($this, "get_social_media_global_settings"));
        add_action('wp_ajax_upfront_get_twitter_page_likes', array($this, "get_twitter_page_likes"));
        add_action('wp_ajax_upfront_get_google_page_subscribers', array($this, "get_google_page_subscribers"));
    }

    public static function array_search_i($str,$array){
        foreach($array as $key => $model) {
            if ($model->name == $str)  :
                return $page_name = $model->value; // get the value of the last element
            endif;
        }
        return false;
    }

    public static function get_last_part_of_page_url($url){
        $keys = parse_url($url); // parse the url
        $path = explode("/", $keys['path']); // splitting the path
        return $facebook_page_name = end($path); // get the value of the last element
    }

    public static function get_page_url($url){
        $upfront_social_media_global_settings = get_option('upfront_social_media_global_settings');
        if($upfront_social_media_global_settings){
            $settings = json_decode($upfront_social_media_global_settings);
            return self::array_search_i($url,$settings);
        }
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

    public function get_twitter_page_likes () {

        $url = $this->get_page_url('twitter_page_url');
        if($url){
            $page_url = $this->get_last_part_of_page_url($url);
        }
        else{
            $page_url = false;
        }

        if ($page_url){
            $page = wp_remote_get("https://twitter.com/users/show/{$page_url}?format=json", array(
                "sslverify" => false,
            ));
            if (200 == wp_remote_retrieve_response_code($page)) {
                $body = @json_decode(wp_remote_retrieve_body($page), true);
                $count = !empty($body['followers_count']) ? (int)$body['followers_count'] : self::COUNT_ERROR;
            } else $count = self::COUNT_ERROR;

            $this->_out(new Upfront_JsonResponse_Success($count));
        }
        $this->_out(new Upfront_JsonResponse_Error('Twitter page not found'));
    }

    public function get_google_page_subscribers () {
        $url = $this->get_page_url('google_page_url');
        if($url){
            $page_url = $this->get_last_part_of_page_url($url);
        }
        else{
            $page_url = false;
        }
        if ($page_url){
                $page = wp_remote_get('https://plusone.google.com/_/+1/fastbutton?bsv&annotation=inline&hl=it&url=' . urlencode('https://plus.google.com/' . $page_url), array(
                    'sslverify' => false,
                ));
                if (200 == wp_remote_retrieve_response_code($page)) {
                    $body = wp_remote_retrieve_body($page);
                    if (preg_match('/window.__SSR *= *{c: *(\d+)/is', $body, $match) ){
                        $count = $match[1];
                    } else $count = self::COUNT_ERROR;
                } else $count = self::COUNT_ERROR;

            $this->_out(new Upfront_JsonResponse_Success($count));
        }
        $this->_out(new Upfront_JsonResponse_Error('Google page not found'));
    }

}

Upfront_SocialMedia_Setting::serve();
