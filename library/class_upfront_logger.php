<?php

/**
 * Logger abstraction
 *
 * Defines the shared interface, regardless of the actual
 * logging destination or method, which is handled by
 * concrete implementations
 */
abstract class Upfront_Logger {

	const LVL_ERROR = 1;
	const LVL_WARNING = 11;
	const LVL_NOTICE = 21;
	const LVL_INFO = 31;

	/**
	 * Logging section
	 *
	 * @var string
	 */
	private $_section;

	/**
	 * Actual logging method
	 *
	 * To be implemented in concrete implementations
	 *
	 * @param string $msg Message to log
	 * @param int $level Log level of the message
	 *
	 * @return bool Status
	 */
	abstract public function log ($msg, $level=false);

	/**
	 * Constructor
	 *
	 * Can also optionally set up the logging section
	 *
	 * @param string $section Optional section
	 */
	public function __construct ($section=false) {
		if (!empty($section)) $this->set_section($section);
	}

	/**
	 * Logs error level messages
	 *
	 * @param string $msg Message to log
	 *
	 * @return bool Status
	 */
	public function error ($msg) {
		return !!$this->log($msg, self::LVL_ERROR);
	}

	/**
	 * Logs warning level messages
	 *
	 * @param string $msg Message to log
	 *
	 * @return bool Status
	 */
	public function warn ($msg) {
		return !!$this->log($msg, self::LVL_WARNING);
	}

	/**
	 * Logs notice level messages
	 *
	 * @param string $msg Message to log
	 *
	 * @return bool Status
	 */
	public function notice ($msg) {
		return !!$this->log($msg, self::LVL_NOTICE);
	}

	/**
	 * Logs info level messages
	 *
	 * @param string $msg Message to log
	 *
	 * @return bool Status
	 */
	public function info ($msg) {
		return !!$this->log($msg, self::LVL_INFO);
	}

	/**
	 * Gets the default log level
	 *
	 * Used for message log level resolution
	 *
	 * @return int Log level
	 */
	public function get_default_level () {
		return self::LVL_WARNING;
	}

	/**
	 * Gets currently active log level
	 *
	 * Used for making decision whether to log the current message
	 *
	 * @return int Log level
	 */
	public function get_active_level () {
		return self::LVL_NOTICE;
	}

	/**
	 * Resolves level to a sane value
	 *
	 * @param int $level Log level
	 *
	 * @return int $level Resolved level
	 */
	public function get_level ($level) {
		return !empty($level) && is_numeric($level)
			? (int)$level
			: $this->get_default_level()
		;
	}

	/**
	 * Checks whether a supplied level is to be logged
	 *
	 * @param int $level Log level
	 *
	 * @return bool
	 */
	public function is_loggable_level ($level) {
		$level = $this->get_level();
		return $this->get_active_level() <= $level;
	}

	/**
	 * Returns known levels
	 *
	 * Levels are represented as level => label pairs
	 *
	 * @return array Known levels
	 */
	public function get_levels () {
		return array(
			0 => __('None', 'upfront'),
			self::LVL_ERROR => __('Error', 'upfront'),
			self::LVL_WARNING => __('Warning', 'upfront'),
			self::LVL_NOTICE => __('Notice', 'upfront'),
			self::LVL_INFO => __('Info', 'upfront'),
		);
	}

	/**
	 * Gets the level name (label)
	 *
	 * As defined by $this->get_levels()
	 *
	 * @return string
	 */
	public function get_level_name ($level) {
		$level = $this->get_level($level);
		$levels = $this->get_levels();

		return !empty($levels[$level])
			? $levels[$level]
			: $levels[$this->get_default_level()]
		;
	}

	/**
	 * Sets logging section
	 *
	 * @param string $section Section name
	 *
	 * @return bool
	 */
	public function set_section ($section) {
		return !!$this->_section = $section;
	}

	/**
	 * Gets logging section
	 *
	 * @return string|bool Section, or (bool)false
	 */
	public function get_section () {
		return $this->_section;
	}

	/**
	 * Formats message for output
	 *
	 * @param string $msg Message body copy
	 * @param int $level Log level
	 *
	 * @return string Formatted message
	 */
	public function format_message ($msg, $level=false) {
		$level = $this->get_level($level);
		$label = $this->get_level_name($level);
		$section = $this->get_section();
		$args =	array(
			$label,
		);
		if (!empty($section)) $args[] = $section;
		return '[' . join('] [', $args) . "] {$msg}";
	}
}


/**
 * Error log based logging implementation
 */
class Upfront_Logger_Fs extends Upfront_Logger {

	public function log ($msg, $level=false) {
		if (!$this->is_loggable_level($level)) return false;
		return !!error_log($this->format_message($msg, $level));
	}
}


/**
 * Stream (inline) based logging implementation
 */
class Upfront_Logger_Stream extends Upfront_Logger {

	public function log ($msg, $level=false) {
		if (!$this->is_loggable_level($level)) return false;
		echo '<pre>' . $this->format_message($msg, $level) . '</pre>';
		return true;
	}
}


/**
 * Logging implementation getter factory
 */
class Upfront_Log {

	const FS = 'FS';
	const STREAM = 'STREAM';

	/**
	 * Concrete implementation getter
	 *
	 * @param string $impl Optional concrete implementation (see class constants)
	 *
	 * @return Upfront_Logger concrete implementation object
	 */
	public static function get ($impl=false) {
		$cname = !empty($impl)
			? 'Upfront_Logger_' . ucfirst(strtolower($impl))
			: self::get_default_logger()
		;
		return new $cname;
	}

	/**
	 * Get default concrete implementation class name
	 *
	 * @return string Default logger class name
	 */
	public static function get_default_logger () {
		return 'Upfront_Logger_Fs';
	}
}

