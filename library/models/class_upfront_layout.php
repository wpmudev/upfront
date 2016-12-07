<?php

class Upfront_Layout extends Upfront_JsonModel {

	public static $version = '1.0.0';

	protected static $cascade;
	protected static $layout_slug;
	protected static $scope_data = array();

	protected static $_layout_default_version = false;

	public static function from_entity_ids ($cascade, $storage_key = '', $dev_first = false) {
		$layout = array();
		if (!is_array($cascade)) return $layout;
		self::$cascade = $cascade;
		if ( current_user_can('switch_themes') && (Upfront_Behavior::debug()->is_dev() || $dev_first) ){
			// try loading for dev stored layout first
			$dev_storage_key = $storage_key ? $storage_key : self::get_storage_key();
			if ( !preg_match("/_dev$/", $dev_storage_key) ){
				$dev_storage_key .= '_dev';
				$layout = self::from_entity_ids($cascade, $dev_storage_key);
				if (is_object($layout) && !$layout->is_empty()) return $layout;
			}
		}
		if ( ! empty( $storage_key ) ) {
			self::set_storage_key($storage_key);
		}
		$storage_key = self::get_storage_key();
		$order = array('specificity', 'item', 'type');

		foreach ($order as $o) {
			if (empty($cascade[$o]))
				continue;

			$layout = $id = false;

			// Allow plugins to prevent loading from database
			$load_from_database = apply_filters('upfront_load_layout_from_database', true);
			if ($load_from_database) {
				$id = $storage_key . '-' . $cascade[$o];
				$layout = self::from_id($id, $storage_key);
			}

			// Always try to load from theme files if layout is empty
			if ($layout === false || $layout->is_empty()) {
				$layout = self::from_specific_files(array(), $cascade, $storage_key); // Load from *specific* files only, no fallback
				if ($layout && !$layout->is_empty()) $layout->set("template_type", "file");
			}

			if ($layout && !$layout->is_empty()) {

				$layout->set("current_layout", self::id_to_type($id));

				return apply_filters('upfront_layout_from_id', $layout, self::id_to_type($id), self::$cascade);
			}
		}
		
		$id= false;
		// If we're out of the loop and still empty, we really have to be doing something now...
		if (!$layout || ($layout && $layout->is_empty())) {
			$layout = self::from_files(array(), $cascade, $storage_key);
			if (!$layout->is_empty()) {
				$layout->set("current_layout", self::id_to_type($id));
				$layout->set("template_type", "file");
				return apply_filters('upfront_layout_from_id', $layout, self::id_to_type($id), self::$cascade);
			}
		}

		return $layout;
	}

	public static function from_cpt ($data, $storage_key = '') {
		// We need to apply global regions that saved in db
		$regions = array();
		$regions_added = array();
		if ( isset($data['regions']) ) {
			foreach ( $data['regions'] as $region ) {
				if ( isset( $region['scope'] ) && $region['scope'] != 'local' ){
					$applied_scope = self::_apply_scoped_region($region);
					if ( empty($applied_scope) ) {
						// if empty because was deleted from Reset Layout (Upfront General - admin dashboard)
						$regions[] = $region;
					} else {
						foreach ( $applied_scope as $applied_data ) {
							if ( !in_array($applied_data['name'], $regions_added) ){
								$regions[] = $applied_data;
								$regions_added[] = $applied_data['name'];
							}
						}
					}
					continue;
				}
				$regions[] = $region;
			}
		}
		// Make sure we replace properties with global ones
		$data["properties"] = self::get_layout_properties();
		$data['regions'] = $regions;

		return self::from_php($data, $storage_key);
	}

	public static function from_php ($data, $storage_key = '') {
		if ( isset($data['layout']) ) self::$cascade = $data['layout'];
		self::set_storage_key($storage_key);
		$layout = new self($data);
		if ( !$layout->is_empty() ){
			$layout->convert_layout();
		}
		return $layout;
	}

	public static function from_json ($json, $storage_key = '') {
		self::set_storage_key($storage_key);
		return self::from_php(json_decode($json, true));
	}

	public static function from_id ($id, $storage_key = '') {
		$regions_data = self::get_regions_data();
		$data = json_decode( get_option($id, json_encode(array())), true );

		if ( ! empty($data) ) {
			// Make sure default theme version is cleared if we load from db
			self::$_layout_default_version = false;

			$regions = array();
			$regions_added = array();
			foreach ( $data['regions'] as $i => $region ) {
				if ( isset($region['scope']) && $region['scope'] != 'local' ){
					foreach ( $regions_data as $region_data ){
						if ( $region['name'] != $region_data['name'] && $region['container'] != $region_data['name'] && $region['name'] != $region_data['container'] )
							continue;
						if ( isset($region['scope']) && $region['scope'] == $region_data['scope'] && !in_array($region_data['name'], $regions_added) ){
							// check if global region was not reset via Upfront General (admin dashboard)
							$applied_scope_check = self::_apply_scoped_region($region);
							if ( !empty($applied_scope_check) ) {
								$regions[] = $region_data;
								$regions_added[] = $region_data['name'];
							}							
						}
					}
					if ( !in_array($region['name'], $regions_added) ){
						$applied_scope = self::_apply_scoped_region($region);
						if ( empty($applied_scope) ) {
							// if empty because was deleted from Reset Layout (Upfront General - admin dashboard)
							$regions[] = $region;
						} else {
							foreach ( $applied_scope as $applied_data ) {
								if ( !in_array($applied_data['name'], $regions_added) ){
									$regions[] = $applied_data;
									$regions_added[] = $applied_data['name'];
								}
							}
						}
					}
					continue;
				}
				$regions[] = $region;
			}
			$data['regions'] = $regions;
			$data['properties'] = self::get_layout_properties($data);
			$data['layout'] = self::$cascade;
		}
		return self::from_php($data, $storage_key);
	}

	/**
	 * Load up a theme layout from files, and also go with a fallback.
	 */
	public static function from_files ($data, $cascade, $storage_key=false) {
		$new_data = apply_filters('upfront_override_layout_data', $data, $cascade);
		if ((empty($new_data) && empty($data)) || json_encode($new_data) == json_encode($data)) {
			$data['regions'] = self::get_regions_data();
		} else {
			$data = $new_data;
			// We need to apply global regions that saved in db
			$regions = array();
			$regions_added = array();
			foreach ( $data['regions'] as $region ) {
				if ( $region['scope'] != 'local' ){
					$applied_scope = self::_apply_scoped_region($region);
					foreach ( $applied_scope as $applied_data ) {
						if ( !in_array($applied_data['name'], $regions_added) ){
							$regions[] = $applied_data;
							$regions_added[] = $applied_data['name'];
						}
					}
					continue;
				}
				$regions[] = $region;
			}
			$data['regions'] = $regions;
		}
		$data['properties'] = self::get_layout_properties($data);
		$data['layout'] = self::$cascade;

		// Do not do this is in builder mode since it will duplicate slider images. Alternative
		// is to fix augment_regions to not re-import images every time page reloads.
		if (!function_exists('upfront_exporter_is_running') || !upfront_exporter_is_running()) {
		  $data = apply_filters('upfront_augment_theme_layout', $data);
		}

		// Loading from files should be the only place where we deal with data from exporter files,
		// which means this is where we expand exporter macros.
		if (!empty($data)) {
			$codec = new Upfront_MacroCodec_LayoutData();
			$data = $codec->expand_all($data);
		}

		return self::from_php($data, $storage_key);
	}

	/**
	 * Loads up *specific* theme layout, does NOT include a fallback like `from_files()`
	 * in order to respect the cascade.
	 */
	public static function from_specific_files ($data, $cascade, $storage_key=false) {
		$new_data = apply_filters('upfront_override_layout_data', $data, $cascade);
		if (empty($new_data)) return false;

		$data = $new_data;
		// We need to apply global regions that saved in db
		$regions = array();
		$regions_added = array();
		foreach ( $data['regions'] as $region ) {
			if ( $region['scope'] != 'local' ){
				$applied_scope = self::_apply_scoped_region($region);
				if ( empty($applied_scope) ) {
					// if empty because was deleted from Reset Layout (Upfront General - admin dashboard)
					$regions[] = $region;
				} else {
					foreach ( $applied_scope as $applied_data ) {
						if ( !in_array($applied_data['name'], $regions_added) ){
							$regions[] = $applied_data;
							$regions_added[] = $applied_data['name'];
						}
					}
				}
				continue;
			}
			$regions[] = $region;
		}
		$data['regions'] = $regions;
		$data['properties'] = self::get_layout_properties($data);
		$data['layout'] = self::$cascade;

		// Do not do this is in builder mode since it will duplicate slider images. Alternative
		// is to fix augment_regions to not re-import images every time page reloads.
		if (!function_exists('upfront_exporter_is_running') || !upfront_exporter_is_running()) {
		  $data = apply_filters('upfront_augment_theme_layout', $data);
		}

		// Loading from files should be the only place where we deal with data from exporter files,
		// which means this is where we expand exporter macros.
		if (!empty($data)) {
			$codec = new Upfront_MacroCodec_LayoutData();
			$data = $codec->expand_all($data);
		}

		return self::from_php($data, $storage_key);
	}

	public static function get_regions_data ($add_global_regions = false) {
		$regions_data = self::_get_regions($add_global_regions);
		$regions_added = array();
		$regions = array();
		foreach ( $regions_data as $i => $region ) {
			if ( $region['scope'] != 'local' ){
				$applied_scope = self::_apply_scoped_region($region);
				if ( empty($applied_scope) ) {
					// if empty because was deleted from Reset Layout (Upfront General - admin dashboard)
					$regions[] = $region;
				} else {
					foreach ( $applied_scope as $applied_data ) {
						if ( !in_array($applied_data['name'], $regions_added) ){
							$regions[] = $applied_data;
							$regions_added[] = $applied_data['name'];
						}
					}
				}
				continue;
			}
			$regions[] = $region;
		}
		return $regions;
	}

	public static function get_layout_properties ($data = array()) {
		$properties = json_decode( get_option(self::_get_layout_properties_id(), json_encode(array())), true );
		$properties = apply_filters('upfront_get_layout_properties', $properties);

		// Simulate layout data to use get/set_property_value function
		$new_data = array(
			'properties' => $properties
		);

		// Make sure version is from layout, instead of global
		if ( false !== self::$_layout_default_version ) {
			upfront_set_property_value('version', self::$_layout_default_version, $new_data);
		}
		else if ( !empty($data) ) {
			$version = upfront_get_property_value('version', $data);
			if ( false === $version ) { // No version, remove version from properties
				upfront_set_property_value('version', '', $new_data);
			}
			else {
				upfront_set_property_value('version', $version, $new_data);
			}
		}

		return $new_data['properties'];
	}

	protected static function _apply_scoped_region ($region) {
		if ($region['name'] === 'lightbox') return array($region);
		$regions = array();
		if ( $region['scope'] != 'local' ){
			if ( empty(self::$scope_data[$region['scope']]) ) {
				$region_scope_data = json_decode( get_option(self::_get_scope_id($region['scope']), json_encode(array())), true );
				self::$scope_data[$region['scope']] = apply_filters('upfront_get_global_regions', $region_scope_data, self::_get_scope_id($region['scope']));
			}
			if ( empty(self::$scope_data[$region['scope']]) ){
				$regions[] = $region;
				return $regions;
			}
			foreach ( self::$scope_data[$region['scope']] as $scope => $data ) {
				if ( ( $data['name'] == $region['name'] || $data['container'] == $region['name'] ) ){
					// if marked as trashed, don't include
					if ( isset($data['trashed']) && $data['trashed'] == 1 )
						continue;
					// don't apply over container and sub, to allow free positioning of global regions
					$data['container'] = $region['container'];
					if ( isset($region['sub']) )
						$data['sub'] = $region['sub'];
					$regions[] = $data;
				}
			}
		}
		return $regions;

	}

	public static function create_layout ($layout_ids = array(), $layout_slug = '') {
		self::$layout_slug = $layout_slug;
		self::$cascade = $layout_ids;
		$data = array(
			"name" => "Default Layout",
			"layout_slug" => self::$layout_slug
		);
		$data["regions"] = self::get_regions_data();
		$data["properties"] = self::get_layout_properties();

		if (!empty($data)) {
			$codec = new Upfront_MacroCodec_LayoutData();
			$data = $codec->expand_all($data);
		}

		return self::from_php(apply_filters('upfront_create_default_layout', $data, $layout_ids, self::$cascade));
	}

	/**
	 * Returns a list of default, generic layouts - the predefined ones.
	 *
	 * @return array List of predefined layouts.
	 */
	public static function get_default_layouts () {
		$layouts = array(
			'maintenance-mode' => array(
				'layout' => self::get_maintenance_mode_layout_cascade()
			),
			'archive-home' => array(
				'layout' => array(
					'item' => 'archive-home',
					'type' => 'archive'
				)
			),
			'archive' => array(
				'layout' => array(
					'type' => 'archive'
				)
			),
			'archive-search' => array(
				'layout' => array(
					'item' => 'archive-search',
					'type' => 'archive'
				)
			),
			'404' => array(
				'layout' => array(
					'specificity' => 'single-404_page',
					'item' => 'single-page',
					'type' => 'single',
				)
			),
			'single' => array(
				'layout' => array(
					'type' => 'single'
				)
			),
		);

		return apply_filters('upfront-core-default_layouts', $layouts);
	}
	
	/**
	 * Returns the default mainteanance page layout cascade
	 *
	 * @return (array) maintenance page layout cascade
	 */
	public static function get_maintenance_mode_layout_cascade () {
		return array(
			'specificity' => 'single-maintenance-mode_page',
			'item' => 'single-page',
			'type' => 'single',
		);
	}

	/**
	 * Returns a list of database-stored layouts
	 * for a particular storage key.
	 *
	 * @param string $storage_key Optional storage key
	 *
	 * @return array List of db-stored hash, in full_key => simple_key pairs format
	 */
	public static function get_db_layouts ($storage_key = '') {
		global $wpdb;
		self::set_storage_key($storage_key);
		$storage_key = self::get_storage_key();
		$sql_storage_key = $wpdb->esc_like($storage_key);

		$results = array();
		$list = $wpdb->get_col("SELECT option_name FROM $wpdb->options WHERE ( `option_name` LIKE '{$storage_key}-single%' OR `option_name` LIKE '{$storage_key}-archive%' )");
		if (empty($list)) return $results;

		foreach ($list as $item) {
			$results[$item] = preg_replace('/^' . preg_quote($storage_key, '/') . '-?/', '', $item);
		}
		return $results;
	}

	public static function list_scoped_regions ($scope, $storage_key = '') {
		self::set_storage_key($storage_key);
		$storage_key = self::get_storage_key();
		$region_scope_data = json_decode( get_option(self::_get_scope_id($scope), json_encode(array())), true );
		$region_scope_data = apply_filters('upfront_get_global_regions', $region_scope_data, $scope);
		$return = array();
		foreach ( $region_scope_data as $region){
			if ( isset($region['trashed']) && $region['trashed'] == 1 )
				continue;
			// Let's unset unused data to tidy up returned response
			unset($region['modules']);
			unset($region['wrappers']);
			$return[] = $region;
		}
		return $return;
	}

	public static function get_scoped_regions ($name, $scope, $storage_key = '') {
		self::set_storage_key($storage_key);
		$storage_key = self::get_storage_key();
		$region_scope_data = json_decode( get_option(self::_get_scope_id($scope), json_encode(array())), true );
		$region_scope_data = apply_filters('upfront_get_global_regions', $region_scope_data, $scope);
		$total = count($region_scope_data);

		$regions = array();
		foreach ( $region_scope_data as $r => $region){
			if ( isset($region['trashed']) && $region['trashed'] == 1 ) continue;
			if ( $region['name'] != $name ) continue;
			// Check if this is main region and we should also return sub region
			if ( $region['container'] == $name ) {
				// Sub region should be rendered consecutively
				$top = false;
				$left = false;
				$right = false;
				$bottom = false;
				if ( $r > 0 ) {
					for ( $i = $r-1; $i >= 0; $i-- ) {
						$reg = $region_scope_data[$i];
						if ( $reg['container'] != $name ) break;
						if ( $reg['sub'] == 'left' && !$left ) {
							$regions[] = $reg;
							$left = true;
						}
						if ( $reg['sub'] == 'top' && !$top ) {
							$regions[] = $reg;
							$top = true;
						}
					}
				}
				$regions[] = $region;
				if ( $r < $total-1 ) {
					for ( $i = $r+1; $i < $total-1; $i++ ) {
						$reg = $region_scope_data[$i];
						if ( $reg['container'] != $name ) break;
						if ( $reg['sub'] == 'right' && !$right ) {
							$regions[] = $reg;
							$right = true;
						}
						if ( $reg['sub'] == 'bottom' && !$bottom ) {
							$regions[] = $reg;
							$bottom = true;
						}
						if ( $reg['sub'] == 'fixed' ) {
							$regions[] = $reg;
						}
					}
				}
			}
			else { // Otherwise, just return this region
				$regions[] = $region;
			}
			break;
		}

		// Simulate layout so we can use it for conversion
		$data = array(
			'regions' => $regions,
			'layout' => array(
				'type' => 'global_regions',
				'item' => 'global_regions-' . $name
			)
		);

		// Expand macro
		if (!empty($data)) {
			$codec = new Upfront_MacroCodec_LayoutData();
			$data = $codec->expand_all($data);
		}

		$instance = self::from_php($data, $storage_key);

		return $instance->get('regions');
	}

	public static function delete_scoped_regions ($name, $scope, $storage_key = '') {
		self::set_storage_key($storage_key);
		$storage_key = self::get_storage_key();
		$region_scope_data = json_decode( get_option(self::_get_scope_id($scope), json_encode(array())), true );
		$return = array();
		foreach ( $region_scope_data as $i => $region){
			if ( $region['name'] != $name && $region['container'] != $name )
				continue;
			$return[] = $region['name'];
			$region_scope_data[$i] = array(
				'name' => $region['name'],
				'container' => $region['container'],
				'scope' => $scope,
				'trashed' => 1
			);
		}
		update_option(self::_get_scope_id($scope), json_encode($region_scope_data));
		return $return;
	}

	protected static function _get_regions ($add_global_regions = false) {
		$regions = array();
		do_action('upfront_get_regions', self::$cascade);
		$layout = upfront_get_default_layout(self::$cascade, self::$layout_slug, $add_global_regions);
		self::$_layout_default_version = $layout['version'];
		return apply_filters('upfront_regions', $layout['regions'], self::$cascade);
	}

	protected static function _get_scope_id ($scope) {
		$storage_key = self::get_storage_key();
		return $storage_key . '-regions-' . $scope;
	}

	protected static function _get_layout_properties_id () {
		$storage_key = self::get_storage_key();
		return $storage_key . '-' . get_stylesheet() . '-layout-properties';
	}

	public static function get_parsed_cascade () { return self::$cascade; }

	public function get_cascade () {
		if (!empty(self::$cascade)) return self::$cascade;
		return !($this->is_empty())
			? $this->get('layout')
			: false
		;
	}

	public function initialize () {
		parent::initialize();
		do_action('upfront_layout_init', $this);
	}

	public function get_region_data ($region_name) {
		$found = array();
		foreach ( $this->_data['regions'] as $region ){
			if ( $region['name'] == $region_name )
				$found = $region;
		}
		return $found;
	}

	public function region_to_json ($region_name) {
		return json_encode($this->get_region_data($region_name));
	}

	public function save () {
		$key = $this->get_id();
		$this->save_global_region();
		if ( $this->_data['properties'] ) {
			update_option(self::_get_layout_properties_id(), json_encode($this->_data['properties']));
		}

		// Delete custom post layout for current post when Save for all posts clicked
		if(!empty($this->_data['layout']) && $this->_data['preferred_layout'] == "single-post") {
			if(!empty($this->_data['layout']['specificity'])) {
				$stylesheet = get_stylesheet();
				$specific_layout = $stylesheet . "-". $this->_data['layout']['specificity'];

				// Delete option
				delete_option( $specific_layout );
			}
		}

		update_option($key, $this->to_json());

		return $key;
	}

	public function save_global_region () {
		$scopes = array();
		foreach ( $this->_data['regions'] as $region ){
			$region['scope'] = !empty($region['scope']) ? $region['scope'] : '';
			if ( $region['scope'] != 'local' ){
				if (empty($scopes[$region['scope']]) || !is_array($scopes[$region['scope']]) )
					$scopes[$region['scope']] = array();
				$scopes[$region['scope']][] = $region;
			}
		}

		foreach ( $scopes as $scope => $data ) {
			$current_scope = json_decode( get_option(self::_get_scope_id($scope), json_encode(array())), true );
			$current_scope = apply_filters('upfront_get_global_regions', $current_scope, self::_get_scope_id($region['scope']));
			$scope_data = $data;
			if ( $current_scope ){ // merge with current scope if it's exist
				foreach ( $current_scope as $current_region ){
					$found = false;
					foreach ( $data as $i => $region ){
						if ( $region['name'] == $current_region['name'] || $region['name'] == $current_region['container'] ){
							$found = true;
							// restore the container and sub, so it's possible to position global regions freely on each layout
							if ( $region['name'] == $current_region['name'] ) {
								$scope_data[$i]['container'] = $current_region['container'];
								if ( isset($current_region['sub']) )
									$scope_data[$i]['sub'] = $current_region['sub'];
							}
							break;
						}
					}
					if ( ! $found )
						$scope_data[] = $current_region;
				}
			}
			update_option(self::_get_scope_id($scope), json_encode($scope_data));
		}
	}

	public function delete ($all = false) {
		if ( $all ){
			$scopes = array();
			if (!empty($this->_data['regions'])) foreach ( $this->_data['regions'] as $region ){
				if ( $region['scope'] != 'local' && !in_array($region['scope'], $scopes) ){
					$scopes[] = $region['scope'];
				}
			}
			foreach ( $scopes as $scope )
				delete_option(self::_get_scope_id($scope));
			delete_option(self::_get_layout_properties_id());
		}
		return delete_option($this->get_id());
	}

	public function get_element_data($id) {
		return self::get_element($id, $this->_data, 'layout');
	}

	/**
	 * Update an element that is already in the layout
	 */
	public function set_element_data($data, $path = false){
		$element_id = self::get_element_id($data);
		if(!$element_id)
			return false;

		if($path){
			$element = $this->get_element_by_path($path);
			if($element){
				if(self::get_element_id($element) == $element_id)
					return $this->set_element_by_path($path, $data);
				// else wrong path, we need the correct one
			}
		}

		$current = $this->get_element($element_id, $this->_data, 'layout');
		if(!$current)
			return false; // The element is not in the layout

		return $this->set_element_by_path($current['path'], $data);
	}

	/**
	 * The path is an array with the position of the element inside the data array (region, module, object)
	 */
	private function get_element_by_path($path){
		$path_size = sizeof($path);
		if($path_size != 2 && $path_size != 3)
			return false;
		$next = array('regions', 'modules', 'objects');
		$i = 0;
		$current = $this->_data;
		while($found && $i < $path_size){
			if(!isset($current[$next[$i]]) || !isset($current[$next[$i]][$path[$i]]))
				return false;
			$current = $current[$next[$i]][$path[$i]];
		}
		return $current;
	}

	private function set_element_by_path($path, $data){
		if(sizeof($path) == 3)
			$this->_data['regions'][$path[0]]['modules'][$path[1]]['objects'][$path[2]] = $data;
		else if(sizeof($path) == 2)
			$this->_data['regions'][$path[0]]['modules'][$path[1]] = $data;
		else
			return false;
		return $path;
	}

	private static function get_element($id, $data, $curr){
		$property_found = false;
		$i = 0;
		$value = self::get_element_id($data);

		if($value == $id)
			return array('data' => $data, 'path' => array());

		$next = false;
		if($curr == 'layout')
			$next = 'regions';
		else if($curr == 'regions')
			$next = 'modules';
		else if($curr = 'modules')
			$next = 'objects';

		if(!$next)
			return false;

		$i = 0;
		$found = false;
		if (!empty($data[$next])) while(!$found && $i < sizeof($data[$next])){
			$found = self::get_element($id, $data[$next][$i], $next);
			if($found)
				array_unshift($found['path'], $i);

			$i++;
		}
		return $found;
	}

	private static function get_element_id($element){
		$property_found = false;
		$value = false;
		$i = 0;
		while(!$property_found && $i < sizeof($element['properties'])){
			if($element['properties'][$i]['name'] == 'element_id'){
				return $element['properties'][$i]['value'];
			}
			$i++;
		}
		return $value;
	}

	/**
	 * Backward compatibility conversion
	 */
	protected function convert_layout () {
		$layout_version = $this->get_property_value('version');
		if (!$layout_version) $layout_version = '0.0.0';
		// @TODO quick query var to check original version, remove these code after stable
		if (isset($_GET['original']) && $_GET['original'] == 0) {
			setcookie('original', '', time()-3600, COOKIEPATH, COOKIE_DOMAIN);
		}
		else if ((isset($_GET['original']) && $_GET['original'] == 1) || (isset($_COOKIE['original']) && $_COOKIE['original'] == 1)) {
			setcookie('original', 1, time()+3600, COOKIEPATH, COOKIE_DOMAIN);
			return;
		}
		if (version_compare($layout_version, self::$version) === -1) {
			$transient_key = $this->get_id() . '_ver' . self::$version;
			$cache = get_transient($transient_key);
			if ( !empty($cache) ) {
				$this->_data = json_decode($cache, true);
			}
			else {
				$converter = new Upfront_Compat_LayoutConverter($this, $layout_version, self::$version);
				$converter->convert();
				set_transient($transient_key, $this->to_json(), 120); // set to 120 second for now
			}
		}

	}

}
