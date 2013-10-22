<?php
/**
 * YouTube element for Upfront
 */
class Upfront_UyoutubeView extends Upfront_Object {
    var $defaults = array(
        'type' => false,
        'display_style' => 'gallery',
        'multiple_source' => 'user_channel',
        'multiple_source_id' => '',
        'multiple_videos' => false,
        'multiple_count' => 6,
        'multiple_description_length' => 100,
        'multiple_show_description' => array('multiple_show_description'),
        'multiple_title_length' => 100,
        'multiple_show_title' => array('multiple_show_title'),
        'title' => '',
        'full_title' => '',
        'show_title' => array('show_title'),
        'title_length' => 100,
        'description' => '',
        'full_description' => '',
        'show_description' => array('show_description'),
        'description_length' => 100,
        'thumbWidth' => 200,
        'thumbHeight' => 300,
        'single_video_url' => '',
        'single_video_id' => '',
        'player_width' => 404,
        'player_height' => 246,
        'youtube_status' => 'starting',

        'type' => 'UyoutubeModel',
        'view_class' => 'UyoutubeView',
        'has_settings' => 1,
        'class' =>  'upfront-youtube'
    );

    function __construct($data) {
        $data['properties'] = $this->merge_default_properties($data);
        parent::__construct($data);
    }

    protected function merge_default_properties($data){
        $flat = array();
        if(!isset($data['properties']))
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
    // This data is passed on to the template to precompile template
        $data = $this->properties_to_array();

        $data['wrapper_id'] = str_replace('youtube-object-', 'wrapper-', $data['element_id']);

        $markup = upfront_get_template('uyoutube', $data, dirname(dirname(__FILE__)) . '/tpl/youtube.html');

        return $markup;
    }

    public function add_js_defaults($data){
        $data['uyoutube'] = array(
            'defaults' => $this->defaults,
            'template' => upfront_get_template_url('uyoutube', upfront_element_url('tpl/youtube.html', dirname(__FILE__)))
        );
        return $data;
    }

    private function properties_to_array(){
        $out = array();
        foreach($this->_data['properties'] as $prop)
            $out[$prop['name']] = $prop['value'];
        return $out;
    }

    public static function add_styles_scripts () {
        wp_deregister_script('jquery-form');
        wp_register_script('jquery-form', upfront_element_url('js/jquery.form.min.js', dirname(__FILE__)), array('jquery'), '3.36.0');
        wp_enqueue_script('jquery-form');

        wp_enqueue_style('uyoutube-style', upfront_element_url('css/uyoutube.css', dirname(__FILE__)));
    }
}

class Upfront_Uyoutube_Server extends Upfront_Server {

  public static function serve () {
      $me = new self;
      $me->_add_hooks();
  }

  private function _add_hooks() {
      add_action('wp_ajax_upfront_youtube_single', array($this, "get_single_video_data"));
      add_action('wp_ajax_upfront_youtube_channel', array($this, "get_channel_data"));
      add_action('wp_ajax_upfront_youtube_playlist', array($this, "get_playlist_data"));
  }

  function get_single_video_data() {
    $data = stripslashes_deep($_POST);

    if(! $data['data']['video_id'])
      return $this->_out(new Upfront_JsonResponse_Error("No video id sent"));

    $gdata_video_url = sprintf(
      'https://gdata.youtube.com/feeds/api/videos/%s?alt=json',
      $data['data']['video_id']
    );
    try {
      $response = wp_remote_get($gdata_video_url);
      //TODO check errors
      $response_json = json_decode($response['body'], true);
      $video = $response_json['entry'];
      $data = array(
        'title' => $video['title']['$t'],
        'description' => $video['content']['$t']
      );
      return $this->_out(new Upfront_JsonResponse_Success(array('video' => $data)));
    } catch (Exception $e) {
      return $this->_out(new Upfront_JsonResponse_Error($e->getMessage()));
    }
  }

  function get_channel_data() {
    $data = stripslashes_deep($_POST);

    if(! $data['data']['channel'])
      return $this->_out(new Upfront_JsonResponse_Error("No video id sent"));
    $gdata_channel_url = sprintf(
      'https://gdata.youtube.com/feeds/users/%s/uploads?alt=json',
      $data['data']['channel']
    );
    try {
      $response = wp_remote_get($gdata_channel_url);
      if ($response instanceof WP_Error) {
        var_dump($response);die;
      }
      //TODO check errors
      $response_json = json_decode($response['body'], true);
      $data = $this->getVideosFromChannelData($response_json['feed']['entry']);
      return $this->_out(new Upfront_JsonResponse_Success(array('videos' => $data)));
    } catch (Exception $e) {
      return $this->_out(new Upfront_JsonResponse_Error($e->getMessage()));
    }
  }

  function get_playlist_data() {
    $data = stripslashes_deep($_POST);

    if(! $data['data']['playlist'])
      return $this->_out(new Upfront_JsonResponse_Error("No playlist id sent"));
    $gdata_playlist_url = sprintf(
      'https://gdata.youtube.com/feeds/api/playlists/%s?alt=json',
      $data['data']['playlist']
    );
    try {
      $response = wp_remote_get($gdata_playlist_url);
      if ($response instanceof WP_Error) {
        var_dump($response);die;
      }
      if ($response['response']['code'] === 404) {
        echo 'playlist not found'; die;
      }
      //TODO check errors
      $response_json = json_decode($response['body'], true);
      $data = $this->getVideosFromChannelData($response_json['feed']['entry']);
      return $this->_out(new Upfront_JsonResponse_Success(array('videos' => $data)));
    } catch (Exception $e) {
      return $this->_out(new Upfront_JsonResponse_Error($e->getMessage()));
    }
  }

  private function getVideosFromChannelData($data) {
    $videos = array();
    foreach ($data as $video) {
      $query = array();
      parse_str(parse_url($video['link'][0]['href'], PHP_URL_QUERY), $query);
      $description = substr($video['media$group']['media$description']['$t'], 0, 100);
      $description = empty($description) ? 'This video has no description.' : $description;
      $videos[] = array(
        'original_description' => $description,
        'description' => $description,
        'title' => $video['title']['$t'],
        'thumbnail' => $video['media$group']['media$thumbnail'][0]['url'],
        'id' => $query['v']
      );
    }

    return $videos;
  }
}
Upfront_Uyoutube_Server::serve();
