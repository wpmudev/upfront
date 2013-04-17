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
		$wp_id = $query->get_queried_object_id();
		
		if (!$wp_id && $query->is_404) {
			$wp_entity = self::_to_entity('404_page');
		} else {
			$post_type = !empty($query->post_type) ? $query->post_type : 'post';
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

	public function is_empty () {
		return empty($this->_data);
	}
}



abstract class Upfront_JsonModel extends Upfront_Model {

	protected function __construct ($json=false) {
		$this->_data = $json;
		$this->initialize();
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
		return json_encode($this->to_php(), true);
	}

}



class Upfront_Layout extends Upfront_JsonModel {

	public static function from_entity_ids ($cascade) {
		$layout = array();
		if (!is_array($cascade)) return $layout;
		foreach ($cascade as $id_part) {
			$id = self::STORAGE_KEY . '-' . $id_part;
			$layout = self::from_id($id);
			if (!$layout->is_empty()) {
				$layout->set("current_layout", self::id_to_type($id));
				return $layout;
			}
		}
		return $layout;
	}

	public static function from_php ($data) {
		return new self($data);
	}

	public static function from_json ($json) {
		return self::from_php(json_decode($json, true));
	}

	public static function from_id ($id) {
		$data = get_option($id, json_encode(array()));
		return self::from_json($data);
	}

	public static function create_layout () {
		//$data = '{"name":"Layout 1","regions":[{"name":"Main","modules":[{"name":"Merged module","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357456975525-1753"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c6"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]},{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357719047636-1467"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c14"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]},{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357719048044-1716"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c22"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1357719072172-1882"},{"name":"class","value":"c22"}]},{"name":"","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"image-object-1357460676135-1523"},{"name":"content","value":"http:\/\/wpsalad.com\/wp-content\/uploads\/2012\/11\/wpmudev.png"},{"name":"class","value":"c22"},{"name":"type","value":"ImageModel"},{"name":"view_class","value":"ImageView"}]}],"properties":[{"name":"element_id","value":"module-1357460676140-1230"},{"name":"class","value":"c20 ml2"}]},{"name":"Merged module","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357719370220-1638"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c22"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]},{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357719370581-1294"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c22"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1357719375784-1417"},{"name":"class","value":"c22"}]}]},{"name":"sidebar","modules":[{"name":"","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1357460687069-1239"},{"name":"content","value":"My awesome stub content goes here"},{"name":"class","value":"c22"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1357460687072-1451"},{"name":"class","value":"c20 ml2"}]}]}]}';
		//$data = '{"name":"Layout 1","regions":[{"name":"Main"},{"name":"sidebar","modules":[{"name":"","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1360045228310-1131"},{"name":"content","value":"Edit away!"},{"name":"class","value":"c22 ml0 mr0 mt0"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1360045228313-1375"},{"name":"class","value":"c22"},{"name":"has_settings","value":"0"}]}]}]}';
		/*$data = '{"name":"Layout 1","regions":[{"name":"Main"},{"name":"sidebar","modules":[{"name":"","objects":[{"name":"","element_id":"","properties":[{"name":"element_id","value":"text-object-1360045228310-1131"},{"name":"content","value":"Edit away!"},{"name":"class","value":"c22 ml0 mr0 mt0"},{"name":"type","value":"PlainTxtModel"},{"name":"view_class","value":"PlainTxtView"}]}],"properties":[{"name":"element_id","value":"module-1360045228313-1375"},{"name":"wrapper_id","value":"wrapper-13548645456-1231"},{"name":"class","value":"c22"},{"name":"has_settings","value":"0"}]}]}], "wrappers":[{"name":"","properties":[{"name":"wrapper_id","value":"wrapper-13548645456-1231"},{"name":"class","value":"c22"}]}]}';
		return self::from_json($data);*/
		$data = array(
			"name" => "Default Layout",
			"regions" => self::_get_regions()
		);
		return self::from_php($data);
	}
	
	protected static function _get_regions () {
		return apply_filters('upfront-regions', array(
			array('name' => "Header"),
			array('name' => "Left Sidebar"),
			array('name' => "Main"),
			array('name' => "Right Sidebar"),
			array('name' => "Footer")
		));
	}

	public function save () {
		$key = $this->get_id();
		update_option($key, $this->to_json());
		return $key;
	}

	public function delete () {
		return delete_option($this->get_id());
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