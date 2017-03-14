<?php



class Upfront_Object_Group extends Upfront_Container {
	protected $_type = 'Object_Group';
	protected $_children = 'objects';
	protected $_child_view_class = 'Upfront_Object';

	protected $_child_instances = array();

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
		$class = $this->get_css_class();
		$style = $this->get_css_inline();
		$attr = $this->get_attr();
		$element_id = $this->get_id();

		// So let's map out the breakpoints/presets map
		$preset_map = $this->_get_preset_map($this->_data);
		// Now we have a map of breakpoint/presets we can encode as the attribute
		// This will be used for the breakpoint preset toggling
		$preset = $this->_get_preset($this->_data, $preset_map);
		$class .= ' ' . $preset;

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
		return "{$pre}<{$this->_tag} data-preset_map='" . esc_attr(!empty($preset_map) ? json_encode($preset_map) : '') . "' class='{$class}' {$style} {$element_id} {$attr}>{$out}</{$this->_tag}>{$post}";
	}

	public function get_css_class () {
		$classes = parent::get_css_class();
		$classes .= ' upfront-object-group';
		$propagated = $this->get_propagated_classes();
		if (!empty($propagated)) $classes .= ' ' . join(' ', $propagated);

		$theme_style = $this->_get_property('theme_style');
		if ($theme_style) $classes .= ' ' . strtolower($theme_style);
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

	public function instantiate_child ($child_data, $idx) {
		$key = md5(serialize($child_data));
		if (!empty($this->_child_instances[$key])) return $this->_child_instances[$key];

		$view_class = upfront_get_property_value("view_class", $child_data);
		$view = $view_class
			? "Upfront_{$view_class}"
			: $this->_child_view_class
		;
		if (!class_exists($view)) $view = $this->_child_view_class;

		$this->_child_instances[$key] = new $view($child_data, $this->_data);
		return $this->_child_instances[$key];
	}


	public function get_style_for ($breakpoint, $context, $col = false) {

		return '';
	}
}
