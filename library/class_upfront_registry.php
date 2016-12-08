<?php

interface IUpfront_Registry {

	/**
	 * Gets implementing registry instance
	 *
	 * @return object
	 */
	public static function get_instance ();

	/**
	 * Gets a value registered for a key
	 *
	 * @param string $key Key to check
	 * @param mixed $default Optional fallback value (defaults to false)
	 *
	 * @return mixed
	 */
	public function get ($key, $default=false);

	/**
	 * Sets a registry value for a key
	 *
	 * @param string $key Key
	 * @param mixed $value Value to set
	 */
	public function set ($key, $value);

	/**
	 * Gets entire registered storage content
	 *
	 * @return array
	 */
	public function get_all ();

}

/**
 * Registry abstraction
 */
abstract class Upfront_Registry implements IUpfront_Registry {

	/**
	 * Internal data storage
	 *
	 * @var array
	 */
	protected $_data = array();

	/**
	 * Spawns an instance
	 *
	 * Never for the outside world.
	 */
	protected function __construct () {}

	/**
	 * Implements direct variable get access
	 *
	 * @param string $key Key to get
	 *
	 * @return mixed
	 */
	public function __get ($key) {
		return $this->get($key);
	}

	/**
	 * Implements direct variable set access
	 *
	 * @param string $key Key
	 * @param mixed $value Value to set
	 */
	public function __set ($key, $value) {
		return $this->set($key, $value);
	}

	/**
	 * Gets a value registered for a key
	 *
	 * @param string $key Key to check
	 * @param mixed $default Optional fallback value (defaults to false)
	 *
	 * @return mixed
	 */
	public function get ($key, $default=false) {
		return !empty($this->_data[$key])
			? $this->_data[$key]
			: $default
		;
	}

	/**
	 * Gets entire registered storage content
	 *
	 * @return array
	 */
	public function get_all () {
		return $this->_data;
	}

	/**
	 * Sets a registry value for a key
	 *
	 * @param string $key Key
	 * @param mixed $value Value to set
	 */
	public function set ($key, $value) {
		$this->_data[$key] = $value;
	}
}


/**
 * General type registry, for use throughout the code.
 */
class Upfront_Global_Registry extends Upfront_Registry {

	/**
	 * Singleton instance
	 *
	 * @var Upfront_Global_Registry
	 */
	private static $_instance;

	/**
	 * Gets singleton instance
	 *
	 * @return Upfront_Global_Registry
	 */
	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

/**
 * Upfront entities registry
 */
class Upfront_Entity_Registry extends Upfront_Registry {

	/**
	 * Singleton instance
	 *
	 * @var Upfront_Entity_Registry
	 */
	private static $_instance;

	/**
	 * Gets singleton instance
	 *
	 * @return Upfront_Entity_Registry
	 */
	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

/**
 * Upfront presets registry
 */
class Upfront_PresetServer_Registry extends Upfront_Registry {

	/**
	 * Singleton instance
	 *
	 * @var Upfront_PresetServer_Registry
	 */
	private static $_instance;

	/**
	 * Gets singleton instance
	 *
	 * @return Upfront_PresetServer_Registry
	 */
	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

/**
 * Upfront public (element) stylesheets registry
 */
class Upfront_PublicStylesheets_Registry extends Upfront_Registry {

	/**
	 * Singleton instance
	 *
	 * @var Upfront_PublicStylesheets_Registry
	 */
	private static $_instance;

	/**
	 * Gets singleton instance
	 *
	 * @return Upfront_PublicStylesheets_Registry
	 */
	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

/**
 * Upfront public (element) scripts registry
 */
class Upfront_PublicScripts_Registry extends Upfront_Registry {

	/**
	 * Singleton instance
	 *
	 * @var Upfront_PublicScripts_Registry
	 */
	private static $_instance;

	/**
	 * Gets singleton instance
	 *
	 * @return Upfront_PublicScripts_Registry
	 */
	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}
}

/**
 * Upfront core FE dependencies registry
 */
class Upfront_CoreDependencies_Registry extends Upfront_Registry {

	/**
	 * Singleton instance
	 *
	 * @var Upfront_CoreDependencies_Registry
	 */
	private static $_instance;

	const SCRIPTS = 'scripts';
	const STYLES = 'styles';
	const FONTS = 'fonts';

	const WP_SCRIPTS = 'wp_scripts';
	const WP_STYLES = 'wp_styles';

	/**
	 * Gets singleton instance
	 *
	 * @return Upfront_CoreDependencies_Registry
	 */
	public static function get_instance () {
		if (!self::$_instance) self::$_instance = new self;
		return self::$_instance;
	}

	/**
	 * Pushes a value to one of the registered stacks
	 *
	 * @param string $key Stack to push to (see class constants)
	 * @param mixed $value Value to set
	 */
	public function set ($key, $value) {
		if (!in_array($key, array(self::SCRIPTS, self::STYLES, self::FONTS, self::WP_STYLES, self::WP_SCRIPTS))) return false;
		if (empty($this->_data[$key])) $this->_data[$key] = array();

		$this->_data[$key][] = $value;
	}

	/**
	 * Replaces an entire registered stack
	 *
	 * @param string $key Stack to replace (see class constants)
	 * @param mixed $values New stack values
	 */
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

	/**
	 * Gets a value off of registered stack
	 *
	 * @param string $key Stack to use (see class constants)
	 * @param mixed $default Optional fallback value (defaults to false)
	 *
	 * @return mixed
	 */
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
