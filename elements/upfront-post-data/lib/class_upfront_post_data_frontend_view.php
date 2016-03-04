<?php

/**
 * Front-end rendering class.
 */
class Upfront_PostDataView extends Upfront_Object_Group {


	private $_post;
	private $_child_instances = array();

	public function get_css_class () {
		$classes = parent::get_css_class();
		
		$this->get_post();
		
		$classes .= !empty($this->_post->ID) && is_sticky( $this->_post->ID ) ? " uf-post-data uf-post-data-sticky" : " uf-post-data";

		return $classes;
	}

	public function get_post () {
		if (empty($this->_post)) {
			$data = $this->_properties_to_array();
			if (empty($data)) $data = Upfront_Post_Data_Data::get_defaults();
			$this->_post = Upfront_Post_Data_Model::spawn_post($data);
		}
		return $this->_post;
	}
	
	public function instantiate_child ($child_data, $idx) {
		$key = md5(serialize($child_data));
		if (!empty($this->_child_instances[$key])) return $this->_child_instances[$key];

		$this->_child_instances[$key] = new Upfront_PostDataPartView($child_data, $this->_data, $this);
		return $this->_child_instances[$key];
	}

	private function _properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop) {
			$out[$prop['name']] = !empty($prop['value']) ? $prop['value'] : '';
		}
		return $out;
	}

	public static function default_properties () {
		return Upfront_Post_Data_Data::get_defaults();
	}

	public function get_propagated_classes () {
		$classes = array();
		foreach ($this->_child_instances as $part_view) {
			$classes = array_merge($classes, $part_view->get_propagated_classes());
		}
		return $classes;
	}

	public function get_attr () {
		$attr = parent::get_attr();
		$propagated = array($attr);
		foreach ($this->_child_instances as $part_view) {
			$propagated[] = $part_view->get_propagated_attr();
		}
		$propagated = array_values(array_unique(array_filter($propagated)));
		return empty($propagated)
			? $attr
			: join(' ', $propagated) . ' '
		;
	}
}


class Upfront_PostDataPartView extends Upfront_Object {

	private $_parent;
	
	private $_part_type;
	private $_part_view;
	private $_preset_id;
	
	private $_markup = array();
	
	public function __construct ($data, $parent_data = '', $parent_obj = false) {
		parent::__construct($data, $parent_data);
		if ($parent_obj !== false) {
			$this->_parent = $parent_obj;
		}

		$this->_part_type = $this->_get_property('part_type');

		$props = !empty($parent_data['properties'])
			? upfront_properties_to_array($parent_data['properties'])
			: Upfront_Post_Data_Data::get_defaults()
		;

		$props = Upfront_Post_Data_Data::apply_preset($props);
		$this->_preset_id = Upfront_Post_Data_Data::get_preset_id($props);

		$view_class = Upfront_Post_Data_PartView::_get_view_class($props);
		$this->_part_view = new $view_class(array_merge(
			$props,
			$parent_data
		));

	}

	public function get_markup () {
		if (empty($this->_markup)) {
			$post = $this->_parent->get_post();
			$this->_markup = $this->_part_view->get_markup($post);
		}
		return isset($this->_markup[$this->get_part_type()])
			? $this->_markup[$this->get_part_type()]
			: ''
		;
	}

	public function get_part_type () {
		return $this->_part_type;
	}

	public function get_propagated_classes () {
		$cls = $this->_part_view->get_propagated_classes();
		$cls[] = $this->get_part_type();
		if (!empty($this->_preset_id)) $cls[] = 'preset-' . esc_attr($this->_preset_id);

		return $cls;
	}

	/**
	 * Check the part view for propagated attributes other than class.
	 *
	 * @return string
	 */
	public function get_propagated_attr () {
		return is_callable(array($this->_part_view, 'get_propagated_attr'))
			? $this->_part_view->get_propagated_attr()
			: ''
		;
	}
	
}
