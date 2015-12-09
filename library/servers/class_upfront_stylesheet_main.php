<?php

//require_once('class_upfront_accordion_presets_server.php');
//require_once('class_upfront_tab_presets_server.php');

/**
 * Serves frontend stylesheet.
 */
class Upfront_StylesheetMain extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		upfront_add_ajax('upfront_load_styles', array($this, "load_styles"));
		upfront_add_ajax_nopriv('upfront_load_styles', array($this, "load_styles"));

		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_ajax('upfront_theme_styles', array($this, "theme_styles"));
			upfront_add_ajax('upfront_theme_styles_options', array($this, "theme_styles_options"));
		}
		if (Upfront_Permissions::current(Upfront_Permissions::SAVE)) {
			upfront_add_ajax('upfront_save_styles', array($this, "save_styles"));
			upfront_add_ajax('upfront_delete_styles', array($this, "delete_styles"));

			upfront_add_ajax('upfront_save_theme_colors_styles', array($this, "save_theme_colors_styles"));
		}
	}

	function load_styles () {
		$layout = apply_filters('upfront-style-base_layout', Upfront_Layout::get_instance());
		$base_only = isset($_POST['base_only']) ? filter_var($_POST['base_only'], FILTER_VALIDATE_BOOLEAN) : false;

		// Alright, so initialize the var first
		$style = '';
		$bootable = Upfront_Permissions::current(Upfront_Permissions::BOOT);
		$cache = $ckey = false;
		
		/*
		// Let's try to go with cached response first, if we can
		if (!Upfront_Behavior::debug()->is_active(Upfront_Behavior::debug()->constant('STYLE'))) {
			$cache = Upfront_Cache::get_instance(Upfront_Cache::TYPE_LONG_TERM);
			$ckey = $cache->key('styles_main', array($layout, $bootable));
			$style = $cache->get($ckey);
			if (!empty($style)) $this->_out(new Upfront_CssResponse_Success($style), !$bootable);
		}
		*/

		// Add typography styles - rearranging so the imports from Google fonts come first, if needed.
		// When loading styles in editor mode don't include typography styles since they are generated
		// by javascript
		if (false === $base_only) {
			$grid = Upfront_Grid::get_grid();
			$preprocessor = new Upfront_StylePreprocessor($grid, $layout);
			
			$style = $this->prepare_typography_styles($layout, $grid);
			$style .= $preprocessor->process();
		}

		// Always load original theme styles into theme unless we're in builder, yay
		// Reasoning behind it: we want theme users to always have original theme styles loaded
		// because if they want to override some style they can add their own additional properties
		// or nullify explicitly existing rules. So, to avoid complex initialization logic depending
		// on wheather there is something in database just load theme styles always. In builder though
		// we don't want this because user is editing actual theme styles.
		$style .= $this->load_theme_styles_unless_in_builder();

		// When loading styles in editor mode don't include element styles and colors since they
		// will be loaded separately to the body. If they are included in main style than after
		// style is edited in editor (e.g. some property is removed) inconsistencies may occur
		// especially with rules removal since those would still be defined in main style.
		if ($base_only) {
			$this->_out(new Upfront_JsonResponse_Success(array('styles' => $style)));
			return;
		}

		//Add theme styles
		$style .= $this->prepare_theme_styles();
		// Add theme colors styles
		$style .= $this->_get_theme_colors_styles();
		// Add elements presets styles
		$style = apply_filters('get_element_preset_styles', $style);
		$style = Upfront_UFC::init()->process_colors($style);

		if (!empty($cache) && !empty($ckey)) { // make use of cache, if possible
			$cache->set($ckey, $style);
		}

		/**
		 * Filter the styles just before we use them
		 *
		 * @param string $style Gathered styles
		 */
		$style = apply_filters('upfront-dependencies-main-styles', $style);

		$this->_out(new Upfront_CssResponse_Success($style), !$bootable); // Serve cacheable styles for visitors
	}

	function save_styles(){
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$name = sanitize_key(str_replace(' ', '_', trim($_POST['name'])));
		$styles = trim(stripslashes($_POST['styles']));
		$element_type = isset($_POST['elementType']) ? sanitize_key($_POST['elementType']) : 'unknown';

		// Fix storage key missing _dev in dev mode. Called from ajax, use POST.
		$storage_key = Upfront_Layout::get_storage_key();
		if (isset($_POST['dev']) && $_POST['dev'] === 'true' && strpos($storage_key, '_dev') === false) $storage_key = $storage_key . '_dev';

		$db_option = $storage_key . '_' . get_stylesheet() . '_styles';
		$current_styles = get_option($db_option, array());
    	$current_styles = apply_filters('upfront_get_theme_styles', $current_styles);

		$styles = apply_filters('upfront-save_styles', $styles, $name, $element_type);

		if(!isset($current_styles[$element_type]))
			$current_styles[$element_type] = array();

		$current_styles[$element_type][$name] = $styles;

		global $wpdb;
		update_option($db_option, $current_styles);

		$this->_out(new Upfront_JsonResponse_Success(array(
			'name' => $name,
			'styles' => $styles
		)));
	}

	function delete_styles(){
		if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

		$elementType = isset($_POST['elementType']) ? $_POST['elementType'] : false;
		$styleName = isset($_POST['styleName']) ? $_POST['styleName'] : false;

		if(!$elementType || !$styleName)
			$this->_out(new Upfront_JsonResponse_Error('No element type or style to delete.'));

		$db_option = Upfront_Layout::get_storage_key() . '_' . get_stylesheet() . '_styles';
		$current_styles = get_option($db_option);

		if(!$current_styles || !isset($current_styles[$elementType]) || !isset($current_styles[$elementType][$styleName]))
			$this->_out(new Upfront_JsonResponse_Error("The style doesn\'t exist."));

		unset($current_styles[$elementType][$styleName]);

		update_option($db_option, $current_styles);

		$this->_out(new Upfront_JsonResponse_Success(array()));
	}

	function theme_styles() {
		// Fix storage key missing _dev in dev mode. This is called from ajax calls so use POST.
		$storage_key = Upfront_Layout::get_storage_key();
		if (isset($_POST['dev']) && $_POST['dev'] === 'true' && strpos($storage_key, '_dev') === false) $storage_key = $storage_key . '_dev';
		$styles = get_option($storage_key . '_' . get_stylesheet() . '_styles');
		
		if(!isset($_POST['only_db_options']) || (isset($_POST['only_db_options']) && $_POST['only_db_options'] != "true")) {
			$styles = apply_filters('upfront_get_theme_styles', $styles);
		}

		$this->_out(new Upfront_JsonResponse_Success(array(
			'styles' => $styles
		)));
	}

	function load_theme_styles_unless_in_builder() {
		if (!empty($_SERVER['HTTP_REFERER']) && strpos($_SERVER['HTTP_REFERER'], 'create_new') !== false) {
			return '';
		}
		$child = Upfront_ChildTheme::get_instance();

		return $child instanceof Upfront_ChildTheme
			? $child->getThemeStylesAsCss()
			: ''
		;
	}

	function prepare_theme_styles() {
		// Fix storage key missing _dev in dev mode. This is regular GET request.
		$storage_key = Upfront_Layout::get_storage_key();
		if (isset($_GET['load_dev']) && $_GET['load_dev'] == 1 && strpos($storage_key, '_dev') === false) $storage_key = $storage_key . '_dev';

		$styles = get_option($storage_key . '_' . get_stylesheet() . '_styles', array());
		$out = '';
		//$layout = Upfront_Layout::get_cascade();
		$layout = Upfront_Layout::get_parsed_cascade(); // Use pure static method instead
		$layout_id = ( !empty($layout['specificity']) ? $layout['specificity'] : ( !empty($layout['item']) ? $layout['item'] : $layout['type'] ) );

		$layout_style_loaded = false; // Keep track of global layout CSS, so we sent over to the filter

		if( is_array( $styles ) ){
		  foreach($styles as $type => $elements) {
			foreach($elements as $name => $content) {
			  // If region CSS, only load the one saved matched the layout_id
			  $style_rx = '/^(' . preg_quote("{$layout_id}", '/') . '|' . preg_quote("{$type}", '/') . ')/';
			  if ( preg_match('/^region(-container|)$/', $type) && !preg_match($style_rx, $name) )
				continue;
			  $out .= $content;
			  if ( $type == 'layout' && $name == 'layout-style' )
			  	$layout_style_loaded = true;
			}
		  }
		}


		$out = apply_filters('upfront_prepare_theme_styles', $out, $layout_style_loaded);

		return $out;
	}

	function prepare_typography_styles ($layout, $grid) {
		$typography = $layout->get_property_value('typography');
		if (!$typography)
			return '';
		$out = '';
		$faces = array();
		foreach ( $typography as $element=>$properties ) {
			$properties = wp_parse_args($properties, array(
				'font_face' => false,
				'weight' => false,
				'style' => false,
				'size' => false,
				'line_height' => false,
				'color' => false,
			));
			$face = !empty($properties['font_face'])
				? $properties['font_face']
				: false
			;
			$faces[] = array(
				'face' => $face,
				'weight' => $properties['weight']
			);
			if (!empty($face) && false !== strpos($face, ' '))  $face = '"' . $face . '"';
			$font = $properties['font_face'] ? "{$face}, {$properties['font_family']}" : "inherit";

			$selector = $this->_typography_element_to_output_selector($element);
			if (empty($selector)) continue;

			$out .= "{$selector} {\n" .
					"font-family: {$font};\n" .
					( $properties['weight'] ? "font-weight: {$properties['weight']};\n" : "" ) .
					( $properties['style'] ? "font-style: {$properties['style']};\n" : "" ) .
					( $properties['size'] ? "font-size: {$properties['size']}px;\n" : "" ) .
					( $properties['line_height'] ? "line-height: {$properties['line_height']}em;\n" : "" ) .
					"color: {$properties['color']};\n" .
					"}\n";
		}

		// Responsive/breakpoint typography
		$breakpoints = $grid->get_breakpoints();
		$tablet_typography;
		foreach ($breakpoints as $breakpoint) {
			// Ignore default/desktop breakpoint as we store it separately
			if ( $breakpoint->is_default() ) {
				continue;
			}

			$breakpoint_css = '';
			// Breakpoint's typography should load (inherit) like this:
			// - if there is no typography for current breakpoint it should inherit settings from
			//   wider one, if wider one is not defined inherit from one above, last one is default
			//   typography
			// - in case of widest (tablet for now) it should inherit from default typography
			$breakpoint_id = $breakpoint->get_id();
			$typography = $breakpoint->get_typography();

			if ($breakpoint_id === 'tablet') {
				$tablet_typography = $typography;// needed for mobile
			}

			if (empty($typography) || false === isset($typography['h2'])) {
				switch ($breakpoint_id) {
				case 'tablet':
					$layout_properties = Upfront_ChildTheme::get_instance()->getLayoutProperties();
					$value = upfront_get_property_value('typography', array('properties'=>$layout_properties));
					$typography = $value;
					break;
				case 'mobile':
					if (empty($tablet_typography)) {
						$layout_properties = Upfront_ChildTheme::get_instance()->getLayoutProperties();
						$value = upfront_get_property_value('typography', array('properties'=>$layout_properties));
						$typography = $value;
					} else {
						$typography = $tablet_typography;
					}
					break;
				}
			}
			foreach ( $typography as $element=>$properties ){

				$properties = wp_parse_args($properties, array(
					'font_face' => 'Arial',
					'weight' => '400',
					'style' => 'normal',
					'size' => '16px',
					'line_height' => '1.3',
					'color' => 'black',
					'font_family' => 'sans-serif'
				));
				$faces[] = array(
					'face' => $properties['font_face'],
					'weight' => $properties['weight']
				);
				$font = $properties['font_face'] ? "{$properties['font_face']}, {$properties['font_family']}" : "inherit";

				$selector = $this->_typography_element_to_output_selector($element);
				if (empty($selector)) continue;

				$breakpoint_css .= "{$selector} {\n" .
						"font-family: {$font};\n" .
						( $properties['weight'] ? "font-weight: {$properties['weight']};\n" : "" ) .
						( $properties['style'] ? "font-style: {$properties['style']};\n" : "" ) .
						( $properties['size'] ? "font-size: {$properties['size']}px;\n" : "" ) .
						( $properties['line_height'] ? "line-height: {$properties['line_height']}em;\n" : "" ) .
						"color: {$properties['color']};\n" .
						"}\n";
			}
			$out .= $breakpoint->wrap($breakpoint_css, $breakpoints);
		}

		// Include Google fonts
		$faces = array_values(array_filter(array_unique($faces, SORT_REGULAR)));
		$google_fonts = new Upfront_Model_GoogleFonts;

		$deps = Upfront_CoreDependencies_Registry::get_instance();

		foreach ($faces as $face) {
			if (!$google_fonts->is_from_google($face['face'])) continue;
			$variant = 400 !== (int)$face['weight'] && 'inherit' !== $face['weight']
				? $face['weight']
				: false
			;
			$deps->add_font($face['face'], $variant);
		}

		$out = apply_filters('upfront_prepare_typography_styles', $out);

		return $out;
	}

	/**
	 * Convert typography element to CSS selector
	 *
	 * @param string $element Typography element (h1,p, blockquote)
	 *
	 * @return string Final selector
	 */
	private function _typography_element_to_output_selector ($element) {
		if (empty($element)) return false;

		$selector = '.upfront-output-object ' . $element;
		
		// Explicitly support blockquote typo settings for child paragraphs
		if (preg_match('/^blockquote\b/', $element)) {
			$selector = "{$selector}, {$selector} p";
		}
		
		return $selector;
	}

    /**
     * Saves theme colors styles
     * Hooks to upfront_save_theme_colors_styles ajax call
     * @access public
     */
    function save_theme_colors_styles(){
        if (!Upfront_Permissions::current(Upfront_Permissions::SAVE)) $this->_reject();

        $styles = trim(stripslashes($_POST['styles']));
        $styles = apply_filters('upfront-save_theme_colors_styles', $styles);

        update_option("upfront_" . get_stylesheet() . "_theme_colors_styles", $styles);

        $this->_out(new Upfront_JsonResponse_Success(array(
            'styles' => $styles
        )));
    }

    private function _get_theme_colors_styles(){
        return apply_filters('upfront_get_theme_colors_styles', get_option("upfront_" . get_stylesheet() . "_theme_colors_styles"));
    }
}
