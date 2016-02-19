<?php

class Upfront_UwidgetView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$widget_name = $this->_get_property('widget');
		$widget = new Upfront_Uwidget($widget_name);
		$fields = $widget->get_widget_admin_fields();

		// Treat the legacy widget setup
		if (empty($fields) && !(defined('DOING_AJAX') && DOING_AJAX)) {
			$fields_tmp = $this->_get_property('widget_specific_fields');
			if (!empty($fields_tmp)) foreach ($fields_tmp as $field) {
				if (empty($field['name'])) continue;
				$fields[] = array('name' => $field['name']);
			}
		}
		// We should be good here now

		$instance = array();

		foreach($fields as $field) {
			$name = !empty($field['name']) ? $field['name'] : false;
			if (empty($name)) continue;
			$instance[$name] = $this->_get_property($name);
		}

		return "<div class=' upfront-widget'>" .
			$widget->get_widget_markup($instance) .
		"</div>";
	}


	public static function add_js_defaults($data){
		$self = !empty($data['uwidget']) ? $data['uwidget'] : array();
		$data['uwidget'] = array_merge($self, array(
			'defaults' => self::default_properties(),
		));
		return $data;
	}

	public static function default_properties(){
		return array(
			'id_slug' => 'uwidget',
			'type' => "UwidgetModel",
			'view_class' => "UwidgetView",
			"class" => "c24 upfront-widget",
			'has_settings' => 1,
			'preset' => 'default',
			'widget' => false
		);
	}

	public static function add_dependencies () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_element_style('upfront_widget', array('css/widget.css', dirname(__FILE__)));
		}
	}

	public static function add_data ($data) {
		$self = !empty($data['uwidget']) ? $data['uwidget'] : array();
		$data['uwidget'] = array_merge($self, array(
			'widgets' => Upfront_Uwidget::get_widget_list()
		));
		return $data;
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['widget_element'])) return $strings;
		$strings['widget_element'] = self::get_l10n();
		return $strings;
	}

	public static function get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Widget', 'upfront'),
			'loading' => __('Loading...', 'upfront'),
			'done' => __('Done!', 'upfront'),
			'widget' => __('Widget', 'upfront'),
			'settings' => __('Widget settings', 'upfront'),
			'general_settings' => __('General Settings', 'upfront'),
			'widget_select' => __('Select Widget', 'upfront'),
			'select_widget' => __('Please select widget in settings', 'upfront'),
			'select_one' => __('Please select widget', 'upfront'),
			'css' => array(
				'container_label' => __('Widget container', 'upfront'),
				'container_info' => __('The container that wraps widget element', 'upfront'),
				'links_label' => __('Widget links', 'upfront'),
				'links_info' => __('Widget links', 'upfront'),
			),
			'render_error' => __('Ooops, something seems to have gone wrong with rendering the widget', 'upfront'),
			'missing_admin_data' => __('We haven\'t been able to find any fields for the selected widget. Something could be wrong.', 'upfront'),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}

}
