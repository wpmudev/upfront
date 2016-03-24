<?php


class Upfront_Region extends Upfront_Container {
	protected $_type = 'Region';
	protected $_children = 'modules';
	protected $_child_view_class = 'Upfront_Module';

	protected function _is_background () {
		return ( $this->get_container() != $this->get_name() && ( empty($this->_data['sub']) || ( $this->_data['sub'] != 'top' && $this->_data['sub'] != 'bottom' ) ) );
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
		if ( $this->_is_background() ) {
			$more_classes[] = 'upfront-image-lazy upfront-image-lazy-bg';
		}
		// Additional test for background type - only if we're dealing with the featured image regions
		if ('featured' === $this->get_background_type() && !has_post_thumbnail(Upfront_Output::get_post_id())) {
			$more_classes[] = 'no-featured_image'; // We don't seem to have a featured image here
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
			$restrict = !empty($this->_data['restrict_to_container']) ? $this->_data['restrict_to_container'] : false;
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
			$show_close = $this->_get_property('show_close');
			$attr .= ' data-closeicon = "'.(is_array($show_close)?array_pop($show_close):$show_close).'"';
			$click_out_close = $this->_get_property('click_out_close');
			$attr .= ' data-clickout = "'.(is_array($click_out_close)?array_pop($click_out_close):$click_out_close).'"';
			/*$addclosetext = is_array($this->_get_property('add_close_text'))?array_pop($this->_get_property('add_close_text')):$this->_get_property('add_close_text');
			$attr .= ' data-addclosetext = "'.$addclosetext.'"';
			if($addclosetext == 'yes') {
				$attr .= ' data-closetext = "'.$this->_get_property('close_text').'"';
			}*/
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
		$is_overlay = $this->_is_background_overlay($point->get_id());
		$is_default_overlay = $this->_is_background_overlay();
		$bg_css = $this->_get_background_css(false, true, $point->get_id());
		if ( ! empty($bg_css) ) {
			$css .= sprintf('%s #%s {%s}',
					'.' . ltrim($scope, '. '),
					$this->get_id(),
					$bg_css
				) . "\n";
		}
		if ( !$point->is_default() && $is_default_overlay ){
			$css .= sprintf('%s #%s > %s {%s}',
					'.' . ltrim($scope, '. '),
					$this->get_id(),
					'.upfront-output-bg-overlay',
					'display: none;'
				) . "\n";
		}
		if ( $is_overlay ) {
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