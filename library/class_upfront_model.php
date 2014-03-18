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

		return apply_filters('upfront_get_entity_ids', $ids);
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
		if (!empty($this->_data['preferred_layout'])) {
			$id = $this->_data['preferred_layout'];
		} else {
			$id = !empty($this->_data['layout']['item'])
				? $this->_data['layout']['item']
				: $this->_name_to_id()
			;
		}
		return self::STORAGE_KEY . '-' . $id;
	}

	public static function id_to_type ($id) {
		return preg_replace('/^' . preg_quote(self::STORAGE_KEY, '/') . '-/', '', $id);
	}

	public function set ($key, $value) {
		$this->_data[$key] = $value;
	}

	public function get ($key) {
		return isset($this->_data[$key]) ? $this->_data[$key] : false;
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

	public static function from_entity_ids ($cascade) {
		$layout = array();
		if (!is_array($cascade)) return $layout;
		self::$cascade = $cascade;
		foreach ($cascade as $id_part) {
			$id = self::STORAGE_KEY . '-' . $id_part;
			$layout = self::from_id($id);
			if (!$layout->is_empty()) {
				$layout->set("current_layout", self::id_to_type($id));
				return apply_filters('upfront_layout_from_id', $layout, self::id_to_type($id), self::$cascade);
			}
		}
		return $layout;
	}

	public static function from_php ($data) {
		if ( isset($data['layout']) )
			self::$cascade = $data['layout'];
		return new self($data);
	}

	public static function from_json ($json) {
		return self::from_php(json_decode($json, true));
	}

	public static function from_id ($id) {
		$regions = self::get_regions_data();
		$data = json_decode( get_option($id, json_encode(array())), true );
		if ( ! empty($data) ) {
			foreach ( $data['regions'] as $i => $region ) {
				foreach ( $regions as $region_data ){
					if ( $region['name'] != $region_data['name'] )
						continue;
					if ( isset($region['scope']) && $region['scope'] != 'local' )
						$data['regions'][$i] = $region_data;
				}
			}
			$data['layout'] = self::$cascade;
		}
		return self::from_php($data);
	}

	public static function get_regions_data () {
		$regions = self::_get_regions();
		foreach ( $regions as $i => $region ) {
			if ( $region['scope'] != 'local' ){
				$region_data = json_decode( get_option(self::_get_region_id($region['name'], $region['scope']), json_encode(array())), true );
				if ( empty($region_data) )
					continue;
				$regions[$i] = $region_data;
			}
		}
		return $regions;
	}

	public static function create_layout ($layout_ids = array()) {
		$data = array(
			"name" => "Default Layout",
			"properties" => array(),
			"regions" => self::get_regions_data()
		);
		return self::from_php(apply_filters('upfront_create_default_layout', $data, $layout_ids, self::$cascade));
	}

	protected static function _get_regions ($all = false) {
		$regions = array();
		do_action('upfront_get_regions', self::$cascade);
		/*if ( $all || ($arr = upfront_region_supported('header')) )
			$regions[] = array_merge(array(
				'name' => "header",
				'title' => __("Header Area"),
				'properties' => array(),
				'modules' => array(),
				'wrappers' => array(),
				'scope' => "global"
			), ( is_array($arr) ? $arr : array() ));
		if ( $all || ($arr = upfront_region_supported('left-sidebar')) )
			$regions[] = array_merge(array(
				'name' => "left-sidebar",
				'title' => __("Left Sidebar Area"),
				'properties' => array(
					array( 'name' => 'col', 'value' => '5' )
				),
				'modules' => array(),
				'wrappers' => array(),
				'scope' => "global",
				'container' => 'main'
			), ( is_array($arr) ? $arr : array() ));
		$regions[] = array(
			'name' => "main",
			'title' => __("Main Area"),
			'properties' => array(),
			'modules' => array(),
			'wrappers' => array(),
			'scope' => "local",
			'container' => 'main',
			'default' => true
		);
		if ( $all || ($arr = upfront_region_supported('right-sidebar')) )
			$regions[] = array_merge(array(
				'name' => "right-sidebar",
				'title' => __("Right Sidebar Area"),
				'properties' => array(
					array( 'name' => 'col', 'value' => '5' )
				),
				'modules' => array(),
				'wrappers' => array(),
				'scope' => "global",
				'container' => 'main'
			), ( is_array($arr) ? $arr : array() ));
		if ( $all || ($arr = upfront_region_supported('footer')) )
			$regions[] = array_merge(array(
				'name' => "footer",
				'title' => __("Footer Area"),
				'properties' => array(),
				'modules' => array(),
				'wrappers' => array(),
				'scope' => "global"
			), ( is_array($arr) ? $arr : array() ));*/
		//$regions = upfront_get_regions();
		$regions = upfront_get_default_layout(self::$cascade);
		return apply_filters('upfront_regions', $regions, self::$cascade);
	}

	protected static function _get_region_id ($region_name, $scope = '') {
		$region_id = preg_replace('/[^-_a-z0-9]/', '-', strtolower($region_name));
		return self::STORAGE_KEY . '-' . $region_id . ( !empty($scope) ? '-' . $scope : '' );
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
		//return json_encode($this->get_region_data($region_name), true);
		return json_encode($this->get_region_data($region_name));
	}

	public function save () {
		$key = $this->get_id();
		foreach ( self::_get_regions() as $region ){
			if ( $region['scope'] != 'local' )
				update_option(self::_get_region_id($region['name'], $region['scope']), $this->region_to_json($region['name']));
		}
		update_option($key, $this->to_json());
		return $key;
	}

	public function delete () {
		return delete_option($this->get_id());
	}

	public function delete_region ($region_name) {
		return delete_option(self::_get_region_id($region_name));
	}

	public function delete_regions () {
		foreach ( self::_get_regions() as $i => $region ) {
			$this->delete_region($region['name']);
		}
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