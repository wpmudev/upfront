<?php

class Upfront_ModuleLoader {
	
	private function __construct () {

	}

	public static function serve () {
		$me = new self;
		$me->init_core_elements();
	}

	public function init_core_elements () {
		$core_path = trailingslashit(get_template_directory()) . 'elements/';
		if (!is_dir($core_path)) return false;
		$elements = glob("{$core_path}/*");
		$this->_load_elements($elements);
	}

	private function _load_elements ($elements) {
		if (empty($elements) || !is_array($elements)) return false;
		foreach ($elements as $element) {
			$this->_load_element($element);
		}
		return true;
	}

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