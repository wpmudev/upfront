<?php
/**
 * Accordion element for Upfront
 */
class Upfront_UaccordionView extends Upfront_Object {
  public static function default_properties() {
    $defaultPanel = new StdClass();
    $defaultPanel->title = 'Panel 1';
    $defaultPanel->content = 'Click on active panel title to edit title. Confirm with Enter key.<br>Click on plus button [+] to add new panel.';
    return array(
      'type' => 'UaccordionModel',
      'view_class' => 'UaccordionView',
      'has_settings' => 1,
      'class' =>  'upfront-accordion',
      'accordion' => array($defaultPanel),
      'accordion_count' => 1,
      'accordion_fixed_width' => 'auto',
      'id_slug' => 'uaccordion',

      'style_type' => 'theme_defined',
      'theme_style' => 'style1',
      'header_border_color' => 'rgb(174, 196, 216)',
      'header_bg_color' => 'rgb(255, 255, 255)',
      'panel_bg_color' => 'rgb(255, 255, 255)'
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

      $data['wrapper_id'] = str_replace('uaccordion-object-', 'wrapper-', $data['element_id']);

      $markup = upfront_get_template('uaccordion', $data, dirname(dirname(__FILE__)) . '/tpl/uaccordion.html');

     // upfront_add_element_style('uaccordion_style', array('css/uaccordion.css', dirname(__FILE__)));
      upfront_add_element_script('uaccordion_script', array('js/uaccordion-front.js', dirname(__FILE__)));

      return $markup;
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
  public function add_styles_scripts() {
      wp_enqueue_style('uaccordion_style', upfront_element_url('css/uaccordion.css', dirname(__FILE__)));
  }

}

function upfront_accordion_add_local_url ($data) {
	$data['upfront_accordion'] = array(
		"root_url" => trailingslashit(upfront_element_url('/', dirname(__FILE__)))
	);
	return $data;
}
add_filter('upfront_data', 'upfront_accordion_add_local_url');
