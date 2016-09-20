<?php

/**
 * Upfront model abstraction
 */
abstract class Upfront_Model {

	const STORAGE_KEY = 'upfront';

	/**
	 * Storage key
	 *
	 * @var string
	 */
	protected static $storage_key = self::STORAGE_KEY;

	/**
	 * Model name
	 *
	 * @var string
	 */
	protected $_name;

	/**
	 * Internal data
	 *
	 * @var array
	 */
	protected $_data;

	/**
	 * Initializes the model
	 */
	abstract public function initialize ();

	/**
	 * Persists the model data
	 */
	abstract public function save ();

	/**
	 * Removes the model data
	 */
	abstract public function delete ();

	/**
	 * Resolves model name to an ID fragment
	 *
	 * @return string
	 */
	protected function _name_to_id () {
		$name = preg_replace('/[^-_a-z0-9]/', '-', strtolower($this->_name));
		return $name;
	}

	/**
	 * Gets model name
	 *
	 * @return string
	 */
	public function get_name () {
		return $this->_name;
	}

	/**
	 * Resolves and gets the model fully qualified ID
	 *
	 * Will try to go through the data in resolution first,
	 * and will fall back to name-to-id convention
	 *
	 * Fully resolved ID will also include the storage key
	 *
	 * @return string
	 */
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
		return $storage_key . '-' . $id;
	}

	/**
	 * Compacts a fully resolved ID to an ID fragment
	 *
	 * @param string $id Fully resolved ID
	 *
	 * @return string Collapsed ID fragment
	 */
	public static function id_to_type ($id) {
		$storage_key = self::get_storage_key();
		return preg_replace('/^' . preg_quote($storage_key, '/') . '-/', '', $id);
	}

	/**
	 * Sets new internal storage key
	 *
	 * Resets the internal storage key to default if the
	 * argument is empty
	 *
	 * @param string $storage_key New storage key to use
	 */
	public static function set_storage_key ($storage_key) {
		if (!empty($storage_key)) {
			self::$storage_key = $storage_key;
		} else {
			// restore to default if empty
			self::$storage_key = self::STORAGE_KEY;
		}
	}

	/**
	 * Gets the current storage key
	 *
	 * Passes the value through the filter first
	 *
	 * @return string
	 */
	public static function get_storage_key() {
		return apply_filters('upfront-storage-key', self::$storage_key);
	}

	/**
	 * Sets a keyed value to the internal data storage
	 *
	 * @param string $key Key to use
	 * @param mixed $value Value to set
	 */
	public function set ($key, $value) {
		$this->_data[$key] = $value;
	}

	/**
	 * Gets a value from internal data storage
	 *
	 * @param string $key Key to get
	 *
	 * @return mixed Value, or (bool)false if it hasn't been set
	 */
	public function get ($key) {
		return isset($this->_data[$key]) ? $this->_data[$key] : false;
	}

	/**
	 * Gets a property value from internal data storage
	 *
	 * @see upfront_get_property_value
	 *
	 * @param string $prop Property key
	 *
	 * @return mixed
	 */
	public function get_property_value ($prop) {
		return upfront_get_property_value($prop, $this->_data);
	}

	/**
	 * Sets a property value to internal data storage
	 *
	 * @see upfront_set_property_value
	 *
	 * @param string $prop Property key
	 * @param mixed $value Value to set
	 */
	public function set_property_value ($prop, $value) {
		$this->_data = upfront_set_property_value($prop, $value, $this->_data);
	}

	/**
	 * Checks if internal data storage is empty
	 *
	 * @return bool
	 */
	public function is_empty () {
		return empty($this->_data);
	}
}

/**
 * Cache key class
 */
class Upfront_Cache_Key {

	/**
	 * Cache key type
	 *
	 * @var string
	 */
	private $_type;

	/**
	 * Cache key unique identifier
	 *
	 * @var mixed
	 */
	private $_identifier;

	/**
	 * Compiled identifier hash
	 *
	 * @var string
	 */
	private $_hash;

	/**
	 * Spawns a key instance, never to the outside world
	 *
	 * @param string $type Key type
	 * @param mixed $identifier Unique identifier
	 */
	protected function __construct ($type, $identifier=false) {
		$this->_type = $type;
		$this->_identifier = $identifier;
		$this->_hash = !empty($this->_identifier) ? $this->get_serialized_identifier() : false;
	}

	/**
	 * Spawns a new cache key instance for the outsiders
	 *
	 * @param string $type Key type
	 * @param mixed $identifier Unique identifier
	 *
	 * @return Upfront_Cache_Key instance
	 */
	public static function spawn ($type, $identifier=false) {
		return new self($type, $identifier);
	}

	/**
	 * Gets key type
	 *
	 * Falls back to 'upfront'
	 *
	 * @return string
	 */
	public function get_type () {
		return !empty($this->_type)
			? $this->_type
			: 'upfront'
		;
	}

	/**
	 * Gets key identifier
	 *
	 * @return mixed
	 */
	public function get_identifier () {
		return !empty($this->_identifier)
			? $this->_identifier
			: rand()
		;
	}

	/**
	 * Gets the compiled identifier hash
	 *
	 * @return string
	 */
	public function get_hash () {
		if (!empty($this->_hash)) return $this->_hash;
		$this->_hash = $this->get_serialized_identifier();
		return $this->_hash;
	}

	/**
	 * Sets hash to a new value
	 *
	 * @param string $hash New hash
	 *
	 * @return string New hash (side-effect)
	 */
	public function set_hash ($hash) {
		return $this->_hash = $hash;
	}

	/**
	 * Gets typed hash
	 *
	 * @return string
	 */
	public function get () {
		return $this->get_typed_hash();
	}

	/**
	 * Gets typed hash
	 *
	 * @return string
	 */
	public function get_typed_hash () {
		$type = preg_replace('/^[^a-z]$/', '', $this->get_type());
		$hash = preg_replace('/^[a-f0-9]$/', '', $this->get_hash());

		return substr("{$type}_uf_{$hash}", 0, 45);
	}

	/**
	 * Hashes the internal identifier
	 *
	 * @return string Hash
	 */
	public function get_serialized_identifier () {
		return md5(serialize($this->get_identifier()));
	}
}

/**
 * Main cache class abstraction
 */
abstract class Upfront_Cache_Abstract {

	/**
	 * Creates cache key instance
	 *
	 * Accepts variable parameters, that will be passed to
	 * the key instance creation
	 *
	 * @return object Upfront_Cache_Key instance
	 */
	public function key () {
		$func_args = func_get_args();
		return call_user_func_array(array('Upfront_Cache_Key', 'spawn'), $func_args);
	}

	/**
	 * Gets cache expiration
	 *
	 * @param bool $context Optional context
	 *
	 * @return number Expiration timespan in seconds
	 */
	public function get_expiration ($context=false) {
		return DAY_IN_SECONDS;
	}

	/**
	 * Gets a cached value
	 *
	 * @param mixed $key_or_type Cache key object, or type string to create a key from
	 * @param mixed $identifier Identifier is optional if the cache key object is used as the first argument
	 *
	 * @return mixed
	 */
	public function get ($key_or_type, $identifier=false) {
		$key = $key_or_type instanceof Upfront_Cache_Key
			? $key_or_type
			: $this->key($key_or_type, $identifier)
		;
		return $this->_get_from_key($key);
	}

	/**
	 * Sets a cached value
	 *
	 * @param mixed $key_or_type Cache key object, or type string to create a key from
	 * @param mixed $identifier_or_value Identifier is optional if the cache key object is used as the first argument
	 * @param mixed $value Optional value to set (2nd param will be used if key is 1st)
	 */
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

	/**
	 * Gets a cached value
	 *
	 * Just an interface
	 *
	 * @param Upfront_Cache_Key $key Key to check
	 *
	 * @return bool
	 */
	protected function _get_from_key (Upfront_Cache_Key $key) {
		return false;
	}

	/**
	 * Sets a cached value
	 *
	 * Just an interface
	 *
	 * @param Upfront_Cache_Key $key Key to use
	 * @param mixed $value Value to set
	 *
	 * @return bool
	 */
	protected function _set_for_key (Upfront_Cache_Key $key, $value) {
		return false;
	}

}

/**
 * Transient cache implementation
 */
class Upfront_Cache_Transient extends Upfront_Cache_Abstract {

	/**
	 * Gets a cached value
	 *
	 * @param Upfront_Cache_Key $key Key to check
	 *
	 * @return bool
	 */
	protected function _get_from_key (Upfront_Cache_Key $key) {
		return get_transient($key->get());
	}

	/**
	 * Sets a cached value
	 *
	 * @param Upfront_Cache_Key $key Key to use
	 * @param mixed $value Value to set
	 *
	 * @return bool
	 */
	protected function _set_for_key (Upfront_Cache_Key $key, $value) {
		return set_transient($key->get(), $value, $this->get_expiration());
	}
}

/**
 * Cache factory class
 */
abstract class Upfront_Cache {

	const TYPE_LONG_TERM = 'longterm';
	const TYPE_DEFAULT = 'default';

	/**
	 * Internal instances array
	 *
	 * @var array
	 */
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
require_once('models/class_upfront_page_template.php');
require_once('models/class_upfront_page_layout.php');
require_once('models/class_upfront_model_google_fonts.php');
require_once('models/class_upfront_api_keys_model.php');
