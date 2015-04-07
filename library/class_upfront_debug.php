<?php

abstract class Upfront_Debug {

	const ALL = 'all';

	const CACHED_RESPONSE = 'cached_response';
	const STYLE = 'style';
	const MARKUP = 'markup';
	const RESPONSE = 'response';
	const JS_TRANSIENTS = 'js_transients';
	const DEV = 'dev';
	const RESPONSIVE_BREAKPOINTS = 'responsive_breakpoints';
	const WEB_FONTS = 'web_fonts';

	protected $_levels = array();

	abstract public function log ($msg, $context);

	public static function get_debugger () {
		return new Upfront_Debug_StreamWriter;
	}

	public function __construct () {
		$debug_levels = array();
		if (defined('UPFRONT_DEBUG_LEVELS') && UPFRONT_DEBUG_LEVELS) {
			$debug_levels = array_map('trim', explode(',', UPFRONT_DEBUG_LEVELS));
		}
		$this->_levels = $debug_levels;
	}

	public function get_levels () {
		return $this->_levels;
	}

	public function is_active ($level=false) {
		if (!$level) return defined('UPFRONT_DEBUG_LEVELS') && UPFRONT_DEBUG_LEVELS && UPFRONT_DEBUG_LEVELS !== 'none';
		$all = $this->get_levels();
		return in_array($level, $all) || in_array(self::ALL, $all);
	}
}

class Upfront_Debug_StreamWriter extends Upfront_Debug {

	public function log ($msg, $context) {
		if (!$this->is_active($context)) return false;
		echo '<pre>' . var_export($msg, 1) . '</pre>';
	}

}