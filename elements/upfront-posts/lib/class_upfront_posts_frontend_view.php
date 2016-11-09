<?php

/**
 * Front-end rendering class.
 */
class Upfront_PostsView extends Upfront_Object_Group {

	private $_post;
	protected $_children = 'post_objects';
	protected $_child_view_class = 'Upfront_ObjectGroup';
	protected $_child_instances = array();
	protected $_breakpoint = false;
	protected $_markup = array();

	public function __construct ($data, $breakpoint = false) {
		$this->_breakpoint = $breakpoint;
		parent::__construct($data);

		$data = $this->_properties_to_array();
		if (empty($data)) $data = Upfront_Posts_PostsData::get_defaults();

		if (empty($data['display_type'])) return ''; // Force no render for unselected display type.

		$markup = apply_filters('upfront-posts-get_markup-before', false);
		if (!empty($markup)) {
			$this->_markup = $markup;
		}
		else {
			$this->_markup = Upfront_Posts_PostsView::get_markup($data);
		}

		// Create layout data for each posts
		$this->_data['post_objects'] = array();
		$this->_data['post_wrappers'] = array();
		foreach ( $this->_markup as $id => $markup ) {
			$this->create_post_object($id);
		}
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
		return Upfront_Posts_PostsData::get_defaults();
	}

	protected function create_post_object ($id) {
		$classes = $this->_get_property('class');
		$column = upfront_get_class_num('c', $classes);
		$post_col = $this->_get_property('post_col');
		if ( !is_numeric($post_col) || $post_col == 0 ) {
			$post_col = 24;
		}
		$post_class = 'c' .  $post_col;
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
		$this->_data['post_wrappers'][] = $wrapper;

		// Copying post part layouts with all new ids
		$object = $this->clone_object($this->_data, $id);
		upfront_set_property_value('post_id', $id, $object);
		upfront_set_property_value('class', $post_class, $object);
		upfront_set_property_value('wrapper_id', $wrapper_id, $object);
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
		upfront_set_property_value('view_class', 'PostsEachView', $new_object);
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
		$markup = isset($this->_markup[$post_id]) ? $this->_markup[$post_id] : array();

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


class Upfront_PostsEachView extends Upfront_Object_Group {

	private $_parent;
	private $_post_id;
	private $_markup;
	protected $_child_instances = array();
	protected $_breakpoint = false;

	public function __construct ($data, $post_id, $markup, $parent_obj = false, $breakpoint = false) {
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
		return Upfront_Posts_PostsData::get_defaults();
	}

	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		$wrapper_data = $this->_parent ? $this->_parent->find_post_wrapper($wrapper_id) : false;
		return $wrapper_data !== false ? new Upfront_Wrapper($wrapper_data) : false;
	}

	public function get_post_markup () {
		return $this->_markup;
	}

	public function get_css_class () {
		$classes = parent::get_css_class();

		$classes .= !empty($this->_post_id) && is_sticky( $this->_post_id ) ? " uf-post uf-post-sticky" : " uf-post";

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

	public function get_propagated_classes () {
		$classes = array();
		foreach ($this->_child_instances as $part_view) {
			if (!is_callable(array($part_view, 'get_propagated_classes'))) continue;
			$classes = array_merge($classes, $part_view->get_propagated_classes());
		}
		return array_unique($classes);
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

class Upfront_PostsPartView extends Upfront_Object {

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
			: Upfront_Posts_PostsData::get_defaults()
		;

		//$props['preset'] = $this->_parent->get_preset();

		$props = Upfront_Posts_PostsData::apply_preset($props);
		$this->_preset_id = Upfront_Posts_PostsData::get_preset_id($props);

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

	public function get_propagated_classes () {
		$part_type = $this->get_part_type();

		$cls[] = $part_type;

		// Add `upost-data-object-{part type}` class to allow applying custom css per post part type
		// For each type there are part parts that need to be translated to element type class
		// Post data
		if (in_array($part_type, array('title', 'date_posted', 'content') )) {
			$cls[] = 'uposts-object-post_data';
			// Post taxonomy
		} else if (in_array($part_type, array('categories', 'tags') )) {
			$cls[] = 'uposts-object-taxonomy';
			// Post author
		} else if (in_array($part_type, array('author', 'author-email', 'author-url', 'author-bio', 'gravatar') )) {
			$cls[] = 'uposts-object-author';
			// Post comments
		} else if (in_array($part_type, array('comment_count', 'comments', 'comment_form', 'comment_pagination') )) {
			$cls[] = 'uposts-object-comments';
		} else {
			// Meta and featured image have single class that matches type
			$cls[] = 'uposts-object-' . $part_type;
		}
		// We apply preset class on ObjectGroup, commented this so we are not adding double class
		//if (!empty($this->_preset_id)) $cls[] = esc_attr($this->_preset_id);

		return $cls;
	}

	public function get_style_for($point, $scope, $col = false) {
		$css = '';
		return $css;
	}
}
