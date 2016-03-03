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


/**
 * General type registry, for use throughout the code.
 */
class Upfront_Global_Registry extends Upfront_Registry {

	private static $_instance;

	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

class Upfront_Entity_Registry extends Upfront_Registry {

	private static $_instance;

	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

class Upfront_PresetServer_Registry extends Upfront_Registry {

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
	const FONTS = 'fonts';
	
	const WP_SCRIPTS = 'wp_scripts';
	const WP_STYLES = 'wp_styles';

	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}

	public function set ($key, $value) {
		if (!in_array($key, array(self::SCRIPTS, self::STYLES, self::FONTS, self::WP_STYLES, self::WP_SCRIPTS))) return false;
		if (empty($this->_data[$key])) $this->_data[$key] = array();

		$this->_data[$key][] = $value;
	}

	private function _set_all ($key, $values) {
		if (!in_array($key, array(self::SCRIPTS, self::STYLES, self::FONTS, self::WP_STYLES, self::WP_SCRIPTS))) return false;
		if (empty($this->_data[$key])) $this->_data[$key] = array();

		$this->_data[$key] = $values;
	}

	/**
	 * Set individual script for inclusion.
	 *
	 * @param string $url External URL to load the script from
	 */
	public function add_script ($url) {
		return $this->set(self::SCRIPTS, $url);
	}

	/**
	 * Set individual WP script for inclusion.
	 *
	 * @param string $handle WP script handle to load
	 */
	public function add_wp_script ($handle) {
		return $this->set(self::WP_SCRIPTS, $handle);
	}

	/**
	 * Set individual style for inclusion.
	 *
	 * @param string $url External URL to load the style from
	 */
	public function add_style ($url) {
		return $this->set(self::STYLES, $url);
	}

	/**
	 * Set individual font for inclusion.
	 *
	 * Since we want to store the fonts as hash, this is a bit more complex method
	 * that keeps the simple list of variants as values of font family key.
	 *
	 * @param string $family Font family to use.
	 * @param mixed $variant Either a single string variant (weight), or a list of required variants to load
	 */
	public function add_font ($family, $variant=false) {
		$fonts = $this->get_fonts();
		
		if (!isset($fonts[$family])) $fonts[$family] = array();
		if (!empty($variant)) {
			if (!is_array($variant)) $fonts[$family][] = $variant;
			else $fonts[$family] = array_merge($fonts[$family], $variant);
		}
		
		return $this->_set_all(self::FONTS, $fonts);
	}

	public function get ($key, $default=false) {
		if (!in_array($key, array(self::SCRIPTS, self::STYLES, self::WP_STYLES, self::WP_SCRIPTS))) return $default;
		if (!is_array($this->_data[$key])) return $default;
		
		return current($this->_data[$key]);
	}

	/**
	 * Get all scripts registered this far.
	 *
	 * @return array Ordered list of scripts to include.
	 */
	public function get_scripts () {
		return empty($this->_data[self::SCRIPTS])
			? array()
			: $this->_data[self::SCRIPTS]
		;
	}

	/**
	 * Get all WP scripts registered this far.
	 *
	 * @return array Ordered list of script handles.
	 */
	public function get_wp_scripts () {
		return empty($this->_data[self::WP_SCRIPTS])
			? array()
			: $this->_data[self::WP_SCRIPTS]
		;
	}

	/**
	 * Get all styles registered this far.
	 *
	 * @return array Ordered list of styles to include.
	 */
	public function get_styles () {
		return empty($this->_data[self::STYLES])
			? array()
			: $this->_data[self::STYLES]
		;
	}

	/**
	 * Get all fonts registered this far.
	 *
	 * @return array Fonts hash, where each key is a font family and its values are required variants.
	 */
	public function get_fonts () {
		return empty($this->_data[self::FONTS])
			? array()
			: $this->_data[self::FONTS]
		;
	}
}