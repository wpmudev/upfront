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
		return $this->get($key);
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


class Upfront_CoreDependencies_Registry extends Upfront_Registry {

	private static $_instance;

	const SCRIPTS = 'scripts';
	const STYLES = 'styles';

	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}

	public function set ($key, $value) {
		if (!in_array($key, array(self::SCRIPTS, self::STYLES))) return false;
		if (empty($this->_data[$key])) $this->_data[$key] = array();

		$this->_data[$key][] = $value;
	}

	public function add_script ($url) {
		return $this->set(self::SCRIPTS, $url);
	}
	public function add_style ($url) {
		return $this->set(self::STYLES, $url);
	}

	public function get ($key, $default=false) {
		if (!in_array($key, array(self::SCRIPTS, self::STYLES))) return $default;
		if (!is_array($this->_data[$key])) return $default;
		
		return current($this->_data[$key]);
	}

	public function get_scripts () {
		return empty($this->_data[self::SCRIPTS])
			? array()
			: $this->_data[self::SCRIPTS]
		;
	}

	public function get_styles () {
		return empty($this->_data[self::STYLES])
			? array()
			: $this->_data[self::STYLES]
		;
	}
}