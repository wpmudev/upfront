<?php


class Upfront_Object extends Upfront_Entity {
	protected $_type = 'Object';

	public function __construct ($data, $parent_data = "") {
		//Make sure all the properties are initialized
		$data['properties'] = $this->merge_default_properties($data);
		parent::__construct($data);
		$this->_parent_data = $parent_data;
		Upfront_Output::$current_object = $this;
	}

	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		return Upfront_Wrapper::get_instance($wrapper_id, $this->_parent_data);
	}

	protected function merge_default_properties($data){

		if(! method_exists(get_class($this), 'default_properties')){
			if(isset($data['properties']))
				return $data['properties'];
			return array();
		}

		$flat = array();
		$defaults = call_user_func(array(get_class($this), 'default_properties'));

		if(isset($data['properties']))
			foreach($data['properties'] as $prop)
				$flat[$prop['name']] = !empty($prop['value']) ? $prop['value'] : false;

		$flat = array_merge($defaults, $flat);

		if(!empty($flat['theme_style'])){
			$flat['class'] .= ' ' . $flat['theme_style'];
		}

		$properties = array();
		foreach($flat as $name => $value)
			$properties[] = array('name' => $name, 'value' => $value);

		return $properties;
	}

	public function get_markup () {
		if ($this->is_spacer()) {
			return '';
		}
		$view_class = 'Upfront_' . $this->_get_property("view_class");
		if(!class_exists($view_class))
			return apply_filters('upfront-output-get_markup-fallback', "{$view_class} class not found", $view_class);

		$view = new $view_class($this->_data);

		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$name = $view->get_name();
			$pre = "\n\t<!-- Upfront {$view_class} [{$name}] -->\n";
			$post = "\n<!-- End {$view_class} [{$name}] --> \n";
		}

		return $pre . $view->get_markup() . $post;
	}

	public function is_spacer () {
		$spacer_props = Upfront_UspacerView::default_properties();
		$type = $this->_get_property('type');
		return ($type == $spacer_props['type']);
	}

	public function get_style_for ($breakpoint, $context, $col = false) {

		return '';
	}
}