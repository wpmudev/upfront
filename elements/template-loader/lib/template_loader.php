<?php
class Upfront_TemplateLoaderView extends Upfront_Object {
	public static function default_properties() {
		return array();
	}

	public function get_markup () {

		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$content = $this->_get_property('content');
		ob_start();
		get_template_part($content);
    $out = ob_get_contents();
    ob_end_clean();
    return $out;
	}

	public static function add_l10n_strings ($strings) {
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Template Loader', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

	public static function export_content ($export, $object) {
		return upfront_get_property_value('content', $object);
	}
}
