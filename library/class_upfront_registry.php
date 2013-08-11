<?php

interface IUpfront_Registry {
	
	public static function get_instance ();

	public function get ($key, $default=false);
	
	public function set ($key, $value);

	public function get_all ();

}

abstract class Upfront_Registry implements IUpfront_Registry {

	protected $_data = array();

	protected function __construct () {}

	public function __get ($key) {
		return $this->_get($key);
	}

	public function __set ($key, $value) {
		return $this->set($key, $value);
	}

	public function get ($key, $default=false) {
		return !empty($this->_data[$key])
			? $this->_data[$key]
			: $default
		;
	}

	public function get_all () {
		return $this->_data;
	}

	public function set ($key, $value) {
		$this->_data[$key] = $value;
	}
}


class Upfront_Entity_Registry extends Upfront_Registry {

	private static $_instance;

	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

class Upfront_PublicStylesheets_Registry extends Upfront_Registry {

	private static $_instance;

	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

class Upfront_PublicScripts_Registry extends Upfront_Registry {

	private static $_instance;

	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}
