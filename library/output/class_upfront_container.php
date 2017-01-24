<?php

abstract class Upfront_Container extends Upfront_Entity {

	protected $_type;
	protected $_children;
	protected $_child_view_class;
	protected $_wrapper;
	protected $_wrapper_is_spacer;
	public static $_presets;
	
	/**
	 * Array of child views, it's only filled in self::get_markup foreach loop
	 *
	 * @var array
	 */
	protected $_child_views = array();

	public function get_markup () {
		$html='';
		$wrap='';

		// Allow compat to forbid post data types (some wreck up output from plugins)
		$forbidden_post_data_types = apply_filters('upfront-forbidden_post_data_types', array());

		$do_compat = false;
		if (count($forbidden_post_data_types) > 0) {
			// This is for compatibility layer to ensure that only post content is rendered
			// when needed.
			// To allow other post part types to be rendered in other places than main module
			// only filter if there is content present (which means this is main module that
			// shows content beside other part types)
			$check_children_type = $this->_type === 'Object_Group' &&
				$this->_children === 'objects' &&
				count($this->_data[$this->_children]) > 1;

			$are_post_parts = false;
			if ($check_children_type) {
				$first_child = $this->_data[$this->_children][0];
				$are_post_parts = upfront_get_property_value('view_class', $first_child) === 'PostDataPartView';
			}
			if ($are_post_parts) {
				foreach ($this->_data[$this->_children] as $idx => $child) {
					if ( upfront_get_property_value('part_type', $child) === 'content' ) {
						// There is content, show only content i.e. do filtering
						$do_compat = true;
						break;
					}
				}
			}
		}

		if (!empty($this->_data[$this->_children])) {
			foreach ($this->_data[$this->_children] as $idx => $child) {
				if ($do_compat) {
					if (upfront_get_property_value('view_class', $child) === 'PostDataPartView' &&
						in_array(upfront_get_property_value('part_type', $child), $forbidden_post_data_types)) continue;
				}

				$this->_child_views[] = $child_view  = $this->instantiate_child($child, $idx);
				if ($child_view instanceof Upfront_Entity) {
					// Have wrapper? If so, then add wrappers
					$wrapper = $child_view->get_wrapper();
					$wrapper_is_spacer = (($child_view instanceof Upfront_Module || $child_view instanceof Upfront_Object) && $child_view->is_spacer());

					if ($wrapper && !$this->_wrapper) {
						$this->_wrapper = $wrapper;
						$this->_wrapper_is_spacer = $wrapper_is_spacer;
					}
					if ($wrapper && $this->_wrapper->get_wrapper_id() == $wrapper->get_wrapper_id()) {
						$wrap .= $this->_get_child_markup($child_view, $child);
					} else if ($wrapper) {
						// Check spacer and don't render wrapper if it is
						if ($this->_wrapper_is_spacer) {
							$html .= $wrap;
						} else {
							$html .= $this->_wrapper->wrap($wrap);
						}
						$this->_wrapper = $wrapper;
						$this->_wrapper_is_spacer = $wrapper_is_spacer;
						$wrap = $this->_get_child_markup($child_view, $child);
					}
				}
				// No wrapper, just appending html
				if (!isset($wrapper) || !$wrapper) {
					$html .= $this->_get_child_markup($child_view, $child);
				}
			}
		}

		// Have wrapper, append the last one
		if ( isset($wrapper) && $wrapper && $this->_wrapper ) {
			$html .= $this->_wrapper->wrap($wrap);
		}

		return $this->wrap($html);
	}

	protected function _get_child_markup ($view, $data) {
		if ( $view instanceof Upfront_Object ){
			if ( $view->is_spacer() ) {
				return '';
			}
			$theme_style = upfront_get_property_value('theme_style', $data);
			if ($theme_style) {
				$theme_style = strtolower($theme_style);
			}

			// So let's map out the breakpoints/presets map
			$preset_map = $this->_get_preset_map($data);
			// Now we have a map of breakpoint/presets we can encode as the attribute
			// This will be used for the breakpoint preset toggling
			$preset = $this->_get_preset($data, $preset_map);

			$view->set_preset($preset);

			$breakpoint = upfront_get_property_value('breakpoint', $data);
			$theme_styles = array('default' => $theme_style);
			$theme_styles_attr = '';
			if ($breakpoint) {
				foreach ($breakpoint as $id => $props) {
					if (!empty($props['theme_style']))
						$theme_styles[$id] = strtolower($props['theme_style']);
				}
				$theme_styles_attr = " data-theme-styles='" . json_encode($theme_styles) . "'";
			}
			$slug = upfront_get_property_value('id_slug', $data);
			if ($slug === 'ucomment' && is_single()) {
				if (!(function_exists('upfront_exporter_is_running') && upfront_exporter_is_running()) && !comments_open()) return '';
			}

			$classes = $this->_get_property('class');
			$column = upfront_get_class_num('c', $classes);
			$class = $slug === "uposts" ? "c" . $column . " uposts-object" : upfront_get_property_value('class', $data);

			$usingNew = upfront_get_property_value('usingNewAppearance', $data);
			if(!empty( $usingNew )) {
				// Augment the output with preset map, in addition to other stuff going on in there
				return '<div data-preset_map="' . esc_attr(!empty($preset_map) ? json_encode($preset_map) : '') . '" class="upfront-output-object ' . $theme_style . ' ' . $preset . ' upfront-output-' . $slug . ' ' . $class . '" id="' . upfront_get_property_value('element_id', $data) . '"' . $theme_styles_attr . '>' . $view->get_markup() . '</div>';
			} else {
				return '<div data-preset_map="' . esc_attr(!empty($preset_map) ? json_encode($preset_map) : '') . '" class="upfront-output-object ' . $theme_style . ' upfront-output-' . $slug . ' ' . $class . '" id="' . upfront_get_property_value('element_id', $data) . '"' . $theme_styles_attr . '>' . $view->get_markup() . '</div>';
			}
		} else {
			return $view->get_markup();
		}
	}

	public static function _load_presets () {
		if( empty( self::$_presets ) ) {
			self::$_presets = array(
				'UnewnavigationModel' => Upfront_Nav_Presets_Server::get_instance()->get_presets_ids(),
				'ButtonModel' => Upfront_Button_Presets_Server::get_instance()->get_presets_ids(),
				'PostDataModel' => Upfront_PostData_Elements_Server::get_instance()->get_presets_ids(),
				'PostsModel' => Upfront_Posts_Presets_Server::get_instance()->get_presets_ids(),
				'PlainTxtModel' => Upfront_Text_Presets_Server::get_instance()->get_presets_ids(),
				'UimageModel' => Upfront_Image_Presets_Server::get_instance()->get_presets_ids(),
				'UaccordionModel' => Upfront_Accordion_Presets_Server::get_instance()->get_presets_ids(),
				'UcommentModel' => Upfront_Ucomment_Presets_Server::get_instance()->get_presets_ids(),
				'UcontactModel' => Upfront_Contact_Presets_Server::get_instance()->get_presets_ids(),
				'UgalleryModel' => Upfront_Gallery_Presets_Server::get_instance()->get_presets_ids(),
				'USliderModel' => Upfront_Slider_Presets_Server::get_instance()->get_presets_ids(),
				'UtabsModel' => Upfront_Tab_Presets_Server::get_instance()->get_presets_ids(),
				'ThisPostModel' => Upfront_Post_Presets_Server::get_instance()->get_presets_ids(),
				'UwidgetModel' => Upfront_Widget_Presets_Server::get_instance()->get_presets_ids(),
				'LoginModel' => Upfront_Login_Presets_Server::get_instance()->get_presets_ids(),
			);
		}

		return self::$_presets;
	}
	
	public function preset_exist ( $preset, $type ) {
		
		if( empty( $type ) ) return 'default';
		
		$presets = Upfront_Container::_load_presets();

		if( isset( $presets[$type] ) && !empty( $presets[$type] ) ) {
			if( in_array( $preset, $presets[$type] ) ) {
				return $preset;
			} else {
				return 'default';
			}
		}
		
		return 'default';
	}

	protected function _get_preset_map ($data) {
		$preset_map = array();
		$raw_preset_map = upfront_get_property_value('breakpoint_presets', $data);
		$type = upfront_get_property_value('type', $data);
		if (!empty($raw_preset_map)) foreach ($raw_preset_map as $bp => $pst) {
			if (empty($pst['preset'])) continue;
			
			// Check if preset exist, if not use default
			$pst['preset'] = $this->preset_exist( $pst['preset'], $type );
			
			$preset_map[$bp] = esc_js($pst['preset']);
		}
		return $preset_map;
	}

	protected function _get_preset ($data, $preset_map, $breakpoint = false) {
		// We also preserve the current preset class, so it all
		// just works without JS requirement on client
		$preset = upfront_get_property_value('preset', $data);
		$type = upfront_get_property_value('type', $data);
		
		// Check if preset exist, if not use default
		$preset = $this->preset_exist( $preset, $type );

		// Also, if we have a preset map and a default grid breakpoint
		// mapped, let's try to use this as default preset
		if (!empty($preset_map)) {
			$grid = Upfront_Grid::get_grid();
			if ( false === $breakpoint ) {
				$default_bp = $grid->get_default_breakpoint();
				if ($default_bp && is_callable(array($default_bp, 'get_id'))) {
					$bp = $default_bp->get_id();
					if (!empty($preset_map[$bp])) $preset = $preset_map[$bp];
				}
			}
			else {
				$bp = $breakpoint->get_id();
				if (!empty($preset_map[$bp])) {
					$preset = $preset_map[$bp];
				}
				else {
					// Get closest breakpoint with set preset
					$columns = $breakpoint->get_columns();
					$closest = false;
					$breakpoints = $grid->get_breakpoints();
					foreach ( $breakpoints as $each_breakpoint ) {
						$each_columns = $each_breakpoint->get_columns();
						if ( $closest !== false && $each_columns > $closest ) continue;
						if ( $each_columns < $columns ) continue;
						$closest = $each_columns;
						$each_bp = $each_breakpoint->get_id();
						if (!empty($preset_map[$each_bp])) $preset = $preset_map[$each_bp];
					}
				}
			}
		}

		return $preset;
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

		$class .= $this->get_additional_classes();

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

	public function get_wrapper () {
		$wrapper_id = $this->_get_property('wrapper_id');
		return Upfront_Wrapper::get_instance($wrapper_id);
	}


	/**
	 * Returns additional classes
	 *
	 * @return string
	 */
	protected function get_additional_classes(){
		$additional_classes = "";

		foreach( $this->_child_views as $child_view ){
			if( is_a($child_view, "Upfront_LoginView" ) ) // Check to see if any of the child views have a login el
				$additional_classes .= " upfront-bumped-z-index";
		}

		return $additional_classes;
	}
}
