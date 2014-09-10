<?php


abstract class Upfront_EntityResolver {

	/**
	 * Dispatches resolving the specified Upfront ID cascade into searchable ID array.
	 * @param array Common Upfront ID cascade
	 * @return array Searchable Common Upfront IDs array
	 */
	public static function get_entity_ids ($cascade=false) {
		$cascade = $cascade ? $cascade : self::get_entity_cascade();

		$ids = array();
		if (!empty($cascade['type']) && !empty($cascade['item']) && !empty($cascade['specificity'])) {
			$ids['specificity'] = $cascade['type'] . '-' . $cascade['item'] . '-' . $cascade['specificity'];
		}
		if (!empty($cascade['type']) && !empty($cascade['item'])) {
			$ids['item'] = $cascade['type'] . '-' . $cascade['item'];
		}
		if (!empty($cascade['type'])) {
			$ids['type'] = $cascade['type'];
		}

		return $ids;
	}

	/**
	 * Dispatches resolving the current specific WordPress entity
	 * into a common Upfront ID cascade.
	 * @return array Common Upfront ID cascade
	 */
	public static function get_entity_cascade ($query=false) {
		$query = self::_get_query($query);

		if ($query->post_count <= 1 && !$query->tax_query) return self::resolve_singular_entity($query/*, $scope*/);
		else return self::resolve_archive_entity($query);
	}

	/**
	 * Resolves singular entities to an upfront ID.
	 */
	public static function resolve_singular_entity ($query=false) {
		$query = self::_get_query($query);

		$wp_entity = array();
		$wp_object = $query->get_queried_object();
		$wp_id = $query->get_queried_object_id();

		if (!$wp_id && $query->is_404) {
			$wp_entity = self::_to_entity('404_page');
		} else {
			$post_type = !empty($wp_object->post_type) ? $wp_object->post_type : 'post';
			$wp_entity = self::_to_entity($post_type, $wp_id);
		}

		$wp_entity['type'] = 'single';
		return $wp_entity;
	}

	/**
	 * Resolves archive-like entities to an upfront ID.
	 */
	public static function resolve_archive_entity ($query=false) {
		$query = self::_get_query($query);

		$wp_entity = array();

		if (!empty($query->tax_query) && !empty($query->tax_query->queries)) {
			// First, let's try tax query
			$taxonomy = $term = false;
			foreach ($query->tax_query->queries as $query) {
				$taxonomy = !empty($query['taxonomy']) ? $query['taxonomy'] : false;
				$term = !empty($query['terms']) ? $query['terms'] : false;
			}
			if ($taxonomy && $term) $wp_entity = self::_to_entity($taxonomy, $term);

		} else if (!empty($query->is_archive) && !empty($query->is_date)) {
			// Next, date queries
			$date = $query->get('m');
			$wp_entity = self::_to_entity('date', $date);

		} else if (!empty($query->is_search)) {
			// Next, search page
			$wp_entity = self::_to_entity('search', $query->get('s'));

		} else if (!empty($query->is_archive) && !empty($query->is_author)) {
			// Next, author archives
			$wp_entity = self::_to_entity('author', $query->get('author'));

		} else if (!empty($query->is_home)) {

			// Lastly, home page
			$wp_entity = self::_to_entity('home');
		}

		$wp_entity['type'] = 'archive';
		return $wp_entity;
	}

	public static function ids_from_url($url) {
		global $wp;
		$wp = new WP();

		//We need to cheat telling WP we are not in admin area to parse the URL properly
		$current_uri = $_SERVER['REQUEST_URI'];
		$self = $_SERVER['PHP_SELF'];
		$get = $_GET;
		global $current_screen;
		if($current_screen){
			$stored_current_screen = $current_screen->id;
		}
		else {
			require_once(ABSPATH . '/wp-admin/includes/screen.php');
			$current_screen = WP_Screen::get('front');
		}

		$_SERVER['REQUEST_URI'] = $url;
		$_SERVER['PHP_SELF'] = 'foo';

		$urlParts = explode('?', $url);

		if($urlParts > 1){
			parse_str($urlParts[1], $_GET);
		}


		$wp->parse_request();


		$query = new WP_Query($wp->query_vars);
		$query->parse_query();

		//Set the global post in case that no-one is set and we have a single query
		global $post;
		if(!$post && $query->have_posts() && $query->is_singular()){
			$post = $query->next_post();
			setup_postdata($post);
		}

		//Make the query accessible to add it to the response
		global $upfront_ajax_query;
		$upfront_ajax_query = clone($query);

		// Intercept /edit/(post|page)/id
		$editor = Upfront_ContentEditor_VirtualPage::serve();
		if($editor->parse_page()){
			global $wp_query;
			$query = $wp_query;
			$post = $wp_query->next_post();
			setup_postdata($post);
		}


		$_SERVER['REQUEST_URI'] = $current_uri;
		$_SERVER['PHP_SELF'] = $self;
		$_GET = $get;

		if(isset($stored_current_screen)) {
			//$current_screen = $current_screen::get($stored_current_screen);
			$current_screen = call_user_func(array($current_screen, 'get', $stored_current_screen));
		}

		$cascade = self::get_entity_ids(self::get_entity_cascade($query));

		return $cascade;
	}

	public static function layout_to_name ($layout_ids) {
		$type = $layout_ids['type'];
		$item = !empty($layout_ids['item']) ? preg_replace("/^{$type}-/", "", $layout_ids['item']) : "";
		$specificity = !empty($layout_ids['specificity']) ? preg_replace("/^{$type}-{$item}-/", "", $layout_ids['specificity']) : "";
		if ( $type == 'single' ){
			$post_type = get_post_type_object($item ? $item : 'post');
			$name = is_object($post_type->labels) ? $post_type->labels->singular_name : $post_type->labels['singular_name'];
			if ( $specificity )
				return sprintf("Single %s: %s", $name, $specificity);
			return sprintf("Single %s", $name);
		}
		else if ( $type == 'archive' ){
			if ( $item == 'home' ){
				return __("Home Page");
			}
			else if ( $item == 'date' || empty($item) ){
				if ( $specificity )
					return sprintf("Archive: %s", jdmonthname($specificity, CAL_MONTH_GREGORIAN_LONG));
				return __("Archive");
			}
			else if ( $item == 'search' ){
				if ( $specificity )
					return sprintf("Search term: %s", $specificity);
				return __("Search");
			}
			else if ( $item == 'author' ){
				if ( $specificity )
					return sprintf("Author: %s", $specificity);
				return __("Author");
			}
			else {
				// means this is taxonomy
				$taxonomy = get_taxonomy($item);
				$name = is_object($taxonomy->labels) ? $taxonomy->labels->singular_name : $taxonomy->labels['singular_name'];
				if ( $specificity )
					return sprintf("%s: %s", $name, $specificity);
				return $name;
			}
		}
	}


	private static function _get_query ($query) {
		if (!$query || !($query instanceof WP_Query)) {
			global $wp_query;
			return $wp_query;
		}
		return $query;
	}

	private static function _to_entity ($item, $specificity=false) {
		$item = is_array($item) ? join('_', $item) : $item;
		$specificity = is_array($specificity) ? join('_', $specificity) : $specificity;
		return array(
			'item' => $item,
			'specificity' => $specificity
		);
	}

}



abstract class Upfront_Model {

	const STORAGE_KEY = 'upfront';
	protected static $storage_key = self::STORAGE_KEY;

	protected $_name;
	protected $_data;

	abstract public function initialize ();
	abstract public function save ();
	abstract public function delete ();

	protected function _name_to_id () {
		$name = preg_replace('/[^-_a-z0-9]/', '-', strtolower($this->_name));
		return $name;
	}

	public function get_name () {
		return $this->_name;
	}

	public function get_id () {
		if (!empty($this->_data['current_layout'])) {
			$id = $this->_data['current_layout'];
		}
		else if (!empty($this->_data['preferred_layout'])) {
			$id = $this->_data['preferred_layout'];
		} else {
			$id = !empty($this->_data['layout']['item'])
				? $this->_data['layout']['item']
				: $this->_name_to_id()
			;
		}
		$storage_key = self::get_storage_key();
		return $storage_key . '-' . $id;
	}

	public static function id_to_type ($id) {
		$storage_key = self::get_storage_key();
		return preg_replace('/^' . preg_quote($storage_key, '/') . '-/', '', $id);
	}

	public static function set_storage_key($storage_key) {
		if (!empty($storage_key))
			self::$storage_key = $storage_key;
		else // restore to default if empty
			self::$storage_key = self::STORAGE_KEY;
	}

	public static function get_storage_key() {
		return apply_filters('upfront-storage-key', self::$storage_key);
	}

	public function set ($key, $value) {
		$this->_data[$key] = $value;
	}

	public function get ($key) {
		return isset($this->_data[$key]) ? $this->_data[$key] : false;
	}

	public function get_property_value ($prop) {
		return upfront_get_property_value($prop, $this->_data);
	}

	public function set_property_value ($prop, $value) {
		$this->_data = upfront_set_property_value($prop, $value, $this->_data);
	}

	public function is_empty () {
		return empty($this->_data);
	}
}



abstract class Upfront_JsonModel extends Upfront_Model {

	protected static $instance;

	protected function __construct ($json=false) {
		$this->_data = $json;
		$this->initialize();
		self::$instance = $this;
	}

	public function get_instance () {
		return self::$instance;
	}

	public function initialize () {
		$data = $this->to_php();
		$this->_name = !empty($data['name']) ? $data['name'] : false;
	}

	public function to_php () {
		return $this->_data
			? $this->_data
			: array()
		;
	}

	public function to_json () {
		//return json_encode($this->to_php(), true);
		return json_encode($this->to_php());
	}

}



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
		self::set_storage_key($storage_key);
		$storage_key = self::get_storage_key();
		$order = array('specificity', 'item', 'type');
		foreach ($order as $o) {
			if (empty($cascade[$o]))
				continue;
			$id = $storage_key . '-' . $cascade[$o];
			$layout = self::from_id($id, $storage_key);
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

	public static function get_regions_data () {
		$regions_data = self::_get_regions();
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
		$regions = array();
		if ( $region['scope'] != 'local' ){
			if ( empty(self::$scope_data[$region['scope']]) ) {
				$region_scope_data = json_decode( get_option(self::_get_scope_id($region['scope']), json_encode(array())), true );
				self::$scope_data[$region['scope']] = apply_filters('upfront_get_global_regions', $region_scope_data, self::_get_scope_id($region['scope']));
			}
			if ( empty(self::$scope_data[$region['scope']]) ){
				$regions[] = $region;
				return $regions;
			} foreach ( self::$scope_data[$region['scope']] as $scope => $data ) {
				if ( ( $data['name'] == $region['name'] || $data['container'] == $region['name'] ) ){
					$regions[] = $data;
				}
			}
		}
		return $regions;

	}

	public static function create_layout ($layout_ids = array(), $layout_slug = '') {
		self::$layout_slug = $layout_slug;
		$data = array(
			"name" => "Default Layout",
			"properties" => self::get_layout_properties(),
			"regions" => self::get_regions_data(),
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
			$post = $query->next_post();

			if ( $post_type->name == 'post' )
				$list['single'] = array(
					'layout' => array(
						'type' => 'single'
					),
					'latest_post' => $post->ID
				);
			else
				$list['single-' . $post_type->name] = array(
					'layout' => array(
						'item' => 'single-' . $post_type->name,
						'type' => 'single'
					),
					'latest_post' => $post->ID
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
				if ( $match[3] && $match[5] )
					$ids['specificity'] = $match[1] . '-' . $match[3] . '-' . $match[5];
				if ( $match[3] )
					$ids['item'] = $match[1] . '-' . $match[3];
				$ids['type'] = $match[1];
				$layout_id = ( $ids['specificity'] ? $ids['specificity'] : ( $ids['item'] ? $ids['item'] : $ids['type'] ) );
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

	protected static function _get_regions () {
		$regions = array();
		do_action('upfront_get_regions', self::$cascade);
		$regions = upfront_get_default_layout(self::$cascade, self::$layout_slug);
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
			if ( $region['scope'] != 'local' ){
				if ( !is_array($scopes[$region['scope']]) )
					$scopes[$region['scope']] = array();
				$scopes[$region['scope']][] = $region;
			}
		}
		foreach ( $scopes as $scope => $data ) {
			$current_scope = json_decode( get_option(self::_get_scope_id($region['scope']), json_encode(array())), true );
			$current_scope = apply_filters('upfront_get_global_regions', $current_scope, self::_get_scope_id($region['scope']));
			$scope_data = $data;
			if ( $current_scope ){ // merge with current scope if it's exist
				foreach ( $current_scope as $current_region ){
					$found = false;
					foreach ( $data as $region ){
						if ( $region['name'] == $current_region['name'] || $region['name'] == $current_region['container'] ){
							$found = true;
							break;
						}
					}
					if ( ! $found )
						$scope_data[] = $current_region;
				}
			}
			update_option(self::_get_scope_id($scope), json_encode($scope_data));
		}
		if ( $this->_data['properties'] )
			update_option(self::_get_layout_properties_id(), json_encode($this->_data['properties']));
		update_option($key, $this->to_json());
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


// ----- Post Model

abstract class  Upfront_PostModel {

	public static function create ($post_type, $title='', $content='') {
		$post_data = apply_filters(
			'upfront-post_model-create-defaults',
			array(
				'post_type' => $post_type,
				'post_status' => 'auto-draft',
				'post_title' => 'Write a title...',
				'post_content' => 'Your content goes here :)',
			),
			$post_type
		);
		$post_id = wp_insert_post($post_data);

		$post = self::get($post_id);
		return $post;
	}

	public static function get ($post_id) {
		return get_post($post_id);
	}

	public static function save ($changes) {
		$post_id = wp_insert_post($changes);
		$post = self::get($post_id);
		return $post;
	}

}


class Upfront_LayoutRevisions {

	const REVISION_TYPE = 'upfront_layout_rvsn';
	const REVISION_STATUS = 'draft';

	public function __construct () {}

	public static function to_string ($array) {
		if (!is_array($array)) return '';
		return join('::', $array);
	}

	public static function to_hash ($what) {
		return md5(serialize($what));
	}

	/**
	 * Saves the layout and returns the layout ID key.
	 * Layout ID key is *not* the same as layout ID,
	 * it's a hash used to resolve this particular layout.
	 * @param Upfront_Layout $layout layout to store
	 * @return mixed (bool)false on failure, (string)layout ID key on success
	 */
	public function save_revision ($layout) {
		$cascade = $layout->get_cascade();
		$store = $layout->to_php();
		$layout_id_key = self::to_hash($store);

		$existing_revision = $this->get_revision($layout_id_key);
		if (!empty($existing_revision)) return $layout_id_key;

		$post_id = wp_insert_post(array(
			"post_content" => serialize($store),
			"post_title" => self::to_string($cascade),
			"post_name" => $layout_id_key,
			"post_type" => self::REVISION_TYPE,
			"post_status" => self::REVISION_STATUS,
			"post_author" => get_current_user_id(),
		));
		return !empty($post_id) && !is_wp_error($post_id)
			? $layout_id_key
			: false
		;
	}

	/**
	 * Fetches a single revision, as determined by supplied layout ID key.
	 * @param string $layotu_id_key Requested revision key
	 * @return mixed (Upfront_Layout)revision on success, (bool)false on failure
	 */
	public function get_revision ($layout_id_key) {
		$query = new WP_Query(array(
			"name" => $layout_id_key,
			"post_type" => self::REVISION_TYPE,
			"posts_per_page" => 1,
		));
		return !empty($query->posts[0]) && !empty($query->posts[0]->post_content)
			? unserialize($query->posts[0]->post_content)
			: false
		;
	}

	/**
	 * Fetches a list of revisions in store for the particular entity cascade.
	 * @param array $entity_cascade Entity cascade to be matched for
	 * @param array $args Optional additional arguments list (boundaries)
	 * @return mixed (array)List of revisions
	 */
	public function get_entity_revisions ($entity_cascade, $args=array()) {
		$args = wp_parse_args($args, array(
			'posts_per_page' => 10,
			'post_type' => self::REVISION_TYPE,
		));
		$args["post_title"] = self::to_string($cascade);
		$query = new WP_Query($args);
		return $query->posts;
	}

	/**
	 * Fetches a list of deprecated revisions.
	 * This list includes *all* revisions, it's not entity-specific.
	 * @param array $args Optional additional arguments list (boundaries)
	 * @return mixed (array)List of deprecated revisions
	 */
	public function get_all_deprecated_revisions ($args=array()) {
		$args = wp_parse_args($args, array(
			'posts_per_page' => -1,
			'post_type' => self::REVISION_TYPE,
			'post_status' => self::REVISION_STATUS,
			'date_query' => array(array(
				'before' => "-1 day",
			)),
		));
		$query = new WP_Query($args);
		return $query->posts;
	}

	/**
	 * Deletes the requested revision.
	 * Also validated we have actually deleted a revision.
	 * @param int $revision_id Revision post ID to remove
	 * @return bool
	 */
	public function drop_revision ($revision_id) {
		if (empty($revision_id) || !is_numeric($revision_id)) return false;
		$rev = get_post($revision_id);
		if (self::REVISION_TYPE !== $rev->post_type) return false;
		return (bool)wp_delete_post($revision_id, true);
	}

}

class Upfront_Model_GoogleFonts {

	public function __construct () {
		$this->refresh();
	}

	/**
	 * Lists all available fonts as a PHP hash.
	 * @return array
	 */
	public function get_all () {
		return !empty(self::$_cached_list)
			? json_decode(self::$_cached_list, true)
			: array()
		;
	}

	/**
   * Lists available font categories. In Google Fonts that is:
   * serif, sans-serif, handwriting, etc.
	 * @return array
	 */
	public function get_categories () {
		static $all = array();
		if (empty($all)) $all = $this->get_all();
		return wp_list_pluck($all, 'category');
	}

	/**
	 * Lists available font families. These are font names such as Advent Pro, Lato etc.
	 * @return array
	 */
	public function get_families () {
		static $all = array();
		if (empty($all)) $all = $this->get_all();
		return wp_list_pluck($all, 'family');
	}

	/**
	 * Checks to see if a requested font is originated from Google.
	 * @param string $font Font face to check
	 * @return bool
	 */
	public function is_from_google ($font) {
		$families = $this->get_families();
		return in_array($font, $families);
	}

	/**
	 * Refreshes the font list cache from Google.
	 * Needs to have an API key and needs to be executed periodically
	 */
	public function refresh () {
		$key = $this->_get_api_key();
		if (empty($key)) return false;
	}

	protected function _get_api_key () { return false; }

	private static $_cached_list = '[{"family":"ABeeZee","category":"sans-serif","variants":["regular","italic"]},{"family":"Abel","category":"sans-serif","variants":["regular"]},{"family":"Abril Fatface","category":"display","variants":["regular"]},{"family":"Aclonica","category":"sans-serif","variants":["regular"]},{"family":"Acme","category":"sans-serif","variants":["regular"]},{"family":"Actor","category":"sans-serif","variants":["regular"]},{"family":"Adamina","category":"serif","variants":["regular"]},{"family":"Advent Pro","category":"sans-serif","variants":["100","200","300","regular","500","600","700"]},{"family":"Aguafina Script","category":"handwriting","variants":["regular"]},{"family":"Akronim","category":"display","variants":["regular"]},{"family":"Aladin","category":"handwriting","variants":["regular"]},{"family":"Aldrich","category":"sans-serif","variants":["regular"]},{"family":"Alef","category":"sans-serif","variants":["regular","700"]},{"family":"Alegreya","category":"serif","variants":["regular","italic","700","700italic","900","900italic"]},{"family":"Alegreya SC","category":"serif","variants":["regular","italic","700","700italic","900","900italic"]},{"family":"Alegreya Sans","category":"sans-serif","variants":["100","100italic","300","300italic","regular","italic","500","500italic","700","700italic","800","800italic","900","900italic"]},{"family":"Alegreya Sans SC","category":"sans-serif","variants":["100","100italic","300","300italic","regular","italic","500","500italic","700","700italic","800","800italic","900","900italic"]},{"family":"Alex Brush","category":"handwriting","variants":["regular"]},{"family":"Alfa Slab One","category":"display","variants":["regular"]},{"family":"Alice","category":"serif","variants":["regular"]},{"family":"Alike","category":"serif","variants":["regular"]},{"family":"Alike Angular","category":"serif","variants":["regular"]},{"family":"Allan","category":"display","variants":["regular","700"]},{"family":"Allerta","category":"sans-serif","variants":["regular"]},{"family":"Allerta Stencil","category":"sans-serif","variants":["regular"]},{"family":"Allura","category":"handwriting","variants":["regular"]},{"family":"Almendra","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Almendra Display","category":"display","variants":["regular"]},{"family":"Almendra SC","category":"serif","variants":["regular"]},{"family":"Amarante","category":"display","variants":["regular"]},{"family":"Amaranth","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Amatic SC","category":"handwriting","variants":["regular","700"]},{"family":"Amethysta","category":"serif","variants":["regular"]},{"family":"Anaheim","category":"sans-serif","variants":["regular"]},{"family":"Andada","category":"serif","variants":["regular"]},{"family":"Andika","category":"sans-serif","variants":["regular"]},{"family":"Angkor","category":"display","variants":["regular"]},{"family":"Annie Use Your Telescope","category":"handwriting","variants":["regular"]},{"family":"Anonymous Pro","category":"monospace","variants":["regular","italic","700","700italic"]},{"family":"Antic","category":"sans-serif","variants":["regular"]},{"family":"Antic Didone","category":"serif","variants":["regular"]},{"family":"Antic Slab","category":"serif","variants":["regular"]},{"family":"Anton","category":"sans-serif","variants":["regular"]},{"family":"Arapey","category":"serif","variants":["regular","italic"]},{"family":"Arbutus","category":"display","variants":["regular"]},{"family":"Arbutus Slab","category":"serif","variants":["regular"]},{"family":"Architects Daughter","category":"handwriting","variants":["regular"]},{"family":"Archivo Black","category":"sans-serif","variants":["regular"]},{"family":"Archivo Narrow","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Arimo","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Arizonia","category":"handwriting","variants":["regular"]},{"family":"Armata","category":"sans-serif","variants":["regular"]},{"family":"Artifika","category":"serif","variants":["regular"]},{"family":"Arvo","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Asap","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Asset","category":"display","variants":["regular"]},{"family":"Astloch","category":"display","variants":["regular","700"]},{"family":"Asul","category":"sans-serif","variants":["regular","700"]},{"family":"Atomic Age","category":"display","variants":["regular"]},{"family":"Aubrey","category":"display","variants":["regular"]},{"family":"Audiowide","category":"display","variants":["regular"]},{"family":"Autour One","category":"display","variants":["regular"]},{"family":"Average","category":"serif","variants":["regular"]},{"family":"Average Sans","category":"sans-serif","variants":["regular"]},{"family":"Averia Gruesa Libre","category":"display","variants":["regular"]},{"family":"Averia Libre","category":"display","variants":["300","300italic","regular","italic","700","700italic"]},{"family":"Averia Sans Libre","category":"display","variants":["300","300italic","regular","italic","700","700italic"]},{"family":"Averia Serif Libre","category":"display","variants":["300","300italic","regular","italic","700","700italic"]},{"family":"Bad Script","category":"handwriting","variants":["regular"]},{"family":"Balthazar","category":"serif","variants":["regular"]},{"family":"Bangers","category":"display","variants":["regular"]},{"family":"Basic","category":"sans-serif","variants":["regular"]},{"family":"Battambang","category":"display","variants":["regular","700"]},{"family":"Baumans","category":"display","variants":["regular"]},{"family":"Bayon","category":"display","variants":["regular"]},{"family":"Belgrano","category":"serif","variants":["regular"]},{"family":"Belleza","category":"sans-serif","variants":["regular"]},{"family":"BenchNine","category":"sans-serif","variants":["300","regular","700"]},{"family":"Bentham","category":"serif","variants":["regular"]},{"family":"Berkshire Swash","category":"handwriting","variants":["regular"]},{"family":"Bevan","category":"display","variants":["regular"]},{"family":"Bigelow Rules","category":"display","variants":["regular"]},{"family":"Bigshot One","category":"display","variants":["regular"]},{"family":"Bilbo","category":"handwriting","variants":["regular"]},{"family":"Bilbo Swash Caps","category":"handwriting","variants":["regular"]},{"family":"Bitter","category":"serif","variants":["regular","italic","700"]},{"family":"Black Ops One","category":"display","variants":["regular"]},{"family":"Bokor","category":"display","variants":["regular"]},{"family":"Bonbon","category":"handwriting","variants":["regular"]},{"family":"Boogaloo","category":"display","variants":["regular"]},{"family":"Bowlby One","category":"display","variants":["regular"]},{"family":"Bowlby One SC","category":"display","variants":["regular"]},{"family":"Brawler","category":"serif","variants":["regular"]},{"family":"Bree Serif","category":"serif","variants":["regular"]},{"family":"Bubblegum Sans","category":"display","variants":["regular"]},{"family":"Bubbler One","category":"sans-serif","variants":["regular"]},{"family":"Buda","category":"display","variants":["300"]},{"family":"Buenard","category":"serif","variants":["regular","700"]},{"family":"Butcherman","category":"display","variants":["regular"]},{"family":"Butterfly Kids","category":"handwriting","variants":["regular"]},{"family":"Cabin","category":"sans-serif","variants":["regular","italic","500","500italic","600","600italic","700","700italic"]},{"family":"Cabin Condensed","category":"sans-serif","variants":["regular","500","600","700"]},{"family":"Cabin Sketch","category":"display","variants":["regular","700"]},{"family":"Caesar Dressing","category":"display","variants":["regular"]},{"family":"Cagliostro","category":"sans-serif","variants":["regular"]},{"family":"Calligraffitti","category":"handwriting","variants":["regular"]},{"family":"Cambo","category":"serif","variants":["regular"]},{"family":"Candal","category":"sans-serif","variants":["regular"]},{"family":"Cantarell","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Cantata One","category":"serif","variants":["regular"]},{"family":"Cantora One","category":"sans-serif","variants":["regular"]},{"family":"Capriola","category":"sans-serif","variants":["regular"]},{"family":"Cardo","category":"serif","variants":["regular","italic","700"]},{"family":"Carme","category":"sans-serif","variants":["regular"]},{"family":"Carrois Gothic","category":"sans-serif","variants":["regular"]},{"family":"Carrois Gothic SC","category":"sans-serif","variants":["regular"]},{"family":"Carter One","category":"display","variants":["regular"]},{"family":"Caudex","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Cedarville Cursive","category":"handwriting","variants":["regular"]},{"family":"Ceviche One","category":"display","variants":["regular"]},{"family":"Changa One","category":"display","variants":["regular","italic"]},{"family":"Chango","category":"display","variants":["regular"]},{"family":"Chau Philomene One","category":"sans-serif","variants":["regular","italic"]},{"family":"Chela One","category":"display","variants":["regular"]},{"family":"Chelsea Market","category":"display","variants":["regular"]},{"family":"Chenla","category":"display","variants":["regular"]},{"family":"Cherry Cream Soda","category":"display","variants":["regular"]},{"family":"Cherry Swash","category":"display","variants":["regular","700"]},{"family":"Chewy","category":"display","variants":["regular"]},{"family":"Chicle","category":"display","variants":["regular"]},{"family":"Chivo","category":"sans-serif","variants":["regular","italic","900","900italic"]},{"family":"Cinzel","category":"serif","variants":["regular","700","900"]},{"family":"Cinzel Decorative","category":"display","variants":["regular","700","900"]},{"family":"Clicker Script","category":"handwriting","variants":["regular"]},{"family":"Coda","category":"display","variants":["regular","800"]},{"family":"Coda Caption","category":"sans-serif","variants":["800"]},{"family":"Codystar","category":"display","variants":["300","regular"]},{"family":"Combo","category":"display","variants":["regular"]},{"family":"Comfortaa","category":"display","variants":["300","regular","700"]},{"family":"Coming Soon","category":"handwriting","variants":["regular"]},{"family":"Concert One","category":"display","variants":["regular"]},{"family":"Condiment","category":"handwriting","variants":["regular"]},{"family":"Content","category":"display","variants":["regular","700"]},{"family":"Contrail One","category":"display","variants":["regular"]},{"family":"Convergence","category":"sans-serif","variants":["regular"]},{"family":"Cookie","category":"handwriting","variants":["regular"]},{"family":"Copse","category":"serif","variants":["regular"]},{"family":"Corben","category":"display","variants":["regular","700"]},{"family":"Courgette","category":"handwriting","variants":["regular"]},{"family":"Cousine","category":"monospace","variants":["regular","italic","700","700italic"]},{"family":"Coustard","category":"serif","variants":["regular","900"]},{"family":"Covered By Your Grace","category":"handwriting","variants":["regular"]},{"family":"Crafty Girls","category":"handwriting","variants":["regular"]},{"family":"Creepster","category":"display","variants":["regular"]},{"family":"Crete Round","category":"serif","variants":["regular","italic"]},{"family":"Crimson Text","category":"serif","variants":["regular","italic","600","600italic","700","700italic"]},{"family":"Croissant One","category":"display","variants":["regular"]},{"family":"Crushed","category":"display","variants":["regular"]},{"family":"Cuprum","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Cutive","category":"serif","variants":["regular"]},{"family":"Cutive Mono","category":"monospace","variants":["regular"]},{"family":"Damion","category":"handwriting","variants":["regular"]},{"family":"Dancing Script","category":"handwriting","variants":["regular","700"]},{"family":"Dangrek","category":"display","variants":["regular"]},{"family":"Dawning of a New Day","category":"handwriting","variants":["regular"]},{"family":"Days One","category":"sans-serif","variants":["regular"]},{"family":"Delius","category":"handwriting","variants":["regular"]},{"family":"Delius Swash Caps","category":"handwriting","variants":["regular"]},{"family":"Delius Unicase","category":"handwriting","variants":["regular","700"]},{"family":"Della Respira","category":"serif","variants":["regular"]},{"family":"Denk One","category":"sans-serif","variants":["regular"]},{"family":"Devonshire","category":"handwriting","variants":["regular"]},{"family":"Didact Gothic","category":"sans-serif","variants":["regular"]},{"family":"Diplomata","category":"display","variants":["regular"]},{"family":"Diplomata SC","category":"display","variants":["regular"]},{"family":"Domine","category":"serif","variants":["regular","700"]},{"family":"Donegal One","category":"serif","variants":["regular"]},{"family":"Doppio One","category":"sans-serif","variants":["regular"]},{"family":"Dorsa","category":"sans-serif","variants":["regular"]},{"family":"Dosis","category":"sans-serif","variants":["200","300","regular","500","600","700","800"]},{"family":"Dr Sugiyama","category":"handwriting","variants":["regular"]},{"family":"Droid Sans","category":"sans-serif","variants":["regular","700"]},{"family":"Droid Sans Mono","category":"monospace","variants":["regular"]},{"family":"Droid Serif","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Duru Sans","category":"sans-serif","variants":["regular"]},{"family":"Dynalight","category":"display","variants":["regular"]},{"family":"EB Garamond","category":"serif","variants":["regular"]},{"family":"Eagle Lake","category":"handwriting","variants":["regular"]},{"family":"Eater","category":"display","variants":["regular"]},{"family":"Economica","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Ek Mukta","category":"sans-serif","variants":["200","300","regular","500","600","700","800"]},{"family":"Electrolize","category":"sans-serif","variants":["regular"]},{"family":"Elsie","category":"display","variants":["regular","900"]},{"family":"Elsie Swash Caps","category":"display","variants":["regular","900"]},{"family":"Emblema One","category":"display","variants":["regular"]},{"family":"Emilys Candy","category":"display","variants":["regular"]},{"family":"Engagement","category":"handwriting","variants":["regular"]},{"family":"Englebert","category":"sans-serif","variants":["regular"]},{"family":"Enriqueta","category":"serif","variants":["regular","700"]},{"family":"Erica One","category":"display","variants":["regular"]},{"family":"Esteban","category":"serif","variants":["regular"]},{"family":"Euphoria Script","category":"handwriting","variants":["regular"]},{"family":"Ewert","category":"display","variants":["regular"]},{"family":"Exo","category":"sans-serif","variants":["100","100italic","200","200italic","300","300italic","regular","italic","500","500italic","600","600italic","700","700italic","800","800italic","900","900italic"]},{"family":"Exo 2","category":"sans-serif","variants":["100","100italic","200","200italic","300","300italic","regular","italic","500","500italic","600","600italic","700","700italic","800","800italic","900","900italic"]},{"family":"Expletus Sans","category":"display","variants":["regular","italic","500","500italic","600","600italic","700","700italic"]},{"family":"Fanwood Text","category":"serif","variants":["regular","italic"]},{"family":"Fascinate","category":"display","variants":["regular"]},{"family":"Fascinate Inline","category":"display","variants":["regular"]},{"family":"Faster One","category":"display","variants":["regular"]},{"family":"Fasthand","category":"serif","variants":["regular"]},{"family":"Fauna One","category":"serif","variants":["regular"]},{"family":"Federant","category":"display","variants":["regular"]},{"family":"Federo","category":"sans-serif","variants":["regular"]},{"family":"Felipa","category":"handwriting","variants":["regular"]},{"family":"Fenix","category":"serif","variants":["regular"]},{"family":"Finger Paint","category":"display","variants":["regular"]},{"family":"Fira Mono","category":"monospace","variants":["regular","700"]},{"family":"Fira Sans","category":"sans-serif","variants":["300","300italic","regular","italic","500","500italic","700","700italic"]},{"family":"Fjalla One","category":"sans-serif","variants":["regular"]},{"family":"Fjord One","category":"serif","variants":["regular"]},{"family":"Flamenco","category":"display","variants":["300","regular"]},{"family":"Flavors","category":"display","variants":["regular"]},{"family":"Fondamento","category":"handwriting","variants":["regular","italic"]},{"family":"Fontdiner Swanky","category":"display","variants":["regular"]},{"family":"Forum","category":"display","variants":["regular"]},{"family":"Francois One","category":"sans-serif","variants":["regular"]},{"family":"Freckle Face","category":"display","variants":["regular"]},{"family":"Fredericka the Great","category":"display","variants":["regular"]},{"family":"Fredoka One","category":"display","variants":["regular"]},{"family":"Freehand","category":"display","variants":["regular"]},{"family":"Fresca","category":"sans-serif","variants":["regular"]},{"family":"Frijole","category":"display","variants":["regular"]},{"family":"Fruktur","category":"display","variants":["regular"]},{"family":"Fugaz One","category":"display","variants":["regular"]},{"family":"GFS Didot","category":"serif","variants":["regular"]},{"family":"GFS Neohellenic","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Gabriela","category":"serif","variants":["regular"]},{"family":"Gafata","category":"sans-serif","variants":["regular"]},{"family":"Galdeano","category":"sans-serif","variants":["regular"]},{"family":"Galindo","category":"display","variants":["regular"]},{"family":"Gentium Basic","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Gentium Book Basic","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Geo","category":"sans-serif","variants":["regular","italic"]},{"family":"Geostar","category":"display","variants":["regular"]},{"family":"Geostar Fill","category":"display","variants":["regular"]},{"family":"Germania One","category":"display","variants":["regular"]},{"family":"Gilda Display","category":"serif","variants":["regular"]},{"family":"Give You Glory","category":"handwriting","variants":["regular"]},{"family":"Glass Antiqua","category":"display","variants":["regular"]},{"family":"Glegoo","category":"serif","variants":["regular"]},{"family":"Gloria Hallelujah","category":"handwriting","variants":["regular"]},{"family":"Goblin One","category":"display","variants":["regular"]},{"family":"Gochi Hand","category":"handwriting","variants":["regular"]},{"family":"Gorditas","category":"display","variants":["regular","700"]},{"family":"Goudy Bookletter 1911","category":"serif","variants":["regular"]},{"family":"Graduate","category":"display","variants":["regular"]},{"family":"Grand Hotel","category":"handwriting","variants":["regular"]},{"family":"Gravitas One","category":"display","variants":["regular"]},{"family":"Great Vibes","category":"handwriting","variants":["regular"]},{"family":"Griffy","category":"display","variants":["regular"]},{"family":"Gruppo","category":"display","variants":["regular"]},{"family":"Gudea","category":"sans-serif","variants":["regular","italic","700"]},{"family":"Habibi","category":"serif","variants":["regular"]},{"family":"Hammersmith One","category":"sans-serif","variants":["regular"]},{"family":"Hanalei","category":"display","variants":["regular"]},{"family":"Hanalei Fill","category":"display","variants":["regular"]},{"family":"Handlee","category":"handwriting","variants":["regular"]},{"family":"Hanuman","category":"serif","variants":["regular","700"]},{"family":"Happy Monkey","category":"display","variants":["regular"]},{"family":"Headland One","category":"serif","variants":["regular"]},{"family":"Henny Penny","category":"display","variants":["regular"]},{"family":"Herr Von Muellerhoff","category":"handwriting","variants":["regular"]},{"family":"Holtwood One SC","category":"serif","variants":["regular"]},{"family":"Homemade Apple","category":"handwriting","variants":["regular"]},{"family":"Homenaje","category":"sans-serif","variants":["regular"]},{"family":"IM Fell DW Pica","category":"serif","variants":["regular","italic"]},{"family":"IM Fell DW Pica SC","category":"serif","variants":["regular"]},{"family":"IM Fell Double Pica","category":"serif","variants":["regular","italic"]},{"family":"IM Fell Double Pica SC","category":"serif","variants":["regular"]},{"family":"IM Fell English","category":"serif","variants":["regular","italic"]},{"family":"IM Fell English SC","category":"serif","variants":["regular"]},{"family":"IM Fell French Canon","category":"serif","variants":["regular","italic"]},{"family":"IM Fell French Canon SC","category":"serif","variants":["regular"]},{"family":"IM Fell Great Primer","category":"serif","variants":["regular","italic"]},{"family":"IM Fell Great Primer SC","category":"serif","variants":["regular"]},{"family":"Iceberg","category":"display","variants":["regular"]},{"family":"Iceland","category":"display","variants":["regular"]},{"family":"Imprima","category":"sans-serif","variants":["regular"]},{"family":"Inconsolata","category":"monospace","variants":["regular","700"]},{"family":"Inder","category":"sans-serif","variants":["regular"]},{"family":"Indie Flower","category":"handwriting","variants":["regular"]},{"family":"Inika","category":"serif","variants":["regular","700"]},{"family":"Irish Grover","category":"display","variants":["regular"]},{"family":"Istok Web","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Italiana","category":"serif","variants":["regular"]},{"family":"Italianno","category":"handwriting","variants":["regular"]},{"family":"Jacques Francois","category":"serif","variants":["regular"]},{"family":"Jacques Francois Shadow","category":"display","variants":["regular"]},{"family":"Jim Nightshade","category":"handwriting","variants":["regular"]},{"family":"Jockey One","category":"sans-serif","variants":["regular"]},{"family":"Jolly Lodger","category":"display","variants":["regular"]},{"family":"Josefin Sans","category":"sans-serif","variants":["100","100italic","300","300italic","regular","italic","600","600italic","700","700italic"]},{"family":"Josefin Slab","category":"serif","variants":["100","100italic","300","300italic","regular","italic","600","600italic","700","700italic"]},{"family":"Joti One","category":"display","variants":["regular"]},{"family":"Judson","category":"serif","variants":["regular","italic","700"]},{"family":"Julee","category":"handwriting","variants":["regular"]},{"family":"Julius Sans One","category":"sans-serif","variants":["regular"]},{"family":"Junge","category":"serif","variants":["regular"]},{"family":"Jura","category":"sans-serif","variants":["300","regular","500","600"]},{"family":"Just Another Hand","category":"handwriting","variants":["regular"]},{"family":"Just Me Again Down Here","category":"handwriting","variants":["regular"]},{"family":"Kameron","category":"serif","variants":["regular","700"]},{"family":"Kantumruy","category":"sans-serif","variants":["300","regular","700"]},{"family":"Karla","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Kaushan Script","category":"handwriting","variants":["regular"]},{"family":"Kavoon","category":"display","variants":["regular"]},{"family":"Kdam Thmor","category":"display","variants":["regular"]},{"family":"Keania One","category":"display","variants":["regular"]},{"family":"Kelly Slab","category":"display","variants":["regular"]},{"family":"Kenia","category":"display","variants":["regular"]},{"family":"Khmer","category":"display","variants":["regular"]},{"family":"Kite One","category":"sans-serif","variants":["regular"]},{"family":"Knewave","category":"display","variants":["regular"]},{"family":"Kotta One","category":"serif","variants":["regular"]},{"family":"Koulen","category":"display","variants":["regular"]},{"family":"Kranky","category":"display","variants":["regular"]},{"family":"Kreon","category":"serif","variants":["300","regular","700"]},{"family":"Kristi","category":"handwriting","variants":["regular"]},{"family":"Krona One","category":"sans-serif","variants":["regular"]},{"family":"La Belle Aurore","category":"handwriting","variants":["regular"]},{"family":"Lancelot","category":"display","variants":["regular"]},{"family":"Lato","category":"sans-serif","variants":["100","100italic","300","300italic","regular","italic","700","700italic","900","900italic"]},{"family":"League Script","category":"handwriting","variants":["regular"]},{"family":"Leckerli One","category":"handwriting","variants":["regular"]},{"family":"Ledger","category":"serif","variants":["regular"]},{"family":"Lekton","category":"sans-serif","variants":["regular","italic","700"]},{"family":"Lemon","category":"display","variants":["regular"]},{"family":"Libre Baskerville","category":"serif","variants":["regular","italic","700"]},{"family":"Life Savers","category":"display","variants":["regular","700"]},{"family":"Lilita One","category":"display","variants":["regular"]},{"family":"Lily Script One","category":"display","variants":["regular"]},{"family":"Limelight","category":"display","variants":["regular"]},{"family":"Linden Hill","category":"serif","variants":["regular","italic"]},{"family":"Lobster","category":"display","variants":["regular"]},{"family":"Lobster Two","category":"display","variants":["regular","italic","700","700italic"]},{"family":"Londrina Outline","category":"display","variants":["regular"]},{"family":"Londrina Shadow","category":"display","variants":["regular"]},{"family":"Londrina Sketch","category":"display","variants":["regular"]},{"family":"Londrina Solid","category":"display","variants":["regular"]},{"family":"Lora","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Love Ya Like A Sister","category":"display","variants":["regular"]},{"family":"Loved by the King","category":"handwriting","variants":["regular"]},{"family":"Lovers Quarrel","category":"handwriting","variants":["regular"]},{"family":"Luckiest Guy","category":"display","variants":["regular"]},{"family":"Lusitana","category":"serif","variants":["regular","700"]},{"family":"Lustria","category":"serif","variants":["regular"]},{"family":"Macondo","category":"display","variants":["regular"]},{"family":"Macondo Swash Caps","category":"display","variants":["regular"]},{"family":"Magra","category":"sans-serif","variants":["regular","700"]},{"family":"Maiden Orange","category":"display","variants":["regular"]},{"family":"Mako","category":"sans-serif","variants":["regular"]},{"family":"Marcellus","category":"serif","variants":["regular"]},{"family":"Marcellus SC","category":"serif","variants":["regular"]},{"family":"Marck Script","category":"handwriting","variants":["regular"]},{"family":"Margarine","category":"display","variants":["regular"]},{"family":"Marko One","category":"serif","variants":["regular"]},{"family":"Marmelad","category":"sans-serif","variants":["regular"]},{"family":"Marvel","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Mate","category":"serif","variants":["regular","italic"]},{"family":"Mate SC","category":"serif","variants":["regular"]},{"family":"Maven Pro","category":"sans-serif","variants":["regular","500","700","900"]},{"family":"McLaren","category":"display","variants":["regular"]},{"family":"Meddon","category":"handwriting","variants":["regular"]},{"family":"MedievalSharp","category":"display","variants":["regular"]},{"family":"Medula One","category":"display","variants":["regular"]},{"family":"Megrim","category":"display","variants":["regular"]},{"family":"Meie Script","category":"handwriting","variants":["regular"]},{"family":"Merienda","category":"handwriting","variants":["regular","700"]},{"family":"Merienda One","category":"handwriting","variants":["regular"]},{"family":"Merriweather","category":"serif","variants":["300","300italic","regular","italic","700","700italic","900","900italic"]},{"family":"Merriweather Sans","category":"sans-serif","variants":["300","300italic","regular","italic","700","700italic","800","800italic"]},{"family":"Metal","category":"display","variants":["regular"]},{"family":"Metal Mania","category":"display","variants":["regular"]},{"family":"Metamorphous","category":"display","variants":["regular"]},{"family":"Metrophobic","category":"sans-serif","variants":["regular"]},{"family":"Michroma","category":"sans-serif","variants":["regular"]},{"family":"Milonga","category":"display","variants":["regular"]},{"family":"Miltonian","category":"display","variants":["regular"]},{"family":"Miltonian Tattoo","category":"display","variants":["regular"]},{"family":"Miniver","category":"display","variants":["regular"]},{"family":"Miss Fajardose","category":"handwriting","variants":["regular"]},{"family":"Modern Antiqua","category":"display","variants":["regular"]},{"family":"Molengo","category":"sans-serif","variants":["regular"]},{"family":"Molle","category":"handwriting","variants":["italic"]},{"family":"Monda","category":"sans-serif","variants":["regular","700"]},{"family":"Monofett","category":"display","variants":["regular"]},{"family":"Monoton","category":"display","variants":["regular"]},{"family":"Monsieur La Doulaise","category":"handwriting","variants":["regular"]},{"family":"Montaga","category":"serif","variants":["regular"]},{"family":"Montez","category":"handwriting","variants":["regular"]},{"family":"Montserrat","category":"sans-serif","variants":["regular","700"]},{"family":"Montserrat Alternates","category":"sans-serif","variants":["regular","700"]},{"family":"Montserrat Subrayada","category":"sans-serif","variants":["regular","700"]},{"family":"Moul","category":"display","variants":["regular"]},{"family":"Moulpali","category":"display","variants":["regular"]},{"family":"Mountains of Christmas","category":"display","variants":["regular","700"]},{"family":"Mouse Memoirs","category":"sans-serif","variants":["regular"]},{"family":"Mr Bedfort","category":"handwriting","variants":["regular"]},{"family":"Mr Dafoe","category":"handwriting","variants":["regular"]},{"family":"Mr De Haviland","category":"handwriting","variants":["regular"]},{"family":"Mrs Saint Delafield","category":"handwriting","variants":["regular"]},{"family":"Mrs Sheppards","category":"handwriting","variants":["regular"]},{"family":"Muli","category":"sans-serif","variants":["300","300italic","regular","italic"]},{"family":"Mystery Quest","category":"display","variants":["regular"]},{"family":"Neucha","category":"handwriting","variants":["regular"]},{"family":"Neuton","category":"serif","variants":["200","300","regular","italic","700","800"]},{"family":"New Rocker","category":"display","variants":["regular"]},{"family":"News Cycle","category":"sans-serif","variants":["regular","700"]},{"family":"Niconne","category":"handwriting","variants":["regular"]},{"family":"Nixie One","category":"display","variants":["regular"]},{"family":"Nobile","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Nokora","category":"serif","variants":["regular","700"]},{"family":"Norican","category":"handwriting","variants":["regular"]},{"family":"Nosifer","category":"display","variants":["regular"]},{"family":"Nothing You Could Do","category":"handwriting","variants":["regular"]},{"family":"Noticia Text","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Noto Sans","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Noto Serif","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Nova Cut","category":"display","variants":["regular"]},{"family":"Nova Flat","category":"display","variants":["regular"]},{"family":"Nova Mono","category":"monospace","variants":["regular"]},{"family":"Nova Oval","category":"display","variants":["regular"]},{"family":"Nova Round","category":"display","variants":["regular"]},{"family":"Nova Script","category":"display","variants":["regular"]},{"family":"Nova Slim","category":"display","variants":["regular"]},{"family":"Nova Square","category":"display","variants":["regular"]},{"family":"Numans","category":"sans-serif","variants":["regular"]},{"family":"Nunito","category":"sans-serif","variants":["300","regular","700"]},{"family":"Odor Mean Chey","category":"display","variants":["regular"]},{"family":"Offside","category":"display","variants":["regular"]},{"family":"Old Standard TT","category":"serif","variants":["regular","italic","700"]},{"family":"Oldenburg","category":"display","variants":["regular"]},{"family":"Oleo Script","category":"display","variants":["regular","700"]},{"family":"Oleo Script Swash Caps","category":"display","variants":["regular","700"]},{"family":"Open Sans","category":"sans-serif","variants":["300","300italic","regular","italic","600","600italic","700","700italic","800","800italic"]},{"family":"Open Sans Condensed","category":"sans-serif","variants":["300","300italic","700"]},{"family":"Oranienbaum","category":"serif","variants":["regular"]},{"family":"Orbitron","category":"sans-serif","variants":["regular","500","700","900"]},{"family":"Oregano","category":"display","variants":["regular","italic"]},{"family":"Orienta","category":"sans-serif","variants":["regular"]},{"family":"Original Surfer","category":"display","variants":["regular"]},{"family":"Oswald","category":"sans-serif","variants":["300","regular","700"]},{"family":"Over the Rainbow","category":"handwriting","variants":["regular"]},{"family":"Overlock","category":"display","variants":["regular","italic","700","700italic","900","900italic"]},{"family":"Overlock SC","category":"display","variants":["regular"]},{"family":"Ovo","category":"serif","variants":["regular"]},{"family":"Oxygen","category":"sans-serif","variants":["300","regular","700"]},{"family":"Oxygen Mono","category":"monospace","variants":["regular"]},{"family":"PT Mono","category":"monospace","variants":["regular"]},{"family":"PT Sans","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"PT Sans Caption","category":"sans-serif","variants":["regular","700"]},{"family":"PT Sans Narrow","category":"sans-serif","variants":["regular","700"]},{"family":"PT Serif","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"PT Serif Caption","category":"serif","variants":["regular","italic"]},{"family":"Pacifico","category":"handwriting","variants":["regular"]},{"family":"Paprika","category":"display","variants":["regular"]},{"family":"Parisienne","category":"handwriting","variants":["regular"]},{"family":"Passero One","category":"display","variants":["regular"]},{"family":"Passion One","category":"display","variants":["regular","700","900"]},{"family":"Pathway Gothic One","category":"sans-serif","variants":["regular"]},{"family":"Patrick Hand","category":"handwriting","variants":["regular"]},{"family":"Patrick Hand SC","category":"handwriting","variants":["regular"]},{"family":"Patua One","category":"display","variants":["regular"]},{"family":"Paytone One","category":"sans-serif","variants":["regular"]},{"family":"Peralta","category":"display","variants":["regular"]},{"family":"Permanent Marker","category":"handwriting","variants":["regular"]},{"family":"Petit Formal Script","category":"handwriting","variants":["regular"]},{"family":"Petrona","category":"serif","variants":["regular"]},{"family":"Philosopher","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Piedra","category":"display","variants":["regular"]},{"family":"Pinyon Script","category":"handwriting","variants":["regular"]},{"family":"Pirata One","category":"display","variants":["regular"]},{"family":"Plaster","category":"display","variants":["regular"]},{"family":"Play","category":"sans-serif","variants":["regular","700"]},{"family":"Playball","category":"display","variants":["regular"]},{"family":"Playfair Display","category":"serif","variants":["regular","italic","700","700italic","900","900italic"]},{"family":"Playfair Display SC","category":"serif","variants":["regular","italic","700","700italic","900","900italic"]},{"family":"Podkova","category":"serif","variants":["regular","700"]},{"family":"Poiret One","category":"display","variants":["regular"]},{"family":"Poller One","category":"display","variants":["regular"]},{"family":"Poly","category":"serif","variants":["regular","italic"]},{"family":"Pompiere","category":"display","variants":["regular"]},{"family":"Pontano Sans","category":"sans-serif","variants":["regular"]},{"family":"Port Lligat Sans","category":"sans-serif","variants":["regular"]},{"family":"Port Lligat Slab","category":"serif","variants":["regular"]},{"family":"Prata","category":"serif","variants":["regular"]},{"family":"Preahvihear","category":"display","variants":["regular"]},{"family":"Press Start 2P","category":"display","variants":["regular"]},{"family":"Princess Sofia","category":"handwriting","variants":["regular"]},{"family":"Prociono","category":"serif","variants":["regular"]},{"family":"Prosto One","category":"display","variants":["regular"]},{"family":"Puritan","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Purple Purse","category":"display","variants":["regular"]},{"family":"Quando","category":"serif","variants":["regular"]},{"family":"Quantico","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Quattrocento","category":"serif","variants":["regular","700"]},{"family":"Quattrocento Sans","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Questrial","category":"sans-serif","variants":["regular"]},{"family":"Quicksand","category":"sans-serif","variants":["300","regular","700"]},{"family":"Quintessential","category":"handwriting","variants":["regular"]},{"family":"Qwigley","category":"handwriting","variants":["regular"]},{"family":"Racing Sans One","category":"display","variants":["regular"]},{"family":"Radley","category":"serif","variants":["regular","italic"]},{"family":"Raleway","category":"sans-serif","variants":["100","200","300","regular","500","600","700","800","900"]},{"family":"Raleway Dots","category":"display","variants":["regular"]},{"family":"Rambla","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Rammetto One","category":"display","variants":["regular"]},{"family":"Ranchers","category":"display","variants":["regular"]},{"family":"Rancho","category":"handwriting","variants":["regular"]},{"family":"Rationale","category":"sans-serif","variants":["regular"]},{"family":"Redressed","category":"handwriting","variants":["regular"]},{"family":"Reenie Beanie","category":"handwriting","variants":["regular"]},{"family":"Revalia","category":"display","variants":["regular"]},{"family":"Ribeye","category":"display","variants":["regular"]},{"family":"Ribeye Marrow","category":"display","variants":["regular"]},{"family":"Righteous","category":"display","variants":["regular"]},{"family":"Risque","category":"display","variants":["regular"]},{"family":"Roboto","category":"sans-serif","variants":["100","100italic","300","300italic","regular","italic","500","500italic","700","700italic","900","900italic"]},{"family":"Roboto Condensed","category":"sans-serif","variants":["300","300italic","regular","italic","700","700italic"]},{"family":"Roboto Slab","category":"serif","variants":["100","300","regular","700"]},{"family":"Rochester","category":"handwriting","variants":["regular"]},{"family":"Rock Salt","category":"handwriting","variants":["regular"]},{"family":"Rokkitt","category":"serif","variants":["regular","700"]},{"family":"Romanesco","category":"handwriting","variants":["regular"]},{"family":"Ropa Sans","category":"sans-serif","variants":["regular","italic"]},{"family":"Rosario","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Rosarivo","category":"serif","variants":["regular","italic"]},{"family":"Rouge Script","category":"handwriting","variants":["regular"]},{"family":"Rubik Mono One","category":"sans-serif","variants":["regular"]},{"family":"Rubik One","category":"sans-serif","variants":["regular"]},{"family":"Ruda","category":"sans-serif","variants":["regular","700","900"]},{"family":"Rufina","category":"serif","variants":["regular","700"]},{"family":"Ruge Boogie","category":"handwriting","variants":["regular"]},{"family":"Ruluko","category":"sans-serif","variants":["regular"]},{"family":"Rum Raisin","category":"sans-serif","variants":["regular"]},{"family":"Ruslan Display","category":"display","variants":["regular"]},{"family":"Russo One","category":"sans-serif","variants":["regular"]},{"family":"Ruthie","category":"handwriting","variants":["regular"]},{"family":"Rye","category":"display","variants":["regular"]},{"family":"Sacramento","category":"handwriting","variants":["regular"]},{"family":"Sail","category":"display","variants":["regular"]},{"family":"Salsa","category":"display","variants":["regular"]},{"family":"Sanchez","category":"serif","variants":["regular","italic"]},{"family":"Sancreek","category":"display","variants":["regular"]},{"family":"Sansita One","category":"display","variants":["regular"]},{"family":"Sarina","category":"display","variants":["regular"]},{"family":"Satisfy","category":"handwriting","variants":["regular"]},{"family":"Scada","category":"sans-serif","variants":["regular","italic","700","700italic"]},{"family":"Schoolbell","category":"handwriting","variants":["regular"]},{"family":"Seaweed Script","category":"display","variants":["regular"]},{"family":"Sevillana","category":"display","variants":["regular"]},{"family":"Seymour One","category":"sans-serif","variants":["regular"]},{"family":"Shadows Into Light","category":"handwriting","variants":["regular"]},{"family":"Shadows Into Light Two","category":"handwriting","variants":["regular"]},{"family":"Shanti","category":"sans-serif","variants":["regular"]},{"family":"Share","category":"display","variants":["regular","italic","700","700italic"]},{"family":"Share Tech","category":"sans-serif","variants":["regular"]},{"family":"Share Tech Mono","category":"monospace","variants":["regular"]},{"family":"Shojumaru","category":"display","variants":["regular"]},{"family":"Short Stack","category":"handwriting","variants":["regular"]},{"family":"Siemreap","category":"display","variants":["regular"]},{"family":"Sigmar One","category":"display","variants":["regular"]},{"family":"Signika","category":"sans-serif","variants":["300","regular","600","700"]},{"family":"Signika Negative","category":"sans-serif","variants":["300","regular","600","700"]},{"family":"Simonetta","category":"display","variants":["regular","italic","900","900italic"]},{"family":"Sintony","category":"sans-serif","variants":["regular","700"]},{"family":"Sirin Stencil","category":"display","variants":["regular"]},{"family":"Six Caps","category":"sans-serif","variants":["regular"]},{"family":"Skranji","category":"display","variants":["regular","700"]},{"family":"Slackey","category":"display","variants":["regular"]},{"family":"Smokum","category":"display","variants":["regular"]},{"family":"Smythe","category":"display","variants":["regular"]},{"family":"Sniglet","category":"display","variants":["regular","800"]},{"family":"Snippet","category":"sans-serif","variants":["regular"]},{"family":"Snowburst One","category":"display","variants":["regular"]},{"family":"Sofadi One","category":"display","variants":["regular"]},{"family":"Sofia","category":"handwriting","variants":["regular"]},{"family":"Sonsie One","category":"display","variants":["regular"]},{"family":"Sorts Mill Goudy","category":"serif","variants":["regular","italic"]},{"family":"Source Code Pro","category":"monospace","variants":["200","300","regular","500","600","700","900"]},{"family":"Source Sans Pro","category":"sans-serif","variants":["200","200italic","300","300italic","regular","italic","600","600italic","700","700italic","900","900italic"]},{"family":"Special Elite","category":"display","variants":["regular"]},{"family":"Spicy Rice","category":"display","variants":["regular"]},{"family":"Spinnaker","category":"sans-serif","variants":["regular"]},{"family":"Spirax","category":"display","variants":["regular"]},{"family":"Squada One","category":"display","variants":["regular"]},{"family":"Stalemate","category":"handwriting","variants":["regular"]},{"family":"Stalinist One","category":"display","variants":["regular"]},{"family":"Stardos Stencil","category":"display","variants":["regular","700"]},{"family":"Stint Ultra Condensed","category":"display","variants":["regular"]},{"family":"Stint Ultra Expanded","category":"display","variants":["regular"]},{"family":"Stoke","category":"serif","variants":["300","regular"]},{"family":"Strait","category":"sans-serif","variants":["regular"]},{"family":"Sue Ellen Francisco","category":"handwriting","variants":["regular"]},{"family":"Sunshiney","category":"handwriting","variants":["regular"]},{"family":"Supermercado One","category":"display","variants":["regular"]},{"family":"Suwannaphum","category":"display","variants":["regular"]},{"family":"Swanky and Moo Moo","category":"handwriting","variants":["regular"]},{"family":"Syncopate","category":"sans-serif","variants":["regular","700"]},{"family":"Tangerine","category":"handwriting","variants":["regular","700"]},{"family":"Taprom","category":"display","variants":["regular"]},{"family":"Tauri","category":"sans-serif","variants":["regular"]},{"family":"Telex","category":"sans-serif","variants":["regular"]},{"family":"Tenor Sans","category":"sans-serif","variants":["regular"]},{"family":"Text Me One","category":"sans-serif","variants":["regular"]},{"family":"The Girl Next Door","category":"handwriting","variants":["regular"]},{"family":"Tienne","category":"serif","variants":["regular","700","900"]},{"family":"Tinos","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Titan One","category":"display","variants":["regular"]},{"family":"Titillium Web","category":"sans-serif","variants":["200","200italic","300","300italic","regular","italic","600","600italic","700","700italic","900"]},{"family":"Trade Winds","category":"display","variants":["regular"]},{"family":"Trocchi","category":"serif","variants":["regular"]},{"family":"Trochut","category":"display","variants":["regular","italic","700"]},{"family":"Trykker","category":"serif","variants":["regular"]},{"family":"Tulpen One","category":"display","variants":["regular"]},{"family":"Ubuntu","category":"sans-serif","variants":["300","300italic","regular","italic","500","500italic","700","700italic"]},{"family":"Ubuntu Condensed","category":"sans-serif","variants":["regular"]},{"family":"Ubuntu Mono","category":"monospace","variants":["regular","italic","700","700italic"]},{"family":"Ultra","category":"serif","variants":["regular"]},{"family":"Uncial Antiqua","category":"display","variants":["regular"]},{"family":"Underdog","category":"display","variants":["regular"]},{"family":"Unica One","category":"display","variants":["regular"]},{"family":"UnifrakturCook","category":"display","variants":["700"]},{"family":"UnifrakturMaguntia","category":"display","variants":["regular"]},{"family":"Unkempt","category":"display","variants":["regular","700"]},{"family":"Unlock","category":"display","variants":["regular"]},{"family":"Unna","category":"serif","variants":["regular"]},{"family":"VT323","category":"monospace","variants":["regular"]},{"family":"Vampiro One","category":"display","variants":["regular"]},{"family":"Varela","category":"sans-serif","variants":["regular"]},{"family":"Varela Round","category":"sans-serif","variants":["regular"]},{"family":"Vast Shadow","category":"display","variants":["regular"]},{"family":"Vibur","category":"handwriting","variants":["regular"]},{"family":"Vidaloka","category":"serif","variants":["regular"]},{"family":"Viga","category":"sans-serif","variants":["regular"]},{"family":"Voces","category":"display","variants":["regular"]},{"family":"Volkhov","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Vollkorn","category":"serif","variants":["regular","italic","700","700italic"]},{"family":"Voltaire","category":"sans-serif","variants":["regular"]},{"family":"Waiting for the Sunrise","category":"handwriting","variants":["regular"]},{"family":"Wallpoet","category":"display","variants":["regular"]},{"family":"Walter Turncoat","category":"handwriting","variants":["regular"]},{"family":"Warnes","category":"display","variants":["regular"]},{"family":"Wellfleet","category":"display","variants":["regular"]},{"family":"Wendy One","category":"sans-serif","variants":["regular"]},{"family":"Wire One","category":"sans-serif","variants":["regular"]},{"family":"Yanone Kaffeesatz","category":"sans-serif","variants":["200","300","regular","700"]},{"family":"Yellowtail","category":"handwriting","variants":["regular"]},{"family":"Yeseva One","category":"display","variants":["regular"]},{"family":"Yesteryear","category":"handwriting","variants":["regular"]},{"family":"Zeyada","category":"handwriting","variants":["regular"]}]';
}
