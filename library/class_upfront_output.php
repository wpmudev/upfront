<?php

class Upfront_Output {

	private $_layout;
	private $_debugger;
	
	private static $_instance;
	
	public static $current_object;
	public static $current_module;

	public function __construct ($layout, $post) {
		$this->_layout = $layout;
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	public static function get_layout ($layout_ids) {
		$layout = Upfront_Layout::from_entity_ids($layout_ids);

		if ($layout->is_empty()) {
			$layout = Upfront_Layout::create_layout($layout_ids);
		}
		
		$post_id = is_singular() ? get_the_ID() : '';
		$post = get_post($post_id);
		self::$_instance = new self($layout, $post);

		// Add actions
		add_action('wp_enqueue_scripts', array(self::$_instance, 'add_styles'));

		// Do the template...
		return self::$_instance->apply_layout();
	}
	
	public static function get_layout_data () {
		if ( self::$_instance )
			return self::$_instance->_layout->to_php();
		return false;
	}
	
	public static function get_layout_object () {
		if ( self::$_instance )
			return self::$_instance->_layout;
		return false;
	}
	
	public static function get_current_object () {
		if ( self::$current_object )
			return self::$current_object;
		return false;
	}
	
	public static function get_current_module () {
		if ( self::$current_module )
			return self::$current_module;
		return false;
	}

	public function apply_layout () {
		$layout = $this->_layout->to_php();
		
		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$html =  "<!-- Code generated by Upfront core -->\n";
			$html .= "<!-- Layout Name: {$layout['name']} -->\n";
		}
		$region_markups = array();
		$container_views = array();
		foreach ($layout['regions'] as $region) {
			$region_view = new Upfront_Region($region);
			$container = $region_view->get_container();
			if ( !isset($region_markups[$container]) )
				$region_markups[$container] = $region_view->get_markup();
			else
				$region_markups[$container] .= $region_view->get_markup();
			if ( $region_view->get_name() == $container ) {
				$container_views[$container] = new Upfront_Region_Container($region);
			}
		}
		foreach ($container_views as $container => $container_view) {
			$html .= $container_view->wrap( $region_markups[$container] );
		}
		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$html .= "<!-- Upfront layout end -->\n";
		}
		return $html;
	}

	function add_styles () {
		wp_enqueue_style('upfront-main', upfront_ajax_url('upfront_load_styles'), array(), 0.1, 'all');
	}
}



abstract class Upfront_Entity {

	protected $_data;
	protected $_tag = 'div';
	protected $_debugger;

	public function __construct ($data) {
		$this->_data = $data;
		$this->_debugger = Upfront_Debug::get_debugger();
	}

	abstract public function get_markup ();


	public function get_style_for ($breakpoint, $context) {

		return '';

		$post = $pre = '';
		$post = $this->_debugger->is_active(Upfront_Debug::STYLE)
			? "/* General styles for {$this->get_name()} */"
			: ""
		;
		return trim("{$pre} .{$context} .{$this->get_css_class()} {" .
			'width: 100%;' .
		"} {$post}") . "\n";
	}

	public function get_front_context () {
		return 'default';
	}

	public function get_css_class () {
		$classes = array(
			"upfront-output-" . strtolower(str_replace("_", "-", $this->_type)),
			$this->get_front_context()
		);
		$name = $this->get_name();
		if ( $name != 'anonymous' )
			$classes[] = "upfront-" . strtolower(str_replace("_", "-", $this->_type)) . "-" . strtolower(str_replace(" ", "-", $name));
		return join(' ', $classes);
	}
	
	public function get_css_inline () {
		return '';
	}

	protected function _get_property ($prop) {
		return upfront_get_property_value($prop, $this->_data);
	}

	public function get_name () {
		if (!empty($this->_data['name'])) return $this->_data['name'];
		return 'anonymous';
	}

	public function get_container () {
		if (!empty($this->_data['container'])) return $this->_data['container'];
		return $this->get_name();
	}
	
	public function get_class_num ($classname) {
		$classes = $this->_get_property('class');
		return upfront_get_class_num($classname, $classes);
	}
	
	protected function _get_background_css () {
		$background_color = $this->_get_property('background_color');
		$background_image = $this->_get_property('background_image');
		$background_repeat = $this->_get_property('background_repeat');
		$background_fill = $this->_get_property('background_fill');
		$background_position = $this->_get_property('background_position');
		$css = array();
		if ( $background_color )
			$css[] = 'background-color: ' . $background_color;
		if ( $background_image ){
			$css[] = 'background-image: url(' . $background_image . ')';
			if ( $background_fill == 'fill' ){
				$css[] = 'background-size: 100% 100%';
				$css[] = 'background-repeat: no-repeat';
				$css[] = 'background-position: 0 0';
			}
			else {
				$css[] = 'background-size: auto auto';
				$css[] = 'background-repeat: ' . $background_repeat;
				$css[] = 'background-position: ' . $background_position;
			}
		}
		return implode('; ', $css);
	}
}


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
			if ($child_view instanceof Upfront_Container){
				// Have wrapper? If so, then add wrappers
				$wrapper = $child_view->get_wrapper();
				if ( $wrapper && !$this->_wrapper )
					$this->_wrapper = $wrapper;
				if ( $wrapper && $this->_wrapper->get_wrapper_id() == $wrapper->get_wrapper_id() ){
					$wrap .= $child_view->get_markup();
				}
				else if ( $wrapper ) {
					$html .= $this->_wrapper->wrap($wrap);
					$this->_wrapper = $wrapper;
					$wrap = $child_view->get_markup();
				}
			}
			// No wrapper, just appending html
			if ( !isset($wrapper) || !$wrapper )
				$html .= $child_view->get_markup();
		}
		// Have wrapper, append the last one
		if ( isset($wrapper) && $wrapper )
			$html .= $this->_wrapper->wrap($wrap);
		return $this->wrap($html);
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
		$element_id = $this->_get_property('element_id');
		
		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$name = $this->get_name();
			$pre = "\n\t<!-- Upfront {$this->_type} [{$name} - #{$element_id}] -->\n";
			$post = "\n<!-- End {$this->_type} [{$name} - #{$element_id}] --> \n";
		}
		
		$style = $style ? "style='{$style}'" : '';
		$element_id = $element_id ? "id='{$element_id}'" : '';
		return "{$pre}<{$this->_tag} class='{$class}' {$style} {$element_id}>{$out}</{$this->_tag}>{$post}";
	}
	
	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		return Upfront_Wrapper::get_instance($wrapper_id);
	}
	
	
}


class Upfront_Region_Container extends Upfront_Container {
	protected $_type = 'Region_Container';
	
	public function wrap ($out) {
		return parent::wrap("<div class='upfront-grid-layout'>{$out}</div>");
	}
	
	public function get_css_inline () {
		$css = '';
		$css .= $this->_get_background_css();
		return $css;
	}
}

class Upfront_Region extends Upfront_Container {
	protected $_type = 'Region';
	protected $_children = 'modules';
	protected $_child_view_class = 'Upfront_Module';
	
	public function get_css_inline () {
		$css = '';
		if ( $this->get_container() != $this->get_name() )
			$css .= $this->_get_background_css();
		return $css;
	}
}

class Upfront_Wrapper extends Upfront_Entity {
	static protected $_instances = array();
	protected $_type = 'Wrapper';
	protected $_wrapper_id = '';
	
	static public function get_instance ($wrapper_id) {
		foreach ( self::$_instances as $instance ){
			if ( $instance->_wrapper_id == $wrapper_id )
				return $instance;
		}
		$layout = Upfront_Output::get_layout_data();
		if ( !$layout )
			return false;
		$wrapper_data = false;
		foreach ( $layout['regions'] as $region ){
			if (!empty($region['wrappers'])) foreach ( $region['wrappers'] as $wrapper ){
				if ( $wrapper_id == upfront_get_property_value('wrapper_id', $wrapper) ){
					$wrapper_data = $wrapper;
					break 2;
				}
			}
		}
		if ( !$wrapper_data )
			return false;
		self::$_instances[] = new self($wrapper_data);
		return end(self::$_instances);
	}
	
	public function __construct ($data) {
		parent::__construct($data);
		$this->_wrapper_id = $this->_get_property('wrapper_id');
	}
	
	public function get_markup () {
		return '';
	}
	
	public function get_wrapper_id () {
		return $this->_wrapper_id;
	}
	
	public function wrap ($out) {
		$class = $this->get_css_class();
		
		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$name = $this->get_name();
			$pre = "\n\t<!-- Upfront {$this->_type} [{$name} - #{$this->_wrapper_id}] -->\n";
			$post = "\n<!-- End {$this->_type} [{$name} - #{$this->_wrapper_id}] --> \n";
		}
		
		$wrapper_id = $this->_wrapper_id ? "id='{$this->_wrapper_id}'" : '';
		return "{$pre}<{$this->_tag} class='{$class}' {$wrapper_id}>{$out}</{$this->_tag}>{$post}";
	}
}

class Upfront_Module extends Upfront_Container {
	protected $_type = 'Module';
	protected $_children = 'objects';
	protected $_child_view_class = 'Upfront_Object';
	
	public function __construct ($data) {
		parent::__construct($data);
		Upfront_Output::$current_module = $this;
	}
}

class Upfront_Object extends Upfront_Entity {
	protected $_type = 'Object';

	public function __construct ($data) {
		parent::__construct($data);
		Upfront_Output::$current_object = $this;
	}
	
	public function get_markup () {
		$view_class = 'Upfront_' . $this->_get_property("view_class");
		$view = new $view_class($this->_data);

		if ($this->_debugger->is_active(Upfront_Debug::MARKUP)) {
			$name = $view->get_name();
			$pre = "\n\t<!-- Upfront {$view_class} [{$name}] -->\n";
			$post = "\n<!-- End {$view_class} [{$name}] --> \n";
		}

		return $pre . $view->get_markup() . $post;
	}
}

class Upfront_PlainTxtView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		return "<div class='upfront-output-object upfront-plain_txt' {$element_id}>" . $this->_get_property('content') . '</div>';
	}
}


class Upfront_ImageView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		return "<div class='upfront-output-object upfront-output-image' {$element_id}><img src='" . esc_attr($this->_get_property('content')) . "' /></div>";
	}
}

class Upfront_SettingExampleView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		return "<div class='upfront-output-object upfront-settingexample' {$element_id}></div>";
	}
}