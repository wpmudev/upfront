<?php

class Upfront_SocialMediaView extends Upfront_Object {

    const COUNT_ERROR = 'Error';

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';
        $layout_style = $this->_get_property('social_radio_tabbed');

        switch ($layout_style) {
            case '':
                return "Please select an option from backend";
                break;
            case 'like_tabbed':
                return "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::like_follow_plus_one().
                "</div>";
                break;
            case 'count_tabbed':
                return "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::fan_follower_count().
                "</div>";
                break;
            case 'call_tabbed':
                return "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::call_to_action().
                "</div>";
                break;
        }

    }

    public function like_follow_plus_one(){
        $counter_options = $this->_get_property('counter_options');
        $like_social_media_services = $this->_get_property('like_social_media_services');

        global $post;

        $content = strip_shortcodes(wp_filter_nohtml_kses($post->post_content));
        $content = substr($content,0,55);

        $page_url = (is_home() ? site_url() : $post->guid);
        $page_content = (is_home() ? '' : $content.'...');

        $output = '<div class="upfront-like-follow-plusone-box">';
        if(!$like_social_media_services) return;
        foreach($like_social_media_services as $social) :

            $output .= '<div data-id="upfront-icon-'.$social.'" class="upfront-social-icon">';
            switch ($social) {
                case 'facebook':
                    $facebook_button = $counter_options == 'horizontal' ? 'button_count' : 'box_count';
                    $facebook_width = $counter_options == 'horizontal' ? "92" : "65";
                    $facebook_height = $counter_options == 'horizontal' ? "20" : "65";

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
                    "max-width:{$facebook_width}px; ".
                    "height:{$facebook_height}px;' ".
                    "allowTransparency='true'></iframe>";
                    break;
                case 'twitter':
                    $tweet_button = $counter_options == 'horizontal' ? "horizontal" : "vertical";
                    $tweet_width  = $counter_options == 'horizontal' ? "100" : "80";
                    $tweet_height = $counter_options == 'horizontal' ? "20" : "63";

                    $output .= "<iframe allowtransparency='true' frameborder='0' scrolling='no' src='https://platform.twitter.com/widgets/tweet_button.html?".
                        "url=".rawurlencode($page_url)."&amp;".
                        "text={$page_content}&amp;".
                        "count={$tweet_button}&amp;".
                        "size=medium' ".
                        "style='width:{$tweet_width}px; ".
                        "height:{$tweet_height}px;'></iframe>";
                    break;
                case 'google':
                    $google_button = $counter_options == 'horizontal' ? "medium" : "tall";
                    $google_width = $counter_options == 'horizontal' ? "72" : "50";
                    $output .= "<script type='text/javascript' src='https://apis.google.com/js/plusone.js'></script><g:plusone width='".$google_width."' size='{$google_button}'></g:plusone>";
                    break;

            }
            $output .= '';
            $output .= '</div>';

        endforeach;
        $output .= '</div>';
        return $output;
    }

    function get_twitter_page_followers () {

        $url = $this->_get_property('count_social_media_services-twitter-url');
        $consumer_key = $this->_get_property('twitter-consumer-key');
        $consumer_secret = $this->_get_property('twitter-consumer-secret');

        if($url && $consumer_key && $consumer_secret){
            $page_name = Upfront_SocialMedia_Setting::get_last_part_of_page_url($url);
        }
        else{
            return false;
        }

        $user_twitter_name = $page_name;
        $token = get_option('upfront_twitter_token');
        $followers_count = get_transient('upfront_twitter_count');

        if (false !== $followers_count && $followers_count) return number_format($followers_count);

        // Get new token if there isn't one
        if (!$token) {
            $credentials = $consumer_key . ':' . $consumer_secret;
            $to_send = base64_encode($credentials);

            $args = array(
                'method' => 'POST',
                'httpversion' => '1.1',
                'blocking' => true,
                'sslverify' => false,
                'headers' => array(
                    'Authorization' => 'Basic ' . $to_send,
                    'Content-Type' =>
                    'application/x-www-form-urlencoded;charset=UTF-8'
                ),
                'body' => array( 'grant_type' => 'client_credentials' )
            );
            $response =
                wp_remote_post('https://api.twitter.com/oauth2/token', $args);
            if (is_wp_error($response)) return false; // Something went wrong

            $keys = json_decode(wp_remote_retrieve_body($response));

            if ($keys) {
                update_option('upfront_twitter_token', $keys->access_token);
                $token = $keys->access_token;
            }
        }

        // Do the actual remote call
        $args = array(
            'httpversion' => '1.1',
            'blocking' => true,
            'sslverify' => false,
            'headers' => array(
                'Authorization' => "Bearer {$token}"
            )
        );

        $api_url = "https://api.twitter.com/1.1/users/show.json?screen_name={$user_twitter_name}";
        $response = wp_remote_get($api_url, $args);

        if (!is_wp_error($response)) {
            $followers = json_decode(wp_remote_retrieve_body($response));
            $followers_count = $followers->followers_count;
        }

        set_transient('upfront_twitter_count', $followers_count, 60
            * 60 * 24);

        return ($followers_count);
    }

    public function get_google_page_subscriber () {

        $url = $this->_get_property('count_social_media_services-google-url');
        if($url){
            $page_url = Upfront_SocialMedia_Setting::get_last_part_of_page_url($url);
        }
        else{
            return false;
        }

        if ($page_url){
            $page = wp_remote_get('https://plusone.google.com/_/+1/fastbutton?bsv&annotation=inline&hl=it&url=' . urlencode('https://plus.google.com/' . $page_url), array(
                'sslverify' => false,
            ));
            if (200 == wp_remote_retrieve_response_code($page)) {
                $body = wp_remote_retrieve_body($page);
                if (preg_match('/window.__SSR *= *{c: *(\d+)/is', $body, $match) ){
                    $count = $match[1];
                   set_transient('upfront_google_count', $count, 60
                       * 60 * 24);
                } else $count = self::COUNT_ERROR;
            } else $count = self::COUNT_ERROR;

            return $count;
        }
        return 'Google page not found';
    }

    public function get_facebook_page_likes () {

        $url = $this->_get_property('count_social_media_services-facebook-url');
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

    public function fan_follower_count(){
        $count_social_media_services = $this->_get_property('count_social_media_services');
        $output = '<div class="upfront-fan-follower-count-box">';

        foreach($count_social_media_services as $social) :

            switch ($social)
            {
                case 'facebook':
                    $iconClass = 'facebook-count';
                    $url = $this->_get_property('count_social_media_services-facebook-url');
                    $output .= '<div data-id="upfront-icon-'.$social.'" class="ufront-'.$iconClass.'-box upfront-social-icon">';
                    $output .= '<a class="upfront-fan-counts '.$iconClass.'" target="_blank" href="'.( $url ? $url : '#' ).'">';
                    if($url){
                        $output .= '<span class="upfront-fan-count"><strong>'.self::get_facebook_page_likes().'</strong> Fans</span>';
                    }else{
                        $output .= '<span class="alert-url">!</span>';
                    };
                    $output .= '</a>';
                    $output .= '</div>';
                    break;
                case 'twitter':
                    $iconClass = 'twitter-count';
                    $url = $this->_get_property('count_social_media_services-twitter-url');
                    $output .= '<div data-id="upfront-icon-'.$social.'" class="ufront-'.$iconClass.'-box upfront-social-icon">';
                    $output .= '<a class="upfront-fan-counts '.$iconClass.'" target="_blank" href="'.( $url ? $url : '#' ).'">';
                    if($url){
                        $output .= '<span class="upfront-fan-count"><strong>'.self::get_twitter_page_followers().'</strong> Followers</span>';
                    }else{
                        $output .= '<span class="alert-url">!</span>';
                    };
                    $output .= '</a>';
                    $output .= '</div>';
                    break;
                case 'google':
                    $iconClass = 'gplus-count';
                    $url = $this->_get_property('count_social_media_services-google-url');
                    $output .= '<div data-id="upfront-icon-'.$social.'" class="ufront-'.$iconClass.'-box upfront-social-icon">';
                    $output .= '<a class="upfront-fan-counts '.$iconClass.'" target="_blank" href="'.( $url ? $url : '#' ).'">';
                    if($url){
                        $output .= '<span class="upfront-fan-count"><strong>'.self::get_google_page_subscriber().'</strong> Subscribers</span>';
                    }else{
                        $output .= '<span class="alert-url">!</span>';
                    };
                    $output .= '</a>';
                    $output .= '</div>';
                    break;
            }

        endforeach;
        $output .= '</div>';
        return $output;
    }

    public function call_to_action(){
        $call_social_media_services = $this->_get_property('call_social_media_services');
        $button_style = $this->_get_property('button_style');
        $button_size = $this->_get_property('button_size');

        $output = '';
        foreach($call_social_media_services as $social) :
            switch ($social)
            {
                case 'facebook':
                    $iconClass = 'facebook-link';
                    $url = $this->_get_property('call_social_media_services-facebook-url');
                    break;
                case 'twitter':
                    $iconClass = 'twitter-link';
                    $url = $this->_get_property('call_social_media_services-twitter-url');
                    break;
                case 'google':
                    $iconClass = 'gplus-link';
                    $url = $this->_get_property('call_social_media_services-google-url');
                    break;
                case 'linked-in':
                    $iconClass = 'linkedin-link';
                    $url = $this->_get_property('call_social_media_services-linked-in-url');
                    break;
                case 'pinterest':
                    $iconClass = 'pinterest-link';
                    $url = $this->_get_property('call_social_media_services-pinterest-url');
                    break;
                case 'youtube':
                    $iconClass = 'youtube-link';
                    $url = $this->_get_property('call_social_media_services-youtube-url');
                    break;
            }

            $output .= '<div class="ufront-'.$iconClass.'-box upfront-social-icon upfront-'.$button_style.' upfront-button-size-'.$button_size.'">';
            $output .= '<a class="upfront-call-to-action '.$iconClass.'" target="_blank" href="'.($url ? $url : '#' ).'"></a>';
            $output .= (!$url ? '<span class="alert-url">!</span>':'' );
            $output .= '</div>';
        endforeach;
        return $output;
    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-social-media', upfront_element_url('css/upfront-social-media-style.css', dirname(__FILE__)));
        if(is_user_logged_in()):
            wp_enqueue_script(array('jquery-ui-sortable'));
        endif;
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
        add_action('wp_ajax_upfront_get_twitter_page_likes', array($this, "get_twitter_page_likes"));
        add_action('wp_ajax_upfront_get_google_page_subscribers', array($this, "get_google_page_subscribers"));
        add_filter('the_content', array($this, "upfront_the_content_filter"));
    }

    public static function upfront_the_content_filter( $content ) {
            $output = '';
            $old_content = $content;
            if ( is_single() ):
                global $post;
                $add_counter_all_posts = self::get_value_by_name('add_counter_all_posts');
                if ( get_option('upfront_social_media_global_settings') && $add_counter_all_posts[0] == 'yes' ) :
                    $content = strip_shortcodes(wp_filter_nohtml_kses($post->post_content));
                    $content = substr($content,0,55);

                    $page_url = (is_home() ? site_url() : $post->guid);
                    $page_content = (is_home() ? '' : $content.'...');
                    $counter_options = self::get_value_by_name('counter_options');

                    $facebook_button = $counter_options == 'horizontal' ? 'button_count' : 'box_count';
                    $facebook_width = $counter_options == 'horizontal' ? "92" : "65";
                    $facebook_height = $counter_options == 'horizontal' ? "20" : "65";

                    $tweet_button = $counter_options == 'horizontal' ? "horizontal" : "vertical";
                    $tweet_width  = $counter_options == 'horizontal' ? "100" : "80";
                    $tweet_height = $counter_options == 'horizontal' ? "20" : "63";

                    $google_button = $counter_options == 'horizontal' ? "medium" : "tall";
                    $google_width = $counter_options == 'horizontal' ? "72" : "50";

                    switch (self::get_value_by_name("after_post_title_alignment")) {
                        case 'left':
                            $location_top_alignment = 'left';
                            break;
                        case 'center':
                            $location_top_alignment = 'center';
                            break;
                        case 'right':
                            $location_top_alignment = 'right';
                            break;
                    }

                    switch (self::get_value_by_name("after_post_content_alignment")) {
                        case 'left':
                            $location_bottom_alignment = 'left';
                            break;
                        case 'center':
                            $location_bottom_alignment = 'center';
                            break;
                        case 'right':
                            $location_bottom_alignment = 'right';
                            break;
                    }
                    $after_post_title = self::get_value_by_name("after_post_title");
                    $after_post_content = self::get_value_by_name("after_post_content");
                    $location_top = ($after_post_title[0] == 'yes' ? "data-alignment='{$location_top_alignment}'" : "");
                    $location_bottom = ($after_post_content[0] == 'yes' ? "data-alignment='{$location_bottom_alignment}'" : "");

                    $facebook_icon = "<div class='upfront-share-item upfront-share-item-facebook'>".
                        "<iframe src='//www.facebook.com/plugins/like.php?".
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
                        "max-width:{$facebook_width}px; ".
                        "height:{$facebook_height}px;' ".
                        "allowTransparency='true'></iframe>".
                        "</div>";

                    $twitter_icon = "<div class='upfront-share-item upfront-share-item-twitter'>".
                        "<iframe allowtransparency='true' frameborder='0' scrolling='no' src='https://platform.twitter.com/widgets/tweet_button.html?".
                        "url=".rawurlencode($page_url)."&amp;".
                        "text={$page_content}&amp;".
                        "count={$tweet_button}&amp;".
                        "size=medium' ".
                        "style='width:{$tweet_width}px; ".
                        "height:{$tweet_height}px;'></iframe>".
                        "</div>";

                    $gplus_icon = "<div class='upfront-share-item upfront-share-item-plusone'>".
                        "<script type='text/javascript' src='https://apis.google.com/js/plusone.js'></script><g:plusone width='".$google_width."' size='{$google_button}'></g:plusone>".
                        "</div>";
                    $after_post_title = self::get_value_by_name("after_post_title");
                    if($after_post_title[0] == 'yes'):
                        $output .= "<div class='upfront-entry-share upfront-entry-share-top' {$location_top} >";
                        $services = self::get_value_by_name("global_social_media_services");
                        if($services):
                            foreach($services as $service){
                                switch ($service) {
                                    case 'facebook':
                                        $output .=  $facebook_icon;
                                        break;
                                    case 'twitter':
                                        $output .=  $twitter_icon;
                                        break;
                                    case 'google':
                                        $output .=  $gplus_icon;
                                        break;
                                }
                            }
                        endif;
                        $output .= "</div>";
                    endif;

                    $output .= $old_content;

                    $after_post_content = self::get_value_by_name("after_post_content");
                    if($after_post_content[0] == 'yes'):
                        $output .= "<div class='upfront-entry-share upfront-entry-share-bottom' {$location_bottom} >";
                        $services = self::get_value_by_name("global_social_media_services");
                        if($services):
                            foreach($services as $service){
                                switch ($service) {
                                    case 'facebook':
                                        $output .=  $facebook_icon;
                                        break;
                                    case 'twitter':
                                        $output .=  $twitter_icon;
                                        break;
                                    case 'google':
                                        $output .=  $gplus_icon;
                                        break;
                                }
                            }
                        endif;
                        $output .= "</div>";
                    endif;

                else:
                    $output = $old_content;
                endif; // settings end
            else:
                $output = $old_content;
            endif;
            // Returns the content.
            return $output;
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

    public static function get_value_by_name($url){
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

    public function get_twitter_page_likes () {
        $followers_count = get_transient('upfront_twitter_count');
        if (false !== $followers_count){
            $this->_out(new Upfront_JsonResponse_Success(number_format($followers_count)));
        }
        $this->_out(new Upfront_JsonResponse_Error('Twitter count not found'));
    }

    public function get_google_page_subscribers () {
        $followers_count = get_transient('upfront_google_count');
        if (false !== $followers_count){
            $this->_out(new Upfront_JsonResponse_Success(number_format($followers_count)));
        }
        $this->_out(new Upfront_JsonResponse_Error('Google count not found'));
    }

}

Upfront_SocialMedia_Setting::serve();

function upfront_social ($data) {
    $data['social'] = array(
        "settings" => get_option('upfront_social_media_global_settings')
    );
    return $data;
}
add_filter('upfront_data', 'upfront_social');