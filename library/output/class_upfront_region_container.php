<?php

class Upfront_Region_Container extends Upfront_Container {
	protected $_type = 'Region_Container';

	public function wrap ($out, $before = '', $after = '') {
		$overlay = '';
		$bg_attr = '';
		foreach ( Upfront_Output::$grid->get_breakpoints(true) as $breakpoint ) {
			$overlay .= $this->_get_background_overlay($breakpoint->get_id());
			$bg_attr .= $this->_get_background_attr(false, true, $breakpoint->get_id());
		}

		$additional_classes = array();
		// Additional test for background type - only if we're dealing with the featured image regions
		if ('featured' === $this->get_background_type() && !has_post_thumbnail(Upfront_Output::get_post_id())) {
			$additional_classes[] = 'no-featured_image'; // We don't seem to have a featured image here
		}

		// Build the class attribute
		$extras = '';
		if (!empty($additional_classes) && is_array($additional_classes)) {
			$additional_classes = array_values(array_filter(array_map('sanitize_html_class', $additional_classes)));
			$extras = join(' ', $additional_classes);
		}

		$bg_node_start = "<div class='upfront-region-container-bg upfront-image-lazy upfront-image-lazy-bg {$extras}' {$bg_attr}>";
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
		$is_overlay = $this->_is_background_overlay($point->get_id());
		$is_default_overlay = $this->_is_background_overlay();
		$bg_css = $this->_get_background_css(false, true, $point->get_id());
		if ('featured' === $this->get_background_type($point->get_id()) && !has_post_thumbnail(Upfront_Output::get_post_id())) {
			$bg_default = $this->_get_breakpoint_property('background_default', $point->get_id());
			if ( 'hide' === $bg_default ) {
				$css .= sprintf('%s #%s {%s}',
						'.' . ltrim($scope, '. '),
						$this->get_id(),
						'display: none;'
					);
			}
		}
		if ( !empty($bg_css) ) {
			$css .= sprintf('%s #%s > %s {%s}',
					'.' . ltrim($scope, '. '),
					$this->get_id(),
					'.upfront-region-container-bg',
					$bg_css
				) . "\n";
		}
		if ( !$point->is_default() && $is_default_overlay ) {
			$css .= sprintf('%s #%s > %s {%s}',
					'.' . ltrim($scope, '. '),
					$this->get_id(),
					'.upfront-region-container-bg > .upfront-output-bg-overlay',
					'display: none;'
				) . "\n";
		}
		if ( $is_overlay ) {
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