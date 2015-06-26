<?php



class Upfront_Object_Group extends Upfront_Container {
	protected $_type = 'Object_Group';
	protected $_children = 'objects';
	protected $_child_view_class = 'Upfront_Object';

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
        return parent::wrap( "{$out}\n" );
    }
    
    public function get_css_class () {
        $classes = parent::get_css_class();
        $classes .= ' upfront-object-group';
        $theme_style = $this->_get_property('theme_style');
        if($theme_style)
            $classes .= ' ' . strtolower($theme_style);
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
		$view_class = upfront_get_property_value("view_class", $child_data);
		$view = $view_class
			? "Upfront_{$view_class}"
			: $this->_child_view_class
		;
		if (!class_exists($view)) $view = $this->_child_view_class;
		return new $view($child_data, $this->_data);
	}
}