<?php

class Upfront_Uwidget {
	
	public static function get_widget_list () {
		global $wp_widget_factory, $wp_registered_widgets;
		$data = array();
		foreach ( $wp_widget_factory->widgets as $widget ){
			$data[] = array(
				'name' => $widget->name,
				'class' => get_class($widget)
			);
		}
		return $data;
	}
	
	public static function get_widget_markup ($widget, $instance = array()) {
		$args = apply_filters('upfront_widget_widget_args', array());
		
		ob_start();
		the_widget($widget, (!empty($instance) ? $instance : array()), $args);
		
		return ob_get_clean();
	}
	
	public static function add_js_defaults($data){
		$data['uwidget'] = array(
			'defaults' => self::default_properties(),
		);
		return $data;
	}

	public static function default_properties(){
		return array(
			'id_slug' => 'uwidget',
			'type' => "UwidgetModel",
			'view_class' => "UwidgetView",
			"class" => "c22 upfront-widget",
			'has_settings' => 1,

			'widget' => false
		);
	}
}

class Upfront_UwidgetView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		$widget = $this->_get_property('widget');
		
		return "<div class='upfront-output-object upfront-widget' {$element_id}>" .
			Upfront_Uwidget::get_widget_markup($widget) .
		"</div>";
	}
	
}

class Upfront_UwidgetAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_action('wp_ajax_uwidget_load_widget_list', array($this, "load_widget_list"));
		add_action('wp_ajax_uwidget_get_widget_markup', array($this, "load_markup"));
	}

	public function load_widget_list () {
		$this->_out(new Upfront_JsonResponse_Success(Upfront_Uwidget::get_widget_list()));
	}

	public function load_markup () {
		$args = array();
		$data = json_decode(stripslashes($_POST['data']), true);
		
		$this->_out(new Upfront_JsonResponse_Success(Upfront_Uwidget::get_widget_markup($data['widget'], $data['instance'])));
	}
}
Upfront_UwidgetAjax::serve();


function upfront_widget_data ($data) {
	$data['uwidget'] = array(
		'widgets' => Upfront_Uwidget::get_widget_list()
	);
	return $data;
}
add_filter('upfront_data', 'upfront_widget_data');

