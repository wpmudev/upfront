<?php

class Upfront_Module_Group extends Upfront_Container {
	protected $_type = 'Module_Group';
	protected $_children = 'modules';
	protected $_child_view_class = 'Upfront_Module';

	public function __construct ($data) {
		parent::__construct($data);
	}

	public function get_markup () {
		$pre = '';
		$anchor = upfront_get_property_value('anchor', $this->_data);
		if (!empty($anchor)) $pre .= '<a id="' . esc_attr($anchor) . '" data-is-anchor="1"></a>';
		return $pre . parent::get_markup();
	}

	public function wrap ($out) {
		$overlay = '';
		$bg_attr = '';
		foreach ( Upfront_Output::$grid->get_breakpoints(true) as $breakpoint ) {
			$overlay .= $this->_get_background_overlay($breakpoint->get_id());
			$bg_attr .= $this->_get_background_attr(false, true, $breakpoint->get_id());
		}
		$bg_node_start = "<div class='upfront-module-group-bg upfront-image-lazy upfront-image-lazy-bg' {$bg_attr}>";
		$bg_node_end = "</div>";
		return parent::wrap( "{$out}\n{$bg_node_start}{$overlay}{$bg_node_end}" );
	}

	public function get_css_class () {
		$classes = parent::get_css_class();
		$classes .= ' upfront-module-group';
		$theme_style = $this->_get_property('theme_style');
		if ($theme_style) {
			$classes .= ' ' . strtolower($theme_style);
		}
		$prop_class = $this->_get_property('class');
		$column = upfront_get_class_num('c', $prop_class);
		$classes .= ' c' . $column;
		return $classes;
	}

	public function get_attr () {
		$theme_style = $this->_get_property('theme_style');
		$link = $this->_get_property('href');
		$linkTarget = $this->_get_property('linkTarget');
		if($theme_style)
			$theme_style = strtolower($theme_style);
		$theme_styles = array( 'default' => $theme_style );
		foreach ( Upfront_Output::$grid->get_breakpoints(true) as $breakpoint ) {
			$theme_styles[$breakpoint->get_id()] = $this->_get_breakpoint_property('theme_style', $breakpoint->get_id());
		}

		$link_attributes = '';
		if(!empty($link)) {
			$link_attributes = "data-group-link='".$link."'";
			if(!empty($linkTarget)) {
				$link_attributes .= "data-group-target='".$linkTarget."'";
			}
		}

		return " data-theme-styles='" . json_encode($theme_styles) . "' ".$link_attributes;
	}

	public function get_style_for ($point, $scope) {
		$css = '';
		$is_overlay = $this->_is_background_overlay($point->get_id());
		$is_default_overlay = $this->_is_background_overlay();
		$bg_css = $this->_get_background_css(false, true, $point->get_id());
		$use_padding = $this->_get_breakpoint_property('use_padding', $point->get_id());
		$column_padding = $point->get_column_padding();
		if ( !empty($bg_css) ) {
			if ( $use_padding )
				$bg_css .= " margin: {$column_padding}px;";
			$css .= sprintf('%s #%s > %s {%s}',
					'.' . ltrim($scope, '. '),
					$this->get_id(),
					'.upfront-module-group-bg',
					$bg_css
				) . "\n";
		}
		if ( !$point->is_default() && $is_default_overlay ) {
			$css .= sprintf('%s #%s > %s {%s}',
					'.' . ltrim($scope, '. '),
					$this->get_id(),
					'.upfront-module-group-bg > .upfront-output-bg-overlay',
					'display: none;'
				) . "\n";
		}
		if ( $is_overlay ) {
			$css .= sprintf('%s #%s > %s {%s}',
					'.' . ltrim($scope, '. '),
					$this->get_id(),
					'.upfront-module-group-bg > .upfront-output-bg-' . $point->get_id(),
					'display: block;'
				) . "\n";
		}
		return $css;
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