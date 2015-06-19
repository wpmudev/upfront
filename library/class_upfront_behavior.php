<?php

class Upfront_CompressionBehavior {

	const LEVEL_AGGRESSIVE = 'aggressive';
	const LEVEL_DEFAULT = 'default';
	const LEVEL_LOW = 'low';

	private $_compression;
	private $_experiments;

	private static $_instance;
	
	private function __construct () {
		$this->_parse_compression();
		$this->_parse_experiments();
	}
	private function __clone () {}

	public static function get_instance () {
		if (!self::$_instance) {
			self::$_instance = new self;
		}
		return self::$_instance;
	}

	private function _parse_compression () {
		if (empty($this->_compression)) {
			if (defined('UPFRONT_COMPRESS_RESPONSE') && UPFRONT_COMPRESS_RESPONSE) $this->_compression = true;
		}
	}

	private function _parse_experiments () {
		if (empty($this->_experiments) && defined('UPFRONT_EXPERIMENTS_ON') && UPFRONT_EXPERIMENTS_ON) {
			$level = UPFRONT_EXPERIMENTS_ON;
			if (in_array($level, array(1, '1', true), true)) $this->_experiments = self::LEVEL_DEFAULT;
			else $this->_experiments = $level;
		}
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