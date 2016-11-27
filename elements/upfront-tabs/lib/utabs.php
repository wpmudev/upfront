<?php
/**
 * Tabbed element for Upfront
 */
class Upfront_UtabsView extends Upfront_Object {

	public static function default_properties() {
		$defaultTab = new StdClass();
		$defaultTab->title = '';
		$defaultTab->content = self::_get_l10n('default_tab_content');

		$secondTab = new StdClass();
		$secondTab->title = '';
		$secondTab->content = self::_get_l10n('second_tab_content');

		return array(
			'type' => 'UtabsModel',
			'view_class' => 'UtabsView',
			'has_settings' => 1,
			'class' =>  'upfront-tabs',
			'tabs' => array($defaultTab, $secondTab),
			'tabs_count' => 2,

			'id_slug' => 'utabs',
			'preset' => 'default'
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

		// Ensure tab title
		// Do shortcode
		foreach($data['tabs'] as $index=>$tab) {
			$ttl = trim(str_replace("\n", '', $tab['title']));
			if (empty($ttl)) {
				$tab['title'] = 'Tab ' . ($index + 1);
			}
			$tab['content'] = $this->_do_shortcode($tab['content']);
			$data['tabs'][$index] = $tab;
		}

		if (!$data['preset']) {
			$data['preset'] = 'default';
		}

		$data['wrapper_id'] = str_replace('utabs-object-', 'wrapper-', $data['element_id']);

		$markup = upfront_get_template('utabs', $data, dirname(dirname(__FILE__)) . '/tpl/utabs.html');

		// upfront_add_element_style('upfront_tabs', array('css/utabs.css', dirname(__FILE__)));
		upfront_add_element_script('upfront_tabs', array('js/utabs-front.js', dirname(__FILE__)));

		return $markup;
	}

	protected function _do_shortcode ($content) {
		return Upfront_Codec::get('wordpress')->do_shortcode($content);
	}

	public function add_js_defaults($data){
		$data['utabs'] = array(
				'defaults' => self::default_properties(),
				'template' => upfront_get_template_url('utabs', upfront_element_url('tpl/utabs.html', dirname(__FILE__)))
		);
		return $data;
	}

	private function properties_to_array(){
		$out = array();
		foreach($this->_data['properties'] as $prop)
				$out[$prop['name']] = $prop['value'];
		return $out;
	}

	public static function add_styles_scripts() {
		upfront_add_element_style('utabs-style', array('css/utabs.css', dirname(__FILE__)));
		//wp_enqueue_style('utabs-style', upfront_element_url('css/utabs.css', dirname(__FILE__)));
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['utabs_element'])) return $strings;
		$strings['utabs_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Tabs', 'upfront'),
			'default_tab_content' => __('<p>Click on active tab title to edit title. Confirm with Enter key.</p><p>Click on plus button [+] to add new tab.</p>', 'upfront'),
			'second_tab_content' => __('Have fun with tabs.', 'upfront'),
			'tab_label'	=> __('Tab', 'upfront'),
			'content_label'	=> __('Content', 'upfront'),
			'tab_placeholder' => __('Tab Content', 'upfront'),
			'css' => array(
				'container_label' => __('Tabs container', 'upfront'),
				'container_info' => __('The layer that contains all the contents of the tab element.', 'upfront'),
				'menu_label' => __('Tabs menu', 'upfront'),
				'menu_info' => __('The row that contains all tabs.', 'upfront'),
				'tabs_label' => __('Tabs', 'upfront'),
				'tabs_info' => __('Each of the tabs.', 'upfront'),
				'active_tab_label' => __('Active tab', 'upfront'),
				'active_tab_info' => __('Active tab', 'upfront'),
				'tab_content_label' => __('Tab content', 'upfront'),
				'tab_content_info' => __('The layer that wraps tab content', 'upfront'),
				'tab_p_label' => __('Tab content paragraph', 'upfront'),
				'tab_p_info' => __('The paragraph that contains tab content', 'upfront'),
				'active_content_label' => __('Active tab content', 'upfront'),
				'active_content_info' => __('The layer that wraps active tab content', 'upfront'),
				'active_p_label' => __('Active tab content paragraph', 'upfront'),
				'active_p_info' => __('The paragraph that contains active tab content', 'upfront'),
			),
			'settings' => __('Tabs settings', 'upfront'),
			'add_tab' => __('Add a Tab', 'upfront'),
			'default_preset' => __('Default', 'upfront'),
			'content_area_colors_label' => __('Content Area Colors', 'upfront'),
			'content_area_bg_label' => __('Content Area BG', 'upfront'),
			'colors_label' => __('Colors', 'upfront'),
			'tab_typography_label' => __('Tab Label Typography', 'upfront'),
			'tab_bg_label' => __('Tab Background', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}

function upfront_tabs_add_local_url ($data) {
	$data['upfront_tabs'] = array(
		"root_url" => trailingslashit(upfront_element_url('/', dirname(__FILE__)))
	);
	return $data;
}
add_filter('upfront_data', 'upfront_tabs_add_local_url');
