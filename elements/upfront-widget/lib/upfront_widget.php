<?php

class Upfront_Uwidget {

	public static function get_widget_list () {
		$data = array();
		global $wp_registered_widget_controls, $wp_registered_widgets;		
		foreach ($wp_registered_widgets as $key => $widget) {
			$data[] = array(
				'name' => $widget['name'],
				'key' => $key,
				'admin' => !empty($wp_registered_widget_controls[$key])
			);
		}
		return $data;
	}

	public static function get_widget_markup ($widget, $instance = array()) {
		global $wp_registered_widgets;
		$result = '';
		$args = !empty($wp_registered_widgets[$widget]['params']) ? $wp_registered_widgets[$widget]['params'] : array();

		$callback = $wp_registered_widgets[$widget]['callback'];
		if (empty($callback) || !is_callable($callback)) return $result;

		if (is_array($callback) && !empty($callback[0]) && is_object($callback[0]) && $callback[0] instanceof WP_Widget) {
			$callback[1] = 'widget';
		}
		$args = wp_parse_args($args, array(
			'before_widget' => '',
			'before_title' => '',
			'after_title' => '',
			'after_widget' => '',
		));
		$args = apply_filters('upfront_widget_widget_args', $args);
		$instance = wp_parse_args($instance, array(
			'title' => '',
		));

		ob_start();
		call_user_func_array($callback, array($args, $instance));
		$out = ob_get_clean();

		return !empty($out) ? $out : $result;
	}

	public static function _admin_fields ($widget) {
		global $wp_registered_widget_controls;
		$result = array();

		if (empty($wp_registered_widget_controls[$widget])) return $result;
		
		$callback = $wp_registered_widget_controls[$widget]['callback'];
		if (empty($callback) || !is_callable($callback)) return $result;

		$params = $wp_registered_widget_controls[$widget]['params'];

		ob_start();
		call_user_func_array($callback, array($params));
		$markup = ob_get_clean();

		return self::_get_fields($markup);
	}

	public static function _get_fields ($markup) {
		$form = new DOMDocument();
		@$form->loadHTML($markup);

		$xpath = new DOMXPath($form);
		$nodes = $xpath->query('/html/body//label | /html/body//input | /html/body//select | /html/body//textarea');

		$fields = array();

		foreach($nodes as $node) {
			if ('label' === strtolower($node->nodeName)) {
				if (isset($fields[$node->getAttribute('for')])) $fields[$node->getAttribute('for')]['label'] = $node->nodeValue;
				else $fields[$node->getAttribute('for')] = array('label' => $node->nodeValue);
			} else {
				$exp_name = explode('[', $node->getAttribute('name'));
				$fieldname = str_replace(']', '', array_pop($exp_name));
				if (isset($fields[$node->getAttribute('id')])) $fields[$node->getAttribute('id')]['name'] = $fieldname;
				else $fields[$node->getAttribute('id')] = array('name' =>$fieldname);
				if (strtolower($node->nodeName) == 'select') {
					$fields[$node->getAttribute('id')]['type'] = $node->nodeName;
					$fields[$node->getAttribute('id')]['options'] = array();
					foreach($xpath->query('./option', $node) as $option) {
						$fields[$node->getAttribute('id')]['options'][$option->getAttribute('value')] = $option->nodeValue;
					}
				} elseif('textarea' === strtolower($node->nodeName)) {
					$fields[$node->getAttribute('id')]['type'] = $node->nodeName;
					$fields[$node->getAttribute('id')]['value'] = $node->nodeValue;
				} elseif('input' === strtolower($node->nodeName)) {
					$fields[$node->getAttribute('id')]['type'] = $node->getAttribute('type');
					$fields[$node->getAttribute('id')]['value'] = $node->getAttribute('value');

				}
			}

		}

		return $fields;
	}

	public static function get_widget_admin_fields($widget) {
		return self::_admin_fields($widget);
	}

}

class Upfront_UwidgetView extends Upfront_Object {

	public function get_markup () {
		$element_id = $this->_get_property('element_id');
		$element_id = $element_id ? "id='{$element_id}'" : '';

		$widget = $this->_get_property('widget');

		$fields = Upfront_Uwidget::get_widget_admin_fields($widget);

		$instance = array();

		foreach($fields as $field) {
			$instance[$field['name']] = $this->_get_property($field['name']);
		}


		return "<div class=' upfront-widget' {$element_id}>" .
			Upfront_Uwidget::get_widget_markup($widget, $instance) .
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

			'widget' => false
		);
	}

	public static function add_dependencies () {
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			upfront_add_element_style('upfront_widget', array('css/widget.css', dirname(__FILE__)));
		}
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['widget_element'])) return $strings;
		$strings['widget_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Widget', 'upfront'),
			'loading' => __('Loading...', 'upfront'),
			'done' => __('Done!', 'upfront'),
			'widget' => __('Widget', 'upfront'),
			'settings' => __('Widget settings', 'upfront'),
			'widget_select' => __('Select Widget', 'upfront'),
			'select_widget' => __('Please select widget on settings', 'upfront'),
			'css' => array(
				'container_label' => __('Widget container', 'upfront'),
				'container_info' => __('The container that wraps widget element', 'upfront'),
				'links_label' => __('Widget links', 'upfront'),
				'links_info' => __('Widget links', 'upfront'),
			),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
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
		add_action('wp_ajax_uwidget_get_widget_admin_form', array($this, "load_admin_form"));
	}

	public function load_widget_list () {
		$this->_out(new Upfront_JsonResponse_Success(Upfront_Uwidget::get_widget_list()));
	}

	public function load_markup () {
		$args = array();
		$data = json_decode(stripslashes($_POST['data']), true);

		$this->_out(new Upfront_JsonResponse_Success(Upfront_Uwidget::get_widget_markup($data['widget'], $data['instance'])));
	}

	public function load_admin_form () {
		$data = json_decode(stripslashes($_POST['data']), true);
		$this->_out(new Upfront_JsonResponse_Success(Upfront_Uwidget::get_widget_admin_fields($data['widget'])));
	}
}
Upfront_UwidgetAjax::serve();


function upfront_widget_data ($data) {
	$self = !empty($data['uwidget']) ? $data['uwidget'] : array();
	$data['uwidget'] = array_merge($self, array(
		'widgets' => Upfront_Uwidget::get_widget_list()
	));
	return $data;
}
add_filter('upfront_data', 'upfront_widget_data');
