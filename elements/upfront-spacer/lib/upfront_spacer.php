<?php

class Upfront_UspacerView extends Upfront_Object {

	public function get_markup () {
		return "";
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['spacer_element'])) return $strings;
		$strings['spacer_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Spacer', 'upfront')
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}