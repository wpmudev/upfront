<?php

class Upfront_ThisPostView extends Upfront_Object {
	public static $PARTNAMES = array(
		'EXCERPT' => 'excerpt',
		'AUTHOR' => 'author',
        'AUTHOR_GRAVATAR' => 'author_gravatar',
        'CATEGORIES' => 'categories',
		'COMMENTS' => 'comments_count',
		'CONTENTS' => 'contents',
		'DATE' => 'date',
		'UPDATE' => 'update',
		'IMAGE' => 'featured_image',
		'TAGS' => 'tags',
		'TITLE' => 'title',
		'META' => 'meta',
	);
	protected $parts;

	public static $partTemplates = array();

	public function __construct($data){
		parent::__construct($data);
		$parts = array_values(apply_filters('upfront_post_parts', self::$PARTNAMES));

		// adds features to wp caption shortcode to support UF post image variants
//		add_filter("img_caption_shortcode", array( $this, "image_caption_shortcode"), 10, 30);
	}

	public static function get_post_part($type, $options = array(), $tpl = false, $properties = array()){
		$options = is_array($options) ? $options : array();
		global $post;
		$parts = array_values(apply_filters('upfront_post_parts', self::$PARTNAMES));
		if(array_search($type, $parts) === FALSE){
			$unknown = array();
			$unknown[$type] = 'Unknown part';
			return $unknown;
		}

		$part = array('replacements' => array());
		$replacements = array();
		$tpls = array();
		$classes = array();

		if(!sizeof(self::$partTemplates))
			self::$partTemplates = self::get_templates();

		if(!$tpl)
			$tpl = self::$partTemplates[$type];

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

                break;
			case self::$PARTNAMES['CATEGORIES']:
				$replacements['%categories%'] = get_the_category_list();
				break;

			case self::$PARTNAMES['COMMENTS']:
				$replacements['%comments_count%'] = get_comments_number();
				break;

			case self::$PARTNAMES['CONTENTS']:
                $limit = isset($options['limit']) ? $options['limit'] : 1000;

                if (!empty($post->ID) && is_numeric($post->ID)) {
					ob_start();
					the_content();
					$replacements['%contents%'] = ob_get_clean();
					$replacements['%excerpt%'] = self::excerpt( $limit );
                } else {
                	$post = apply_filters('upfront-this_post-unknown_post', $post, $options);
					$replacements['%contents%'] = apply_filters('the_content', $post->post_content);
					$replacements['%excerpt%'] = self::excerpt( $limit );
                }

				if(!empty($options['excerpt']))
					$replacements['%contents%'] = $replacements['%excerpt%'];

				$offset = isset($options['content_offset']) ? $options['content_offset'] : '';
				$replacements['%offset%'] = $offset;
				break;

            case self::$PARTNAMES['EXCERPT']:
                $limit = isset($options['limit']) ? $options['limit'] : 1000;
                $replacements['%excerpt%'] = self::excerpt( $limit );
                //$replacements['%excerpt%'] = $limit; // Why???
                break;

			case self::$PARTNAMES['DATE']:
				$format = isset($options['format']) ? $options['format'] : 'd M Y';
				$replacements['%date%'] = self::_format_post_date( $format );
				$replacements['%date_iso%'] = get_the_date('c');
				break;

            case self::$PARTNAMES['UPDATE']:
                $format = isset($options['format']) ? $options['format'] : 'd M Y';
                $replacements['%update%'] = self::_format_post_date( $format, "update" );
                $replacements['%date_iso%'] = get_the_modified_date('c');
                break;

			case self::$PARTNAMES['IMAGE']:
				if ( isset($properties['hide_featured_image']) && $properties['hide_featured_image'] == 1 ){
					$classes[] = 'hide-featured_image';
					$tpl = ''; // empty $tpl so it doesn't output anything
				}
				if ( isset($properties['full_featured_image']) && $properties['full_featured_image'] == 1 ){
					$classes[] = 'full-featured_image';
					$replacements['%image%'] = get_the_post_thumbnail(null, 'full');
				}
				else {
					$replacements['%image%'] = upfront_get_edited_post_thumbnail();
				}
				if (empty($replacements['%image%'])) $classes[] = 'no-featured_image';
				$replacements['%permalink%'] = get_permalink();
				break;

			case self::$PARTNAMES['TAGS']:
                $sep = isset($options['tag_separator']) ? $options['tag_separator'] : ', ';
                $tags = get_the_tag_list('', $sep);
				$replacements['%tags%'] = !empty($tags) ? $tags : '';
				break;

			case self::$PARTNAMES['TITLE']:
				$replacements['%title%'] = get_the_title();
				$replacements['%permalink%'] = get_permalink();
				break;

			case self::$PARTNAMES['AUTHOR_GRAVATAR']:
				$avatar = self::get_tpl_parameter('avatar', $tpl);

				foreach($avatar as $size){
					$_size = str_replace( array("{", "}"), "", $size );
					$replacements['%avatar_' . $size . '%'] = get_avatar($post->post_author, $_size);
				}
				break;

			case self::$PARTNAMES['META']:
				$metas = Upfront_PostmetaModel::get_all_post_meta_fields(get_the_ID());
				foreach ($metas as $meta) {
					if (empty($meta['meta_key'])) continue;
					$rpl = Upfront_Codec::get('postmeta')->get_clean_macro($meta['meta_key']);
					$value = Upfront_Codec::get('postmeta')->get_extracted_value($meta, get_the_ID());
					$replacements[$rpl] = $value;
				}
				break;
		}

		$replacements = apply_filters('upfront_post_part_replacements', $replacements, $type, $options, $tpl);
		$out = array(
			'replacements' => $replacements,
			'tpl' => self::replace($tpl, $replacements),
			'classes' => $classes
		);

		// Cleanup unused meta
		if ($type === self::$PARTNAMES['META'] && !empty($out['tpl'])) {
			$out['tpl'] = Upfront_Codec::get('postmeta')->clear_all($out['tpl']);
		}

		return $out;
	}

	private static function _format_post_date( $format, $type = "date" ){
		$func = $type === "update" ?  "get_the_modified_date" : "get_the_date";
		/**
		 * label each part
		 */
		$date = "";
		if( !empty( $format ) ){
			$split = str_split( $format );
			$f = 0;
			foreach( $split as $part ){
				if( str_word_count($part) === 0 ){ // if this part is a free space
					$date .= $part;
				}else{
					$date .= sprintf("<span class='%s_part_%s'>%s</span>", $type, $f , $func($part) );
					$f ++;
				}
			}
		}

		return $date;
	}

	protected static  function excerpt( $limit ) {
        $excerpt = explode(' ', get_the_excerpt(), $limit);
        if (count($excerpt)>=$limit) {
	        array_pop($excerpt);
            $excerpt = implode(" ",$excerpt).'...';
        } else {
            $excerpt = implode(" ",$excerpt);
        }
        $excerpt = preg_replace('`\[[^\]]*\]`','',$excerpt);
        return $excerpt;
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
		return self::get_template_markup($post, $this->properties_to_array());
	}

	public static function get_template_markup($post, $properties) {
        $post = !empty($post) ? $post : new WP_Post(new StdClass);
        $markup = Upfront_ThisPostView::get_post_markup($post->ID, $post->post_type, $properties);
		$markup = upfront_get_template(
			'this-post',
			array(
				'post' => $post,
                "markup" => $markup
			),
			dirname(dirname(__FILE__)) . '/tpl/this-post.php'
		);
		return $markup;
	}

	protected static function get_padding_styles($properties, $archive, $post){
		$layout_type = $archive ? 'archive' : 'single';
		$post_type = $post->post_type;
		$layout_id = $post->ID;
		if($archive)
			$layout_id = str_replace('uposts-object-', '', $properties['element_id']);
		$layoutData = self::find_postlayout($layout_type, $post_type, $layout_id);
		$options = !empty($layoutData['partOptions']) ? $layoutData['partOptions'] : array();
		$styles = '<style>%s</style>';
		$rules = '';

		if(isset($options['contents'])){
			$col_size = isset($properties['colSize']) ? $properties['colSize'] : 45;
			$paddingLeft = isset($options['contents']['padding_left']) ? $options['contents']['padding_left'] * $col_size : 0;
			$paddingRight = isset($options['contents']['padding_right']) ? $options['contents']['padding_right'] * $col_size : 0;
			$rules = '#' . $properties['element_id'] . ' .post_content>* { padding-left: ' . $paddingLeft . 'px; padding-right: ' . $paddingRight . 'px; }';
		}

		$out = sprintf($styles, $rules);

		return $out;
	}

	public static function get_post_markup ($post_id, $post_type, $properties=array(), $layout = false, $archive = false) {
		if($post_id === 0)
			return self::get_new_post_contents($post_type);

		if (!$post_id || !is_numeric($post_id)) {
			$post = self::get_new_post_contents($post_type, array(), false);
		} else {
			$post = get_post($post_id);
		}
		$post = !empty($post) && is_object($post) ? $post : new WP_Post(new StdClass);
		if ($post->post_status != 'publish' && !is_user_logged_in())
			return ''; // Augment this!

		if(!$properties['post_data'])
			$properties['post_data'] = array();

		$properties['featured_image'] = array_search('featured_image', $properties['post_data']) !== FALSE;

		$out = self::post_template($post, $properties, $layout, $archive) . self::get_padding_styles($properties, $archive, $post);
		return $out;
	}

	public static function get_new_post_contents($post_type = 'post', $properties=array(), $query_override=true) {
		$post = self::get_new_post($post_type);

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

	public static function get_new_post($post_type, $title = 'Enter your new %s title here', $content = "Your %s content goes here. Have fun writing :)"){
		$title = sprintf(__($title, 'upfront'), $post_type);
		$content = sprintf(__($content, 'upfront'), $post_type);

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

		return $post;
	}

  	private static function _part_style_class($options, $slug){
		return isset( $options[$slug] ) && isset( $options[$slug]["theme_style"] ) ? " " . $options[$slug]["theme_style"] : "";
	}

	public static function post_template($this_post, $properties=array(), $layoutData = false, $archive = false) {
		$post_data = self::prepare_post($this_post);
		$excerpt = false;
		$layout_type = $archive ? 'archive' : 'single';

		$post_type = $this_post->post_type;
		$layout_id = $this_post->ID;
		if($archive)
			$layout_id = str_replace('uposts-object-', '', $properties['element_id']);

		if(!$layoutData)
			$layoutData = self::find_postlayout($layout_type, $post_type, $layout_id);
		else
			$excerpt = $properties['content_type'] == 'excerpt';//?true:false;

		$templates = self::find_partTemplates($layout_type, $post_type, $layout_id);

		$options = !empty($layoutData['partOptions']) ? $layoutData['partOptions'] : array();
		$layout = array(
			'wrappers' => $layoutData['postLayout'],
			'wrappersLength' => sizeof($layoutData['postLayout']),
			'extraClasses' => array(),
			'attributes' => array()
		);


		if (!empty($layout['wrappers']) && is_array($layout['wrappers'])) foreach($layout['wrappers'] as $i => $w){
			$layout['wrappers'][$i]['objectsLength'] = sizeof($w['objects']);

			foreach($w['objects'] as $k => $o){
				$o['slug'] = isset($o['slug']) ? $o['slug'] : 'spacer';
				$layout['wrappers'][$i]['objects'][$k]['slug'] = $o['slug'];

				$opts = !empty($options[$o['slug']]) ? $options[$o['slug']] : array(); // This is for the layout
				$opts['excerpt'] = $excerpt;
				$tpl = !empty($templates[$o['slug']]) ? $templates[$o['slug']] : false;
				$markups = self::get_post_part($o['slug'], $opts, $tpl, $properties);

				$layout['wrappers'][$i]['objects'][$k]['markup'] = !empty($markups['tpl']) ? $markups['tpl'] : false;
				$layout['extraClasses'][$o['slug']] = isset($opts['extraClasses']) ? $opts['extraClasses'] : '';

			    $part_style_class = self::_part_style_class( $options,  $o["slug"] );
			  	$layout['extraClasses'][$o['slug']] .= $part_style_class;

				if (empty($markups['classes'])) $markups['classes'] = array();
				$layout['extraClasses'][$o['slug']] .= ' ' . join(' ', $markups['classes']);

				if (empty($layout['wrappers'][$i]['classes'])) $layout['wrappers'][$i]['classes'] = '';
				$layout['wrappers'][$i]['classes'] .= ' ' . join(' ', $markups['classes']);

				if (strpos($layout['wrappers'][$i]['objects'][$k]['classes'], 'part-module-' . $o['slug']) === false) {
					$layout['wrappers'][$i]['objects'][$k]['classes'] .= ' part-module-' . $o['slug'];
				}

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
		$key = get_stylesheet() . '-postlayout-' . $type . '-';
		$cascade = array($key . $id,  $key . $post_type);
		$found = false;
		$i = 0;
		while(!$found && $i < sizeof($cascade)){
			$found = get_option($cascade[$i]);
			$i++;
		}
		if(!$found) $found = self::get_theme_layout($type, $post_type, $id);
		if(!$found) $found = self::default_postlayout($type);

		if ($found && !empty($found['postLayout'])) {
			foreach ($found['postLayout'] as $idx => $wrapper) {
				if (empty($wrapper['classes'])) $wrapper['classes'] = '';
				if (!empty($wrapper['objects'])) {
					foreach ($wrapper['objects'] as $obj) {
						if ($obj && !empty($obj['slug']) && strpos($wrapper['classes'], 'part-' . $obj['slug']) === false) {
							$wrapper['classes'] .= ' part-' . $obj['slug'];
						}
					}
				}
				$found['postLayout'][$idx]['classes'] = $wrapper['classes'];
			}
		}

		return $found;
	}

	public static function get_theme_layout($type, $post_type, $id){
		$stylesheet_directory = apply_filters('upfront_get_stylesheet_directory', get_stylesheet_directory());
		$layouts_path = $stylesheet_directory . DIRECTORY_SEPARATOR . 'postlayouts';

		if(!file_exists($layouts_path))
			return false;

		$base_filename = $layouts_path . DIRECTORY_SEPARATOR . $type . '-';

		$cascade = array($base_filename . $id . '.php', $base_filename . $post_type . '.php');
		$cascade = apply_filters('upfront_theme_layout_cascade', $cascade, $base_filename);

		$found = false;
		$i = 0;

		while(!$found && $i < sizeof($cascade)){
			if(file_exists($cascade[$i])) {
				$found = require $cascade[$i];
			}
			$i++;
		}
		return $found;
	}

	public static function find_partTemplates($type, $post_type, $id){
		$key = get_stylesheet() . '-parttemplates-' . $type . '-';
		$cascade = array($key . $id,  $key . $post_type);
		$found = false;
		$i = 0;
		$defaults = self::get_templates();
		while(!$found && $i < sizeof($cascade)){
			$found = get_option($cascade[$i]);
			$i++;
		}
		if(!$found)
			$found = self::get_theme_postpart_templates($type, $post_type, $id);

		if($found)
			$found = array_merge($defaults, $found);
		else
			$found = $defaults;

		return $found;
	}

	public static function get_theme_postpart_templates($type, $post_type, $id){
		$stylesheet_directory = apply_filters('upfront_get_stylesheet_directory', get_stylesheet_directory());
		$tpl_path = $stylesheet_directory . DIRECTORY_SEPARATOR . 'templates' . DIRECTORY_SEPARATOR . 'postparts';

		if(!file_exists($tpl_path))
			return false;

		$base_filename = $tpl_path . '/' . $type . '-';

		$cascade = array($base_filename . $id . '.php', $base_filename . $post_type . '.php');

		$cascade = apply_filters('upfront_theme_postpart_templates_cascade', $cascade, $base_filename);

		$found = false;
		$i = 0;

		while(!$found && $i < sizeof($cascade)){
			if(file_exists($cascade[$i])) {
				$found = require $cascade[$i];
			}
			$i++;
		}
		return $found;
	}

	public static function default_postlayout($type){
		if($type == 'single')
			return array(
				'postLayout' => array(
					array('classes' => 'c6', 'objects'=> array(array('slug' => 'date', 'classes' => ' post-part c24'))),
					array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'featured_image', 'classes' => 'post-part c24'))),
					array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'title', 'classes' => 'post-part c24'))),
					array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'contents', 'classes' => ' post-part c24'))),
					//array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'meta', 'classes' => ' post-part c24')))
				),
				'partOptions' => array(
					'featured_image' => array('height' => 150),
					'date' => array(
						'height' => 40,
						"attributes" => array(
							"style" => "min-height: 40px"
						)
					)
				)
			);
		return array(
			'postLayout' => array(
				array('classes' => 'c6', 'objects'=> array(array('slug' => 'date', 'classes' => ' post-part c24'))),
				array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'featured_image', 'classes' => 'post-part 24'))),
				array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'title', 'classes' => 'post-part 24'))),
				array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'contents', 'classes' => ' post-part c24')))
			),
			'partOptions' => array(
				'featured_image' => array('height' => 150),
				'date' => array(
					'height' => 40,
					"attributes" => array(
						"style" => "min-height: 40px"
					)
				)
			)
		);
	}

	public static function prepare_post($this_post){
		$post_data = array();

		//We need to cheat telling WP we are not in admin area
		// to get the same output than in the frontend
		global $current_screen;
		if (!class_exists('WP_Screen')) {
			if (file_exists(ABSPATH . '/wp-admin/includes/class-wp-screen.php')) {
				require_once(ABSPATH . '/wp-admin/includes/class-wp-screen.php');
				if (!function_exists('get_current_screen')) require_once(ABSPATH . '/wp-admin/includes/screen.php');
			} else if (file_exists(ABSPATH . '/wp-admin/includes/screen.php')) require_once(ABSPATH . '/wp-admin/includes/screen.php');
		}
		if (class_exists('WP_Screen')) $current_screen = WP_Screen::get('front');

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
			'row' => 10,
			'preset' => 'default',
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
		return include dirname(dirname(__FILE__)) . '/tpl/part_templates.php';
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
        if (!in_array('excerpt', $types)) {
            $selectors[] = array(
                'type' => 'excerpt',
                'selector' => 'div.post_excerpt',
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

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['this_post_element'])) return $strings;
		$strings['this_post_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('This Post', 'upfront'),
			'thrashed_post' => __('This %s has been deleted. To edit it, <a class="ueditor_restore">restore the %s</a>.', 'upfront'),
			'refreshing' => __('Refreshing post ...', 'upfront'),
			'here_we_are' => __('Here we are!', 'upfront'),
			'post_author' => __('Post Author', 'upfront'),
			'post_date' => __('Post Date', 'upfront'),
			'categories' => __('Categories', 'upfront'),
			'tags' => __('Tags', 'upfront'),
			'comments_count' => __('Comments count', 'upfront'),
			'featured_image' => __('Featured image', 'upfront'),
			'show_post_data' => __('Show the following Post Data:', 'upfront'),
			'post_data' => __('Post Data', 'upfront'),
			'post_settings' => __('Post settings', 'upfront'),
			'featured_image_option' => __('Featured Image Option', 'upfront'),
			'hide_featured_image' => __('Hide Featured Image ', 'upfront'),
			'full_featured_image' => __('Show Full-Size featured image', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

	public static function get_post_image_markup($data) {
		global $post;
		if( !is_object( $post ) ) return;
		$style_variant =  Upfront_ChildTheme::get_image_variant_by_id( $data->uf_variant );
        // if no variant is found, default to the first variant
        $style_variant =  (object) ( $style_variant === array() ? reset( $style_variant )  : $style_variant );
		$style_variant->label_id = !empty( $style_variant->label ) ? "ueditor-image-style-" . str_replace(" ", "-", trim(strtolower( $style_variant->label )))  : $style_variant->vid;

		$layout_data = Upfront_ThisPostView::find_postlayout("single", $post->post_type, $post->ID);
		$options = !empty($layout_data['partOptions']) ? $layout_data['partOptions'] : array();

		$padding_left = $padding_right = 0;
		$col_size = isset($layout_data['colSize']) ? $layout_data['colSize'] : 45;
		if(isset($options['contents'])){
			$padding_left = $options['contents']['padding_left'];
			$padding_right = $options['contents']['padding_right'];
		}

		if ($style_variant && isset( $style_variant->group ) && isset( $style_variant->group->float )) {
			$style_variant->group->marginLeft = $style_variant->group->marginRight = 0;
			if ( $style_variant->group->float == 'left' && $padding_left > 0 ){
				$style_variant->group->marginLeft = ( $padding_left - abs($style_variant->group->margin_left) ) * $col_size;
				$style_variant->group->marginRight = 0;
			}
			else if ( $style_variant->group->float == 'right' && $padding_right > 0 ){
				$style_variant->group->marginRight = ( $padding_right - abs($style_variant->group->margin_right) ) * $col_size;
				$style_variant->group->marginLeft = 0;
			}
			else if ( $style_variant->group->float == 'none' && $padding_left > 0 ){
				$style_variant->group->marginLeft = ( $padding_left - abs($style_variant->group->margin_left) + abs($style_variant->group->left) ) * $col_size;
				$style_variant->group->marginRight = 0;
			}
		}
		$data->caption = trim( $data->caption );

		$markup = upfront_get_template(
			'this-post',
			array(
				"style" => $style_variant,
				"data" => $data,
			),
			dirname(dirname(__FILE__)) . '/tpl/post-image-insert.php'
		);
		return $markup;
	}

	/**
	 * Uses img_caption_shortcode to add support for UF image variants
	 *
	 * @param $out
	 * @param $attr
	 * @param $content
	 *
	 * @return string|void
	 */
	function image_caption_shortcode( $out, $attr, $content ){

		$is_wp_cation = strpos($attr["id"], "uinsert-" ) === false;

		if( $is_wp_cation ) return; // returning null let's wp do it's own logic and rendering for caption shortcode

//		$html = '<img class="" src="http://images.dressale.hk/images/320x480/201301/B/petite-girl-s-favorite-a-line-graduation-dress-with-empire-waist_1358440282519.jpg" alt="" width="320" height="480" /> Petite Girl';
		$image_reg = preg_match('/src="([^"]+)"/', $content, $image_arr);
		$href_reg = preg_match('/href="([^"]+)"/', $content, $anchor_arr);

		$data = (object) shortcode_atts( array(
			'id'	  => '',
			'caption' => '',
			'class'   => '',
			'uf_variant' => '',
			'uf_isLocal' => true,
			'uf_show_caption' => true,
			'image' => $image_reg ? $image_arr[1] : "",
			'linkUrl' => $href_reg ? $anchor_arr[1] : "",

		), $attr, 'caption' );

		return self::get_post_image_markup($data);

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
		//add_action('wp_ajax_this_post-get_markup', array($this, "load_markup"));
		upfront_add_ajax('this_post-get_markup', array($this, "load_markup"));

		//add_action('wp_ajax_content_part_markup', array($this, "get_part_contents"));
		upfront_add_ajax('content_part_markup', array($this, "get_part_contents"));

		//add_action('wp_ajax_this_post-get_thumbnail', array($this, "get_thumbnail"));
		upfront_add_ajax('this_post-get_thumbnail', array($this, "get_thumbnail"));

		add_action('wp_ajax_upfront_save_postparttemplate', array($this, "save_part_template"));
		add_action('wp_ajax_upfront_save_postlayout', array($this, "save_postlayout"));

		//add_action('wp_ajax_upfront_get_postlayout', array($this, "get_postlayout"));
		upfront_add_ajax('upfront_get_postlayout', array($this, "get_postlayout"));

		/**
		 * No need to save image inserts separately anymore
		 */
//		add_action('update_postmeta', array($this, 'update_image_thumbs'), 10, 4);
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
		if (!isset($_POST['post_id']))
			die('error');


		$post_id = $_POST['post_id'];

		$options = !empty($_POST['options']) && is_array($_POST['options']) ? $_POST['options'] : array();
		$templates = !empty($_POST['templates']) && is_array($_POST['templates']) ? stripslashes_deep($_POST['templates']) : array();

		//Prepare the parts before rendering
		if(isset($_POST['parts']))
			$parts = json_decode(stripslashes($_POST['parts']), true);
		else {
			$parts = array();
			foreach(Upfront_ThisPostView::$PARTNAMES as $slug)
				array_push($parts, array('slug' => $slug, 'options' => isset($options[$slug]) ? $options[$slug] : array()));
		}

		$output = $this->generate_part_contents($post_id, $options, $templates, $parts);

		$this->_out(new Upfront_JsonResponse_Success($output));
	}

	protected function generate_part_contents($post_id, $options, $templates, $parts = false, $properties = array()){
		//Prepare the parts before rendering
		if(!$parts){
			$parts = array();
			foreach(Upfront_ThisPostView::$PARTNAMES as $slug)
				array_push($parts, array('slug' => $slug, 'options' => isset($options[$slug]) ? $options[$slug] : array()));
		}

		$post = !empty($post_id) && is_numeric($post_id)
			? get_post($post_id)
			:  apply_filters('upfront-this_post-unknown_post', (object)array(), array('post_id' => $post_id));
		;


		$tpls = array();
		$replacements = array();
		$classes = array();

		$post_data = Upfront_ThisPostView::prepare_post($post);

		foreach($parts as $part){
			$slug = $part['slug'];
			$part_options = !empty($part['options']) ? $part['options'] : array(); // This is for editor
			$contents = Upfront_ThisPostView::get_post_part($slug, $part_options, isset($templates[$slug]) ? $templates[$slug] : '', $properties);

			$tpls[$slug] = $contents['tpl'];
			$classes[$slug] = $contents['classes'];
			$replacements = array_merge($replacements, $contents['replacements']);
			if($slug == 'contents'){
				$replacements['%raw_content%'] = wpautop($post->post_content);
				$replacements['%raw_excerpt%'] = wpautop(get_the_excerpt());
			}
		}
		$output = array(
			'tpls' => $tpls,
			'replacements' => $replacements,
			'classes' => $classes
		);

		return $output;
	}

	public function render_markup(){
		$data = json_decode(stripslashes($_POST['data']), true);
		if (!is_numeric($data['post_id'])) die('error');
	}

	public function load_markup() {
		$data = json_decode(stripslashes($_POST['data']), true);

		//if (!is_numeric($data['post_id'])) die('error');

		$content = '';

		global $post;
		if(!empty($data['post_id'])){
			if (is_numeric($data['post_id'])) {
				$post = get_post($data['post_id']);
				if(!$post) return $this->_out(new Upfront_JsonResponse_Error('Unknown post.'));
			} else {
				$post = apply_filters('upfront-this_post-unknown_post', $post, $data);
				if (empty($post->ID) || $post->ID !== $data['post_id']) $this->_out(new Upfront_JsonResponse_Error('Invalid post.'));
			}
		} else if($data['post_type']) {
			$post = Upfront_ThisPostView::get_new_post($data['post_type']);
		} else{

            $this->_out(new Upfront_JsonResponse_Error('Not enough data.'));
        }

		Upfront_ThisPostView::prepare_post($post);
		$content = Upfront_ThisPostView::get_template_markup($post, $data['properties']);
		
		
		$this->_out(new Upfront_JsonResponse_Success(array(
			"filtered" => $content
		)));
	}

	public function load_markup_old () {
		$data = json_decode(stripslashes($_POST['data']), true);
		if (!is_numeric($data['post_id'])) die('error');

		$content = '';

		if($data['post_id']){
			$post = get_post($data['post_id']);
			if(!$post)
				return $this->_out(new Upfront_JsonResponse_Error('Unknown post.'));

			if($post->post_status == 'trash')
				$content = '<div class="ueditor_deleted_post ueditable upfront-ui">' .
					sprintf(Upfront_ThisPostView::_get_l10n('thrashed_post'), $post->post_type, $post->post_type) .
				'</div>';
			else
				$content = Upfront_ThisPostView::get_post_markup($data['post_id'], null, $data['properties']);
		}
		else if($data['post_type'])
			$content = Upfront_ThisPostView::get_new_post_contents($data['post_type'], $data['properties']);
		else
			$this->_out(new Upfront_JsonResponse_Error('Not enough data.'));


		$this->_out(new Upfront_JsonResponse_Success(array(
			"filtered" => $content
		)));
	}

	public function save_part_template(){
		$tpl = isset($_POST['tpl']) ? stripslashes($_POST['tpl']) : false;
		$type = isset($_POST['type']) ? $_POST['type'] : false;
		$part = isset($_POST['part']) ? $_POST['part'] : false;
		$id = isset($_POST['id']) ? $_POST['id'] : false;

		if(!$tpl || !$type || !$part || !$id)
			$this->_out(new Upfront_JsonResponse_Error('Missing required data.'));

		if($type == 'UpostsModel')
			$type = 'archive';
		else
			$type = 'single';

		$key = get_stylesheet() . '-parttemplates-' . $type . '-' . $id;

		$templates = get_option($key);
		if(!$templates)
			$templates = array();

		$templates[$part] = $tpl;

		update_option($key, $templates);

		$this->_out(new Upfront_JsonResponse_Success(array(
			'stored' => true,
			'key' => $key,
			'tpl' => $tpl
		)));
	}

	public function save_postlayout() {
		$layoutData = isset($_POST['layoutData']) ? stripslashes_deep($_POST['layoutData']) : false;
		$cascade = isset($_POST['cascade']) ? $_POST['cascade'] : false;
		if(!$layoutData || !$cascade)
			$this->_out(new Upfront_JsonResponse_Error('No layout data or cascade sent.'));

		$key = get_stylesheet() . '-postlayout-' . $cascade;

		update_option($key, $layoutData);

		$this->_out(new Upfront_JsonResponse_Success(array(
			"key" => $key,
			"layoutData" => $layoutData
		)));
	}
	/**
	 * Loads all the data needed for a single post to be edited.
	 * @return null
	 */
	public function get_postlayout() {
		$post_type = isset($_POST['post_type']) ? $_POST['post_type'] : false;
		$type = isset($_POST['type']) ? $_POST['type'] : false;
		$id = isset($_POST['id']) ? $_POST['id'] : false;
		$post_id = isset($_POST['post_id']) ? $_POST['post_id'] : false;
		$properties = isset($_POST['properties']) ? $_POST['properties'] : false;

		if(!$post_type || !$type || !$id || !$post_id)
			$this->_out(new Upfront_JsonResponse_Error('No post_type, type or id sent.'));

		if (!empty($post_id)) {
			$post_type = get_post_type($post_id);
		}

		$layout_data = Upfront_ThisPostView::find_postlayout($type, $post_type, $id);

		$layout_data['partTemplates'] = stripslashes_deep(Upfront_ThisPostView::find_partTemplates($type, $post_type, $id));
		$layout_data['partContents'] = $this->generate_part_contents($post_id, $layout_data['partOptions'], $layout_data['partTemplates'], false, $properties);
		$this->_out(new Upfront_JsonResponse_Success($layout_data));
	}

	public function update_image_thumbs($meta_id, $post_id, $key, $value){
		if($key != '_inserts_data')
			return;

		$inserts = maybe_unserialize($value);


		if(!is_array($inserts))
			return;

		foreach($inserts as $id => $img){
			if(isset($img['imageThumb']) && $img['isLocal'] != 'false'){
				//We got an image
				$image_path = $this->get_image_path($img['imageThumb']['src']);
				//If the file doesn't exits, let's create it
				if(!file_exists($image_path)){
					// Get image data
					$imageData = Upfront_Uimage_Server::calculate_image_resize_data($img['imageThumb'], $img['imageFull']);
					// Add the full size image path
					$imageData['image_path'] = $this->get_image_path($img['imageFull']['src']);
					$imageData['skip_random_filename'] = true;

					Upfront_Uimage_Server::resize_image($imageData);
				}
			}
		}
	}

	protected function get_image_path($url){
		$upload_data = wp_upload_dir();
		$upload_dir = $upload_data['basedir'];
		$upload_url = $upload_data['baseurl'];

		$path = $upload_dir . str_replace($upload_url, '', $url);

		return $path;
	}
}
Upfront_ThisPostAjax::serve();
