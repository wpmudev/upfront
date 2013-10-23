<?php

class Upfront_SocialMediaView extends Upfront_Object {

    const COUNT_ERROR = 'Error';

    public function __construct($data) {
        parent::__construct($data);
    }

    public function get_markup () {
        $element_id = $this->_get_property('element_id');
        $element_id = $element_id ? "id='{$element_id}'" : '';
        $layout_style = $this->_get_property('social_type');
        $output = '';

        switch ($layout_style) {
            case '':
                $output = "Please select an option from backend";
                break;
            case 'likes':
                $output = "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::likes() .
                "</div>";
                break;
            case 'fans':
                $output = "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::fans() .
                "</div>";
                break;
            case 'buttons':
                $output = "<div class='upfront-output-object upfront-social' {$element_id}>" .
                    self::buttons() .
                "</div>";
                break;
        }

        $output .= $this->get_fan_counts_script();
        return $output;
    }

    function get_fan_counts_script(){
        $services = $this->_get_property('services');
        $id = $this->_get_property('element_id');
        $count = array();
        foreach($services as $s)
            $count[$s['id']] = Upfront_SocialMedia_Setting::get_count($id, $s);

        return '<script>
            if(typeof usocial == "undefined")
                usocial = {counts:{}};
            usocial.counts["' . $id . '"] = ' . json_encode($count) . ';
        </script>';
    }

    public function likes(){
        $services = $this->_get_property('services');
        $style =  $this->_get_property('counter_options');
        $url = "http://" . $_SERVER["SERVER_NAME"] . $_SERVER["REQUEST_URI"];

        return Upfront_SocialMedia_Setting:: get_likes_markup($services, $style, $url);        
    }

    public function fans(){
        $services = $this->_get_property('services');
        $words = array(
            'facebook' => 'Fans',
            'twitter' => 'Followers',
            'google' => 'Subscribers'
        );
        $output = '';
        $tpl = '<div data-id="upfront-icon-%s" class="ufront-%s-count-box upfront-social-icon usocial_count_wrapper">
                    <a class="upfront-fan-counts %s-count" href="%s">
                    %s
                    <span class="upfront-fan-count"> <strong>%s</strong> %s</span></a>
                </div>';

        foreach ($services as $s) {
            if($s['active']){
                 $count = Upfront_SocialMedia_Setting::get_count($this->_get_property('element_id'), $s, true);
                 $alert = $s['url'] ? '' : '<span class="alert-url">!</span>';

                 $output .= sprintf($tpl, $s['id'], $s['id'], $s['id'], $s['url'], $alert, $count, $words[$s['id']]);
            }
        }

        return $output;
    }

    public function buttons(){
        $services =  $this->_get_property('button_services');
        $button_style = $this->_get_property('button_style');
        $button_size = $this->_get_property('button_size');

        $output = '';
        foreach($services as $s){
            if($s['active']){
                $alert = trim($s->url) ? '<span class="alert-url">!</span>' : '';
                $output .= '<div class="upfront-' . $s['id'] . '-link-box upfront-social-icon upfront-'.$button_style.' usocial-button-'.$button_size.'">
                            <a class="usocial-button '. $s['id'] .'-link" href="'. $s['url'] .'"></a>'. $alert . '
                            </div>';
            }
        }

        if(!$output)
            return 'Please, add some social media services.';

        return $output;
    }

    // Inject style dependencies
    public static function add_public_style () {
        wp_enqueue_style('upfront-social-media', upfront_element_url('css/upfront-social-media-style.css', dirname(__FILE__)));
        if(is_user_logged_in()):
            wp_enqueue_script(array('jquery-ui-sortable'));
        endif;
    }

    //Add properties to Upfront.data
    public static function add_upfront_data ($data) {
        $globals = get_option('upfront_social_media_global_settings', false);
        $data['usocial'] = array(
            'defaults' => array(

                'social_type' => 'likes',

                'like_social_media_services' => array("facebook", "twitter", "google"),
                
                'count_social_media_services' => array(),

                'button_size' => 'medium',
                'button_style' => 'button-style-2',
                'call_social_media_services' => array(),                

                'type' => 'SocialMediaModel',
                'view_class' => 'SocialMediaView',
                'class' => 'c22 upfront-Social-Media',
                'has_settings' => 1
            ),
            'global_defaults' => array(
                'services' => array(
                    'facebook' => array('name' => 'Facebook', 'id' => 'facebook', 'url' => '', 'active' => false, 'meta' => array()),
                    'twitter' => array('name' => 'Twitter', 'id' => 'twitter', 'url' => '', 'active' => false, 'meta' => array(array('id' => 'consumer_key', 'name' => 'Consumer Key', 'value' => ''), array('id' => 'consumer_secret', 'name' => 'Consumer Secret', 'value' => ''))),
                    'google' => array('name' => 'Google +', 'id' => 'google', 'url' => '', 'active' => false, 'meta' => array())
                ),
                'inpost' => array('yes'),
                'after_title' => array('yes'),
                'after_title_align' => 'left',
                'after_content' => array(),
                'after_content_align' => 'left',
                'counter_style' => 'horizontal'
            )
        );

        if($globals)
            $data['usocial']['globals'] = Upfront_SocialMedia_Setting::properties_to_array(json_decode($globals));

        return $data;
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
        add_action('wp_ajax_usocial_save_globals', array($this, "save_social_media_global_settings"));
        add_action('wp_ajax_usocial_get_counts', array($this, 'serve_counts'));
    }

    public function serve_counts(){
        if(!$_POST['element_id'] || !$_POST['services'])
            return $this->_out(new Upfront_JsonResponse_Error('No element id'));

        $response = array();
        $element_id = $_POST['element_id'];
        $services = $_POST['services'];
        foreach($services as $s){
            $response[$s['id']] = self::get_count($element_id, $s, true);
        }

        return $this->_out(new Upfront_JsonResponse_Success($response));
    }

    public static function add_post_filters(){
        $glob = self::get_globals();
        if(!$glob || !sizeof($glob['inpost']))
            return;

        if(sizeof($glob['after_title'])){
            add_filter('the_content', array('Upfront_SocialMedia_Setting', 'social_title'));
            add_filter('the_excerpt', array('Upfront_SocialMedia_Setting', 'social_title'));
        }

        if(sizeof($glob['after_content'])){
            add_filter('the_content', array('Upfront_SocialMedia_Setting', 'social_content'));
            add_filter('the_excerpt', array('Upfront_SocialMedia_Setting', 'social_content'));
        }
    }

    public static function social_content($content){
        $glob = self::get_globals();
        $align = $glob['after_content_align'];
        return self::social_filter($align, $glob) . $content;
    }

    public static function social_title($content){
        $glob = self::get_globals();
        $align = $glob['after_title_align'];
        return $content . self::social_filter($align, $glob);
    }

    public static function social_filter($align, $glob){
        $style = $glob['counter_style'];
        $services = $glob['services'];

        return '<div class="usocial-inpost usocial-inpost-' . $align . '">' . self::get_likes_markup($services, $style) . '</div>';
    }

    public static function get_likes_markup($services, $style, $url = false){
        global $post;

        if($post){
            $text = $post->post_title;
            if(!$url)
                $url = get_permalink($post->id);
        }
        else{
            $text = get_bloginfo('description');
            if(!$url)
                $url = "http://" . $_SERVER["SERVER_NAME"] . $_SERVER["REQUEST_URI"];
        }

        $hor = $style == 'horizontal';

        if(!sizeof($services))
            return 'Please, select some social services.';

        $data = array(
            'url' => $url,
            'style' => $style,
            'width' => $hor ? 90 : 70,
            'height' => $hor ? 20 : 60,
            'size' => $hor ? 'medium' : 'tall',
            'layout' => $hor ? 'button_count' : 'box_count',
            'text' => $text
        );

        $output = '';
        foreach($services as $s){
            if(is_object($s)){
                $active = $s->active;
                $service_id = $s->id;
            }
            else{
                $active = $s['active'];
                $service_id = $s['id'];                
            }
            $output .= $active ? self::likes_tpl($service_id . '-likes', $data) : '';
        }

        return $output;
    }

    protected static function likes_tpl($name, $data){
        $tpls = array(
            'facebook-likes' => '<div data-id="upfront-icon-facebook" class="upfront-social-icon">
                            <iframe class="social-frame usocial-fb {{style}} like" src="//www.facebook.com/plugins/like.php?href={{url}}&amp;send=false&amp;layout={{layout}}&amp;width={{width}}px&amp;show_faces=true&amp;font&amp;colorscheme=light&amp;action=like&amp;height={{height}}px" scrolling="no" frameborder="0" style="border:none; overflow:hidden;" allowTransparency="true"></iframe>
                        </div>',

            'twitter-likes' => '<div data-id="upfront-icon-twitter" class="upfront-social-icon">
                <iframe class="social-frame usocial-twitter {{style}} like" allowtransparency="true" frameborder="0" scrolling="no" src="//platform.twitter.com/widgets/tweet_button.html?text={{text}}&amp;url={{url}}&amp;original_referer={{url}}&amp;count={{style}}&amp;size=medium" style=""></iframe>
            </div>',

            'google-likes' => '<div data-id="upfront-icon-google" class="upfront-social-icon social-frame usocial-google {{style}} like">
                <script type="text/javascript" src="//apis.google.com/js/plusone.js"></script>
                <div class="g-plusone" data-size="{{size}}"></div>
            </div>'
        );
        
        if(! $tpls[$name])
            return 'Wrong social template ' . $name;
        $out = $tpls[$name];
        foreach($data as $key => $value)
            $out = str_replace('{{' . $key . '}}', $value, $out);
        return $out;
    }

    public static function get_globals(){
        $glob = get_option('upfront_social_media_global_settings', false);
        if($glob)
            return self::properties_to_array(json_decode($glob));
        return false;
    }

    public static function properties_to_array($props){
        $arr = array();
        foreach($props as $prop)
            $arr[$prop->name] = $prop->value;
        return $arr;
    }

    public static function array_search_i($str,$array){
        foreach($array as $key => $model) {
            if ($model->name == $str)  :
                return $page_name = $model->value; // get the value of the last element
            endif;
        }
        return false;
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

    public static function get_count($element_id, $service, $fetch = false) {
        $id = $service['id'];
        $url = $service['url'];
        if(!$id || ! $url)
            return 'Error';

        //From transient
        $count = self::get_transient_count($element_id, $id, $url);
        if($count)
            return $count;

        if(!$fetch)
            return false;

        $transient_time = 60 * 60 * 6; //6 hours
        $transient_id = str_replace('SocialMedia-Object-', '', $element_id);
        $name = self::get_url_last_part($url);

        //Otherwise, fetch it
        if($id == 'facebook'){
            if($name){
                $count = self::COUNT_ERROR;
                $page = wp_remote_get(
                    "https://graph.facebook.com/{$name}", 
                    array('sslverify' => false)
                );
                if (200 == wp_remote_retrieve_response_code($page)) {
                    $body = @json_decode(wp_remote_retrieve_body($page), true);
                    if(!empty($body['likes'])){
                        $count = $body['likes'];
                        set_transient(
                            'usocial_facebook_' . $transient_id, 
                            array('count' => $count, 'url' => $url),
                            $transient_time
                        );
                    }
                }

                return $count;
            }
            return 'Not found';
        }

        else if($id == 'twitter'){
            $consumer_key = false;
            $consumer_secret = false;
            foreach($service['meta'] as $m){
                if($m['id'] == 'consumer_key')
                    $consumer_key = $m['value'];
                else if($m['id'] == 'consumer_secret')
                    $consumer_secret = $m['value'];
            }

            if(!$url || !$name || !$consumer_key || !$consumer_secret)
                return 'No credentials';

            // Get new token if there isn't one
            $token = self::get_twitter_token($element_id, $consumer_key, $consumer_secret);
            if (!$token) 
                return 'No twitter token';

            // Do the actual remote call
            $args = array(
                'httpversion' => '1.1',
                'blocking' => true,
                'sslverify' => false,
                'headers' => array(
                    'Authorization' => "Bearer {$token}"
                )
            );

            $api_url = "https://api.twitter.com/1.1/users/show.json?screen_name={$name}";
            $response = wp_remote_get($api_url, $args);

            if(is_wp_error($response))
                return 'Error';

            $followers = json_decode(wp_remote_retrieve_body($response));
            $followers_count = $followers->followers_count;

            set_transient(
                'usocial_twitter_'. $transient_id, 
                array('count' => $followers_count, 'url' => $url),
                $transient_time
            );

            return $followers_count;
        }

        else if($id == 'google'){
            if ($name){
                $page = wp_remote_get(
                    'https://plusone.google.com/_/+1/fastbutton?bsv&annotation=inline&hl=it&url=' . urlencode('https://plus.google.com/' . $name), 
                    array('sslverify' => false)
                );

                $count = self::COUNT_ERROR;
                if (200 == wp_remote_retrieve_response_code($page)) {
                    $body = wp_remote_retrieve_body($page);
                    if (preg_match('/window.__SSR *= *{c: *(\d+)/is', $body, $match) ){
                        $count = $match[1];
                        set_transient(
                            'usocial_google_' . $transient_id, 
                            array('count' => $count, 'url' => $url),
                            $transient_time
                        );
                    }
                }

                return $count;
            }
            return 'Google page not found';
        }
        return 'Unknow service';
    }

    protected static function get_transient_count($element_id, $service_id, $url){
        $element_id = str_replace('SocialMedia-Object-', '', $element_id);
        $name = 'usocial_' . $service_id . '_' . $element_id;
        $tran = get_transient($name);
        if(!$tran)
            return false;
        return $tran['url'] == $url ? $tran['count'] : false;
    }

    protected static function get_twitter_token($element_id, $key, $secret){
        $option = 'social_twitter_token_' . $element_id;
        $token = get_option($option);

        //From option
        if($token && $token['key'] == $key && $token['secret'] == $secret)
            return $token['token'];

        //Otherwise, fetch it
        $credentials = $key . ':' . $secret;
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

        $response = wp_remote_post('https://api.twitter.com/oauth2/token', $args);
        if (is_wp_error($response)) 
            return false; // Something went wrong

        $keys = json_decode(wp_remote_retrieve_body($response));

        if ($keys) {
            $option_value = array(
                'token' => $keys->access_token,
                'key' => $key,
                'secret' => $secret
            );
            update_option($option, $option_value);
            return $keys->access_token;
        }

        return false;
    }

    protected static function get_url_last_part($url){
        $keys = parse_url($url); // parse the url
        return end(explode("/", $keys['path'])); // splitting the path
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