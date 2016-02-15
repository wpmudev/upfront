<?php

class Upfront_Module extends Upfront_Container {
	protected $_type = 'Module';
	protected $_children = 'objects';
	protected $_child_view_class = 'Upfront_Object';

	private $_child_instances;

	public function __construct ($data, $parent_data = "") {
		parent::__construct($data);
		$this->_parent_data = $parent_data;
		Upfront_Output::$current_module = $this;
	}

	public function get_markup () {
		if ($this->is_spacer()) {
			return '';
		}
		$children = !empty($this->_data[$this->_children]) ? $this->_data[$this->_children] : array();
		$pre = '';
		if (!empty($children)) foreach ($children as $child) {
			$anchor = upfront_get_property_value('anchor', $child);
			if (!empty($anchor)) $pre .= '<a id="' . esc_attr($anchor) . '" data-is-anchor="1"></a>';
		}
		return $pre . parent::get_markup();
	}

	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		return Upfront_Wrapper::get_instance($wrapper_id, $this->_parent_data);
	}
    
    public function get_css_class () {
        $classes = parent::get_css_class();
        $more_classes = array();

        foreach ($this->_child_instances as $view) {
        	$cls = $view->get_propagated_classes();
        	if (empty($cls)) continue;

        	$more_classes = array_merge($more_classes, $cls);
        }

        $prop_class = $this->_get_property('class');
        $column = upfront_get_class_num('c', $prop_class);
        $more_classes[] = 'c' . $column;
        return $classes . ' ' . join(' ', $more_classes);
    }

	public function instantiate_child ($child_data, $idx) {
		$key = md5(serialize($child_data));
		if (!empty($this->_child_instances[$key])) return $this->_child_instances[$key];

		$default_view = !empty($child_data['objects']) && is_array($child_data['objects']) ? "Upfront_Object_Group" : $this->_child_view_class;
		$view_class = upfront_get_property_value("view_class", $child_data);
		$view = $view_class
			? "Upfront_{$view_class}"
			: $default_view
		;
		if (!class_exists($view)) $view = $default_view;
		$this->_child_instances[$key] = new $view($child_data);

		return $this->_child_instances[$key];
	}

	public function is_spacer () {
		$spacer_props = Upfront_UspacerView::default_properties();
		$children = !empty($this->_data[$this->_children]) ? $this->_data[$this->_children] : array();
		if (!empty($children)) {
			$type = upfront_get_property_value('type', $children[0]);
		}
		return ($type == $spacer_props['type']);
	}
}