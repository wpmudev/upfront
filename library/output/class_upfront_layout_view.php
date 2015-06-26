<?php


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
    
    public function get_css_class () {
        $classes = parent::get_css_class();
        $classes .= ' upfront-image-lazy upfront-image-lazy-bg';
        return $classes;
    }

	public function get_attr () {
		$attr = '';
		foreach ( Upfront_Output::$grid->get_breakpoints(true) as $breakpoint ) {
			$attr .= $this->_get_background_attr(true, true, $breakpoint->get_id());
		}
		return $attr;
	}
	
	public function get_style_for ($point, $scope) {
		$css = '';
		$type = $this->get_background_type($point->get_id());
		$default_type = $this->get_background_type();
		$bg_css = $this->_get_background_css(true, true, $point->get_id());
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