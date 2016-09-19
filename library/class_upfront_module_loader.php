<?php

/**
 * Resolves and loads Upfront modules
 */
class Upfront_ModuleLoader {

	/**
	 * Doesn't allow spawning from the outside
	 */
	private function __construct () {}

	/**
	 * Public main access point
	 */
	public static function serve () {
		$me = new self;
		$me->init_core_elements();
	}

	/**
	 * Initializes all elements from core FS path
	 *
	 * @return bool
	 */
	public function init_core_elements () {
		$core_path = trailingslashit(get_template_directory()) . 'elements/';
		if (!is_dir($core_path)) return false;
		$elements = glob("{$core_path}/*");
		return $this->_load_elements($elements);
	}

	/**
	 * Loads elements from array
	 *
	 * @param array $elements List of known elements (array of paths)
	 *
	 * @return bool
	 */
	private function _load_elements ($elements) {
		if (empty($elements) || !is_array($elements)) return false;
		foreach ($elements as $element) {
			$this->_load_element($element);
		}
		return true;
	}

	/**
	 * Bootstraps and loads individual element
	 *
	 * @param string $element Element root directory
	 *
	 * @return bool
	 */
	private function _load_element ($element) {
		if (empty($element) || !is_dir($element)) return false;
		$entry_points = glob("{$element}/*.php");

		if (count($entry_points) > 1 || empty($entry_points[0])) return false; // For now - might inclide some detection here
		$element_path = $entry_points[0];
		if (apply_filters('upfront-core_modules-load_module', true, $element_path)) {
			require_once($element_path);
		}
		return true;
	}

}
