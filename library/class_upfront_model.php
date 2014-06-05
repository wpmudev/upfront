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
	 * Lists available font names.
	 * @return array
	 */
	public function get_names () {
		static $all = array();
		if (empty($all)) $all = $this->get_all();
		return wp_list_pluck($all, 'name');
	}

	/**
	 * Lists available font families.
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
		$names = $this->get_names();
		return in_array($font, $names);
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

	private static $_cached_list = '[{"name":"ABeeZee","family":"sans-serif"},{"name":"Abel","family":"sans-serif"},{"name":"Abril Fatface","family":"display"},{"name":"Aclonica","family":"sans-serif"},{"name":"Acme","family":"sans-serif"},{"name":"Actor","family":"sans-serif"},{"name":"Adamina","family":"serif"},{"name":"Advent Pro","family":"sans-serif"},{"name":"Aguafina Script","family":"handwriting"},{"name":"Akronim","family":"display"},{"name":"Aladin","family":"handwriting"},{"name":"Aldrich","family":"sans-serif"},{"name":"Alef","family":"sans-serif"},{"name":"Alegreya","family":"serif"},{"name":"Alegreya SC","family":"serif"},{"name":"Alegreya Sans","family":"sans-serif"},{"name":"Alegreya Sans SC","family":"sans-serif"},{"name":"Alex Brush","family":"handwriting"},{"name":"Alfa Slab One","family":"display"},{"name":"Alice","family":"serif"},{"name":"Alike","family":"serif"},{"name":"Alike Angular","family":"serif"},{"name":"Allan","family":"display"},{"name":"Allerta","family":"sans-serif"},{"name":"Allerta Stencil","family":"sans-serif"},{"name":"Allura","family":"handwriting"},{"name":"Almendra","family":"serif"},{"name":"Almendra Display","family":"display"},{"name":"Almendra SC","family":"serif"},{"name":"Amarante","family":"display"},{"name":"Amaranth","family":"sans-serif"},{"name":"Amatic SC","family":"handwriting"},{"name":"Amethysta","family":"serif"},{"name":"Anaheim","family":"sans-serif"},{"name":"Andada","family":"serif"},{"name":"Andika","family":"sans-serif"},{"name":"Angkor","family":"display"},{"name":"Annie Use Your Telescope","family":"handwriting"},{"name":"Anonymous Pro","family":"monospace"},{"name":"Antic","family":"sans-serif"},{"name":"Antic Didone","family":"serif"},{"name":"Antic Slab","family":"serif"},{"name":"Anton","family":"sans-serif"},{"name":"Arapey","family":"serif"},{"name":"Arbutus","family":"display"},{"name":"Arbutus Slab","family":"serif"},{"name":"Architects Daughter","family":"handwriting"},{"name":"Archivo Black","family":"sans-serif"},{"name":"Archivo Narrow","family":"sans-serif"},{"name":"Arimo","family":"sans-serif"},{"name":"Arizonia","family":"handwriting"},{"name":"Armata","family":"sans-serif"},{"name":"Artifika","family":"serif"},{"name":"Arvo","family":"serif"},{"name":"Asap","family":"sans-serif"},{"name":"Asset","family":"display"},{"name":"Astloch","family":"display"},{"name":"Asul","family":"sans-serif"},{"name":"Atomic Age","family":"display"},{"name":"Aubrey","family":"display"},{"name":"Audiowide","family":"display"},{"name":"Autour One","family":"display"},{"name":"Average","family":"serif"},{"name":"Average Sans","family":"sans-serif"},{"name":"Averia Gruesa Libre","family":"display"},{"name":"Averia Libre","family":"display"},{"name":"Averia Sans Libre","family":"display"},{"name":"Averia Serif Libre","family":"display"},{"name":"Bad Script","family":"handwriting"},{"name":"Balthazar","family":"serif"},{"name":"Bangers","family":"display"},{"name":"Basic","family":"sans-serif"},{"name":"Battambang","family":"display"},{"name":"Baumans","family":"display"},{"name":"Bayon","family":"display"},{"name":"Belgrano","family":"serif"},{"name":"Belleza","family":"sans-serif"},{"name":"BenchNine","family":"sans-serif"},{"name":"Bentham","family":"serif"},{"name":"Berkshire Swash","family":"handwriting"},{"name":"Bevan","family":"display"},{"name":"Bigelow Rules","family":"display"},{"name":"Bigshot One","family":"display"},{"name":"Bilbo","family":"handwriting"},{"name":"Bilbo Swash Caps","family":"handwriting"},{"name":"Bitter","family":"serif"},{"name":"Black Ops One","family":"display"},{"name":"Bokor","family":"display"},{"name":"Bonbon","family":"handwriting"},{"name":"Boogaloo","family":"display"},{"name":"Bowlby One","family":"display"},{"name":"Bowlby One SC","family":"display"},{"name":"Brawler","family":"serif"},{"name":"Bree Serif","family":"serif"},{"name":"Bubblegum Sans","family":"display"},{"name":"Bubbler One","family":"sans-serif"},{"name":"Buda","family":"display"},{"name":"Buenard","family":"serif"},{"name":"Butcherman","family":"display"},{"name":"Butterfly Kids","family":"handwriting"},{"name":"Cabin","family":"sans-serif"},{"name":"Cabin Condensed","family":"sans-serif"},{"name":"Cabin Sketch","family":"display"},{"name":"Caesar Dressing","family":"display"},{"name":"Cagliostro","family":"sans-serif"},{"name":"Calligraffitti","family":"handwriting"},{"name":"Cambo","family":"serif"},{"name":"Candal","family":"sans-serif"},{"name":"Cantarell","family":"sans-serif"},{"name":"Cantata One","family":"serif"},{"name":"Cantora One","family":"sans-serif"},{"name":"Capriola","family":"sans-serif"},{"name":"Cardo","family":"serif"},{"name":"Carme","family":"sans-serif"},{"name":"Carrois Gothic","family":"sans-serif"},{"name":"Carrois Gothic SC","family":"sans-serif"},{"name":"Carter One","family":"display"},{"name":"Caudex","family":"serif"},{"name":"Cedarville Cursive","family":"handwriting"},{"name":"Ceviche One","family":"display"},{"name":"Changa One","family":"display"},{"name":"Chango","family":"display"},{"name":"Chau Philomene One","family":"sans-serif"},{"name":"Chela One","family":"display"},{"name":"Chelsea Market","family":"display"},{"name":"Chenla","family":"display"},{"name":"Cherry Cream Soda","family":"display"},{"name":"Cherry Swash","family":"display"},{"name":"Chewy","family":"display"},{"name":"Chicle","family":"display"},{"name":"Chivo","family":"sans-serif"},{"name":"Cinzel","family":"serif"},{"name":"Cinzel Decorative","family":"display"},{"name":"Clicker Script","family":"handwriting"},{"name":"Coda","family":"display"},{"name":"Coda Caption","family":"sans-serif"},{"name":"Codystar","family":"display"},{"name":"Combo","family":"display"},{"name":"Comfortaa","family":"display"},{"name":"Coming Soon","family":"handwriting"},{"name":"Concert One","family":"display"},{"name":"Condiment","family":"handwriting"},{"name":"Content","family":"display"},{"name":"Contrail One","family":"display"},{"name":"Convergence","family":"sans-serif"},{"name":"Cookie","family":"handwriting"},{"name":"Copse","family":"serif"},{"name":"Corben","family":"display"},{"name":"Courgette","family":"handwriting"},{"name":"Cousine","family":"monospace"},{"name":"Coustard","family":"serif"},{"name":"Covered By Your Grace","family":"handwriting"},{"name":"Crafty Girls","family":"handwriting"},{"name":"Creepster","family":"display"},{"name":"Crete Round","family":"serif"},{"name":"Crimson Text","family":"serif"},{"name":"Croissant One","family":"display"},{"name":"Crushed","family":"display"},{"name":"Cuprum","family":"sans-serif"},{"name":"Cutive","family":"serif"},{"name":"Cutive Mono","family":"monospace"},{"name":"Damion","family":"handwriting"},{"name":"Dancing Script","family":"handwriting"},{"name":"Dangrek","family":"display"},{"name":"Dawning of a New Day","family":"handwriting"},{"name":"Days One","family":"sans-serif"},{"name":"Delius","family":"handwriting"},{"name":"Delius Swash Caps","family":"handwriting"},{"name":"Delius Unicase","family":"handwriting"},{"name":"Della Respira","family":"serif"},{"name":"Denk One","family":"sans-serif"},{"name":"Devonshire","family":"handwriting"},{"name":"Didact Gothic","family":"sans-serif"},{"name":"Diplomata","family":"display"},{"name":"Diplomata SC","family":"display"},{"name":"Domine","family":"serif"},{"name":"Donegal One","family":"serif"},{"name":"Doppio One","family":"sans-serif"},{"name":"Dorsa","family":"sans-serif"},{"name":"Dosis","family":"sans-serif"},{"name":"Dr Sugiyama","family":"handwriting"},{"name":"Droid Sans","family":"sans-serif"},{"name":"Droid Sans Mono","family":"monospace"},{"name":"Droid Serif","family":"serif"},{"name":"Duru Sans","family":"sans-serif"},{"name":"Dynalight","family":"display"},{"name":"EB Garamond","family":"serif"},{"name":"Eagle Lake","family":"handwriting"},{"name":"Eater","family":"display"},{"name":"Economica","family":"sans-serif"},{"name":"Electrolize","family":"sans-serif"},{"name":"Elsie","family":"display"},{"name":"Elsie Swash Caps","family":"display"},{"name":"Emblema One","family":"display"},{"name":"Emilys Candy","family":"display"},{"name":"Engagement","family":"handwriting"},{"name":"Englebert","family":"sans-serif"},{"name":"Enriqueta","family":"serif"},{"name":"Erica One","family":"display"},{"name":"Esteban","family":"serif"},{"name":"Euphoria Script","family":"handwriting"},{"name":"Ewert","family":"display"},{"name":"Exo","family":"sans-serif"},{"name":"Exo 2","family":"sans-serif"},{"name":"Expletus Sans","family":"display"},{"name":"Fanwood Text","family":"serif"},{"name":"Fascinate","family":"display"},{"name":"Fascinate Inline","family":"display"},{"name":"Faster One","family":"display"},{"name":"Fasthand","family":"serif"},{"name":"Fauna One","family":"serif"},{"name":"Federant","family":"display"},{"name":"Federo","family":"sans-serif"},{"name":"Felipa","family":"handwriting"},{"name":"Fenix","family":"serif"},{"name":"Finger Paint","family":"display"},{"name":"Fjalla One","family":"sans-serif"},{"name":"Fjord One","family":"serif"},{"name":"Flamenco","family":"display"},{"name":"Flavors","family":"display"},{"name":"Fondamento","family":"handwriting"},{"name":"Fontdiner Swanky","family":"display"},{"name":"Forum","family":"display"},{"name":"Francois One","family":"sans-serif"},{"name":"Freckle Face","family":"display"},{"name":"Fredericka the Great","family":"display"},{"name":"Fredoka One","family":"display"},{"name":"Freehand","family":"display"},{"name":"Fresca","family":"sans-serif"},{"name":"Frijole","family":"display"},{"name":"Fruktur","family":"display"},{"name":"Fugaz One","family":"display"},{"name":"GFS Didot","family":"serif"},{"name":"GFS Neohellenic","family":"sans-serif"},{"name":"Gabriela","family":"serif"},{"name":"Gafata","family":"sans-serif"},{"name":"Galdeano","family":"sans-serif"},{"name":"Galindo","family":"display"},{"name":"Gentium Basic","family":"serif"},{"name":"Gentium Book Basic","family":"serif"},{"name":"Geo","family":"sans-serif"},{"name":"Geostar","family":"display"},{"name":"Geostar Fill","family":"display"},{"name":"Germania One","family":"display"},{"name":"Gilda Display","family":"serif"},{"name":"Give You Glory","family":"handwriting"},{"name":"Glass Antiqua","family":"display"},{"name":"Glegoo","family":"serif"},{"name":"Gloria Hallelujah","family":"handwriting"},{"name":"Goblin One","family":"display"},{"name":"Gochi Hand","family":"handwriting"},{"name":"Gorditas","family":"display"},{"name":"Goudy Bookletter 1911","family":"serif"},{"name":"Graduate","family":"display"},{"name":"Grand Hotel","family":"handwriting"},{"name":"Gravitas One","family":"display"},{"name":"Great Vibes","family":"handwriting"},{"name":"Griffy","family":"display"},{"name":"Gruppo","family":"display"},{"name":"Gudea","family":"sans-serif"},{"name":"Habibi","family":"serif"},{"name":"Hammersmith One","family":"sans-serif"},{"name":"Hanalei","family":"display"},{"name":"Hanalei Fill","family":"display"},{"name":"Handlee","family":"handwriting"},{"name":"Hanuman","family":"serif"},{"name":"Happy Monkey","family":"display"},{"name":"Headland One","family":"serif"},{"name":"Henny Penny","family":"display"},{"name":"Herr Von Muellerhoff","family":"handwriting"},{"name":"Holtwood One SC","family":"serif"},{"name":"Homemade Apple","family":"handwriting"},{"name":"Homenaje","family":"sans-serif"},{"name":"IM Fell DW Pica","family":"serif"},{"name":"IM Fell DW Pica SC","family":"serif"},{"name":"IM Fell Double Pica","family":"serif"},{"name":"IM Fell Double Pica SC","family":"serif"},{"name":"IM Fell English","family":"serif"},{"name":"IM Fell English SC","family":"serif"},{"name":"IM Fell French Canon","family":"serif"},{"name":"IM Fell French Canon SC","family":"serif"},{"name":"IM Fell Great Primer","family":"serif"},{"name":"IM Fell Great Primer SC","family":"serif"},{"name":"Iceberg","family":"display"},{"name":"Iceland","family":"display"},{"name":"Imprima","family":"sans-serif"},{"name":"Inconsolata","family":"monospace"},{"name":"Inder","family":"sans-serif"},{"name":"Indie Flower","family":"handwriting"},{"name":"Inika","family":"serif"},{"name":"Irish Grover","family":"display"},{"name":"Istok Web","family":"sans-serif"},{"name":"Italiana","family":"serif"},{"name":"Italianno","family":"handwriting"},{"name":"Jacques Francois","family":"serif"},{"name":"Jacques Francois Shadow","family":"display"},{"name":"Jim Nightshade","family":"handwriting"},{"name":"Jockey One","family":"sans-serif"},{"name":"Jolly Lodger","family":"display"},{"name":"Josefin Sans","family":"sans-serif"},{"name":"Josefin Slab","family":"serif"},{"name":"Joti One","family":"display"},{"name":"Judson","family":"serif"},{"name":"Julee","family":"handwriting"},{"name":"Julius Sans One","family":"sans-serif"},{"name":"Junge","family":"serif"},{"name":"Jura","family":"sans-serif"},{"name":"Just Another Hand","family":"handwriting"},{"name":"Just Me Again Down Here","family":"handwriting"},{"name":"Kameron","family":"serif"},{"name":"Kantumruy","family":"sans-serif"},{"name":"Karla","family":"sans-serif"},{"name":"Kaushan Script","family":"handwriting"},{"name":"Kavoon","family":"display"},{"name":"Kdam Thmor","family":"display"},{"name":"Keania One","family":"display"},{"name":"Kelly Slab","family":"display"},{"name":"Kenia","family":"display"},{"name":"Khmer","family":"display"},{"name":"Kite One","family":"sans-serif"},{"name":"Knewave","family":"display"},{"name":"Kotta One","family":"serif"},{"name":"Koulen","family":"display"},{"name":"Kranky","family":"display"},{"name":"Kreon","family":"serif"},{"name":"Kristi","family":"handwriting"},{"name":"Krona One","family":"sans-serif"},{"name":"La Belle Aurore","family":"handwriting"},{"name":"Lancelot","family":"display"},{"name":"Lato","family":"sans-serif"},{"name":"League Script","family":"handwriting"},{"name":"Leckerli One","family":"handwriting"},{"name":"Ledger","family":"serif"},{"name":"Lekton","family":"sans-serif"},{"name":"Lemon","family":"display"},{"name":"Libre Baskerville","family":"serif"},{"name":"Life Savers","family":"display"},{"name":"Lilita One","family":"display"},{"name":"Lily Script One","family":"display"},{"name":"Limelight","family":"display"},{"name":"Linden Hill","family":"serif"},{"name":"Lobster","family":"display"},{"name":"Lobster Two","family":"display"},{"name":"Londrina Outline","family":"display"},{"name":"Londrina Shadow","family":"display"},{"name":"Londrina Sketch","family":"display"},{"name":"Londrina Solid","family":"display"},{"name":"Lora","family":"serif"},{"name":"Love Ya Like A Sister","family":"display"},{"name":"Loved by the King","family":"handwriting"},{"name":"Lovers Quarrel","family":"handwriting"},{"name":"Luckiest Guy","family":"display"},{"name":"Lusitana","family":"serif"},{"name":"Lustria","family":"serif"},{"name":"Macondo","family":"display"},{"name":"Macondo Swash Caps","family":"display"},{"name":"Magra","family":"sans-serif"},{"name":"Maiden Orange","family":"display"},{"name":"Mako","family":"sans-serif"},{"name":"Marcellus","family":"serif"},{"name":"Marcellus SC","family":"serif"},{"name":"Marck Script","family":"handwriting"},{"name":"Margarine","family":"display"},{"name":"Marko One","family":"serif"},{"name":"Marmelad","family":"sans-serif"},{"name":"Marvel","family":"sans-serif"},{"name":"Mate","family":"serif"},{"name":"Mate SC","family":"serif"},{"name":"Maven Pro","family":"sans-serif"},{"name":"McLaren","family":"display"},{"name":"Meddon","family":"handwriting"},{"name":"MedievalSharp","family":"display"},{"name":"Medula One","family":"display"},{"name":"Megrim","family":"display"},{"name":"Meie Script","family":"handwriting"},{"name":"Merienda","family":"handwriting"},{"name":"Merienda One","family":"handwriting"},{"name":"Merriweather","family":"serif"},{"name":"Merriweather Sans","family":"sans-serif"},{"name":"Metal","family":"display"},{"name":"Metal Mania","family":"display"},{"name":"Metamorphous","family":"display"},{"name":"Metrophobic","family":"sans-serif"},{"name":"Michroma","family":"sans-serif"},{"name":"Milonga","family":"display"},{"name":"Miltonian","family":"display"},{"name":"Miltonian Tattoo","family":"display"},{"name":"Miniver","family":"display"},{"name":"Miss Fajardose","family":"handwriting"},{"name":"Modern Antiqua","family":"display"},{"name":"Molengo","family":"sans-serif"},{"name":"Molle","family":"handwriting"},{"name":"Monda","family":"sans-serif"},{"name":"Monofett","family":"display"},{"name":"Monoton","family":"display"},{"name":"Monsieur La Doulaise","family":"handwriting"},{"name":"Montaga","family":"serif"},{"name":"Montez","family":"handwriting"},{"name":"Montserrat","family":"sans-serif"},{"name":"Montserrat Alternates","family":"sans-serif"},{"name":"Montserrat Subrayada","family":"sans-serif"},{"name":"Moul","family":"display"},{"name":"Moulpali","family":"display"},{"name":"Mountains of Christmas","family":"display"},{"name":"Mouse Memoirs","family":"sans-serif"},{"name":"Mr Bedfort","family":"handwriting"},{"name":"Mr Dafoe","family":"handwriting"},{"name":"Mr De Haviland","family":"handwriting"},{"name":"Mrs Saint Delafield","family":"handwriting"},{"name":"Mrs Sheppards","family":"handwriting"},{"name":"Muli","family":"sans-serif"},{"name":"Mystery Quest","family":"display"},{"name":"Neucha","family":"handwriting"},{"name":"Neuton","family":"serif"},{"name":"New Rocker","family":"display"},{"name":"News Cycle","family":"sans-serif"},{"name":"Niconne","family":"handwriting"},{"name":"Nixie One","family":"display"},{"name":"Nobile","family":"sans-serif"},{"name":"Nokora","family":"serif"},{"name":"Norican","family":"handwriting"},{"name":"Nosifer","family":"display"},{"name":"Nothing You Could Do","family":"handwriting"},{"name":"Noticia Text","family":"serif"},{"name":"Noto Sans","family":"sans-serif"},{"name":"Noto Serif","family":"serif"},{"name":"Nova Cut","family":"display"},{"name":"Nova Flat","family":"display"},{"name":"Nova Mono","family":"monospace"},{"name":"Nova Oval","family":"display"},{"name":"Nova Round","family":"display"},{"name":"Nova Script","family":"display"},{"name":"Nova Slim","family":"display"},{"name":"Nova Square","family":"display"},{"name":"Numans","family":"sans-serif"},{"name":"Nunito","family":"sans-serif"},{"name":"Odor Mean Chey","family":"display"},{"name":"Offside","family":"display"},{"name":"Old Standard TT","family":"serif"},{"name":"Oldenburg","family":"display"},{"name":"Oleo Script","family":"display"},{"name":"Oleo Script Swash Caps","family":"display"},{"name":"Open Sans","family":"sans-serif"},{"name":"Open Sans Condensed","family":"sans-serif"},{"name":"Oranienbaum","family":"serif"},{"name":"Orbitron","family":"sans-serif"},{"name":"Oregano","family":"display"},{"name":"Orienta","family":"sans-serif"},{"name":"Original Surfer","family":"display"},{"name":"Oswald","family":"sans-serif"},{"name":"Over the Rainbow","family":"handwriting"},{"name":"Overlock","family":"display"},{"name":"Overlock SC","family":"display"},{"name":"Ovo","family":"serif"},{"name":"Oxygen","family":"sans-serif"},{"name":"Oxygen Mono","family":"monospace"},{"name":"PT Mono","family":"monospace"},{"name":"PT Sans","family":"sans-serif"},{"name":"PT Sans Caption","family":"sans-serif"},{"name":"PT Sans Narrow","family":"sans-serif"},{"name":"PT Serif","family":"serif"},{"name":"PT Serif Caption","family":"serif"},{"name":"Pacifico","family":"handwriting"},{"name":"Paprika","family":"display"},{"name":"Parisienne","family":"handwriting"},{"name":"Passero One","family":"display"},{"name":"Passion One","family":"display"},{"name":"Pathway Gothic One","family":"sans-serif"},{"name":"Patrick Hand","family":"handwriting"},{"name":"Patrick Hand SC","family":"handwriting"},{"name":"Patua One","family":"display"},{"name":"Paytone One","family":"sans-serif"},{"name":"Peralta","family":"display"},{"name":"Permanent Marker","family":"handwriting"},{"name":"Petit Formal Script","family":"handwriting"},{"name":"Petrona","family":"serif"},{"name":"Philosopher","family":"sans-serif"},{"name":"Piedra","family":"display"},{"name":"Pinyon Script","family":"handwriting"},{"name":"Pirata One","family":"display"},{"name":"Plaster","family":"display"},{"name":"Play","family":"sans-serif"},{"name":"Playball","family":"display"},{"name":"Playfair Display","family":"serif"},{"name":"Playfair Display SC","family":"serif"},{"name":"Podkova","family":"serif"},{"name":"Poiret One","family":"display"},{"name":"Poller One","family":"display"},{"name":"Poly","family":"serif"},{"name":"Pompiere","family":"display"},{"name":"Pontano Sans","family":"sans-serif"},{"name":"Port Lligat Sans","family":"sans-serif"},{"name":"Port Lligat Slab","family":"serif"},{"name":"Prata","family":"serif"},{"name":"Preahvihear","family":"display"},{"name":"Press Start 2P","family":"display"},{"name":"Princess Sofia","family":"handwriting"},{"name":"Prociono","family":"serif"},{"name":"Prosto One","family":"display"},{"name":"Puritan","family":"sans-serif"},{"name":"Purple Purse","family":"display"},{"name":"Quando","family":"serif"},{"name":"Quantico","family":"sans-serif"},{"name":"Quattrocento","family":"serif"},{"name":"Quattrocento Sans","family":"sans-serif"},{"name":"Questrial","family":"sans-serif"},{"name":"Quicksand","family":"sans-serif"},{"name":"Quintessential","family":"handwriting"},{"name":"Qwigley","family":"handwriting"},{"name":"Racing Sans One","family":"display"},{"name":"Radley","family":"serif"},{"name":"Raleway","family":"sans-serif"},{"name":"Raleway Dots","family":"display"},{"name":"Rambla","family":"sans-serif"},{"name":"Rammetto One","family":"display"},{"name":"Ranchers","family":"display"},{"name":"Rancho","family":"handwriting"},{"name":"Rationale","family":"sans-serif"},{"name":"Redressed","family":"handwriting"},{"name":"Reenie Beanie","family":"handwriting"},{"name":"Revalia","family":"display"},{"name":"Ribeye","family":"display"},{"name":"Ribeye Marrow","family":"display"},{"name":"Righteous","family":"display"},{"name":"Risque","family":"display"},{"name":"Roboto","family":"sans-serif"},{"name":"Roboto Condensed","family":"sans-serif"},{"name":"Roboto Slab","family":"serif"},{"name":"Rochester","family":"handwriting"},{"name":"Rock Salt","family":"handwriting"},{"name":"Rokkitt","family":"serif"},{"name":"Romanesco","family":"handwriting"},{"name":"Ropa Sans","family":"sans-serif"},{"name":"Rosario","family":"sans-serif"},{"name":"Rosarivo","family":"serif"},{"name":"Rouge Script","family":"handwriting"},{"name":"Rubik Mono One","family":"sans-serif"},{"name":"Rubik One","family":"sans-serif"},{"name":"Ruda","family":"sans-serif"},{"name":"Rufina","family":"serif"},{"name":"Ruge Boogie","family":"handwriting"},{"name":"Ruluko","family":"sans-serif"},{"name":"Rum Raisin","family":"sans-serif"},{"name":"Ruslan Display","family":"display"},{"name":"Russo One","family":"sans-serif"},{"name":"Ruthie","family":"handwriting"},{"name":"Rye","family":"display"},{"name":"Sacramento","family":"handwriting"},{"name":"Sail","family":"display"},{"name":"Salsa","family":"display"},{"name":"Sanchez","family":"serif"},{"name":"Sancreek","family":"display"},{"name":"Sansita One","family":"display"},{"name":"Sarina","family":"display"},{"name":"Satisfy","family":"handwriting"},{"name":"Scada","family":"sans-serif"},{"name":"Schoolbell","family":"handwriting"},{"name":"Seaweed Script","family":"display"},{"name":"Sevillana","family":"display"},{"name":"Seymour One","family":"sans-serif"},{"name":"Shadows Into Light","family":"handwriting"},{"name":"Shadows Into Light Two","family":"handwriting"},{"name":"Shanti","family":"sans-serif"},{"name":"Share","family":"display"},{"name":"Share Tech","family":"sans-serif"},{"name":"Share Tech Mono","family":"monospace"},{"name":"Shojumaru","family":"display"},{"name":"Short Stack","family":"handwriting"},{"name":"Siemreap","family":"display"},{"name":"Sigmar One","family":"display"},{"name":"Signika","family":"sans-serif"},{"name":"Signika Negative","family":"sans-serif"},{"name":"Simonetta","family":"display"},{"name":"Sintony","family":"sans-serif"},{"name":"Sirin Stencil","family":"display"},{"name":"Six Caps","family":"sans-serif"},{"name":"Skranji","family":"display"},{"name":"Slackey","family":"display"},{"name":"Smokum","family":"display"},{"name":"Smythe","family":"display"},{"name":"Sniglet","family":"display"},{"name":"Snippet","family":"sans-serif"},{"name":"Snowburst One","family":"display"},{"name":"Sofadi One","family":"display"},{"name":"Sofia","family":"handwriting"},{"name":"Sonsie One","family":"display"},{"name":"Sorts Mill Goudy","family":"serif"},{"name":"Source Code Pro","family":"monospace"},{"name":"Source Sans Pro","family":"sans-serif"},{"name":"Special Elite","family":"display"},{"name":"Spicy Rice","family":"display"},{"name":"Spinnaker","family":"sans-serif"},{"name":"Spirax","family":"display"},{"name":"Squada One","family":"display"},{"name":"Stalemate","family":"handwriting"},{"name":"Stalinist One","family":"display"},{"name":"Stardos Stencil","family":"display"},{"name":"Stint Ultra Condensed","family":"display"},{"name":"Stint Ultra Expanded","family":"display"},{"name":"Stoke","family":"serif"},{"name":"Strait","family":"sans-serif"},{"name":"Sue Ellen Francisco","family":"handwriting"},{"name":"Sunshiney","family":"handwriting"},{"name":"Supermercado One","family":"display"},{"name":"Suwannaphum","family":"display"},{"name":"Swanky and Moo Moo","family":"handwriting"},{"name":"Syncopate","family":"sans-serif"},{"name":"Tangerine","family":"handwriting"},{"name":"Taprom","family":"display"},{"name":"Tauri","family":"sans-serif"},{"name":"Telex","family":"sans-serif"},{"name":"Tenor Sans","family":"sans-serif"},{"name":"Text Me One","family":"sans-serif"},{"name":"The Girl Next Door","family":"handwriting"},{"name":"Tienne","family":"serif"},{"name":"Tinos","family":"serif"},{"name":"Titan One","family":"display"},{"name":"Titillium Web","family":"sans-serif"},{"name":"Trade Winds","family":"display"},{"name":"Trocchi","family":"serif"},{"name":"Trochut","family":"display"},{"name":"Trykker","family":"serif"},{"name":"Tulpen One","family":"display"},{"name":"Ubuntu","family":"sans-serif"},{"name":"Ubuntu Condensed","family":"sans-serif"},{"name":"Ubuntu Mono","family":"monospace"},{"name":"Ultra","family":"serif"},{"name":"Uncial Antiqua","family":"display"},{"name":"Underdog","family":"display"},{"name":"Unica One","family":"display"},{"name":"UnifrakturCook","family":"display"},{"name":"UnifrakturMaguntia","family":"display"},{"name":"Unkempt","family":"display"},{"name":"Unlock","family":"display"},{"name":"Unna","family":"serif"},{"name":"VT323","family":"monospace"},{"name":"Vampiro One","family":"display"},{"name":"Varela","family":"sans-serif"},{"name":"Varela Round","family":"sans-serif"},{"name":"Vast Shadow","family":"display"},{"name":"Vibur","family":"handwriting"},{"name":"Vidaloka","family":"serif"},{"name":"Viga","family":"sans-serif"},{"name":"Voces","family":"display"},{"name":"Volkhov","family":"serif"},{"name":"Vollkorn","family":"serif"},{"name":"Voltaire","family":"sans-serif"},{"name":"Waiting for the Sunrise","family":"handwriting"},{"name":"Wallpoet","family":"display"},{"name":"Walter Turncoat","family":"handwriting"},{"name":"Warnes","family":"display"},{"name":"Wellfleet","family":"display"},{"name":"Wendy One","family":"sans-serif"},{"name":"Wire One","family":"sans-serif"},{"name":"Yanone Kaffeesatz","family":"sans-serif"},{"name":"Yellowtail","family":"handwriting"},{"name":"Yeseva One","family":"display"},{"name":"Yesteryear","family":"handwriting"},{"name":"Zeyada","family":"handwriting"}]';
}