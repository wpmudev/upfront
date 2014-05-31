<?php

class Upfront_ThisPostView extends Upfront_Object {
	public static $PARTNAMES = array(
		'AUTHOR' => 'author',
		'CATEGORIES' => 'categories',
		'COMMENTS' => 'comments_count',
		'CONTENTS' => 'contents',
		'DATE' => 'date',
		'IMAGE' => 'featured_image',
		'TAGS' => 'tags',
		'TITLE' => 'title',
	);
	protected $parts;

	public function __construct($data){
		parent::__construct($data);
		$parts = array_values(self::$PARTNAMES);
	}

	public static function get_post_part($type, $options = array(), $tpl = false){
		$options = is_array($options) ? $options : array();
		
		global $post;
		$parts = array_values(self::$PARTNAMES);
		if(array_search($type, $parts) === FALSE){
			$unknown = array();
			$unknown[$type] = 'Unknown part';
			return $unknown;
		}

		$part = array('replacements' => array());
		$replacements = array();
		$tpls = array();

		if(!$tpl)
			$tpl = file_get_contents(dirname(dirname(__FILE__)) . '/tpl/' . $type . '.php');

		switch($type){
			case self::$PARTNAMES['AUTHOR']:
				$replacements['%author%'] = get_the_author();
				$replacements['%author_url%'] = get_author_posts_url($post->post_author);

				$meta = self::get_tpl_parameter('author_meta', $tpl);
				foreach($meta as $key){
					$replacements['%author_meta_' . $key . '%'] = get_the_author_meta($key);
				}

				$avatar = self::get_tpl_parameter('avatar', $tpl);
				foreach($avatar as $size){
					$replacements['%avatar_' . $size . '%'] = get_avatar($post->post_author, $size);
				}

				break;
			case self::$PARTNAMES['CATEGORIES']:
				$replacements['%categories%'] = get_the_category_list();
				break;

			case self::$PARTNAMES['COMMENTS']:
				$replacements['%categories%'] = get_comments_number();
				break;

			case self::$PARTNAMES['CONTENTS']:
				ob_start();
				the_content();
				$replacements['%contents%'] = ob_get_clean();
				ob_start();
				the_excerpt();
				$replacements['%excerpt%'] = ob_get_clean();
				
				if($options['excerpt'])
					$replacements['%contents%'] = $replacements['%excerpt%'];

				$offset = isset($options['content_offset']) ? $options['content_offset'] : '';
				$replacements['%offset%'] = $offset;
				break;

			case self::$PARTNAMES['DATE']:
				$format = isset($options['format']) ? $options['format'] : '';
				$replacements['%date%'] = get_the_date($format);
				$replacements['%date_iso%'] = get_the_date('c');
				break;

			case self::$PARTNAMES['IMAGE']:
				$replacements['%image%'] = get_the_post_thumbnail();
				$replacements['%permalink%'] = get_permalink();
				break;

			case self::$PARTNAMES['TAGS']:
                $sep = isset($options['tag_separator']) ? $options['tag_separator'] : '';
				$replacements['%tags%'] = get_the_tag_list('', $sep);
				break;

			case self::$PARTNAMES['TITLE']:
				$replacements['%title%'] = get_the_title();
				$replacements['%permalink%'] = get_permalink();
				break;
		}

		$out = array(
			'replacements' => $replacements,
			'tpl' => self::replace($tpl, $replacements)
		);

		return $out;
	}

	protected static function replace($text, $replacements){
		return str_replace(array_keys($replacements), array_values($replacements), $text);
	}

	protected static function get_tpl_parameter($name, $tpl){
		preg_match_all('/%' . $name . '_([^%]*?)%/im', $tpl, $matches);
		if(sizeof($matches) > 1)
			return $matches[1];
		return array();
	}

	public function get_markup () {
		global $post;
		$element_id = $this->_get_property('element_id');
		return
			'<div class=" upfront-this_post" id="' . $element_id . '">' .
				self::get_post_markup(get_the_ID(), $post->post_type, $this->properties_to_array()) .
			'</div>';
	}

	public static function get_post_markup ($post_id, $post_type, $properties=array(), $layout = false) {
		if($post_id === 0)
			return self::get_new_post($post_type);

		if (!$post_id || !is_numeric($post_id)) {
			$post = self::get_new_post($post_type, array(), false);
		} else {
			$post = get_post($post_id);
		}
		if ($post->post_password && !is_user_logged_in() || $post->post_status != 'publish' && !is_user_logged_in())
			return ''; // Augment this!

		if(!$properties['post_data'])
			$properties['post_data'] = array();

		$properties['featured_image'] = array_search('featured_image', $properties['post_data']) !== FALSE;

		return self::post_template($post, $properties, $layout);
	}

	public static function get_new_post($post_type = 'post', $properties=array(), $query_override=true) {

		$title = sprintf(__('Enter your new %s title here', 'upfront'), $post_type);
		$content = sprintf(__('Your %s content goes here. Have fun writing :)', 'upfront'), $post_type);

		$post_arr = array(
			'ID' => 0,
			'post_title' => $title,
			'post_content' => $content,
			'post_type' => $post_type,
			'filter' => 'raw',
			'post_author' => get_current_user_id()
		);
		$post_obj = new stdClass();
		foreach($post_arr as $key => $value)
			$post_obj->$key = $value;

		$post = new WP_Post($post_obj);

		if ($query_override) {
			query_posts( 'post_type=' . $post_type . '&posts_per_page=1');
			if(have_posts())
				the_post();
			$post_id = get_the_ID();
			if($post_id)
				query_posts('p=' . $post_id);
		}

		return self::post_template($post, $properties);
	}

	public static function post_template($this_post, $properties=array(), $layoutData = false) {
		$post_data = self::prepare_post($this_post);
		$excerpt = false;
		if(!$layoutData)
			$layoutData = self::find_postlayout('single', $this_post->post_type, $this_post->ID);
		else
			$excerpt = $properties['content_type'] == 'excerpt'?true:false;

		$options = $layoutData['partOptions'];
		$templates = $properties['templates'];

		$layout = array(
			'wrappers' => $layoutData['postLayout'],
			'wrappersLength' => sizeof($layoutData['postLayout']),
			'extraClasses' => array(),
			'attributes' => array()
		);


		foreach($layout['wrappers'] as $i => $w){
			$layout['wrappers'][$i]['objectsLength'] = sizeof($w['objects']);
			foreach($w['objects'] as $k => $o){
				$opts = !empty($options[$o['slug']]) ? $options[$o['slug']] : array(); // This is for the layout
				$opts['excerpt'] = $excerpt;
				$tpl =  isset($templates[$o['slug']]) ? $templates[$o['slug']] : false;
				$markups = self::get_post_part($o['slug'], $opts, $tpl);
				$layout['wrappers'][$i]['objects'][$k]['markup'] = $markups['tpl'];
				$layout['extraClasses'][$o['slug']] = isset($opts['extraClasses']) ? $opts['extraClasses'] : '';
				$attributes = '';
				if(isset($opts['attributes'])){
					foreach($opts['attributes'] as $key => $value)
						$attributes .= $key . '="' . $value . '" ';
				}

				$layout['attributes'][$o['slug']] = $attributes;
			}
		}

		$data = upfront_get_template('content', $layout, get_template_directory() . '/scripts/upfront/templates/content.html');

		self::restore_post($post_data);

		return $data;
	}

	public static function find_postlayout($type, $post_type, $id){
		$key = get_stylesheet() . '-' . $type . '-';
		$cascade = array($key . $id,  $key . $post_type);
		$found = false;
		$i = 0;
		while(!$found && $i < sizeof($cascade)){
			$found = get_option($cascade[$i]);
			$i++;
		}
		if(!$found)
			$found = self::default_postlayout($type);

		return $found;
	}

	public static function default_postlayout($type){
		if($type == 'single')
			return array(
				'postLayout' => array(
					array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'title', 'classes' => 'post-part 24'))),
					array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'date', 'classes' => ' post-part c24'))),
					array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'contents', 'classes' => ' post-part c24')))
				),
				'partOptions' => array('featured_image' => array('height' => 100))
			);
		return array(
			'postLayout' => array(
				array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'title', 'classes' => 'post-part 24'))),
				array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'date', 'classes' => ' post-part c24'))),
				array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'excerpt', 'classes' => ' post-part c24')))
			),
			'partOptions' => array('featured_image' => array('height' => 100))
		);
	}

	public static function prepare_post($this_post){
		$post_data = array();

		global $post;
		$post = $this_post;
		setup_postdata($post);

		global $wp_query, $more;

		$post_data['in_the_loop'] = $wp_query->in_the_loop;
		// This below with post query rewrite is an inline fix for WP not sanity checking before iteration: https://core.trac.wordpress.org/ticket/26321
		$post_data['old_query_posts'] = $wp_query->posts;

		//Make sure we show the whole post content
		$more = 1;

		$wp_query->is_single = true;
		$wp_query->in_the_loop = true;
		$wp_query->posts = array();
	}

	public static function restore_post($post_data){
		global $wp_query;
		$wp_query->in_the_loop = $post_data['in_the_loop'];
		$wp_query->posts = $post_data['old_query_posts'];
	}

	public static function default_properties(){
		return array(
			'type' => 'ThisPostModel',
			'view_class' => 'ThisPostView',
			'class' => 'c24 upfront-this_post',
			'has_settings' => 1,
			'id_slug' => 'this_post',

			'post_data' => array('author', 'date', 'comments_count', 'featured_image') // also: categories,  tags

		);
	}

	public static function add_js_defaults($data){
		$data['thisPost'] = array(
			'defaults' => self::default_properties(),
			'templates' => self::get_templates()
		);

		return $data;
	}

	protected static function get_templates(){
		$names = array('author', 'categories', 'comments_count', 'contents', 'date', 'featured_image', 'tags', 'title');
		$templates = array();
		$dir = dirname(dirname(__FILE__)) . '/tpl/';
		foreach($names as $name){
			$templates[$name] = file_get_contents($dir . $name . '.php');
		}
		return $templates;
	}

	/**
	 * Checks the editor selectors presence and injects defaults
	 * if nothing better is found.
	 */
	public static function add_fallback_selectors ($selectors) {
		$selectors = !empty($selectors) ? $selectors : array();
		$types = wp_list_pluck($selectors, 'type');

		if (!in_array('title', $types)) {
			$selectors[] = array(
				'type' => 'title',
				'selector' => 'h1.post_title',
			);
		}
		if (!in_array('content', $types)) {
			$selectors[] = array(
				'type' => 'content',
				'selector' => 'div.post_content',
			);
		}
		if (!in_array('thumbnail', $types)) {
			$selectors[] = array(
				'type' => 'thumbnail',
				'selector' => '.post_thumbnail',
			);
		}
		if (!in_array('date', $types)) {
			$selectors[] = array(
				'type' => 'date',
				'selector' => '.post_date',
			);
		}
		if (!in_array('author', $types)) {
			$selectors[] = array(
				'type' => 'author',
				'selector' => '.post_author',
			);
		}

		return $selectors;
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}
}

/**
 * Posts AJAX response implementation.
 */
class Upfront_ThisPostAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_this_post-get_markup', array($this, "load_markup"));
		add_action('wp_ajax_content_part_markup', array($this, "get_part_contents"));
		add_action('wp_ajax_this_post-get_thumbnail', array($this, "get_thumbnail"));
		add_action('wp_ajax_upfront_save_postlayout', array($this, "save_postlayout"));
		add_action('wp_ajax_upfront_get_postlayout', array($this, "get_postlayout"));
	}
	public function get_thumbnail() {
		$post_id = stripslashes($_POST['post_id']);
		if (!is_numeric($post_id)) die('error');
		$background_image = '';
		if(has_post_thumbnail($post_id)) {
			$featured_image = wp_get_attachment_image_src( get_post_thumbnail_id( $post_id ), 'single-post-thumbnail' );
			$background_image = $featured_image[0];
		}

		$this->_out(new Upfront_JsonResponse_Success(array(
			"featured_image" => $background_image
		)));

	}

	public function get_part_contents(){
		if (!isset($_POST['post_id']) || !is_numeric($_POST['post_id']))
			die('error');


		$post_id = $_POST['post_id'];

		$options = !empty($_POST['options']) && is_array($_POST['options']) ? $_POST['options'] : array();
		$templates = isset($_POST['templates']) ? $_POST['templates'] : array();

		//Prepare the parts before rendering
		if(isset($_POST['parts']))
			$parts = json_decode(stripslashes($_POST['parts']), true);
		else {
			$parts = array();
			foreach(Upfront_ThisPostView::$PARTNAMES as $slug)
				array_push($parts, array('slug' => $slug, 'options' => isset($options[$slug]) ? $options[$slug] : array()));
		}

		$post = get_post($post_id);

		$tpls = array();
		$replacements = array();

		$post_data = Upfront_ThisPostView::prepare_post($post);
		foreach($parts as $part){
			$slug = $part['slug'];
			$part_options = !empty($part['options']) ? $part['options'] : array(); // This is for editor
			$contents = Upfront_ThisPostView::get_post_part($slug, $part_options, isset($templates[$slug]) ? $templates[$slug] : '');
			$tpls[$slug] = $contents['tpl'];
			$replacements = array_merge($replacements, $contents['replacements']);
			if($slug == 'contents'){
				$replacements['%raw_content%'] = wpautop($post->post_content);
				$replacements['%raw_excerpt%'] = wpautop(get_the_excerpt());
			}
		}

		$output = array(
			'tpls' => $tpls,
			'replacements' => $replacements
		);

		$this->_out(new Upfront_JsonResponse_Success($output));
	}

	public function render_markup(){
		$data = json_decode(stripslashes($_POST['data']), true);
		if (!is_numeric($data['post_id'])) die('error');
	}

	public function load_markup () {
		$data = json_decode(stripslashes($_POST['data']), true);
		if (!is_numeric($data['post_id'])) die('error');

		$content = '';

		if($data['post_id']){
			$post = get_post($data['post_id']);
			if(!$post)
				return $this->_out(new Upfront_JsonResponse_Error('Unknown post.'));

			if($post->post_status == 'trash')
				$content = '<div class="ueditor_deleted_post ueditable upfront-ui">This ' . $post->post_type . ' has been deleted. To edit it, <a class="ueditor_restore">restore the ' . $post->post_type . '</a>.</div>';
			else
				$content = Upfront_ThisPostView::get_post_markup($data['post_id'], null, $data['properties']);
		}
		else if($data['post_type'])
			$content = Upfront_ThisPostView::get_new_post($data['post_type'], $data['properties']);
		else
			$this->_out(new Upfront_JsonResponse_Error('Not enough data.'));


		$this->_out(new Upfront_JsonResponse_Success(array(
			"filtered" => $content
		)));
	}

	public function save_postlayout() {
		$layoutData = isset($_POST['layoutData']) ? $_POST['layoutData'] : false;
		$cascade = isset($_POST['cascade']) ? $_POST['cascade'] : false;
		if(!$layoutData || !$cascade)
			$this->_out(new Upfront_JsonResponse_Error('No layout data or cascade sent.'));

		$key = get_stylesheet() . '-' . $cascade;

		update_option($key, $layoutData);

		$this->_out(new Upfront_JsonResponse_Success(array(
			"key" => $key,
			"layoutData" => $layoutData
		)));
	}

	public function get_postlayout() {
		$post_type = isset($_POST['post_type']) ? $_POST['post_type'] : false;
		$type = isset($_POST['type']) ? $_POST['type'] : false;
		$id = isset($_POST['id']) ? $_POST['id'] : false;

		if(!$post_type || !$type || !$id)
			$this->_out(new Upfront_JsonResponse_Error('No post_type, type or id sent.'));

		$this->_out(new Upfront_JsonResponse_Success(Upfront_ThisPostView::find_postlayout($type, $post_type, $id)));
	}

}
Upfront_ThisPostAjax::serve();