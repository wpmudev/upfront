<?php

/**
 * Front-end rendering class.
 */
class Upfront_PostsListsView extends Upfront_Object_Group {

	private $_post;
	protected $_children = 'post_objects';
	protected $_child_view_class = 'Upfront_ObjectGroup';
	protected $_child_instances = array();
	protected $_breakpoint = false;
	protected $_markup = array();
	protected $_is_compat = false;

	public function __construct ($data, $breakpoint = false) {
		$this->_breakpoint = $breakpoint;
		parent::__construct($data);

		$props = $this->_properties_to_array();
		if (empty($props)) $props = Upfront_PostsLists_PostsData::get_defaults();

		if (empty($props['display_type'])) return ''; // Force no render for unselected display type.

		$this->_is_compat = empty($this->_data['objects']); // No objects means return to compat mode

		$props['preset'] = $this->get_preset(); // Set preset properly

		$markup = apply_filters('upfront-posts-get_markup-before', false);
		if (!empty($markup)) {
			$this->_is_compat = true;
			$this->_markup = $markup;
		}
		else if ( !$this->_is_compat ) {
			$this->_markup = Upfront_PostsLists_PostsView::get_posts_part_markup($props);
		}

		// Create layout data for each posts
		$this->_data['post_objects'] = array();
		$this->_data['post_wrappers'] = array();
		if ( !$this->_is_compat ) {
			foreach ( $this->_markup as $id => $markup ) {
				$this->create_post_object($id);
			}
		}
		else {
			$this->create_compat_object();
			$this->reset_props_for_compat();
		}
	}

	public function wrap ($out) {
		if ( !$this->_is_compat ) {
			return parent::wrap( $this->wrap_posts($out) );
		}

		// If compat render, we don't render preset as we delegate that to the child object
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


	public function get_css_class () {
		if ( !$this->_is_compat ) {
			// We need object class to attach preset styles
			return parent::get_css_class() . ' upostslist-object';
		}
		
		$classes = Upfront_Container::get_css_class();
		$classes .= ' upfront-object-group';

		return $classes;
	}


	public function get_attr () {
		if ( !$this->_is_compat ) return parent::get_attr();

		$link_attributes = '';
		if(!empty($link)) {
			$link_attributes = "data-group-link='".$link."'";
			if(!empty($linkTarget)) {
				$link_attributes .= "data-group-target='".$linkTarget."'";
			}
		}

		return $link_attributes;
	}

	private function _properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop) {
			if (!isset($prop['value'])) continue;
			$out[$prop['name']] = $prop['value'];
		}
		return $out;
	}

	public static function default_properties () {
		return Upfront_PostsLists_PostsData::get_defaults();
	}

	protected function wrap_posts ($out) {
		return "<ul class='uf-posts-list'>" . $out . "</ul>";
	}

	protected function create_post_object ($id) {
		$classes = $this->_get_property('class');
		$column = upfront_get_class_num('c', $classes);
		$post_col = $this->_get_property('post_col');
		if ( !is_numeric($post_col) || $post_col == 0 ) {
			$post_col = 24;
		}
		$post_class = ' c' .  $post_col;
		$index = count($this->_data['post_objects']);
		$post_per_row = $column >= $post_col ? floor($column/$post_col) : 1;
		if ( $index === 0 || $index % $post_per_row === 0 ) {
			$post_class .= ' clr';
		}
		$wrapper_id = $this->_get_property('element_id') . '-wrapper-' . $id;
		$wrapper = array(
			'properties' => array(
				array( 'name' => 'wrapper_id', 'value' => $wrapper_id ),
				array( 'name' => 'class', 'value' => $post_class )
			)
		);

		// Copying post part layouts with all new ids
		$object = $this->clone_object($this->_data, $id);
		upfront_set_property_value('post_id', $id, $object);
		upfront_set_property_value('class', $post_class, $object);
		upfront_set_property_value('element_id', $this->_get_property('element_id') . '-each-' . $id, $object);
		upfront_set_property_value('wrapper_id', $wrapper_id, $object);

		// Set breakpoint values if needed
		if ( $this->_breakpoint ) {
			$breakpoint_id = $this->_breakpoint->get_id();
			$breakpoint_columns = $this->_breakpoint->get_columns();
			$bp_post_col = $this->_get_breakpoint_property('post_col', $breakpoint_id);
			if ( !is_numeric($bp_post_col) || $bp_post_col == 0 || $bp_post_col > $breakpoint_columns ) {
				$bp_post_col = $breakpoint_columns;
			}
			upfront_set_breakpoint_property_value('col', $bp_post_col, $wrapper, $this->_breakpoint);
			upfront_set_breakpoint_property_value('col', $bp_post_col, $object, $this->_breakpoint);
		}

		$this->_data['post_wrappers'][] = $wrapper;
		$this->_data['post_objects'][] = $object;
	}

	protected function clone_object ($data, $id) {
		$new_object = array(
			'wrappers' => $data['wrappers'],
			'objects' => $data['objects'],
			'properties' => $data['properties']
		);
		if( !empty($new_object['wrappers']) ) {
			foreach ( $new_object['wrappers'] as $w => $wrapper ) {
				$wrapper_id = upfront_get_property_value('wrapper_id', $wrapper);
				$new_wrapper_id = $wrapper_id . '-' . $id . '-' . $w;
				upfront_set_property_value('wrapper_id', $new_wrapper_id, $new_object['wrappers'][$w]);
				upfront_set_property_value('ref_wrapper_id', $wrapper_id, $new_object['wrappers'][$w]);

				$objects = $this->find_objects_by_wrapper_id($wrapper_id, $new_object);

				if ( !empty($objects) ) {
					foreach ( $objects as $o => $object ) {
						$object_id = upfront_get_property_value('element_id', $object);
						$new_object_id = $object_id . '-' . $id . '-' . $w;
						upfront_set_property_value('wrapper_id', $new_wrapper_id, $new_object['objects'][$o]);
						upfront_set_property_value('element_id', $new_object_id, $new_object['objects'][$o]);
						upfront_set_property_value('ref_element_id', $object_id, $new_object['objects'][$o]);
					}
				}
			}
		}
		upfront_set_property_value('view_class', 'PostsListsEachView', $new_object);
		return $new_object;
	}

	protected function find_objects_by_wrapper_id ($wrapper_id, $data) {
		$found = array();
		foreach ( $data['objects'] as $o => $object ) {
			if ( upfront_get_property_value('wrapper_id', $object) === $wrapper_id ) {
				$found[$o] = $object;
			}
		}
		return $found;
	}

	public function find_post_wrapper ($wrapper_id) {
		$found = false;
		foreach ( $this->_data['post_wrappers'] as $w => $wrapper ) {
			if ( upfront_get_property_value('wrapper_id', $wrapper ) === $wrapper_id ) {
				$found = $wrapper;
				break;
			}
		}
		return $found;
	}

	protected function create_compat_object () {
		$classes = $this->_get_property('class');
		$column = upfront_get_class_num('c', $classes);
		$post_class = 'c' .  $column;

		$wrapper_id = $this->_get_property('element_id') . '-wrapper';
		$wrapper = array(
			'properties' => array(
				array( 'name' => 'wrapper_id', 'value' => $wrapper_id ),
				array( 'name' => 'class', 'value' => $post_class )
			)
		);

		// Copying post part layouts with all new ids
		$object = $this->_data;
		upfront_set_property_value('view_class', 'PostsListsCompatView', $object);
		upfront_set_property_value('class', $classes, $object);
		upfront_set_property_value('element_id', $this->_get_property('element_id') . '-compat', $object);
		upfront_set_property_value('wrapper_id', $wrapper_id, $object);
		if ( !empty($this->_markup) ) {
			upfront_set_property_value('_markup', $this->_markup, $object);
		}

		$this->_data['post_wrappers'][] = $wrapper;
		$this->_data['post_objects'][] = $object;
	}

	protected function reset_props_for_compat () {
		// Remove paddings
		$this->_set_property('top_padding_use', false);
		$this->_set_property('top_padding_num', 0);
		$this->_set_property('bottom_padding_use', false);
		$this->_set_property('bottom_padding_num', 0);
		$this->_set_property('left_padding_use', false);
		$this->_set_property('left_padding_num', 0);
		$this->_set_property('right_padding_use', false);
		$this->_set_property('right_padding_num', 0);

		// Reset breakpoint values if available
		if ( $this->_breakpoint ) {
			$breakpoint_id = $this->_breakpoint->get_id();
			// Remove paddings
			$this->_set_breakpoint_property('top_padding_use', false, $breakpoint_id);
			$this->_set_breakpoint_property('top_padding_num', 0, $breakpoint_id);
			$this->_set_breakpoint_property('bottom_padding_use', false, $breakpoint_id);
			$this->_set_breakpoint_property('bottom_padding_num', 0, $breakpoint_id);
			$this->_set_breakpoint_property('left_padding_use', false, $breakpoint_id);
			$this->_set_breakpoint_property('left_padding_num', 0, $breakpoint_id);
			$this->_set_breakpoint_property('right_padding_use', false, $breakpoint_id);
			$this->_set_breakpoint_property('right_padding_num', 0, $breakpoint_id);

		}
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

		$post_id = upfront_get_property_value('post_id', $child_data);
		$markup = is_array($this->_markup) && isset($this->_markup[$post_id]) ? $this->_markup[$post_id] : array();

		$this->_child_instances[$key] = new $view($child_data, $post_id, $markup, $this);
		return $this->_child_instances[$key];
	}

	public function get_preset() {
		$preset_map = $this->_get_preset_map($this->_data);
		$preset = $this->_get_preset($this->_data, $preset_map, $this->_breakpoint);
		return $preset;
	}

	public function get_wrappers_data () {
		return isset($this->_data['post_wrappers']) ? $this->_data['post_wrappers'] : array();
	}
}

class Upfront_PostsListsEachWrapper extends Upfront_Wrapper {

	private $_object;
	protected $_tag = "li";

	public function __construct ($data, $object) {
		parent::__construct($data);
		$this->_object = $object;
	}

	public function get_css_class () {
		$classes = parent::get_css_class();
		$object_classes = $this->_object->get_wrapper_css_class();
		return $classes . " " . $object_classes;
	}

}


class Upfront_PostsListsEachView extends Upfront_Object_Group {

	private $_parent;
	private $_post_id;
	private $_markup;
	protected $_tag = 'article';
	protected $_child_instances = array();
	protected $_breakpoint = false;
	protected $_wrapper_obj = false;

	public function __construct ($data, $post_id, $markup = false, $parent_obj = false, $breakpoint = false) {
		$this->_breakpoint = $breakpoint;
		$this->_post_id = $post_id;
		$this->_markup = $markup;
		if ($parent_obj !== false) {
			$this->_parent = $parent_obj;
		}

		parent::__construct($data);
	}

	private function _properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop) {
			$out[$prop['name']] = $prop['value'];
		}
		return $out;
	}

	public static function default_properties () {
		return Upfront_PostsLists_PostsData::get_defaults();
	}

	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		$wrapper_data = $this->_parent ? $this->_parent->find_post_wrapper($wrapper_id) : false;
		$this->_wrapper_obj = $wrapper_data !== false ? new Upfront_PostsListsEachWrapper($wrapper_data, $this) : false;
		return $this->_wrapper_obj;
	}

	public function get_post_markup () {
		return $this->_markup;
	}

	public function get_wrapper_css_class () {
		$classes = !empty($this->_post_id) && is_sticky( $this->_post_id ) ? "uf-post uf-post-sticky" : "uf-post";

		// if the post does not have a theme image, assign a class to denote that
		if(!empty($this->_post_id) && !has_post_thumbnail($this->_post_id)) {
			$classes .= ' no-feature-image';
		}
		return $classes;
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

		$this->_child_instances[$key] = new $view($child_data, $this->_data, $this);
		return $this->_child_instances[$key];
	}

	public function get_attr () {
		$attr = parent::get_attr();
		$propagated = array($attr);
		foreach ($this->_child_instances as $part_view) {
			if (!is_callable(array($part_view, 'get_propagated_attr'))) continue;
			$propagated[] = $part_view->get_propagated_attr();
		}
		$propagated = array_values(array_unique(array_filter($propagated)));
		return empty($propagated)
			? $attr
			: join(' ', $propagated) . ' '
			;
	}

	public function get_preset () {
		return $this->_parent ? $this->_parent->get_preset() : false;
	}
}

class Upfront_PostsListsPartView extends Upfront_Object {

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
			: Upfront_PostsLists_PostsData::get_defaults()
		;

		//$props['preset'] = $this->_parent->get_preset();

		$props = Upfront_PostsLists_PostsData::apply_preset($props);
		$this->_preset_id = Upfront_PostsLists_PostsData::get_preset_id($props);

	}

	public function get_markup () {
		if (empty($this->_markup)) {
			$this->_markup = $this->_parent->get_post_markup();
		}
		return isset($this->_markup[$this->get_part_type()])
			? $this->_markup[$this->get_part_type()]
			: ''
		;
	}

	public function get_part_type () {
		return $this->_part_type;
	}

	public function get_style_for($point, $scope, $col = false) {
		$css = '';
		return $css;
	}
}



class Upfront_PostsListsCompatView extends Upfront_Object {

	public function __construct ($data, $post_id, $markup, $parent_obj = false, $breakpoint = false) {
		$this->_breakpoint = $breakpoint;
		$this->_post_id = $post_id;
		$this->_markup = $markup;
		if ($parent_obj !== false) {
			$this->_parent = $parent_obj;
		}

		parent::__construct($data);
	}

	public function get_markup () {
		$data = $this->_properties_to_array();
		if (empty($data)) $data = Upfront_PostsLists_PostsData::get_defaults();

		if (empty($data['display_type'])) return ''; // Force no render for unselected display type.

		$markup = isset($data['_markup']) ? $data['_markup'] : '';
		if (!empty($markup)) return $markup;

		return Upfront_PostsLists_PostsView::get_markup($data);
	}

	private function _properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop) {
			if (!isset($prop['value'])) continue;
			$out[$prop['name']] = $prop['value'];
		}
		return $out;
	}

	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		$wrapper_data = $this->_parent ? $this->_parent->find_post_wrapper($wrapper_id) : false;
		return $wrapper_data !== false ? new Upfront_Wrapper($wrapper_data) : false;
	}

}

