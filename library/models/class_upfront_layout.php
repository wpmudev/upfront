<?php

class Upfront_Layout extends Upfront_JsonModel {

	protected static $cascade;
	protected static $layout_slug;
	protected static $scope_data = array();

	public static function from_entity_ids ($cascade, $storage_key = '', $dev_first = false) {
		$layout = array();
		if (!is_array($cascade)) return $layout;
		self::$cascade = $cascade;
		if ( current_user_can('switch_themes') && (!empty($_GET['dev']) || $dev_first) ){
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
				return apply_filters('upfront_layout_from_id', $layout, self::id_to_type($id), self::$cascade);
			}
		}

		return $layout;
	}

	public static function from_php ($data, $storage_key = '') {
		if ( isset($data['layout']) )
			self::$cascade = $data['layout'];
		self::set_storage_key($storage_key);
		return new self($data);
	}

	public static function from_json ($json, $storage_key = '') {
		self::set_storage_key($storage_key);
		return self::from_php(json_decode($json, true));
	}

	public static function from_id ($id, $storage_key = '') {
		$regions_data = self::get_regions_data();
		$data = json_decode( get_option($id, json_encode(array())), true );

		if ( ! empty($data) ) {
			$regions = array();
			$regions_added = array();
			foreach ( $data['regions'] as $i => $region ) {
				if ( isset($region['scope']) && $region['scope'] != 'local' ){
					foreach ( $regions_data as $region_data ){
						if ( $region['name'] != $region_data['name'] && $region['container'] != $region_data['name'] && $region['name'] != $region_data['container'] )
							continue;
						if ( isset($region['scope']) && $region['scope'] == $region_data['scope'] && !in_array($region_data['name'], $regions_added) ){
							$regions[] = $region_data;
							$regions_added[] = $region_data['name'];
						}
					}
					if ( !in_array($region['name'], $regions_added) ){
						$applied_scope = self::_apply_scoped_region($region);
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
			$data['properties'] = self::get_layout_properties();
			$data['layout'] = self::$cascade;
		}
		return self::from_php($data, $storage_key);
	}

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
		$data['properties'] = self::get_layout_properties();
		$data['layout'] = self::$cascade;

		// Do not do this is in builder mode since it will duplicate slider images. Alternative
		// is to fix augment_regions to not re-import images every time page reloads.
		if (!function_exists('upfront_exporter_is_running') || !upfront_exporter_is_running()) {
		  $data = apply_filters('upfront_augment_theme_layout', $data);
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
		$data['properties'] = self::get_layout_properties();
		$data['layout'] = self::$cascade;

		// Do not do this is in builder mode since it will duplicate slider images. Alternative
		// is to fix augment_regions to not re-import images every time page reloads.
		if (!function_exists('upfront_exporter_is_running') || !upfront_exporter_is_running()) {
		  $data = apply_filters('upfront_augment_theme_layout', $data);
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
		return $regions;
	}

	public static function get_layout_properties () {
		$properties = json_decode( get_option(self::_get_layout_properties_id(), json_encode(array())), true );
		$properties = apply_filters('upfront_get_layout_properties', $properties);

		return $properties;
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
			"properties" => self::get_layout_properties(),
			"regions" => self::get_regions_data(true),
			"layout_slug" => self::$layout_slug
		);
		return self::from_php(apply_filters('upfront_create_default_layout', $data, $layout_ids, self::$cascade));
	}

	public static function list_theme_layouts() {
		$theme_slug = $_POST['stylesheet'];
		$theme_directory = trailingslashit(get_theme_root($theme_slug)) . $theme_slug;
		$templates_directory = trailingslashit($theme_directory) . 'layouts/';
		// Exclude header and footer
		$layout_files = array_diff(scandir($templates_directory), array('header.php', 'footer.php'));

		$layouts = array();
		// Classify theme layout files into layouts
		foreach($layout_files as $layout) {
			// We only want to use php files (excludes: ., .., .DS_STORE, etc)
			if (strpos($layout, '.php') === false) continue;

			$layout_id = str_replace('.php', '', $layout);
			$properties = array(
				'label' => $layout_id // provide default label
			);
			$properties['layout'] = array(
				'item' => $layout_id
			);

			switch ($layout_id) {
			case 'archive':
				$properties['label'] = 'Archive';
				$properties['layout']['type'] = 'archive';
				break;
			case 'home':
			case 'archive-home':
				$properties['label'] = 'Home';
				$properties['layout']['type'] = 'archive';
				break;
			case 'index':
				$properties['label'] = 'Index page';
				$properties['layout']['type'] = 'single';
				break;
			case 'single-page':
				$properties['label'] = 'Single page';
				$properties['layout']['type'] = 'single';
				break;
			case 'single-post':
				$properties['label'] = 'Single post';
				$properties['layout']['type'] = 'single';
				break;
			case 'single':
				$properties['label'] = 'Single';
				$properties['layout']['type'] = 'single';
				break;
			}

			if ($layout_id !== 'single' && strpos($layout_id, 'single') !== false ) {
				$layout = str_replace('single-', '', $layout_id);
				$properties['label'] = 'Single ' . $layout;
				$properties['layout']['type'] = 'single';
			}

			if ($layout_id !== 'archive' && strpos($layout_id, 'archive') !== false ) {
				$layout = str_replace('archive-', '', $layout_id);
				$properties['label'] = 'Archive ' . $layout;
				$properties['layout']['type'] = 'archive';
			}

			$layouts[$layout_id] = $properties;
		}

		return $layouts;
	}

	public static function list_available_layout () {
		$saved = self::list_saved_layout();
		$saved_keys = array_keys($saved);
		$list = array(
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
		);
		// add singular post type
		foreach ( get_post_types(array('public' => true, 'show_ui' => true), 'objects') as $post_type ){
			$query = new WP_Query(array(
				'post_type' => $post_type->name,
				'post_status' => 'publish'
			));
			$query->parse_query();
			$post = $query->post_count > 0 ?  $query->next_post() : false;

			if ( $post_type->name == 'post' )
				$list['single'] = array(
					'layout' => array(
						'type' => 'single'
					),
					'latest_post' => is_object( $post ) ?  $post->ID : null
				);
			else
				$list['single-' . $post_type->name] = array(
					'layout' => array(
						'item' => 'single-' . $post_type->name,
						'type' => 'single'
					),
					'latest_post' => is_object( $post ) ?  $post->ID : ""
				);
		}
		// add taxonomy archive
		foreach ( get_taxonomies(array('public' => true, 'show_ui' => true), 'objects') as $taxonomy ){
			$list['archive-' . $taxonomy->name] = array(
				'layout' => array(
					'item' => 'archive-' . $taxonomy->name,
					'type' => 'archive'
				)
			);
		}
		foreach ( $list as $i => $li ){
			$list[$i]['label'] = Upfront_EntityResolver::layout_to_name($li['layout']);
			$list[$i]['saved'] = in_array($i, $saved_keys);
		}
		return $list;
	}

	public static function list_saved_layout ($storage_key = '') {
		global $wpdb;
		self::set_storage_key($storage_key);
		$storage_key = self::get_storage_key();
		$layouts = $wpdb->get_results("SELECT * FROM $wpdb->options WHERE ( `option_name` LIKE '{$storage_key}-single%' OR `option_name` LIKE '{$storage_key}-archive%' )");
		$return = array();
		foreach ( $layouts as $layout ){
			if ( preg_match("/^{$storage_key}-([^-]+)(-([^-]+)|)(-([^-]+)|)$/", $layout->option_name, $match) ){
				$ids = array();
				if ( !empty($match[3]) && !empty($match[5]) )
					$ids['specificity'] = $match[1] . '-' . $match[3] . '-' . $match[5];
				if ( $match[3] )
					$ids['item'] = $match[1] . '-' . $match[3];
				$ids['type'] = $match[1];
				$layout_id = ( !empty($ids['specificity']) ? $ids['specificity'] : ( $ids['item'] ? $ids['item'] : $ids['type'] ) );
				$return[$layout_id] = array(
					'layout' => $ids,
					'label' => Upfront_EntityResolver::layout_to_name($ids)
				);
				if ( $ids['type'] == 'single' ){
					$query = new WP_Query(array(
						'post_type' => $post_type->name,
						'post_status' => 'publish'
					));
					$query->parse_query();
					$post = $query->next_post();
					$return[$layout_id]['latest_post'] = $post->ID;
				}
			}
		}
		return $return;
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
		$return = array();
		foreach ( $region_scope_data as $region){
			if ( isset($region['trashed']) && $region['trashed'] == 1 )
				continue;
			if ( $region['name'] != $name && $region['container'] != $name )
				continue;
			$return[] = $region;
		}
		return $return;
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
		$regions = upfront_get_default_layout(self::$cascade, self::$layout_slug, $add_global_regions);
		return apply_filters('upfront_regions', $regions, self::$cascade);
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
		if ( $this->_data['properties'] ) {
			update_option(self::_get_layout_properties_id(), json_encode($this->_data['properties']));
		}

		update_option($key, $this->to_json());
/*
		$storage_key = self::get_storage_key();

		//if layout is applied to all posts, it should be saved to the db, even though the current layout is specific to the post
		if($storage_key . '-' . $this->_data['preferred_layout'] != $key) {
			update_option($storage_key . '-' . $this->_data['preferred_layout'], $this->to_json());
		}
*/
		return $key;
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

	/*
	Update an element that is already in the layout
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
	/*
	The path is an array with the position of the element inside the data array (region, module, object)
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
		while(!$found && $i < sizeof($data[$next])){
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
}