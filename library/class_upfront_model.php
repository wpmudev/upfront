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
			'specificity' => $specificity,
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
			foreach ( $regions as $i => $region ) {
				if ( isset($region['scope']) && $region['scope'] == 'global' )
					continue;
				foreach ( $data['regions'] as $region_data ) {
					if ( $region['name'] != $region_data['name'] )
						continue;
					$regions[$i] = $region_data;
				}
			}
			$data['regions'] = $regions;
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
		if ( $all || ($arr = upfront_region_supported('header')) )
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
		// Use this instead of main, so we have some content:
		/*$regions[] = array(
			'name' => "main", 
			'title' => __("Main Area"), 
			'properties' => array(), 
			'modules' => json_decode('[{"name":"","objects":[{"name":"","element_id":"","properties":[{"name":"type","value":"ThisPostModel"},{"name":"view_class","value":"ThisPostView"},{"name":"element_id","value":"this_post-object-1368256944132-1598"},{"name":"class","value":"c22"},{"name":"has_settings","value":0}]}],"properties":[{"name":"element_id","value":"module-1368256944133-1595"},{"name":"class","value":"c17 upfront-this_post_module ml2 mr0 mt5 mb0"},{"name":"has_settings","value":0},{"name":"wrapper_id","value":"wrapper-1368256987423-1189"},{"name":"row","value":7}]}]', true), 
			'wrappers' => json_decode('[{"name":"","properties":[{"name":"wrapper_id","value":"wrapper-1368256987423-1189"},{"name":"class","value":"c19 clr"}]}]', true), 
			'scope' => "local", 
			'container' => 'main',
			'default' => true
		);*/
		
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
			), ( is_array($arr) ? $arr : array() ));
		return apply_filters('upfront_regions', $regions, self::$cascade);
	}
	
	protected static function _get_region_id ($region_name, $scope = '') {
		$region_id = preg_replace('/[^-_a-z0-9]/', '-', strtolower($region_name));
		return self::STORAGE_KEY . '-' . $region_id . ( !empty($scope) ? '-' . $scope : '' );
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
}


// ----- Post Model

abstract class  Upfront_PostModel {

	public static function create ($post_type, $title='', $content='') {
		$post_id = wp_insert_post(apply_filters('upfront-post_model-create-defaults', array(
			'post_type' => $post_type,
			'post_status' => 'auto-draft',
			'post_title' => apply_filters('upfront-post_model-create-default_title', $title, $post_type),
			'post_content' => apply_filters('upfront-post_model-create-default_content', $content, $post_type),
		), $post_type));
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