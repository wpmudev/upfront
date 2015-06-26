<?php

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
			if ($child_view instanceof Upfront_Entity){
				// Have wrapper? If so, then add wrappers
				$wrapper = $child_view->get_wrapper();

				if ( $wrapper && !$this->_wrapper )
					$this->_wrapper = $wrapper;
				if ( $wrapper && $this->_wrapper->get_wrapper_id() == $wrapper->get_wrapper_id() ){
					$wrap .= $this->_get_child_markup($child_view, $child);
				}
				else if ( $wrapper ) {
					$html .= $this->_wrapper->wrap($wrap);
					$this->_wrapper = $wrapper;
					$wrap = $this->_get_child_markup($child_view, $child);
				}
			}
			// No wrapper, just appending html
			if ( !isset($wrapper) || !$wrapper ){
				$html .= $this->_get_child_markup($child_view, $child);
			}
		}

		// Have wrapper, append the last one
		if ( isset($wrapper) && $wrapper )
			$html .= $this->_wrapper->wrap($wrap);
		return $this->wrap($html);
	}

	protected function _get_child_markup ($view, $data) {
		if ( $view instanceof Upfront_Object ){
			$theme_style = upfront_get_property_value('theme_style', $data);
			if($theme_style)
				$theme_style = strtolower($theme_style);
			$breakpoint = upfront_get_property_value('breakpoint', $data);
			$theme_styles = array( 'default' => $theme_style );
			$theme_styles_attr = '';
			if ( $breakpoint ) {
				foreach ( $breakpoint as $id => $props ){
					if ( !empty($props['theme_style']) )
						$theme_styles[$id] = strtolower($props['theme_style']);
				}
				$theme_styles_attr = " data-theme-styles='" . json_encode($theme_styles) . "'";
			}
			$slug = upfront_get_property_value('id_slug', $data);
			if($slug === 'ucomment' && is_single() && !comments_open())
				return '';					
			$classes = $this->_get_property('class');
			$column = upfront_get_class_num('c', $classes);
			$class = $slug === "uposts" ?   "c" . $column . " uposts-object" : upfront_get_property_value('class', $data);
			return '<div class="upfront-output-object ' . $theme_style .' upfront-output-' . $slug . ' ' . $class . '" id="' . upfront_get_property_value('element_id', $data)  . '"' . $theme_styles_attr . '>' . $view->get_markup() . '</div>';
		}
		else {
			return $view->get_markup();
		}
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


}