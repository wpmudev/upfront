<?php

abstract class Upfront_ChildTheme implements IUpfront_Server {


	private $_version = false;
	private $_required_pages = array();
	protected static $instance;

	public static function get_instance () {
		return self::$instance;
	}

	/**
	 * Gets cached theme version.
	 * @return string theme version
	 */
	public static function get_version () {
		if (!empty(self::$instance) && !empty(self::$instance->_version)) return self::$instance->_version;
		return '1.0';
	}

	protected function __construct () {
		$this->_version = wp_get_theme()->version;
		$this->themeSettings = new Upfront_Theme_Settings(get_stylesheet_directory() . DIRECTORY_SEPARATOR . 'settings.php');
		self::$instance = $this;
		//add_filter('upfront_create_default_layout', array($this, 'load_page_regions'), 10, 3); // Soooo... this no longer works, yay
		add_filter('upfront_override_layout_data', array($this, 'load_page_regions'), 10, 2); // This goes in instead of the above ^
		add_filter('upfront_get_layout_properties', array($this, 'getLayoutProperties'));
		add_filter('upfront_get_theme_fonts', array($this, 'getThemeFonts'), 10, 2);
		add_filter('upfront_get_icon_fonts', array($this, 'getIconFonts'), 10, 2);
		add_filter('upfront_get_theme_colors', array($this, 'getThemeColors'), 10, 2);
		add_filter('upfront_get_post_image_variants', array($this, 'getPostImageVariants'), 10, 2);
		add_filter('upfront_get_button_presets', array($this, 'getButtonPresets'), 10, 2);
		add_filter('upfront_get_tab_presets', array($this, 'getTabPresets'), 10, 2);
		add_filter('upfront_get_accordion_presets', array($this, 'getAccordionPresets'), 10, 2);
		add_filter('upfront_get_theme_styles', array($this, 'getThemeStyles'));
		add_filter('upfront_get_global_regions', array($this, 'getGlobalRegions'));
		add_filter('upfront_get_responsive_settings', array($this, 'getResponsiveSettings'));
		add_filter('upfront_prepare_theme_styles', array($this, 'prepareThemeStyles'));

		add_filter('upfront-storage-key', array($this, 'theme_storage_key'));

		add_filter('upfront-thx-theme_exports_images', array($this, 'theme_exports_images'));

		add_action('after_switch_theme', array($this, 'initial_theme_setup'));

		$this->_set_up_required_pages_from_settings();

		$this->checkMenusExist();
		$this->initialize();
	}

	/**
	 * Make sure this runs on initial theme setup
	 */
	public function initial_theme_setup () {
		update_option('show_on_front', 'posts'); // Make sure we're showing our own archive page as home.
	}

	/**
	 * Check whether we're to export images or not.
	 */
	public function theme_exports_images ($exports) {
		if (!isset($this->_exports_images)) return true; // Legacy themes don't have this switch set.
		return !empty($this->_exports_images);
	}

	/**
	 * This will check the required pages settings content
	 * and spawn some required pages based on whatever is in there.
	 */
	private function _set_up_required_pages_from_settings () {
		$pages = $this->themeSettings->get('required_pages');
		if (empty($pages)) return false;

		$pages = json_decode($pages, true);
		if (empty($pages)) return false;

		$data = array(
			'post_content' => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus id risus felis. Proin elit nulla, elementum sit amet diam rutrum, mollis venenatis felis. Nullam dapibus lacus justo, eget ullamcorper justo cursus ac. Aliquam lorem nulla, blandit id erat id, eleifend fermentum lorem. Suspendisse vitae nulla in dolor ultricies commodo eu congue arcu. Pellentesque et tincidunt tellus. Fusce commodo feugiat dictum. In hac habitasse platea dictumst. Morbi dignissim pellentesque ipsum, sed sollicitudin nulla ultricies in. Praesent eu mi sed massa sollicitudin bibendum in nec orci.',
		);

		foreach ($pages as $page) {
			$data['post_title'] = $page['name'];
			$this->add_required_page($page['slug'], $page['layout'], $data, false);
		}
	}

	abstract public function get_prefix ();
	abstract public function initialize ();

	public function theme_storage_key ($key) {
		$theme_key = $this->get_prefix();
		if ($theme_key === $key) return $key;
		$result = preg_replace('/' . preg_quote(Upfront_Model::STORAGE_KEY, '/') . '/', $theme_key, $key);
		return $result;
	}

	protected function checkMenusExist() {
		$menus = json_decode($this->themeSettings->get('menus'), true);
		if (empty($menus)) return;

		$existing_menus = $this->getExistingMenus();

		foreach($menus as $menu) {
			if (in_array($menu['slug'], $existing_menus)) continue;

			// Create menu if it does not exists
			$new_menu_id = wp_create_nav_menu($menu['name']);
			if (is_numeric($new_menu_id)) { // The menu ID has to be numeric!
				wp_update_nav_menu_object($new_menu_id, array(
					'description' => $menu['description'],
					'menu-name' => $menu['name'], // This member is required because of the way the `wp_update_nav_menu_object` works in WPv4.0 (direct array member access without existence check)
				));
			}

			if (empty($menu['items'])) continue;
			$menu_items = array();
			foreach($menu['items'] as $menu_item) {
				$menu_item['url'] = str_replace('%siteurl%', site_url(), $menu_item['url']);
				$menu_items[$menu_item['menu_item_parent']][] = $menu_item;
			}
			foreach($menu_items[0] as $menu_item) {
				$this->up_update_nav_menu_item( $new_menu_id, 0, $menu_item, $menu_items);
			}

			/*
			foreach($menu['items'] as $menu_item) {
				wp_update_nav_menu_item(
					$new_menu_id,
					0,
					array(
						'menu-item-url' => $menu_item['url'],
						'menu-item-title' => $menu_item['title'],
						'menu-item-position' => $menu_item['menu_order'],
						'menu-item-status' => 'publish'
					)
				);
			}*/
		}
	}

	protected function up_update_nav_menu_item($menu_id, $db_id, $args = array(), $menu_items, $parent_id = 0) {

		$id = wp_update_nav_menu_item($menu_id, $db_id, array(
						'menu-item-parent-id' => $parent_id,
						'menu-item-url' => $args['url'],
						'menu-item-title' => $args['title'],
						'menu-item-position' => $args['menu_order'],
						'menu-item-status' => 'publish'
					));
		//add child items

		if(isset($menu_items[$args['db_id']])) {

			foreach($menu_items[$args['db_id']] as $menu_item) {
				$this->up_update_nav_menu_item( $menu_id, 0, $menu_item, $menu_items, $id);
			}
		}
	}

	protected function getExistingMenus() {
		return array_map(array($this, 'extractSlug'), get_terms('nav_menu'));
	}

	protected function extractSlug($menu) {
		return $menu->slug;
	}

	public function getThemeStylesAsCss() {
		//$layout = Upfront_Layout::get_cascade();
		$layout = Upfront_Layout::get_parsed_cascade(); // Use pure static method instead
		$layout_id = ( !empty($layout['specificity']) ? $layout['specificity'] : ( !empty($layout['item']) ? $layout['item'] : $layout['type'] ) );
		$out = '';
		// See if there are styles in theme files
		$styles_root = get_stylesheet_directory() . DIRECTORY_SEPARATOR . 'element-styles';
		// List subdirectories as element types
		$element_types = is_dir($styles_root)
			? array_diff(scandir($styles_root), Upfront::$Excluded_Files)
			: array()
		;

		$alternate_layout_id = false;
		if (!empty($layout['item']) && 'single-page' == $layout['item'] && !empty($layout['specificity'])) {
			$page_id = preg_replace('/.*-([0-9]+)$/', '$1', $layout['specificity']);
			if (is_numeric($page_id)) foreach ($this->get_required_pages() as $page) {
				if ((int)$page->get_id() !== (int)$page_id) continue;
				$alternate_layout_id = $page->get_layout_name();
				break;
			}
		}

		foreach($element_types as $type) {
			$style_files = array_diff(scandir($styles_root . DIRECTORY_SEPARATOR . $type), Upfront::$Excluded_Files);
			foreach ($style_files as $style) {
				// If region CSS, only load the one saved matched the layout_id
				$style_rx = '/^(' . preg_quote("{$layout_id}", '/') . '|' . preg_quote("{$type}", '/') . (!empty($alternate_layout_id) ? '|' . preg_quote($alternate_layout_id, '/') : '') . ')/';
				if ( preg_match('/^region(-container|)$/', $type) && !preg_match($style_rx, $style) )
					continue;
				$style_content = file_get_contents($styles_root . DIRECTORY_SEPARATOR . $type . DIRECTORY_SEPARATOR . $style);
				$out .= $style_content;
			}
		}

		// Add icon font style if there is active icon font other than UpFont
		$font = $this->getActiveIconFont();
		if ($font) {
			$out .= "\nin font \n";
			$longSrc = '';
			foreach($font['files'] as $type=>$file) {
				$longSrc .= "url('" . get_stylesheet_directory_uri() . '/icon-fonts/' . $file . "') format('";
				switch($type) {
					case 'eot':
						$longSrc .= 'embedded-opentype';
						break;
					case 'woff':
						$longSrc .= 'woff';
						break;
					case 'ttf':
						$longSrc .= 'truetype';
						break;
					case 'svg':
						$longSrc .= 'svg';
						break;
				}
				$longSrc .= "'),";
			};

			$icon_font_style = "@font-face {" .
				"	font-family: '" . $font['family'] . "';";
			if (isset($font['files']['eot'])) {
				$icon_font_style .= "src: url('" . get_stylesheet_directory_uri() . '/icon-fonts/' . $font['files']['eot'] . "');";
			}
			$icon_font_style .= "src:" . substr($longSrc, 0, -1) . ';';

			$icon_font_style .=
				"	font-weight: normal;" .
				"	font-style: normal;" .
				"}" .
				".uf_font_icon {" .
				"	font-family: '" . $font['family'] . "'!important;" .
				"}";
			$out .= $icon_font_style . "\n";
		}

		return $out;
	}

	private function getActiveIconFont() {
		$fonts = json_decode($this->themeSettings->get('icon_fonts'), true);
		$active_font = false;
		foreach($fonts as $font) {
			if ($font['active'] === true) {
				$active_font = $font;
				break;
			}
		}
		return $active_font;
	}

	/**
	 * Get theme styles as css output for stylesheet.
	 */
	public function prepareThemeStyles($styles) {
		// If styles are empty than there is no overrides in db, load from theme
		if(empty($styles) === false) return $styles;

		$out = $this->getThemeStylesAsCss();

		// ALSO!!! Do the theme global styles >.<
		$global_layout_styles = $this->themeSettings->get('layout_style');
		if (!empty($global_layout_styles)) {
			$out .= $global_layout_styles;
		}

		return $out;

	}

	public function getThemeStyles($styles) {
		if (empty($styles) === false) return $styles;

		$theme_styles  = array();
		$styles_root = get_stylesheet_directory() . DIRECTORY_SEPARATOR . 'element-styles';
		if (file_exists($styles_root) === false) return $theme_styles;

		// List subdirectories as element types
		$element_types = array_diff(scandir($styles_root), Upfront::$Excluded_Files);

		foreach($element_types as $type) {
			$theme_styles[$type] = array();
			$styles = array_diff(scandir($styles_root . DIRECTORY_SEPARATOR . $type), Upfront::$Excluded_Files);
			foreach ($styles as $style) {
				$style_content = file_get_contents($styles_root . DIRECTORY_SEPARATOR . $type . DIRECTORY_SEPARATOR . $style);
				$theme_styles[$type][str_replace('.css', '', $style)] = $style_content;
			}
		}
		return $theme_styles;
	}

	public function getGlobalRegions($global_regions = array())  {
		if (empty($global_regions) === false) return $global_regions;

		// A bit reasoning about this. In global regions layout templates i.e. header & footer
		// there can be more than one region since if there is element in header/footer region
		// that links to lightbox, that lightbox is also included in layout template thus
		// making layout template have more than one region. For this reason regions must be
		// parsed to get actual global regions. This function needs to return just actual
		// global regions if they exist i.e. header & footer.
		$global_layouts = array();
		$global_layouts_paths = glob(get_stylesheet_directory() . DIRECTORY_SEPARATOR . 'global-regions' . DIRECTORY_SEPARATOR . '*.php');
		foreach ($global_layouts_paths as $path) {
			$regions = new Upfront_Layout_Maker();
			require $path;
			$global_layouts[] = $regions->create_layout();
		}

		$global_regions = array();
		foreach($global_layouts as $layout) {
			foreach($layout as $region) {
				if ($region['scope'] == 'global' && $region['name'] != 'lightbox') $global_regions[] = $region;
			}
		}

		return $global_regions;
	}

	public function has_global_region($name) {
		$global_regions = $this->getGlobalRegions();
		if (empty($global_regions)) return false;

		$has_region = false;

		foreach ($global_regions as $region) {
			if ($region['name'] !== $name) continue;
			$has_region = true;
			break;
		}

		return $has_region;
	}


	public function getResponsiveSettings($settings) {
		if (empty($settings) === false) return $settings;

		$properties = $this->themeSettings->get('responsive_settings');
		if (!empty($properties)) {
			$properties = json_decode($properties, true);
		}
		return !empty($properties)
			? $properties
			: array()
		;
	}

	protected function parseElementStyles() {
		$elementTypes = array();
		$styles_root = get_stylesheet_directory() . DIRECTORY_SEPARATOR . 'element-styles';

		if (file_exists($styles_root) === false) return $elementTypes;

		// List subdirectories as element types
		$element_types = array_diff(scandir($styles_root), Upfront::$Excluded_Files);
		foreach($element_types as $type) {
			$elementTypes[$type] = array();
			$styles = array_diff(scandir($styles_root . DIRECTORY_SEPARATOR . $type), Upfront::$Excluded_Files);
			foreach ($styles as $style) {
				$elementTypes[$type][] = str_replace('.css', '', $style);
			}
		}

		return $elementTypes;
	}

	/**
	 * Try to populate element style only if styles are empty. This will
	 * provide that styles loaded from database don't get overwritten.
	 */
	public function getElementStylesList($styles) {
		if (empty($styles) === false) return $styles;
		return $this->parseElementStyles();
	}

	public function getLayoutProperties($properties) {
		if (empty($properties) === false) return $properties;

		if ($this->themeSettings->get('layout_properties')) {
			$properties = json_decode(stripslashes($this->themeSettings->get('layout_properties')), true);
		}
		if ($this->themeSettings->get('typography')) {
			$properties[] = array(
				'name' => 'typography',
				'value' => json_decode(stripslashes($this->themeSettings->get('typography')))
			);
		}
		if ($this->themeSettings->get('layout_style')) {
			$properties[] = array(
				'name' => 'layout_style',
				'value' => $this->themeSettings->get('layout_style'),
			);
		}
		if ($this->themeSettings->get('global_regions')) {
			$properties[] = array(
				'name' => 'global_regions',
				'value' => json_decode($this->themeSettings->get('global_regions'))
			);
		}

		return $properties;
	}

	public function getThemeFonts($theme_fonts, $args) {
		if (empty($theme_fonts) === false && $theme_fonts !== '[]') return $theme_fonts;

		$theme_fonts = $this->themeSettings->get('theme_fonts');
		if (isset($args['json']) && $args['json']) return $theme_fonts;

		return is_array( $theme_fonts ) ? $theme_fonts : json_decode($theme_fonts);
	}

	public function getIconFonts($icon_fonts, $args) {
		if (empty($icon_fonts) === false && $icon_fonts !== '[]') return $icon_fonts;

		$icon_fonts = $this->themeSettings->get('icon_fonts');
		// Always add icomoon which is always available from Upfront theme
		$icon_fonts_array = is_array( $icon_fonts ) ? $icon_fonts : json_decode($icon_fonts);
		$icon_fonts_array = is_array( $icon_fonts_array ) ? $icon_fonts_array : array(); // doublecheck we have something useful

		array_unshift($icon_fonts_array, array(
			'name' => 'UpFont',
			'family' => 'icomoon',
			'files' => array(
				'woff' => 'fonts/icomoon.woff',
				'svg' => 'fonts/icomoon.svg',
				'ttf' => 'fonts/icomoon.ttf',
				'eot' => 'fonts/icomoon.eot'
			),
			'active' => false,
			'type' => 'default'
		));
		if (isset($args['json']) && $args['json']) return json_encode($icon_fonts_array);

		return $icon_fonts_array();
	}

	public function getAdditionalFonts() {
		$additional_fonts = $this->themeSettings->get('additional_fonts');
		return empty($additional_fonts) ? '[]' : $additional_fonts;
	}

	public function getThemeColors($theme_colors, $args) {
		if (empty($theme_colors) === false) return $theme_colors;

		$theme_colors = $this->themeSettings->get('theme_colors');
		if (isset($args['json']) && $args['json']) return $theme_colors;

		return json_decode($theme_colors);
	}

	public function getButtonPresets($button_presets, $args) {
		if (empty($button_presets) === false) return $button_presets;

		$button_presets = $this->themeSettings->get('button_presets');
		if (isset($args['json']) && $args['json']) return $button_presets;

		return json_decode($button_presets);
	}

	public function getTabPresets($presets, $args) {
		if (empty($presets) === false) return $presets;

		$presets = $this->themeSettings->get('tab_presets');
		if (isset($args['json']) && $args['json']) return $presets;

		$as_array = false;
		if (isset($args['as_array']) && $args['as_array']) {
			$as_array = true;
		}

		return json_decode($presets, $as_array);
	}

	public function getAccordionPresets($presets, $args) {
		if (empty($presets) === false) return $presets;

		$presets = $this->themeSettings->get('accordion_presets');
		if (isset($args['json']) && $args['json']) return $presets;

		$as_array = false;
		if (isset($args['as_array']) && $args['as_array']) {
			$as_array = true;
		}

		return json_decode($presets, $as_array);
	}

	public function getPostImageVariants($image_variants, $args) {
	  if (empty($image_variants) === false) return $image_variants;

	  $image_variants = $this->themeSettings->get('post_image_variants');
	  if( empty( $image_variants )){
		$image_variants = <<< VRT
		[
		{"vid":"variant-1414082104315-1342","label":"Left","group":{"margin_left":"0","margin_right":"0","col":"12","row":"66","left":"0","float":"left","height":"300","width_cls":"c12","left_cls":"ml0","clear_cls":""},"image":{"order":"0","col":"24","top":"0","left":"0","row":"51","clear":"true","height":"255","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"},"caption":{"show":"1","order":"1","col":"12","top":"0","left":"0","row":"10","clear":"true","height":"50","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"}},
		{"vid":"variant-1414082128389-1073","label":"Right","group":{"margin_left":"0","margin_right":"0","col":"12","row":"65","left":"0","float":"right","height":"300","width_cls":"c12","left_cls":"ml0","clear_cls":""},"image":{"order":"0","col":"24","top":"0","left":"0","row":"51","clear":"true","height":"255","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"},"caption":{"show":"1","order":"1","col":"13","top":"0","left":"0","row":"10","clear":"true","height":"50","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"}},
		{"vid":"variant-1414082154417-1612","label":"Full Width","group":{"margin_left":"0","margin_right":"0","col":"24","row":"60","left":"0","float":"none","height":"300","width_cls":"c24","left_cls":"ml0","clear_cls":""},"image":{"order":"0","col":"24","top":"0","left":"0","row":"51","clear":"true","height":"255","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"},"caption":{"show":"1","order":"1","col":"24","top":"0","left":"0","row":"10","clear":"true","height":"50","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"}},
		{"vid":"variant-1414082173807-1526","label":"Center","group":{"margin_left":"0","margin_right":"0","col":"16","row":"63","left":"4","float":"none","height":"300","width_cls":"c16","left_cls":"ml0","clear_cls":""},"image":{"order":"0","col":"24","top":"0","left":"0","row":"51","clear":"true","height":"255","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"},"caption":{"show":"1","order":"1","col":"16","top":"0","left":"0","row":"10","clear":"true","height":"50","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"}},
		{"vid":"variant-1414082210132-1390","label":"Left caption right","group":{"margin_left":"0","margin_right":"0","col":"12","row":"47","left":"0","float":"left","height":"300","width_cls":"c12","left_cls":"ml0","clear_cls":""},"image":{"order":"0","col":"7","top":"0","left":"0","row":"47","clear":"true","height":"255","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"},"caption":{"show":"1","order":"1","col":"5","top":"10","left":"0","row":"10","clear":"false","height":"50","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"}},
		{"vid":"variant-1414082243148-1249","label":"Right caption left","group":{"margin_left":"0","margin_right":"0","col":"12","row":"62","left":"0","float":"right","height":"300","width_cls":"c12","left_cls":"ml0","clear_cls":""},"image":{"order":"1","col":"8","top":"0","left":"-8","row":"051","clear":"false","height":"255","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"},"caption":{"show":"1","order":"0","col":"4","top":"1","left":"0","row":"10","clear":"true","height":"50","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"}},
		{"vid":"variant-1414082289322-1599","label":"Full width caption above","group":{"margin_left":"0","margin_right":"0","col":"24","row":"60","left":"0","float":"none","height":"300","width_cls":"c24","left_cls":"ml0","clear_cls":""},"image":{"order":"1","col":"24","top":"0","left":"0","row":"51","clear":"true","height":"255","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"},"caption":{"show":"1","order":"0","col":"24","top":"0","left":"0","row":"10","clear":"true","height":"50","width_cls":"c24","left_cls":"ml0","clear_cls":"clr","top_cls":"mt0"}}]
VRT;
	  }

	  if (isset($args['json']) && $args['json']) return $image_variants;

	  return json_decode($image_variants);
	}

	/**
	 * Resolves the layout cascade to a layout name.
	 * @param array $cascade Upfront layout cascade to resolve
	 * @return string Layout name on successful resolution, empty string otherwise
	 */
	protected function _get_page_default_layout ($cascade) {
		$id = false;
		if (!(defined('DOING_AJAX') && DOING_AJAX)) {
			$id = get_post() // A bug in WP API - get_the_ID() is implemented *quite* poorly
				? get_the_ID()
				: false
			;
		} else if (!empty($cascade['specificity'])) {
			$id = intval(preg_replace('/^.*?(\d+)$/is', '\\1', $cascade['specificity']));
		}
		if($id){
			foreach ($this->get_required_pages() as $page) {
				if ($page->get_id() == $id) return $page->get_layout_name();
			}
		}
		return '';
		/*
		if (!$id) {
			return !empty($cascade['item']) && 'single-404_page' == $cascade['item']
				? 'single-404_page'
				: ''
			;
		}
		if (!empty($cascade['item']) && 'single-page' == $cascade['item']) {
			foreach ($this->get_required_pages() as $page) {
				if ($page->get_id() == $id) return $page->get_layout_name();
			}
		} else if (!empty($cascade['item']) && 'single-post' == $cascade['item']) {
			return 'single-post';
		}
		return '';
		*/
	}

	public function load_page_regions($data, $ids/*, $cascade*/){
		//if (!is_singular()) return $data;
		$layoutId = $this->_get_page_default_layout($ids);

		if (empty($layoutId) && !empty($ids['specificity'])) {
			$page_id = preg_replace('/.*-([0-9]+)$/', '$1', $ids['specificity']);
			$tpl = false;
			if (!empty($page_id) && is_numeric($page_id)) $tpl = get_post_meta((int)$page_id, '_wp_page_template', true);
			if (!empty($tpl)) {
				$theme = Upfront_ChildTheme::get_instance();
				$tpl = preg_replace('/page_tpl-(.*)\.php$/', '\1', $tpl);
				$required_pages = $theme->themeSettings->get('required_pages');

				if (!empty($required_pages)) $required_pages = json_decode($required_pages, true);
				$layoutId = !empty($required_pages[$tpl]['layout']) ? $required_pages[$tpl]['layout'] : $layoutId;
			}
		}

		if($layoutId){
			$theme = Upfront_Theme::get_instance();
			$ids['theme_defined'] = $layoutId;
			$data['regions'] = $theme->get_default_layout($ids, $layoutId);
			//$data['regions'] = $theme->get_default_layout(array(), $layoutId);
		}
		//return apply_filters('upfront_augment_theme_layout', $data); // So, this doesn't work anymore either. Yay.
		return $data;
	}

	protected function _import_images ($path) {
		$key = $this->get_prefix() . '-imported_images';
		$imported_attachments = get_option($key);
		if (!empty($imported_attachments)) return $imported_attachments;

		$imported_attachments = array();
		$images = glob(get_stylesheet_directory() . trailingslashit($path) . '*');
		$wp_upload_dir = wp_upload_dir();
		$pfx = !empty($wp_upload_dir['path']) ? trailingslashit($wp_upload_dir['path']) : '';
		if (!function_exists('wp_generate_attachment_metadata')) require_once(ABSPATH . 'wp-admin/includes/image.php');

		foreach ($images as $filepath) {
			$filename =  $this->get_prefix() . '-' . basename($filepath);
			while (file_exists("{$pfx}{$filename}")) {
	            $filename = rand() . $filename;
	        }
	        if (!copy($filepath, "{$pfx}{$filename}")) continue;

			$wp_filetype = wp_check_filetype(basename($filename), null);
	        $attachment = array(
	            'guid' => $wp_upload_dir['url'] . '/' . basename($filename),
	            'post_mime_type' => $wp_filetype['type'],
	            'post_title' => preg_replace('/\.[^.]+$/', '', basename($filename)),
	            'post_content' => '',
	            'post_status' => 'inherit'
	        );
	        $attach_id = wp_insert_attachment($attachment, "{$pfx}{$filename}");
	        $attach_data = wp_generate_attachment_metadata( $attach_id, "{$pfx}{$filename}" );
	        wp_update_attachment_metadata( $attach_id, $attach_data );

	        $imported_attachments[] = $attach_id;
	    }
	    if (!empty($imported_attachments)) {
	    	update_option($key, $imported_attachments);
	    }
	    return $imported_attachments;
	}

	protected function _insert_posts ($limit, $thumbnail_images=array()) {
		$key = $this->get_prefix() . '-posts_created';
		$posts_created = get_option($key, array());
		if (!empty($posts_created)) return $posts_created;

		if (!is_array($thumbnail_images)) $thumbnail_images = array();

		$POSTS_LIMIT = (int)$limit ? (int)$limit : 3;
		$theme_posts = array();
		$lorem_ipsum = array(
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus id risus felis. Proin elit nulla, elementum sit amet diam rutrum, mollis venenatis felis. Nullam dapibus lacus justo, eget ullamcorper justo cursus ac. Aliquam lorem nulla, blandit id erat id, eleifend fermentum lorem. Suspendisse vitae nulla in dolor ultricies commodo eu congue arcu. Pellentesque et tincidunt tellus. Fusce commodo feugiat dictum. In hac habitasse platea dictumst. Morbi dignissim pellentesque ipsum, sed sollicitudin nulla ultricies in. Praesent eu mi sed massa sollicitudin bibendum in nec orci.',
			'Morbi ornare consectetur mattis. Integer nibh mi, condimentum sit amet diam vitae, fermentum posuere elit. Ut vel ligula tellus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Nunc tincidunt rhoncus viverra. Nullam facilisis iaculis nulla. Nam tincidunt adipiscing augue congue molestie. Cras mollis enim ut sagittis congue. Ut sed quam consequat, pellentesque urna sit amet, aliquet elit. Nullam euismod, nisl in sagittis fringilla, metus turpis ornare magna, vel porta sapien tellus at turpis. Nullam quis nisl accumsan, aliquam quam at, pulvinar nunc. Etiam elementum massa id dolor viverra, ut ultrices mi sodales. Donec sollicitudin tempus aliquet. Integer porttitor arcu ac tellus vehicula placerat at quis felis.',
		);
		$lorem_ipsum_title = array(
			'Lorem ipsum',
			'Lorem ipsum dolor',
			'Lorem ipsum dolor sit amet',
		);
		shuffle($lorem_ipsum_title);

		// Do the posts count
		$args = array(
			'post_type' => 'post',
			'post_status' => 'publish',
			'posts_per_page' => $POSTS_LIMIT
		);
		if (!empty($thumbnail_images)) {
			$args['meta_key'] = '_thumbnail_id'; // Limit to ones with featured images only if we have have thumbs to add
		}
		$posts = get_posts();
		$create_posts = $POSTS_LIMIT - count($posts);
		if ($create_posts) {
			for ($i=0; $i < $create_posts; $i++) {
				$post_id = wp_insert_post(array(
					'post_title' => $lorem_ipsum_title[$i],
					'post_status' => 'publish',
					'post_type' => 'post',
					'post_content' => '<p>' . join('</p><p>', $lorem_ipsum) . '</p>',
					'post_excerpt' => join(' ', preg_split("/[\n\r\t ]+/", $lorem_ipsum[0], 36, PREG_SPLIT_NO_EMPTY )),
				));
				if (!empty($thumbnail_images[$i])) set_post_thumbnail($post_id, $thumbnail_images[$i]);
				$theme_posts[] = $post_id;
			}
			update_option($key, $theme_posts);
		}
		return get_option($key, array());
	}

/* --- Public interface --- */

	/**
	 * Gets cached theme version.
	 * @return string theme version
	 */
/*
	public function get_version () {
		return $this->_version;
	}
*/

	/**
	 * Fetches an array of pages required by the theme.
	 * @return array List of required pages.
	 */
	public function get_required_pages () {
		return !empty($this->_required_pages) && is_array($this->_required_pages)
			? $this->_required_pages
			: array()
		;
	}

	/**
	 * Fetch a single required page object.
	 * @param string $key A key under which to look for
	 * @return mixed Upfront_Themes_RequiredPage instance on success, false on failure.
	 */
	public function get_required_page ($key) {
		return !empty($this->_required_pages) && !empty($this->_required_pages[$key])
			? $this->_required_pages[$key]
			: false
		;
	}

	/**
	 * Fetch the ID from a single required page object.
	 * @param string $key A key under which to look for
	 * @return mixed Page ID on success, false on failure.
	 */
	public function get_required_page_id ($key) {
		$page = $this->get_required_page($key);
		return $page
			? $page->get_id()
			: false
		;
	}

	/**
	 * Adds a page and a layout to a list of theme-required pages.
	 * @param string $key The key under which the page will be stored
	 * @param string $layout_name The layout name for the required page
	 * @param array $page_data Page data that'll eventualy be passed to `wp_insert_post`
	 * @param array $wp_template_file Optional WP template to assign to the page
	 */
	public function add_required_page ($key, $layout_name, $page_data, $wp_template_file) {
		$this->_required_pages[$key] = new Upfront_Themes_RequiredPage($this->get_prefix(), $page_data, $layout_name, $wp_template_file);
		return $this->_required_pages[$key]->get_post_id();
	}

	/**
	 * Imports images from the relative path fragment into WP Media.
	 * It only actually happens once, otherwise gets cached IDs.
	 * @param string $path_fragment Relative path fragment that contains the images to be imported.
	 * @return mixed Array of images if successful, false on failure
	 */
	public function add_required_images ($path_fragment) {
		return $this->_import_images($path_fragment);
	}

	/**
	 * Creates the padding posts, with thumbnail images optionally.
	 * Only happens once, otherwise gets cached IDs.
	 * @param int $limit An upper bound of how many posts to create.
	 * @param array $thumbnails Optional array of thumbnail images to assign to posts. Accepts self::add_required_images(...) output
	 * @return array Array of created post IDs (could be empty)
	 */
	public function add_required_posts ($limit, $thumbnails=array()) {
		return $this->_insert_posts($limit, $thumbnails);
	}

	/**
	 * Called from the implementing theme,
	 * this method will actually import the background slider images.
	 */
	protected function _import_slider_image ($filepath) {
        $key = $this->get_prefix() . '-slider-images';
        $images = get_option($key, array());
        if (!empty($images[$filepath])) return $images[$filepath];

        // else import image
        $wp_upload_dir = wp_upload_dir();
        $pfx = !empty($wp_upload_dir['path']) ? trailingslashit($wp_upload_dir['path']) : '';
        if (!function_exists('wp_generate_attachment_metadata')) require_once(ABSPATH . 'wp-admin/includes/image.php');
        $filename = basename($filepath);
        while (file_exists("{$pfx}{$filename}")) {
            $filename = rand() . $filename;
        }
        $full_img_path = get_stylesheet_directory() . DIRECTORY_SEPARATOR . ltrim($filepath, '/');
        @copy($full_img_path, "{$pfx}{$filename}");
        $wp_filetype = wp_check_filetype(basename($filename), null);
        $attachment = array(
            'guid' => $wp_upload_dir['url'] . '/' . basename($filename),
            'post_mime_type' => $wp_filetype['type'],
            'post_title' => preg_replace('/\.[^.]+$/', '', basename($filename)),
            'post_content' => '',
            'post_status' => 'inherit'
        );
        $attach_id = wp_insert_attachment($attachment, "{$pfx}{$filename}");
        $attach_data = wp_generate_attachment_metadata( $attach_id, "{$pfx}{$filename}" );
        wp_update_attachment_metadata( $attach_id, $attach_data );

        $images[$filepath] = $attach_id;
        update_option($key, $images);

        return $attach_id;
    }
}
