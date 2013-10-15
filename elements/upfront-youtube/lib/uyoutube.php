<?php
/**
 * YouTube element for Upfront
 */
class Upfront_UyoutubeView extends Upfront_Object {
	var $defaults = array(
    'type' => false,
		'display_style' => false,
		'multiple_source' => false,
    'multiple_source_id' => '',
		'videos_count' => 6,
    'title' => '',
		'show_title' => true,
    'title_length' => 100,
    'description' => '',
    'show_description' => true,
    'description_length' => 100,
    'thumbWidth' => 200,
    'thumbHeight' => 300,
    'single_video_url' => '',
    'youtube_status' => 'starting',
		'size' =>  array('width' => '100%', 'height' => 'auto'),
		'fullSize' => array('width' => 0, 'height' => 0),
		'position' => array('top' => 0, 'left' => 0),
		'element_size' => array('width' => '100%', 'height' => 250),
		'rotation' => 0,
		'color' => '#ffffff',
		'background' => '#000000',
		'align' => 'left',
		'stretch' => false,
		'quick_swap' => false,

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

		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_style('uyoutube-style', upfront_element_url('css/uyoutube.css', dirname(__FILE__)));
		wp_enqueue_script('wp-color-picker');
	}
}

class Upfront_Uyoutube_Server extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}
	private function _add_hooks() {
    add_action('wp_ajax_upfront_youtube_single', array($this, "get_single_video_data"));
	}

  function get_single_video_data(){
    $data = stripslashes_deep($_POST);

    if(! $data['data']['video_id'])
      return $this->_out(new Upfront_JsonResponse_Error("No video id sent"));

    //TODO get api key from settings
    $developer_key = 'AIzaSyBW4LqXOAZ-GTP4-dYAD2DGpSJ4nzDRbgM';
    $google_api_dir = dirname(__FILE__) . '/../../../vendor/google-api-php-client/src/';
    require_once $google_api_dir . 'Google_Client.php';
    require_once $google_api_dir . 'contrib/Google_YouTubeService.php';
    $client = new Google_Client();
    $client->setDeveloperKey($developer_key);
    $youtube = new Google_YoutubeService($client);
    try {
      //TODO parse video id from request
      $response = $youtube->videos->listVideos('snippet', array('id' => $data['data']['video_id']));
      $video = $response['items'][0];
      $data = array(
        'title' => $video['snippet']['title'],
        'description' => $video['snippet']['description']
      );
      return $this->_out(new Upfront_JsonResponse_Success(array('video' => $data)));
    } catch (Google_ServiceException $e) {
      return $this->_out(new Upfront_JsonResponse_Error($e->getMessage()));
    } catch (Google_Exception $e) {
      return $this->_out(new Upfront_JsonResponse_Error($e->getMessage()));
    }
  }
}
Upfront_Uyoutube_Server::serve();
