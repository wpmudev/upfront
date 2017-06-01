<?php

if (!class_exists('Upfront_Log')) require_once('class_upfront_logger.php');

class Upfront_Debug {

	const ALL = 'all';

	const CACHED_RESPONSE = 'cached_response';
	const STYLE = 'style';
	const MARKUP = 'markup';
	const RESPONSE = 'response';
	const JS_TRANSIENTS = 'js_transients';
	const DEV = 'dev';
	const RESPONSIVE_BREAKPOINTS = 'responsive_breakpoints';
	const WEB_FONTS = 'web_fonts';
	const DEPENDENCIES = 'dependencies';

	protected $_levels = array();

	private static $_debugger;

	private $_logger;

	public static function get_debugger () {
		if (!self::$_debugger) {
			self::$_debugger = new self;
		}
		return self::$_debugger;
	}

	public function __construct () {
		$debug_levels = array();
		if (defined('UPFRONT_DEBUG_LEVELS') && UPFRONT_DEBUG_LEVELS) {
			$debug_levels = array_map('trim', explode(',', UPFRONT_DEBUG_LEVELS));
		}
		$this->_levels = $debug_levels;
		$this->_logger = Upfront_Log::get();
	}

	public function get_levels () {
		return $this->_levels;
	}

	public function is_active ($level=false) {
		if (!$level) return defined('UPFRONT_DEBUG_LEVELS') && UPFRONT_DEBUG_LEVELS/* && UPFRONT_DEBUG_LEVELS !== 'none'*/;
		$all = $this->get_levels();
		return in_array($level, $all) || in_array(self::ALL, $all);
	}

	public function has_level ($level=false) {
		if (empty($level)) return $this->is_active();
		return $this->is_active($this->level($level));
	}

	public function is_dev () {
		return !empty($_GET['dev']) && $this->is_allowed_to_debug();
	}

	public function is_debug () {
		return !empty($_GET['debug']) && $this->is_allowed_to_debug();
	}

	public function is_normal () {
		return !$this->is_dev() && !$this->is_debug();
	}

	public function constant ($which) {
		$which = preg_replace('/[^a-z]/i', '', strtoupper($which));
		$const = "Upfront_Debug::{$which}";

		return defined($const)
			? constant($const)
			: false
		;
	}

	public function level ($level) {
		return $this->constant($level);
	}

	public function set_baseline () {
		if (defined('UPFRONT_DEBUG_LEVELS')) return true; // Already set up
		$levels = $this->is_dev() ? self::ALL : 'none';
		define('UPFRONT_DEBUG_LEVELS', $levels);
	}

	public function is_allowed_to_debug(){
		return (bool) Upfront_Permissions::current(Upfront_Permissions::SEE_USE_DEBUG);
	}

	public function log ($msg, $context=false) {
		if ($this->is_normal()) return false;
		if (!empty($context) && !$this->is_active($context)) return false;
		$this->_logger->info($msg);
	}
}

