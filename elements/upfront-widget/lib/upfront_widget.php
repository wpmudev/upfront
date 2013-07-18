<?php

class Upfront_UwidgetView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';
		$widget = $this->_get_property('widget');
		
		return "<div class='upfront-output-object upfront-widget' {$element_id}>" .
			self::get_widget_markup($widget) .
		"</div>";
	}
	
	public static function get_widget_markup ($widget, $instance = array()) {
		
		$args = apply_filters('upfront_widget_widget_args', array());
		
		ob_start();
		the_widget($widget, (!empty($instance) ? $instance : array()), $args);
		
		return ob_get_clean();
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
		global $wp_widget_factory, $wp_registered_widgets;
		$data = array();
		foreach ( $wp_widget_factory->widgets as $widget ){
			$data[] = array(
				'name' => $widget->name,
				'class' => get_class($widget)
			);
		}
		$this->_out(new Upfront_JsonResponse_Success($data));
	}

	public function load_markup () {
		$args = array();
		$data = json_decode(stripslashes($_POST['data']), true);
		
		$this->_out(new Upfront_JsonResponse_Success(Upfront_UwidgetView::get_widget_markup($data['widget'], $data['instance'])));
	}
}
Upfront_UwidgetAjax::serve();

