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


require_once('models/class_upfront_entity_resolver.php');
require_once('models/class_upfront_json_model.php');
require_once('models/class_upfront_layout.php');
require_once('models/class_upfront_post_model.php');
require_once('models/class_upfront_postmeta_model.php');
require_once('models/class_upfront_layout_revisions.php');
require_once('models/class_upfront_model_google_fonts.php');