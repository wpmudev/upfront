<?php
/**
 * Tabbed element for Upfront
 */
class Upfront_UtabsView extends Upfront_Object {
  public static function default_properties() {
    $defaultTab = new StdClass();
    $defaultTab->title = 'Tab 1';
    $defaultTab->content = 'Click on active tab title to edit title. Confirm with Enter key.<br>Click on plus button [+] to add new tab.';
    return array(
      'type' => 'UtabsModel',
      'view_class' => 'UtabsView',
      'has_settings' => 1,
      'class' =>  'upfront-tabs',
      'tabs' => array($defaultTab),
      'tabs_count' => 1,
      'tabs_fixed_width' => 'auto',

      'style_type' => 'theme_defined',
      'theme_style' => 'tabbed',
      'custom_style' => 'tabbed',
      'active_tab_color' => '',
      'active_tab_text_color' => '',
      'inactive_tab_color' => '',
      'inactive_tab_text_color' => ''
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

      foreach($data['properties'] as $prop)
          $flat[$prop['name']] = $prop['value'];

      $flat = array_merge(self::default_properties(), $flat);

      $properties = array();
      foreach($flat as $name => $value)
          $properties[] = array('name' => $name, 'value' => $value);

      return $properties;
  }

  public function get_markup () {
  // This data is passed on to the template to precompile template
      $data = $this->properties_to_array();

      $data['wrapper_id'] = str_replace('utabs-object-', 'wrapper-', $data['element_id']);

      $markup = upfront_get_template('utabs', $data, dirname(dirname(__FILE__)) . '/tpl/utabs.html');

      // upfront_add_element_style('upfront_tabs', array('css/utabs.css', dirname(__FILE__)));
      upfront_add_element_script('upfront_tabs', array('js/utabs-front.js', dirname(__FILE__)));

      return $markup;
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

  public function add_styles_scripts() {
      wp_enqueue_style('utabs-style', upfront_element_url('css/utabs.css', dirname(__FILE__)));
  }
}

function upfront_tabs_add_local_url ($data) {
	$data['upfront_tabs'] = array(
		"root_url" => trailingslashit(upfront_element_url('/', dirname(__FILE__)))
	);
	return $data;
}
add_filter('upfront_data', 'upfront_tabs_add_local_url');
