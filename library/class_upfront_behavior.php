<?php

class Upfront_CompressionBehavior {

	const LEVEL_HARDCORE = 'hardcore';
	const LEVEL_AGGRESSIVE = 'aggressive';
	const LEVEL_DEFAULT = 'default';
	const LEVEL_LOW = 'low';

	const OPTIONS_KEY = 'upfront-options-experiments';

	private $_compression;
	private $_experiments;

	private static $_instance;

	private function __construct () {
		$this->reload();
	}
	private function __clone () {}

	public static function get_instance () {
		if (!self::$_instance) {
			self::$_instance = new self;
		}
		return self::$_instance;
	}

	/**
	 * (Re)Initialize compression options
	 *
	 * Uses defined option as first choice, falls back to saved option
	 *
	 * @return bool
	 */
	private function _parse_compression () {
		if (defined('UPFRONT_COMPRESS_RESPONSE') && UPFRONT_COMPRESS_RESPONSE) return $this->_compression = true;
		else return $this->_compression = $this->get_option('compression');
	}

	/**
	 * (Re)Initialize experiments options
	 *
	 * Uses defined option as first choice, falls back to saved option
	 *
	 * @return mixed Experiments level on success, (bool)false otherwise
	 */
	private function _parse_experiments () {
		if (defined('UPFRONT_EXPERIMENTS_ON') && UPFRONT_EXPERIMENTS_ON) {
			$level = UPFRONT_EXPERIMENTS_ON;
			return $this->_experiments = in_array($level, array(1, '1', true), true)
				? self::LEVEL_DEFAULT
				: $level
			;
		} else {
			$level = $this->get_option('level');
			return $this->_experiments = in_array($level, array_keys($this->get_known_compression_levels()))
				? $level
				: false
			;
		}
	}

	/**
	 * Return known compression levels with associated labels
	 *
	 * @return array Compression level => level label map
	 */
	public function get_known_compression_levels () {
		return array(
			self::LEVEL_LOW => __('Low', Upfront::TextDomain),
			self::LEVEL_DEFAULT => __('Default', Upfront::TextDomain),
			self::LEVEL_AGGRESSIVE => __('Aggressive', Upfront::TextDomain),
			self::LEVEL_HARDCORE => __('Hardcore', Upfront::TextDomain),
		);
	}

	/**
	 * Gets a list of options from storage
	 *
	 * @return array
	 */
	public function get_options () {
		$options = Upfront_Cache_Utils::get_option(self::OPTIONS_KEY, array());
		return !empty($options) && is_array($options)
			? $options
			: array()
		;
	}

	/**
	 * Sets the options
	 * Also checks user permission level
	 *
	 * @param array $data Options map to save
	 *
	 * @return bool
	 */
	public function set_options ($data) {
		if (!current_user_can('manage_options')) return false;
		$options = $this->get_options();
		$options = wp_parse_args($data, $options);

		return !!Upfront_Cache_Utils::update_option(self::OPTIONS_KEY, $options, false);
	}

	/**
	 * Individual options getter
	 *
	 * @uses Upfront_CompressionBehavior::get_options
	 *
	 * @param string $key Option key to get
	 * @param mixed $fallback Fallback value to return (defaults to (bool)false)
	 *
	 * @return mixed Fallback value
	 */
	public function get_option ($key, $fallback=false) {
		$options = $this->get_options();
		return isset($options[$key])
			? $options[$key]
			: $fallback
		;
	}

	/**
	 * (Re)Loads and (re)parses options
	 *
	 * @return bool
	 */
	public function reload () {
		$this->_parse_compression();
		$this->_parse_experiments();
		return true;
	}

	/**
	 * Whether or not the compression has been enabled.
	 *
	 * @return bool True if it actually is, false otherwise
	 */
	public function has_compression () {
		return (bool)$this->_compression;
	}

	/**
	 * Whether or not the load experiments has been enabled at all
	 *
	 * @return bool True if they are, false otherwise
	 */
	public function has_experiments () {
		return (bool)$this->_experiments;
	}

	/**
	 * Check if the particular experiments level is active.
	 *
	 * @param bool $level Level (see constants map) to check
	 * @return bool
	 */
	public function has_experiments_level ($level=false) {
		$level = empty($level) ? self::LEVEL_DEFAULT : $level;
		if (!$this->has_experiments()) return false;

		return $this->_experiments === $level;
	}

	public function constant ($which) {
		$which = preg_replace('/[^a-z]/i', '', strtoupper($which));
		$const = "Upfront_CompressionBehavior::LEVEL_{$which}";

		return defined($const)
			? constant($const)
			: false
		;
	}
}


abstract class Upfront_Behavior {

	public static function compression () {
		return Upfront_CompressionBehavior::get_instance();
	}

	public static function debug () {
		return Upfront_Debug::get_debugger();
	}
	
}
