<?php

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
		if (!empty($this->_data['preferred_layout'])) {
			$id = $this->_data['preferred_layout'];
		} else if (!empty($this->_data['current_layout'])) {
			$id = $this->_data['current_layout'];
		} else if (!empty($this->_data['layout']['item']) && 'single-page' === $this->_data['layout']['item'] && !empty($this->_data['layout']['specificity'])) {
			$id = $this->_data['layout']['specificity'];
		} else {
			$id = !empty($this->_data['layout']['item'])
				? $this->_data['layout']['item']
				: $this->_name_to_id()
			;
		}

		$storage_key = self::get_storage_key();
		return apply_filters('upfront-model-get_id', $storage_key . '-' . $id, $this);
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

class Upfront_Cache_Key {

	private $_type;
	private $_identifier;
	private $_hash;

	protected function __construct ($type, $identifier=false) {
		$this->_type = $type;
		$this->_identifier = $identifier;
		$this->_hash = !empty($this->_identifier) ? $this->get_serialized_identifier() : false;
	}

	public static function spawn ($type, $identifier=false) {
		return new self($type, $identifier);
	}

	public function get_type () {
		return !empty($this->_type)
			? $this->_type
			: 'upfront'
		;
	}

	public function get_identifier () {
		return !empty($this->_identifier)
			? $this->_identifier
			: rand()
		;
	}

	public function get_hash () {
		if (!empty($this->_hash)) return $this->_hash;
		$this->_hash = $this->get_serialized_identifier();
		return $this->_hash;
	}

	public function set_hash ($hash) {
		return $this->_hash = $hash;
	}

	public function get () {
		return $this->get_typed_hash();
	}

	public function get_typed_hash () {
		$type = preg_replace('/^[^a-z]$/', '', $this->get_type());
		$hash = preg_replace('/^[a-f0-9]$/', '', $this->get_hash());

		return substr("{$type}_uf_{$hash}", 0, 45);
	}

	public function get_serialized_identifier () {
		return md5(serialize($this->get_identifier()));
	}
}

abstract class Upfront_Cache_Abstract {

	public function key () {
        $func_args = func_get_args();
		return call_user_func_array(array('Upfront_Cache_Key', 'spawn'), $func_args);
	}

	public function get_expiration ($context=false) {
		return DAY_IN_SECONDS;
	}

	public function get ($key_or_type, $identifier=false) {
		$key = $key_or_type instanceof Upfront_Cache_Key
			? $key_or_type
			: $this->key($key_or_type, $identifier)
		;
		return $this->_get_from_key($key);
	}

	public function set ($key_or_type, $identifier_or_value=false, $value=false) {
		$key = false;
		if ($key_or_type instanceof Upfront_Cache_Key) { // 2 args
			$key = $key_or_type;
			$value = $identifier_or_value;
		} else { // 3 args
			$key = $this->key($key_or_type, $identifier_or_value);
		}

		return $this->_set_for_key($key, $value);
	}

	protected function _get_from_key (Upfront_Cache_Key $key) {
		return false;
	}

	protected function _set_for_key (Upfront_Cache_Key $key, $value) {
		return false;
	}

}

class Upfront_Cache_Transient extends Upfront_Cache_Abstract {
	protected function _get_from_key (Upfront_Cache_Key $key) {
		return get_transient($key->get());
	}

	protected function _set_for_key (Upfront_Cache_Key $key, $value) {
		return set_transient($key->get(), $value, $this->get_expiration());
	}
}

abstract class Upfront_Cache {

	const TYPE_LONG_TERM = 'longterm';
	const TYPE_DEFAULT = 'default';

	private static $_instances = array();

	/**
	 * Factory method
	 *
	 * @param string $type Cache type (optional)
	 *
	 * @return Upfront_Cache_Abstract Cache instance
	 */
	public static function get_instance ($type=false) {
		$type = empty($type) ? $type : self::TYPE_DEFAULT;

		if (!empty(self::$_instances[$type])) return self::$_instances[$type];

		if (self::TYPE_LONG_TERM === $type) {
			self::$_instances[$type] = new Upfront_Cache_Transient;
			return self::$_instances[$type];
		}

		if (self::TYPE_DEFAULT === $type) {
			self::$_instances[$type] = new Upfront_Cache_Transient;
			return self::$_instances[$type];	
		}

		return self::get_instance(self::TYPE_DEFAULT);
	}
}


require_once('models/class_upfront_entity_resolver.php');
require_once('models/class_upfront_json_model.php');
require_once('models/class_upfront_layout.php');
require_once('models/class_upfront_post_model.php');
require_once('models/class_upfront_postmeta_model.php');
require_once('models/class_upfront_layout_revisions.php');
require_once('models/class_upfront_model_google_fonts.php');