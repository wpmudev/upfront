<?php

class Upfront_Output {

	private $_layout;
	private $_debugger;

	private static $_instance;

	public static $current_object;
	public static $current_module;
	public static $grid;

	public function __construct ($layout, $post) {
		$this->_layout = $layout;
		$this->_debugger = Upfront_Debug::get_debugger();
		
		self::$grid = Upfront_Grid::get_grid();
	}
	public static function get_post_id () {
		return is_singular() ? get_the_ID() : false;
	}
	public static function get_layout ($layout_ids, $apply = false) {
		$layout = Upfront_Layout::from_entity_ids($layout_ids);

		if ($layout->is_empty()) {
			$layout = Upfront_Layout::create_layout($layout_ids);
		}

		$post_id = is_singular() ? get_the_ID() : '';
		$post = get_post($post_id);
		self::$_instance = new self($layout, $post);

		// Add actions
		add_action('wp_enqueue_scripts', array(self::$_instance, 'add_styles'));
		add_action('wp_enqueue_scripts', array(self::$_instance, 'add_scripts'), 2);

		// Do the template...
		if ( $apply )
			return self::$_instance->apply_layout();
		return self::$_instance;
	}

	public static function get_layout_data () {
		if ( self::$_instance )
			return self::$_instance->_layout->to_php();
		return false;
	}

	public static function get_layout_object () {
		if ( self::$_instance )
			return self::$_instance->_layout;
		return false;
	}

	public static function get_current_object () {
		if ( self::$current_object )
			return self::$current_object;
		return false;
	}

	public static function get_current_module () {
		if ( self::$current_module )
			return self::$current_module;
		return false;
	}

	public function apply_layout () {
		$layout = $this->_layout->to_php();
		$html = '';
		$html_layout = '';

		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$html =  "<!-- Code generated by Upfront core -->\n";
			$html .= "<!-- Layout Name: {$layout['name']} -->\n";
		}
		$layout_view = new Upfront_Layout_View($layout);
		$region_markups = array();
		$region_markups_before = array();
		$region_markups_after = array();
		$container_views = array();
		foreach ($layout['regions'] as $region) {
			$region_view = new Upfront_Region($region);
			$region_sub = $region_view->get_sub();
			$markup = $region_view->get_markup();
			$container = $region_view->get_container();
			if ( ! isset($region_markups[$container]) )
				$region_markups[$container] = '';
			if ( ! isset($region_markups_before[$container]) )
				$region_markups_before[$container] = '';
			if ( ! isset($region_markups_after[$container]) )
				$region_markups_after[$container] = '';
			if ( $region_sub == 'top' || $region_sub == 'bottom' ){
				$sub_container = new Upfront_Region_Sub_Container($region);
				$markup = $sub_container->wrap( $markup );
				if ( $region_sub == 'top' )
					$region_markups_before[$container] .= $markup;
				else
					$region_markups_after[$container] .= $markup;
			}
			else if ( $region_sub == 'fixed' ){
				$region_markups_after[$container] .= $markup;
			}
			else{
				$region_markups[$container] .= $markup;
			}
			if ( $region_view->get_name() == $container ) {
				$container_views[$container] = new Upfront_Region_Container($region);
			}
		}
		foreach ($container_views as $container => $container_view) {
			$type = $container_view->get_entity_type();
			$html_layout .= $container_view->wrap( $region_markups[$container], $region_markups_before[$container], $region_markups_after[$container] );
		}
		$html .= $layout_view->wrap($html_layout);
		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$html .= "<!-- Upfront layout end -->\n";
		}

		do_action('upfront-layout-applied', $layout);

		return $html;
	}

	function add_styles () {
		wp_enqueue_style('upfront-main', upfront_ajax_url('upfront_load_styles'), array(), 0.1, 'all');

		// Load theme fonts
		$theme_fonts = json_decode(get_option('upfront_' . get_stylesheet() . '_theme_fonts'));
		$theme_fonts = apply_filters('upfront_get_theme_fonts', $theme_fonts, array());
		if( $theme_fonts ) {
			foreach($theme_fonts as $theme_font) {
				wp_enqueue_style(
					strtolower(str_replace(' ', '-', $theme_font->font->family)) . '-' . $theme_font->variant,
					'//fonts.googleapis.com/css?family=' . str_replace(' ', '+', $theme_font->font->family) . ':' . $theme_font->variant
				);
			}
		}

	}

	function add_scripts () {
		upfront_add_element_script('upfront-layout', array('scripts/layout.js', dirname(__FILE__)));
		upfront_add_element_script('upfront-default-map', array('scripts/default-map.js', dirname(__FILE__)));
		upfront_add_element_script('upfront-default-slider', array('scripts/default-slider.js', dirname(__FILE__)));
		upfront_add_element_style('upfront-default-slider', array('styles/default-slider.css', dirname(__FILE__)));

	}
}



abstract class Upfront_Entity {

	protected $_data;
	protected $_tag = 'div';
	protected $_debugger;

	public function __construct ($data) {
		$this->_data = $data;
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	abstract public function get_markup ();


	public function get_style_for ($breakpoint, $context) {

		return '';

		$post = $pre = '';
		$post = $this->_debugger->is_active(Upfront_Debug::STYLE)
			? "/* General styles for {$this->get_name()} */"
			: ""
		;
		return trim("{$pre} .{$context} .{$this->get_css_class()} {" .
			'width: 100%;' .
		"} {$post}") . "\n";
	}

	public function get_front_context () {
		return 'default';
	}

	public function get_css_class () {
		$type = strtolower(str_replace("_", "-", $this->_type));
		$classes = array(
			"upfront-output-" . $type,
			$this->get_front_context()
		);
		$name = $this->get_name();
		if ( $name != 'anonymous' )
			$classes[] = "upfront-" . $type . "-" . strtolower(str_replace(" ", "-", $name));
		$entity_type = $this->get_entity_type();
		if ( $entity_type )
			$classes[] = "upfront-" . $type . "-" . $entity_type;

		return join(' ', $classes);
	}

	public function get_css_inline () {
		return '';
	}

	public function get_attr () {
		return '';
	}
	
	public function get_id () {
		return $this->_get_property('element_id');
	}

	protected function _get_property ($prop) {
		return upfront_get_property_value($prop, $this->_data);
	}
	
	protected function _get_breakpoint_property ($prop, $id) {
		$breakpoint = $this->_get_property('breakpoint');
		if ( !empty($breakpoint[$id]) && isset($breakpoint[$id][$prop]) )
			return $breakpoint[$id][$prop];
		return $this->_get_property($prop);
	}

	public function get_name () {
		if (!empty($this->_data['name'])) return $this->_data['name'];
		return 'anonymous';
	}

	public function get_entity_type () {
		if (!empty($this->_data['type'])) return $this->_data['type'];
		return '';
	}

	public function get_container () {
		if (!empty($this->_data['container'])) return $this->_data['container'];
		return $this->get_name();
	}

	public function get_class_num ($classname) {
		$classes = $this->_get_property('class');
		return upfront_get_class_num($classname, $classes);
	}

	public function get_background_type ($breakpoint_id = '') {
		$type = $this->_get_breakpoint_property('background_type', $breakpoint_id);
		if ( ! $type ){
			$background_color = $this->_get_breakpoint_property('background_color', $breakpoint_id);
			$background_image = $this->_get_breakpoint_property('background_image', $breakpoint_id);
			if ( $background_image )
				$type = 'image';
			else if ( $background_color )
				$type = 'color';
		}
		return $type;
	}
	protected function _get_background_css ($is_layout = false, $lazy_loading = false, $breakpoint_id = '') {
		$type = $this->get_background_type($breakpoint_id);
		$default_type = $this->get_background_type();
		$css = array();
		$background_color = $this->_get_breakpoint_property('background_color', $breakpoint_id);
		if ( !$type || in_array($type, array('image', 'color', 'featured')) ){
			if($type == 'featured' && has_post_thumbnail(Upfront_Output::get_post_id())) {
				$featured_image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
				$background_image = $featured_image[0];
			}
			else
				$background_image = $this->_get_breakpoint_property('background_image', $breakpoint_id);
			$background_repeat = $this->_get_breakpoint_property('background_repeat', $breakpoint_id);
			$background_fill = $this->_get_breakpoint_property('background_fill', $breakpoint_id);
			$background_position = $this->_get_breakpoint_property('background_position', $breakpoint_id);
			$background_style = $this->_get_breakpoint_property('background_style', $breakpoint_id);
			if ( $background_color )
				$css[] = 'background-color: ' . $background_color;
			if ( $type == 'image' || $type == 'featured' && $background_image ){
				if ( !$lazy_loading )
					$css[] = 'background-image: url("' . $background_image . '")';
				if ( $background_style == 'full' ){
					$css[] = 'background-size: 100% auto';
					$css[] = 'background-repeat: no-repeat';
					$css[] = 'background-position: 50% 50%';
				}
				else {
					$css[] = 'background-size: auto auto';
					$css[] = 'background-repeat: ' . $background_repeat;
					$css[] = 'background-position: ' . $background_position;
				}
			}
		}
		else if ( $type == 'video' ){
			$background_video_style = $this->_get_breakpoint_property('background_video_style', $breakpoint_id);
			if ( $background_video_style == 'inside' && $background_color )
				$css[] = 'background-color: ' . $background_color;
		}
		if ( !empty($breakpoint_id) && ( $default_type == 'image' || $default_type == 'featured' ) ) {
			$css[] = 'background-image: none';
		}
		return ( !empty($css) ) ? implode('; ', $css) . '; ' : '';
	}

	protected function _get_background_attr ($is_layout = false, $lazy_loading = false, $breakpoint_id = '') {
		$type = $this->get_background_type($breakpoint_id);
		$attr = '';
		$breakpoint = empty($breakpoint_id) ? 'desktop' : $breakpoint_id;
		if ( !$type || $type == 'image' || $type == 'featured' ){
			if($type == 'featured' && has_post_thumbnail(Upfront_Output::get_post_id())) {
				$featured_image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'single-post-thumbnail' );
				$background_image = $featured_image[0];
			}
			else
				$background_image = $this->_get_breakpoint_property('background_image', $breakpoint_id);
			$background_style = $this->_get_breakpoint_property('background_style', $breakpoint_id);
			$background_image_ratio = $this->_get_breakpoint_property('background_image_ratio', $breakpoint_id);
			if ( $background_image ){
				if ( $lazy_loading )
					$attr .= " data-src-{$breakpoint}='{$background_image}'";
				if ( $background_style == 'full' ){
					$attr .= " data-bg-image-ratio-{$breakpoint}='{$background_image_ratio}'";
				}
				if ( !$type )
					$type = 'image';
			}
		}
		if ( !$type )
			$type = 'color';
		$attr .= " data-bg-type-{$breakpoint}='{$type}'";
		return $attr;
	}

	protected function _get_background_overlay ($breakpoint_id = '') {
		$type = $this->get_background_type($breakpoint_id);
		if ( !$type || in_array($type, array('image', 'color', 'featured')) )
			return '';
		$attr = '';
		$markup = '';
		$classes = "upfront-output-bg-overlay upfront-output-bg-{$type}";
		$classes .= ( $breakpoint_id ) ? " upfront-output-bg-{$breakpoint_id}" : "upfront-output-bg-desktop";
		if ( $type == 'map' ) {
			$data = array(
				'center' => $this->_get_breakpoint_property('background_map_center', $breakpoint_id),
				'zoom' => $this->_get_breakpoint_property('background_map_zoom', $breakpoint_id),
				'style' => $this->_get_breakpoint_property('background_map_style', $breakpoint_id),
        		'controls' => $this->_get_breakpoint_property('background_map_controls', $breakpoint_id),
        		'styles' => $this->_get_breakpoint_property('background_map_styles', $breakpoint_id)
			);
			$attr .= 'data-bg-map="' . esc_attr( json_encode($data) ) . '"';
		}
		else if ( $type == 'slider' ){
			$slides = array();
			$images = $this->_get_breakpoint_property('background_slider_images', $breakpoint_id);
			$auto = $this->_get_breakpoint_property('background_slider_rotate', $breakpoint_id);
			$interval = $this->_get_breakpoint_property('background_slider_rotate_time', $breakpoint_id) * 1000;
			$show_control = $this->_get_breakpoint_property('background_slider_control', $breakpoint_id);
			$effect = $this->_get_breakpoint_property('background_slider_transition', $breakpoint_id);
			$slide_attr = "data-slider-show-control='{$show_control}' data-slider-effect='{$effect}'";
			if ( $auto )
				$slide_attr .= " data-slider-auto='1' data-slider-interval='{$interval}'";
			else
				$slide_attr .= " data-slider-auto='0'";
	    	foreach ( $images as $image ){
	    		//$src = wp_get_attachment_image($image, 'full');
	    		$src = upfront_get_attachment_image_lazy($image, 'full');
				$slides[] = "<div class='upfront-default-slider-item'>{$src}</div>";
	    	}
			$slides_markup = join('', $slides);
			$markup = "<div class='upfront-bg-slider' {$slide_attr}>{$slides_markup}</div>";
		}
		else if ( $type == 'video' ){
			$video = $this->_get_breakpoint_property('background_video', $breakpoint_id);
			$embed = $this->_get_breakpoint_property('background_video_embed', $breakpoint_id);
			$width = $this->_get_breakpoint_property('background_video_width', $breakpoint_id);
			$height = $this->_get_breakpoint_property('background_video_height', $breakpoint_id);
			$style = $this->_get_breakpoint_property('background_video_style', $breakpoint_id);
			$mute = $this->_get_breakpoint_property('background_video_mute', $breakpoint_id);
			if ( $video && $embed ){
				$attr = 'data-bg-video-ratio="' . round($height/$width, 2) . '" ';
				$attr .= 'data-bg-video-style="' . $style . '" ';
				// hack additional attributes
				$vid_attrs = array(
					'.*?vimeo\.' => 'autoplay=1&amp;loop=1',
					'.*?youtube\.com\/(v|embed)\/(.+?)(\/|\?).*?$' => 'autoplay=1&amp;controls=0&amp;showinfo=0&amp;modestbranding=1&amp;loop=1&amp;playlist=$3',
					'.*?wistia\.' => 'autoplay=1'
				);
				$vid_attr = '';
				$embed_attr = '';
				if ( preg_match('/(^.*?<iframe.*?src=[\'"])(.*?)([\'"])(.*$)/is', $embed, $match) ){
					foreach ( $vid_attrs as $vid => $a ){
						if ( preg_match( '/^(https?:|)\/\/' . $vid . '/i', $match[2], $vid_match ) ){
							foreach ( $vid_match as $i => $m ){
								if ( $i == 0 )
									continue;
								$a = str_replace('$'.$i, $m, $a);
							}
							$vid_attr = $a;
							break;
						}
					}
					$embed = $match[1] . $match[2] . ( strpos($match[2], '?') > 0  ? '&amp;' : '?' ) . $vid_attr . $match[3] . $embed_attr . $match[4];
				}
				$markup = "<script class='video-embed-code' type='text/html'>{$embed}</script>";
			}
		}
		return "<div class='{$classes}' {$attr}>{$markup}</div>" . "\n";
	}
}


abstract class Upfront_Container extends Upfront_Entity {

	protected $_type;
	protected $_children;
	protected $_child_view_class;
	protected $_wrapper;

	public function get_markup () {
		$html='';
		$wrap='';

		if (!empty($this->_data[$this->_children])) foreach ($this->_data[$this->_children] as $idx => $child) {
			$child_view = $this->instantiate_child($child, $idx);
			if ($child_view instanceof Upfront_Container){
				// Have wrapper? If so, then add wrappers
				$wrapper = $child_view->get_wrapper();

				if ( $wrapper && !$this->_wrapper )
					$this->_wrapper = $wrapper;
				if ( $wrapper && $this->_wrapper->get_wrapper_id() == $wrapper->get_wrapper_id() ){
					$wrap .= $child_view->get_markup();
				}
				else if ( $wrapper ) {
					$html .= $this->_wrapper->wrap($wrap);
					$this->_wrapper = $wrapper;
					$wrap = $child_view->get_markup();
				}
			}
			// No wrapper, just appending html
			if ( !isset($wrapper) || !$wrapper ){
				if($this->_child_view_class == 'Upfront_Object'){
					$theme_style = upfront_get_property_value('theme_style', $child);
					if($theme_style)
						$theme_style = strtolower($theme_style);
					$breakpoint = upfront_get_property_value('breakpoint', $child);
					$theme_styles = array( 'default' => $theme_style );
					$theme_styles_attr = '';
					if ( $breakpoint ) {
						foreach ( $breakpoint as $id => $props ){
							if ( !empty($props['theme_style']) )
								$theme_styles[$id] = strtolower($props['theme_style']);
						}
						$theme_styles_attr = " data-theme-styles='" . json_encode($theme_styles) . "'";
					}
					$slug = upfront_get_property_value('id_slug', $child);
					$classes = $this->_get_property('class');
					$column = upfront_get_class_num('c', $classes);
					$class = $slug === "uposts" ?   "c" . $column . " uposts-object" : upfront_get_property_value('class', $child);
					$html .= '<div class="upfront-output-object ' . $theme_style .' upfront-output-' . $slug . ' ' . $class . '" id="' . upfront_get_property_value('element_id', $child)  . '"' . $theme_styles_attr . '>' . $child_view->get_markup() . '</div>';
				}
				else
					$html .= $child_view->get_markup();
			}
		}

		// Have wrapper, append the last one
		if ( isset($wrapper) && $wrapper )
			$html .= $this->_wrapper->wrap($wrap);
		return $this->wrap($html);
	}

	// Overriden from Upfront_Entity
	public function get_style_for ($breakpoint, $context) {
		$style = parent::get_style_for($breakpoint, $context);
		if (!empty($this->_data[$this->_children])) foreach ($this->_data[$this->_children] as $idx => $child) {
			$child_view = $this->instantiate_child($child, $idx);
			$style .= $child_view->get_style_for($breakpoint, $context);
		}
		return $style;
	}

	public function instantiate_child ($child_data, $idx) {
		$view_class = upfront_get_property_value("view_class", $child_data);
		$view = $view_class
			? "Upfront_{$view_class}"
			: $this->_child_view_class
		;
		if (!class_exists($view)) $view = $this->_child_view_class;
		return new $view($child_data);
	}

	public function wrap ($out) {
		$class = $this->get_css_class();
		$style = $this->get_css_inline();
		$attr = $this->get_attr();
		$element_id = $this->get_id();

		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$name = $this->get_name();
			$pre = "\n\t<!-- Upfront {$this->_type} [{$name} - #{$element_id}] -->\n";
			$post = "\n<!-- End {$this->_type} [{$name} - #{$element_id}] --> \n";
		}
		else {
			$pre = "";
			$post = "";
		}

		$style = $style ? "style='{$style}'" : '';
		$element_id = $element_id ? "id='{$element_id}'" : '';
		return "{$pre}<{$this->_tag} class='{$class}' {$style} {$element_id} {$attr}>{$out}</{$this->_tag}>{$post}";
	}

	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		return Upfront_Wrapper::get_instance($wrapper_id);
	}


}

class Upfront_Layout_View extends Upfront_Container {
	protected $_type = 'Layout';

	public function wrap ($out, $before = '', $after = '') {
		$overlay = "";
		foreach ( Upfront_Output::$grid->get_breakpoints(true) as $breakpoint ) {
			$overlay .= $this->_get_background_overlay($breakpoint->get_id());
		}
		return parent::wrap("{$before}{$out}{$after}\n{$overlay}");
	}

	public function get_css_inline () {
		$css = '';
		return $css;
	}

	public function get_attr () {
		$attr = '';
		foreach ( Upfront_Output::$grid->get_breakpoints(true) as $breakpoint ) {
			$attr .= $this->_get_background_attr(true, false, $breakpoint->get_id());
		}
		return $attr;
	}
	
	public function get_style_for ($point, $scope) {
		$css = '';
		$type = $this->get_background_type($point->get_id());
		$default_type = $this->get_background_type();
		$bg_css = $this->_get_background_css(false, true, $point->get_id());
		if ( !empty($bg_css) ) {
			$css .= sprintf('%s %s {%s}',
						'.' . ltrim($scope, '. '),
						'.upfront-output-layout',
						$bg_css
					) . "\n";
		}
		if ( !$point->is_default() && $default_type && !in_array($default_type, array('image', 'color', 'featured')) ) {
			$css .= sprintf('%s %s > %s {%s}',
						'.' . ltrim($scope, '. '),
						'.upfront-output-layout',
						'.upfront-output-bg-overlay',
						'display: none;'
					) . "\n";
		}
		if ( $type && !in_array($type, array('image', 'color', 'featured')) ) {
			$css .= sprintf('%s %s > %s {%s}',
						'.' . ltrim($scope, '. '),
						'.upfront-output-layout',
						'.upfront-output-bg-' . $point->get_id(),
						'display: block;'
					) . "\n";
		}
		return $css;
	}

}


class Upfront_Region_Container extends Upfront_Container {
	protected $_type = 'Region_Container';

	public function wrap ($out, $before = '', $after = '') {
		$overlay = '';
		$bg_attr = '';
		foreach ( Upfront_Output::$grid->get_breakpoints(true) as $breakpoint ) {
			$overlay .= $this->_get_background_overlay($breakpoint->get_id());
			$bg_attr .= $this->_get_background_attr(false, true, $breakpoint->get_id());
		}
		$bg_node_start = "<div class='upfront-region-container-bg upfront-image-lazy upfront-image-lazy-bg' {$bg_attr}>";
		$bg_node_end = "</div>";
		return parent::wrap("{$bg_node_start}{$before}<div class='upfront-grid-layout'>{$out}</div>\n{$overlay}{$after}{$bg_node_end}");
	}

	public function get_css_inline () {
		$css = '';
		return $css;
	}

	public function get_attr () {
		$attr = '';
		if ( !empty($this->_data['type']) && $this->_data['type'] == 'full' ) {
			$attr .= ' data-behavior="' . ( !empty($this->_data['behavior']) ? $this->_data['behavior'] : 'keep-position' ) . '"';
			$attr .= ' data-original-height="' . $this->_get_property('original_height') . '"';
		}
		if ( !empty($this->_data['sticky']) ) {
			$attr .= ' data-sticky="1"';
		}
		return $attr;
	}
	
	public function get_id () {
		return 'upfront-region-container-' . strtolower(str_replace(" ", "-", $this->get_name()));
	}

	public function get_style_for ($point, $scope) {
		$css = '';
		$type = $this->get_background_type($point->get_id());
		$default_type = $this->get_background_type();
		$bg_css = $this->_get_background_css(false, true, $point->get_id());
		if ( !empty($bg_css) ) {
			$css .= sprintf('%s #%s > %s {%s}',
						'.' . ltrim($scope, '. '),
						$this->get_id(),
						'.upfront-region-container-bg',
						$bg_css
					) . "\n";
		}
		if ( !$point->is_default() && $default_type && !in_array($default_type, array('image', 'color', 'featured')) ) {
			$css .= sprintf('%s #%s > %s {%s}',
						'.' . ltrim($scope, '. '),
						$this->get_id(),
						'.upfront-region-container-bg > .upfront-output-bg-overlay',
						'display: none;'
					) . "\n";
		}
		if ( $type && !in_array($type, array('image', 'color', 'featured')) ) {
			$css .= sprintf('%s #%s > %s {%s}',
						'.' . ltrim($scope, '. '),
						$this->get_id(),
						'.upfront-region-container-bg > .upfront-output-bg-' . $point->get_id(),
						'display: block;'
					) . "\n";
		}
		return $css;
	}
}

class Upfront_Region_Sub_Container extends Upfront_Region_Container {
	protected $_type = 'Region_Sub_Container';

	public function wrap ($out, $before = '', $after = '') {
		return parent::wrap($out, '', '');
	}
}

class Upfront_Region extends Upfront_Container {
	protected $_type = 'Region';
	protected $_children = 'modules';
	protected $_child_view_class = 'Upfront_Module';

	protected function _is_background () {
		return ( $this->get_container() != $this->get_name() && ( !$this->_data['sub'] || ( $this->_data['sub'] != 'top' && $this->_data['sub'] != 'bottom' ) ) );
	}

	public function wrap ($out) {
		$overlay = '';
		if ( $this->_is_background() ) {
			foreach ( Upfront_Output::$grid->get_breakpoints() as $breakpoint ) {
				$overlay .= $this->_get_background_overlay($breakpoint->get_id());
			}
		}
		return parent::wrap( "<div class='upfront-region-wrapper'>{$out}</div>\n{$overlay}" );
	}

	public function instantiate_child ($child_data, $idx) {
		$view = !empty($child_data['modules']) && is_array($child_data['modules']) ? "Upfront_Module_Group" : $this->_child_view_class;
		if (!class_exists($view)) $view = $this->_child_view_class;
		return new $view($child_data, $this->_data);
	}

	public function get_css_class () {
		$classes = parent::get_css_class();
		$more_classes = array();
		$container = $this->get_container();
		$is_main = ( empty($container) || $container == $this->get_name() );
		if ( $is_main ) {
			$more_classes[] = 'upfront-region-center';
		}
		else {
			$more_classes[] = 'upfront-region-side';
			$more_classes[] = 'upfront-region-side-' . $this->get_sub();
		}
		return $classes . ' ' . join(' ', $more_classes);
	}

	public function get_css_inline () {
		$css = '';
		if ( !empty($this->_data['type']) &&  'fixed' === $this->_data['type'] )
			$css .=  $this->_get_position_css();
		elseif ( !empty($this->_data['type']) && 'lightbox' === $this->_data['type'] )
			$css = 'background-color:'. $this->_get_property('lightbox_color').'; '.$this->_get_position_css();
		return $css;
	}

	public function get_attr () {
		$attr = '';
		if ( $this->_is_background() ) {
			foreach ( Upfront_Output::$grid->get_breakpoints() as $breakpoint ) {
				$attr .= $this->_get_background_attr(false, true, $breakpoint->get_id());
			}
		}

		if ( !empty($this->_data['type']) && 'fixed' === $this->_data['type'] ) {
			$restrict = $this->_data['restrict_to_container'];
			$top = $this->_get_property('top');
			$bottom = $this->_get_property('bottom');
			$left = $this->_get_property('left');
			$right = $this->_get_property('right');
			if ( !empty($restrict) )
				$attr .= ' data-restrict-to-container="' . $restrict . '"';
			if ( $top )
				$attr .= ' data-top="' . $top . '"';
			else
				$attr .= ' data-bottom="' . $bottom . '"';
			if ( $left )
				$attr .= ' data-left="' . $left . '"';
			else
				$attr .= ' data-right="' . $right . '"';
		}
		if(	!empty($this->_data['type']) && 'lightbox' === $this->_data['type'] ) {
			$attr .= ' data-overlay = "'.$this->_get_property('overlay_color').'"';
			$attr .= ' data-col = "'.$this->_get_property('col').'"';
			$attr .= ' data-closeicon = "'.(is_array($this->_get_property('show_close'))?array_pop($this->_get_property('show_close')):$this->_get_property('show_close')).'"';
			$attr .= ' data-clickout = "'.(is_array($this->_get_property('click_out_close'))?array_pop($this->_get_property('click_out_close')):$this->_get_property('click_out_close')).'"';
			$addclosetext = is_array($this->_get_property('add_close_text'))?array_pop($this->_get_property('add_close_text')):$this->_get_property('add_close_text');
			$attr .= ' data-addclosetext = "'.$addclosetext.'"';
			if($addclosetext == 'yes') {
				$attr .= ' data-closetext = "'.$this->_get_property('close_text').'"';
			}
		}
		return $attr;
	}
	
	public function get_id () {
		return 'upfront-region-' . strtolower(str_replace(" ", "-", $this->get_name()));
	}

	public function get_sub () {
		return !empty($this->_data['sub']) ? $this->_data['sub'] : false;
	}

	public function get_style_for ($point, $scope) {
		if ( ! $this->_is_background() )
			return '';
		$css = '';
		$type = $this->get_background_type($point->get_id());
		$default_type = $this->get_background_type();
		$bg_css = $this->_get_background_css(false, true, $point->get_id());
		if ( ! empty($bg_css) ) {
			$css .= sprintf('%s #%s {%s}',
						'.' . ltrim($scope, '. '),
						$this->get_id(),
						$bg_css
					) . "\n";
		}
		if ( !$point->is_default() && $default_type && !in_array($default_type, array('image', 'color', 'featured')) ){
			$css .= sprintf('%s #%s > %s {%s}',
						'.' . ltrim($scope, '. '),
						$this->get_id(),
						'.upfront-output-bg-overlay',
						'display: none;'
					) . "\n";
		}
		if ( $type && !in_array($type, array('image', 'color', 'featured')) ) {
			$css .= sprintf('%s #%s > %s {%s}',
						'.' . ltrim($scope, '. '),
						$this->get_id(),
						'.upfront-output-bg-' . $point->get_id(),
						'display: block;'
					) . "\n";
		}
		return $css;
	}

	public function _get_position_css () {
		$css = array();

		$height = $this->_get_property('height');

		if ( $this->_data['type'] != 'lightbox') {
			$width = $this->_get_property('width');
			$top = $this->_get_property('top');
			$left = $this->_get_property('left');
			$bottom = $this->_get_property('bottom');
			$right = $this->_get_property('right');
			if ( $top !== false || $bottom === false )
				$css[] = 'top: ' . ( $top !== false ? $top : 30 ) . 'px';
			else
				$css[] = 'bottom: ' . $bottom . 'px';
			if ( $left !== false || $right === false )
				$css[] = 'left: ' . ( $left !== false ? $left : 30 ) . 'px';
			else
				$css[] = 'right: ' . $right . 'px';

			$css[] = 'width: ' . $width . 'px';
		}

		$css[] = 'min-height: ' . $height . 'px';
		return implode('; ', $css) . '; ';
	}
}

class Upfront_Wrapper extends Upfront_Entity {
	static protected $_instances = array();
	protected $_type = 'Wrapper';
	protected $_wrapper_id = '';

	static public function get_instance ($wrapper_id, $data = '') {
		foreach ( self::$_instances as $instance ){
			if ( $instance->_wrapper_id == $wrapper_id )
				return $instance;
		}
		$wrapper_data = false;
		if ( empty($data) ){
			$layout = Upfront_Output::get_layout_data();
			if ( !$layout )
				return false;
			foreach ( $layout['regions'] as $region ){
				if (!empty($region['wrappers'])) foreach ( $region['wrappers'] as $wrapper ){
					if ( $wrapper_id == upfront_get_property_value('wrapper_id', $wrapper) ){
						$wrapper_data = $wrapper;
						break 2;
					}
				}
			}
		}
		else {
			if (!empty($data['wrappers'])) foreach ( $data['wrappers'] as $wrapper ){
				if ( $wrapper_id == upfront_get_property_value('wrapper_id', $wrapper) ){
					$wrapper_data = $wrapper;
					break;
				}
			}
		}
		if ( !$wrapper_data )
			return false;
		self::$_instances[] = new self($wrapper_data);
		return end(self::$_instances);
	}

	public function __construct ($data) {
		parent::__construct($data);
		$this->_wrapper_id = $this->_get_property('wrapper_id');
	}

	public function get_markup () {
		return '';
	}

	public function get_wrapper_id () {
		return $this->_wrapper_id;
	}

	public function wrap ($out) {
		$class = $this->get_css_class();

		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$name = $this->get_name();
			$pre = "\n\t<!-- Upfront {$this->_type} [{$name} - #{$this->_wrapper_id}] -->\n";
			$post = "\n<!-- End {$this->_type} [{$name} - #{$this->_wrapper_id}] --> \n";
		}
		else {
			$pre = "";
			$post = "";
		}

		$wrapper_id = $this->_wrapper_id ? "id='{$this->_wrapper_id}'" : '';
		return "{$pre}<{$this->_tag} class='{$class}' {$wrapper_id}>{$out}</{$this->_tag}>{$post}";
	}
}


class Upfront_Module_Group extends Upfront_Container {
	protected $_type = 'Module_Group';
	protected $_children = 'modules';
	protected $_child_view_class = 'Upfront_Module';

	public function __construct ($data) {
		parent::__construct($data);
	}

	public function get_markup () {
		return parent::get_markup();
	}

	public function instantiate_child ($child_data, $idx) {
		$view_class = upfront_get_property_value("view_class", $child_data);
		$view = $view_class
			? "Upfront_{$view_class}"
			: $this->_child_view_class
		;
		if (!class_exists($view)) $view = $this->_child_view_class;
		return new $view($child_data, $this->_data);
	}
}

class Upfront_Module extends Upfront_Container {
	protected $_type = 'Module';
	protected $_children = 'objects';
	protected $_child_view_class = 'Upfront_Object';

	public function __construct ($data, $parent_data = "") {
		parent::__construct($data);
		$this->_parent_data = $parent_data;
		Upfront_Output::$current_module = $this;
	}

	public function get_markup () {
		$children = !empty($this->_data[$this->_children]) ? $this->_data[$this->_children] : array();
		$pre = '';
		if (!empty($children)) foreach ($children as $child) {
			$anchor = upfront_get_property_value('anchor', $child);
			if (!empty($anchor)) $pre .= '<a id="' . esc_attr($anchor) . '"></a>';
		}
		return $pre . parent::get_markup();
	}

	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		return Upfront_Wrapper::get_instance($wrapper_id, $this->_parent_data);
	}
}

class Upfront_Object extends Upfront_Entity {
	protected $_type = 'Object';

	public function __construct ($data) {
		//Make sure all the properties are initialized
		$data['properties'] = $this->merge_default_properties($data);
		parent::__construct($data);
		Upfront_Output::$current_object = $this;
	}

	protected function merge_default_properties($data){

		if(! method_exists(get_class($this), 'default_properties')){
			if(isset($data['properties']))
				return $data['properties'];
			return array();
		}

		$flat = array();
		$defaults = call_user_func(array(get_class($this), 'default_properties'));

		if(isset($data['properties']))
			foreach($data['properties'] as $prop)
				$flat[$prop['name']] = !empty($prop['value']) ? $prop['value'] : false;

		$flat = array_merge($defaults, $flat);

		if(!empty($flat['theme_style'])){
			$flat['class'] .= ' ' . $flat['theme_style'];
		}

		$properties = array();
		foreach($flat as $name => $value)
			$properties[] = array('name' => $name, 'value' => $value);

		return $properties;
	}

	public function get_markup () {
		$view_class = 'Upfront_' . $this->_get_property("view_class");
		if(!class_exists($view_class))
			return $view_class . ' class not found';

		$view = new $view_class($this->_data);

		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$name = $view->get_name();
			$pre = "\n\t<!-- Upfront {$view_class} [{$name}] -->\n";
			$post = "\n<!-- End {$view_class} [{$name}] --> \n";
		}

		return $pre . $view->get_markup() . $post;
	}
}
/*
class Upfront_PlainTxtView extends Upfront_Object {

	public function get_markup () {

		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$content = $this->_get_property('content');

		$matches = array();
		$regex = '/<div class="plaintxt_padding([^>]*)>(.+?)<\/div>/s';
		preg_match($regex, $content, $matches);

		if(sizeof($matches) > 1)
			$content = $matches[2];

		$style = array();
		if($this->_get_property('background_color') && $this->_get_property('background_color')!='')
			$style[] = 'background-color: '.$this->_get_property('background_color');

		if($this->_get_property('border') && $this->_get_property('border')!='')
			$style[] = 'border: '.$this->_get_property('border');

		return "<div {$element_id}>".(sizeof($style)>0 ? "<div class='plaintxt_padding' style='".implode(';', $style)."'>": ''). $content .(sizeof($style)>0 ? "</div>": ''). '</div>';
	}
}



class Upfront_ImageView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		return "<div class='upfront-output-object upfront-output-image' {$element_id}><img src='" . esc_attr($this->_get_property('content')) . "' /></div>";
	}
}
*/
class Upfront_SettingExampleView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		return "<div class='upfront-output-object upfront-settingexample' {$element_id}></div>";
	}
}

class Upfront_TestResizeView extends Upfront_Object {

	public function get_markup () {
		return "";
	}
}
