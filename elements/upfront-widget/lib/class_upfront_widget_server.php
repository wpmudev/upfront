<?php
require_once 'class_upfront_widget_wp_defaults.php';
class Upfront_UwidgetAjax extends Upfront_Server {
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
		new Upfront_Uwidget_WP_Defaults();
	}

	private function _add_hooks () {
		add_action('wp_ajax_uwidget_load_widget_list', array($this, "load_widget_list"));
		add_action('wp_ajax_uwidget_get_widget_markup', array($this, "load_markup"));
		add_action('wp_ajax_uwidget_get_widget_admin_form', array($this, "load_admin_form"));
	}

	public function load_widget_list () {
		$this->_out(new Upfront_JsonResponse_Success(Upfront_Uwidget::get_widget_list()));
	}

	public function load_markup () {
		$data = json_decode(stripslashes($_POST['data']), true);
		$widget = new Upfront_Uwidget($data['widget']);

		$this->_out(new Upfront_JsonResponse_Success($widget->get_widget_markup($data['instance'])));
	}

	public function load_admin_form () {
		$data = json_decode(stripslashes($_POST['data']), true);
		$widget = new Upfront_Uwidget($data['widget']);
		
		$this->_out(new Upfront_JsonResponse_Success($widget->get_widget_admin_fields($data['widget'])));
	}
}
Upfront_UwidgetAjax::serve();