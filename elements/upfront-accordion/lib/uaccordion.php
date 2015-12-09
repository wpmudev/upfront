<?php
/**
 * Accordion element for Upfront
 */
class Upfront_UaccordionView extends Upfront_Object {
	public static function default_properties() {
		$defaultPanel = new StdClass();
		$defaultPanel->title = self::_get_l10n('default_panel_title');
		$defaultPanel->content = self::_get_l10n('default_panel_content');
		$secondPanel = new StdClass();
		$secondPanel->title = self::_get_l10n('panel_label').' 2';
		$secondPanel->content = self::_get_l10n('content_label');
		return array(
			'type' => 'UaccordionModel',
			'view_class' => 'UaccordionView',
			'has_settings' => 1,
			'class' =>  'upfront-accordion',
			'accordion' => array($defaultPanel, $secondPanel),
			'accordion_count' => 2,
			'accordion_fixed_width' => 'auto',
			'id_slug' => 'uaccordion',
			'preset' => 'default',
		);
	}

	function __construct($data) {
		$data['properties'] = $this->merge_default_properties($data);
		parent::__construct($data);
	}

	protected function merge_default_properties($data){
		$flat = array();
		if(!isset($data['properties']))
			return $flat;

		foreach($data['properties'] as $prop) {
			if (isset($prop['value']) === false) continue;
			$flat[$prop['name']] = $prop['value'];
		}

		$flat = array_merge(self::default_properties(), $flat);

		$properties = array();
		foreach($flat as $name => $value)
			$properties[] = array('name' => $name, 'value' => $value);

		return $properties;
	}

	public function get_markup () {
		// This data is passed on to the template to precompile template
		$data = $this->properties_to_array();

		// Do shortcode
		foreach($data['accordion'] as $index=>$accordion) {
			$accordion['content'] = $this->_do_shortcode($accordion['content']);
			$data['accordion'][$index] = $accordion;
		}

		$data['preset'] = isset($data['preset']) ? $data['preset'] : 'default';

		$data['wrapper_id'] = str_replace('uaccordion-object-', 'wrapper-', $data['element_id']);

		$markup = upfront_get_template('uaccordion', $data, dirname(dirname(__FILE__)) . '/tpl/uaccordion.html');

		// upfront_add_element_style('uaccordion_style', array('css/uaccordion.css', dirname(__FILE__)));
		upfront_add_element_script('uaccordion_script', array('js/uaccordion-front.js', dirname(__FILE__)));
		return $markup;
	}

	protected function _do_shortcode ($content) {
		$do_processing = apply_filters(
			'upfront-shortcode-enable_in_layout', 
			(defined('UPFRONT_DISABLE_LAYOUT_TEXT_SHORTCODES') && UPFRONT_DISABLE_LAYOUT_TEXT_SHORTCODES ? false : true)
		);
		if ($do_processing) $content = do_shortcode($content);
		return $content;
	}

	public function add_js_defaults($data){
		$newdata = array(
			'defaults' => self::default_properties(),
			'template' => upfront_get_template_url('uaccordion', upfront_element_url('tpl/uaccordion.html', dirname(__FILE__)))
		);

		if(isset($data['uaccordion'])) {
			if(isset($data['uaccordion']['defaults'])) {
				$merged_defaults = array_merge($data['uaccordion']['defaults'], $newdata['defaults']);
				$data['uaccordion']['defaults'] = $merged_defaults;
			}
			else {
				$data['uaccordion']['defaults'] = $newdata['defaults'];
			}
			$data['uaccordion']['template'] = $newdata['template'];
		}
		else
			$data['uaccordion'] = $newdata;

		return $data;
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
			$out[$prop['name']] = $prop['value'];
		return $out;
	}
	public static function add_styles_scripts() {
		upfront_add_element_style('uaccordion_style', array('css/uaccordion.css', dirname(__FILE__)));
		//wp_enqueue_style('uaccordion_style', upfront_element_url('css/uaccordion.css', dirname(__FILE__)));
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['accordion_element'])) return $strings;
		$strings['accordion_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Accordion', 'upfront'),
			'default_panel_title' => __('Panel 1', 'upfront'),
			'default_panel_content' => __('Click on active panel title to edit title. Confirm with Enter key.<br>Click on plus button [+] to add new panel.', 'upfront'),
			'css' => array(
				'containers_label' => __('Panel containers', 'upfront'),
				'containers_info' => __('The wrapper layer of every panel.', 'upfront'),
				'header_label' => __('Panel header', 'upfront'),
				'header_info' => __('The header title of every panel', 'upfront'),
				'active_header_label' => __('Active Panel header', 'upfront'),
				'active_header_info' => __('The header title of active panel', 'upfront'),
				'body_label' => __('Panel body', 'upfront'),
				'body_info' => __('The content part of every panel.', 'upfront'),
				'first_label' => __('First Panel container', 'upfront'),
				'first_info' => __('The wrapper layer of first panel.', 'upfront'),
				'last_label' => __('Last Panel container', 'upfront'),
				'last_label' => __('The wrapper layer of last panel.', 'upfront'),
				'odd_label' => __('Odd Panel containers', 'upfront'),
				'odd_info' => __('The wrapper layer of odd panels.', 'upfront'),
				'even_label' => __('Even Panel containers', 'upfront'),
				'even_info' => __('The wrapper layer of even panels.', 'upfront'),
				'wrap' => __('Element Wrapper', 'upfront'),
				'wrap_info' => __('The wrapper of the whole element.', 'upfront'),
			),
			'settings' => __('Accordion settings', 'upfront'),
			'panel_label'	=> __('Panel', 'upfront'),
			'add_panel'	=> __('Add Panel', 'upfront'),
			'content_label' => __('Content', 'upfront'),
			'appearance' => __('Appearance', 'upfront'),
			'section_bg' => __('Section Background:', 'upfront'),
			'header_bg' => __('Header Background:', 'upfront'),
			'header_border' => __('Header Border:', 'upfront'),
			'default_preset' => __('Default', 'upfront'),
			'content_area_colors_label' => __('Content Area Colors', 'upfront'),
			'content_area_bg_label' => __('Content Area BG', 'upfront'),
			'colors_label' => __('Colors', 'upfront'),
			'header_bg_label' => __('Header BG', 'upfront'),
			'triangle_icon_label' => __('Triangle Icon', 'upfront'),
			'typography_tab_label' => __('Tab Label Typography', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

}

function upfront_accordion_add_local_url ($data) {
	$data['upfront_accordion'] = array(
		"root_url" => trailingslashit(upfront_element_url('/', dirname(__FILE__)))
	);
	return $data;
}
add_filter('upfront_data', 'upfront_accordion_add_local_url');
