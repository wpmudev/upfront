<?php

abstract class Upfront_Logger {

	const LVL_ERROR = 1;
	const LVL_WARNING = 11;
	const LVL_NOTICE = 21;
	const LVL_INFO = 31;

	private $_section;

	abstract public function log ($msg, $level=false);

	public function __construct ($section=false) {
		if (!empty($section)) $this->set_section($section);
	}

	public function error ($msg) {
		return !!$this->log($msg, self::LVL_ERROR);
	}

	public function warn ($msg) {
		return !!$this->log($msg, self::LVL_WARNING);
	}

	public function notice ($msg) {
		return !!$this->log($msg, self::LVL_NOTICE);
	}

	public function info ($msg) {
		return !!$this->log($msg, self::LVL_INFO);
	}

	public function get_default_level () {
		return self::LVL_WARNING;
	}

	public function get_active_level () {
		return self::LVL_NOTICE;
	}

	public function get_level ($level) {
		return !empty($level) && is_numeric($level)
			? (int)$level
			: $this->get_default_level()
		;
	}

	public function is_loggable_level ($level) {
		$level = $this->get_level();
		return $this->get_active_level() <= $level;
	}

	public function get_levels () {
		return array(
			0 => __('None', 'upfront'),
			self::LVL_ERROR => __('Error', 'upfront'),
			self::LVL_WARNING => __('Warning', 'upfront'),
			self::LVL_NOTICE => __('Notice', 'upfront'),
			self::LVL_INFO => __('Info', 'upfront'),
		);
	}

	public function get_level_name ($level) {
		$level = $this->get_level($level);
		$levels = $this->get_levels();

		return !empty($levels[$level])
			? $levels[$level]
			: $levels[$this->get_default_level()]
		;
	}

	public function set_section ($section) {
		return !!$this->_section = $section;
	}

	public function get_section () {
		return $this->_section;
	}

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


class Upfront_Logger_Fs extends Upfront_Logger {

	public function log ($msg, $level=false) {
		return !!error_log($this->format_message($msg, $level));
	}
}


class Upfront_Logger_Stream extends Upfront_Logger {

	public function log ($msg, $level=false) {
		echo '<pre>' . $this->format_message($msg, $level) . '</pre>';
		return true;
	}
}


class Upfront_Log {

	const FS = 'FS';
	const STREAM = 'STREAM';

	public static function get ($impl=false) {
		$cname = !empty($impl)
			? 'Upfront_Logger_' . ucfirst(strtolower($impl))
			: self::get_default_logger()
		;
		return new $cname;
	}

	public static function get_default_logger () {
		return 'Upfront_Logger_Fs';
	}
}

