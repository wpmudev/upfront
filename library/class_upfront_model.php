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

		if(isset($stored_current_screen))
			$current_screen = $current_screen::get($stored_current_screen);

		$cascade = self::get_entity_ids(self::get_entity_cascade($query));

		return $cascade;
	}

	public static function layout_to_name ($layout_ids) {
		$type = $layout_ids['type'];
		$item = $layout_ids['item'] ? preg_replace("/^{$type}-/", "", $layout_ids['item']) : "";
		$specificity = $layout_ids['specificity'] ? preg_replace("/^{$type}-{$item}-/", "", $layout_ids['specificity']) : "";
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
		if ( current_user_can('switch_themes') && ($_GET['dev'] || $dev_first) ){
			// try loading for dev stored layout first
			$dev_storage_key = $storage_key ? $storage_key : self::get_storage_key();
			if ( !preg_match("/_dev$/", $dev_storage_key) ){
				$dev_storage_key .= '_dev';
				$layout = self::from_entity_ids($cascade, $dev_storage_key);
				if (!$layout->is_empty())
					return $layout;
			}
		}
		self::set_storage_key($storage_key);
		$storage_key = self::get_storage_key();
		$order = array('specificity', 'item', 'type');
		foreach ($order as $o) {
			if (!$cascade[$o]) 
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
		return json_decode( get_option(self::_get_layout_properties_id(), json_encode(array())), true );
	}
	
	protected static function _apply_scoped_region ($region) {
		$regions = array();
		if ( $region['scope'] != 'local' ){
			if ( !self::$scope_data[$region['scope']] )
				self::$scope_data[$region['scope']] = json_decode( get_option(self::_get_scope_id($region['scope']), json_encode(array())), true );
			if ( empty(self::$scope_data[$region['scope']]) ){
				$regions[] = $region;
				return $regions;
			}
			foreach ( self::$scope_data[$region['scope']] as $scope => $data ) {
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
			)
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
			foreach ( $this->_data['regions'] as $region ){
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
				'post_content' => '',
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