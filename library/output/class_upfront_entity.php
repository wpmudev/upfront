<?php

abstract class Upfront_Entity {

    protected static $_video_index = 0;

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

	public function get_css_class () {
		$type = strtolower(str_replace("_", "-", $this->_type));
		$classes = array(
			"upfront-output-" . $type
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

	protected function _set_property ($prop, $value) {
		return upfront_set_property_value($prop, $value, $this->_data);
	}

	/**
	 * Retrieves translated property
	 *
	 * @param $prop
	 * @return string|void
	 */
	protected function _get_property_t($prop) {
		return __($this->_get_property( $prop ), "upfront");
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
			if ( $background_image ) $type = 'image';
			else if ( $background_color ) $type = 'color';
		}
		return $type;
	}

	protected function _is_background_overlay ($breakpoint_id = '') {
		$type = $this->get_background_type($breakpoint_id);
		$background_style = $this->_get_breakpoint_property('background_style', $breakpoint_id);
		if ( !$type || 'color' == $type ) return false;
		if ( 'parallax' != $background_style && ( 'image' == $type || 'featured' == $type ) ) return false;
		return true;
	}

	protected function _get_background_image_css ($background_image, $lazy_loading = false, $breakpoint_id = '') {
		$css = array();
		$background_repeat = $this->_get_breakpoint_property('background_repeat', $breakpoint_id);
		$background_fill = $this->_get_breakpoint_property('background_fill', $breakpoint_id);
		$background_position = $this->_get_breakpoint_property('background_position', $breakpoint_id);
		$background_size = $this->_get_breakpoint_property('background_size', $breakpoint_id);
		$background_style = $this->_get_breakpoint_property('background_style', $breakpoint_id);
		$background_image = preg_replace('/^https?:/', '', $background_image);
		if (!$lazy_loading) {
			$css[] = 'background-image: url("' . $background_image . '")';
		}
		if ($background_style == 'full') {
			$css[] = 'background-size: 100% auto';
			$css[] = 'background-repeat: no-repeat';
			$css[] = 'background-position: 50% 50%';
		} else {
			$css[] = "background-size: $background_size";
			$css[] = 'background-repeat: ' . $background_repeat;
			$css[] = 'background-position: ' . $background_position;
		}
		return !empty($css) ? implode('; ', $css) : '';
	}

	protected function _get_background_css ($is_layout = false, $lazy_loading = false, $breakpoint_id = '') {
		$type = $this->get_background_type($breakpoint_id);
		$default_type = $this->get_background_type();
		$css = array();
		$background_color = $this->_get_breakpoint_property('background_color', $breakpoint_id);
		$featured_fallback_background_color = $this->_get_breakpoint_property('featured_fallback_background_color', $breakpoint_id);
		if ( !$type || in_array($type, array('image', 'color', 'featured')) ){
			// if featured and no featured image, set to fallback color
			if ($featured_fallback_background_color && 'featured' == $type && !has_post_thumbnail(Upfront_Output::get_post_id())) {
				$css[] = 'background-color: ' . $featured_fallback_background_color;
			} else if ($background_color) {
				$css[] = 'background-color: ' . $background_color;
			}
			if (!$this->_is_background_overlay($breakpoint_id)) {
				if ('featured' == $type && has_post_thumbnail(Upfront_Output::get_post_id())) {
					$featured_image = wp_get_attachment_image_src( get_post_thumbnail_id( Upfront_Output::get_post_id() ), 'single-post-thumbnail' );
					$background_image = $featured_image[0];
				} else {
					$background_image = $this->_get_breakpoint_property('background_image', $breakpoint_id);
				}
				if ('image' == $type || 'featured' == $type && $background_image) {
					$css[] = $this->_get_background_image_css($background_image, $lazy_loading, $breakpoint_id);
				}
			}
		} else if ('video' == $type) {
			$background_video_style = $this->_get_breakpoint_property('background_video_style', $breakpoint_id);
			if ($background_video_style == 'inside' && $background_color) {
				$css[] = 'background-color: ' . $background_color;
			}
		}
		if (!empty($breakpoint_id) && ($default_type == 'image' || $default_type == 'featured')) {
			$css[] = 'background-image: none';
		}

		return !empty($css) ? implode('; ', $css) . '; ' : '';
	}

	protected function _get_background_image_attr ($background_image, $background_image_ratio, $lazy_loading = false, $breakpoint_id = '') {
		$attr = '';
		$breakpoint = empty($breakpoint_id) ? 'desktop' : $breakpoint_id;
		$background_style = $this->_get_breakpoint_property('background_style', $breakpoint_id);
		$background_image = preg_replace('/^https?:/', '', $background_image);
		if ($lazy_loading) {
			$attr .= " data-src-{$breakpoint}='{$background_image}'";
		}
		if ('full' == $background_style || 'parallax' == $background_style) {
			$attr .= " data-bg-image-ratio-{$breakpoint}='{$background_image_ratio}'";
		}
		return $attr;
	}

	protected function _get_background_attr ($is_layout = false, $lazy_loading = false, $breakpoint_id = '') {
		$type = $this->get_background_type($breakpoint_id);
		$attr = '';
		$breakpoint = empty($breakpoint_id) ? 'desktop' : $breakpoint_id;
		$is_overlay = $this->_is_background_overlay($breakpoint_id);
		if (!$type || $type == 'image' || $type == 'featured') {
			$background_default = $this->_get_breakpoint_property('background_default', $breakpoint_id);
			if ($type == 'featured' && has_post_thumbnail(Upfront_Output::get_post_id())) {
				$featured_image = wp_get_attachment_image_src( get_post_thumbnail_id( Upfront_Output::get_post_id() ), 'single-post-thumbnail' );
				if (!empty($featured_image)) {
					$background_image = $featured_image[0];
					$background_image_ratio = round($featured_image[2]/$featured_image[1], 2);
				}
			} else if (!$type || $type == 'image' || ($type == 'featured' && $background_default == 'image')) {
				$background_image = $this->_get_breakpoint_property('background_image', $breakpoint_id);
				$background_image_ratio = $this->_get_breakpoint_property('background_image_ratio', $breakpoint_id);
			}
			if (!empty($background_image)) {
				if (!$is_overlay) {
					$attr .= $this->_get_background_image_attr($background_image, $background_image_ratio, $lazy_loading, $breakpoint_id);
				}
				if (!$type) {
					$type = 'image';
				}
			}
		}
		if (!$type) $type = 'color';
		$attr .= " data-bg-type-{$breakpoint}='{$type}'";
		if ($is_overlay){
			$attr .= " data-bg-overlay-{$breakpoint}='1'";
		}

		return $attr;
	}

	protected function _get_background_overlay ($breakpoint_id = '') {
		if (!$this->_is_background_overlay($breakpoint_id)) return '';
		$type = $this->get_background_type($breakpoint_id);
		$attr = '';
		$markup = '';
		$classes = "upfront-output-bg-overlay upfront-output-bg-{$type}";
		$classes .= ( $breakpoint_id ) ? " upfront-output-bg-{$breakpoint_id}" : "upfront-output-bg-desktop";
		if ('image' == $type || 'featured' == $type) {
			if ($type == 'featured' && has_post_thumbnail(Upfront_Output::get_post_id())) {
				$featured_image = wp_get_attachment_image_src( get_post_thumbnail_id( Upfront_Output::get_post_id() ), 'single-post-thumbnail' );
				$background_image = $featured_image[0];
				$background_image_ratio = round($featured_image[2]/$featured_image[1], 2);
			} else {
				$background_image = $this->_get_breakpoint_property('background_image', $breakpoint_id);
				$background_image_ratio = $this->_get_breakpoint_property('background_image_ratio', $breakpoint_id);
			}
			$background_style = $this->_get_breakpoint_property('background_style', $breakpoint_id);
			$image_css = $this->_get_background_image_css($background_image, true, $breakpoint_id);
			$image_attr = $this->_get_background_image_attr($background_image, $background_image_ratio, true, $breakpoint_id);
			if ('parallax' == $background_style) {
				$attr .= 'data-bg-parallax=".upfront-bg-image"';
			}

			// What a mess!
			// Okay, so now let's check if we're dealing with a "fixed" image
			// "fixed" meaning fixed in position and size constraints.
			// Apparently, same deal for "tile"...
			if ('fixed' === $background_style || 'tile' === $background_style) {
				// We do? Nice!
				// Okay, so with that in mind, let's throw in some attributes,
				// so that the background loading routine in layout.js
				// stops breaking our carefully crafted inline CSS re:size and position
				$ratio_kw = esc_attr($background_style);
				$image_attr .= " data-bg-image-ratio-{$breakpoint_id}='{$ratio_kw}'";
			}
			// Okay, let's get on with our lives now...

			$markup = "<div class='upfront-bg-image upfront-image-lazy upfront-image-lazy-bg' style='{$image_css}' {$image_attr}></div>";
		}
		else if ('map' == $type) {
			$data = array(
				'center' => $this->_get_breakpoint_property('background_map_center', $breakpoint_id),
				'zoom' => $this->_get_breakpoint_property('background_map_zoom', $breakpoint_id),
				'style' => $this->_get_breakpoint_property('background_map_style', $breakpoint_id),
        		'controls' => $this->_get_breakpoint_property('background_map_controls', $breakpoint_id),
        		'styles' => $this->_get_breakpoint_property('map_styles', $breakpoint_id),
        		'use_custom_map_code' => $this->_get_breakpoint_property('background_use_custom_map_code', $breakpoint_id),
        		'show_markers' => $this->_get_breakpoint_property('background_show_markers', $breakpoint_id),
			);
			$attr .= 'data-bg-map="' . esc_attr( json_encode($data) ) . '"';
		}
		else if ('slider' == $type){
			$slides = array();
			$images = $this->_get_breakpoint_property('background_slider_images', $breakpoint_id);
			$auto = $this->_get_breakpoint_property('background_slider_rotate', $breakpoint_id);
			$interval = $this->_get_breakpoint_property('background_slider_rotate_time', $breakpoint_id) * 1000;
			$show_control = $this->_get_breakpoint_property('background_slider_control', $breakpoint_id);
			$control_style = $this->_get_breakpoint_property('background_slider_control_style', $breakpoint_id);
			$effect = $this->_get_breakpoint_property('background_slider_transition', $breakpoint_id);
			$slide_attr = "data-slider-show-control='{$show_control}' data-slider-effect='{$effect}'";
			if ( $auto )
				$slide_attr .= " data-slider-auto='1' data-slider-interval='{$interval}'";
			else
				$slide_attr .= " data-slider-auto='0'";

			if ($control_style === 'arrows') {
				$slide_attr .= " data-control_num='0'";
				$slide_attr .= " data-control_next_prev='1'";
			} else if ($control_style === 'dots') {
				$slide_attr .= " data-control_num='1'";
				$slide_attr .= " data-control_next_prev='0'";
			} else {
				$slide_attr .= " data-control_num='1'";
				$slide_attr .= " data-control_next_prev='1'";
			}

	    	foreach ( $images as $image ){
	    		//$src = wp_get_attachment_image($image, 'full');
	    		$src = upfront_get_attachment_image_lazy($image, 'full');
				$slides[] = "<div class='upfront-default-slider-item'>{$src}</div>";
	    	}
			$slides_markup = join('', $slides);
			$markup = "<div class='upfront-bg-slider' {$slide_attr}>{$slides_markup}</div>";
		}
		else if ('video' == $type){
			$background_style = $this->_get_breakpoint_property('background_style', $breakpoint_id);
			$background_style = $background_style ? $background_style : 'service';
			if ('service' === $background_style) {
				$video = $this->_get_breakpoint_property('background_video', $breakpoint_id);
				$embed = $this->_get_breakpoint_property('background_video_embed', $breakpoint_id);
				$width = $this->_get_breakpoint_property('background_video_width', $breakpoint_id);
				$height = $this->_get_breakpoint_property('background_video_height', $breakpoint_id);
				$style = $this->_get_breakpoint_property('background_video_style', $breakpoint_id);
				$mute = $this->_get_breakpoint_property('background_video_mute', $breakpoint_id);
				$autoplay = $this->_get_breakpoint_property('background_video_autoplay', $breakpoint_id);
				$loop = $this->_get_breakpoint_property('background_video_loop', $breakpoint_id);
				if ( $video && $embed ){
					self::$_video_index++;
					$video_id = 'bg_video_' . self::$_video_index;
					$mute = $mute === false ? 1 : intval($mute);
					$autoplay = $autoplay === false ? 1 : intval($autoplay);
					$attr = 'data-bg-video-ratio="' . round($height/$width, 2) . '" ';
					$attr .= 'data-bg-video-style="' . $style . '" ';
					$attr .= 'data-bg-video-mute="' . $mute . '"';
					$attr .= 'data-bg-video-loop="' . $loop . '"';
					$autoplay_attr = '&amp;autoplay=' . $autoplay;
					// hack additional attributes
					$vid_attrs = array(
						'.*?vimeo\.' => ($loop === 1 ? '&amp;loop=1' : 'loop=0') . $autoplay_attr . ( $mute == 1 ? '&amp;api=1&amp;player_id=' . $video_id : '' ),
						'.*?youtube\.com\/(v|embed)\/(.+?)(\/|\?).*?$' =>  '&amp;controls=0&amp;showinfo=0&amp;rel=0&amp;wmode=transparent&amp;html5=1&amp;modestbranding=1' . ($loop === 1 ? '&amp;loop=1&amp;enablejsapi=1' : 'loop=0') . $autoplay_attr . ( $mute == 1 ? '&amp;enablejsapi=1' /*. '&amp;origin=' . site_url()*/ : '' ),
						'.*?wistia\.' => ($loop === 1 ? 'endVideoBehavior=loop' : '') . ( $autoplay == 1 ? '&amp;autoPlay=true' : '' ) . ( $mute == 1 ? '&amp;volume=0' : '' )
					);
					$vid_attr = '';
					$embed_attr = ' id="' . $video_id . '"';
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
			} else {
				$video = $this->_get_breakpoint_property('uploaded_background_video', $breakpoint_id);
				$video_id = 'bg_video_' . self::$_video_index;

				$style = $this->_get_breakpoint_property('background_video_style', $breakpoint_id);

				$width = $this->_get_breakpoint_property('background_video_width', $breakpoint_id);
				$height = $this->_get_breakpoint_property('background_video_height', $breakpoint_id);
				$attr = ' data-bg-video-ratio="' . round($height/$width, 2) . '" ';
				$attr .= 'data-bg-video-style="' . $style . '" ';
				$attr .= 'id="' . $video_id . '"  ';

				$mute = $this->_get_breakpoint_property('background_video_mute', $breakpoint_id);
				$autoplay = $this->_get_breakpoint_property('background_video_autoplay', $breakpoint_id);
				$loop = $this->_get_breakpoint_property('background_video_loop', $breakpoint_id);

				if ($mute)
					$vid_attr .= ' muted ';
				if ($autoplay)
					$vid_attr .= ' autoplay ';
				if ($loop)
					$vid_attr .= ' loop ';

				$embed = $this->_get_breakpoint_property('uploaded_background_video_embed', $breakpoint_id);
				$embed = str_replace('video class', 'video ' . $vid_attr . 'controls class', $embed);
				$embed = preg_replace('#width="\d+"#', 'width="' . $width . '"', $embed);
				$embed = preg_replace('#height="\d+"#', 'height="' . $height . '"', $embed);

				if ( $video && $embed ){
					self::$_video_index++;
					$markup = "<script class='video-embed-code' type='text/html'>{$embed}</script>";
				}
			}
		}

		return "<div class='{$classes}' {$attr}>{$markup}</div>" . "\n";
	}

	public function get_propagated_classes () {
		return array();
	}
}
