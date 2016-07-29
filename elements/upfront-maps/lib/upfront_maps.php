<?php
class Upfront_UmapView extends Upfront_Object{

	public function get_markup(){
		$_id = $this->_get_property('element_id');
		$element_id = $_id ? "id='{$_id}'" : '';
		$raw_properties = !empty($this->_data['properties']) ? $this->_data['properties'] : array();
		$to_map = array('markers', 'map_center', 'zoom', 'style', 'controls', 'map_styles', 'draggable', 'scrollwheel', 'hide_markers', 'use_custom_map_code');

		$properties = array();
		foreach ($raw_properties as $prop) {
			if (in_array($prop['name'], $to_map)) $properties[$prop['name']] = $prop['value'];
		}
		if (!is_array($properties['controls'])) $properties['controls'] = array($properties['controls']);
		$map = 'data-map="' . esc_attr(json_encode($properties)) . '"';

		if (empty($properties)) return ''; // No info for this map, carry on.

		upfront_add_element_script('upfront_maps', array('js/upfront_maps-public.js', dirname(__FILE__)));
		upfront_add_element_style('upfront_maps', array('css/visitor.css', dirname(__FILE__)));
		
		if (Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
			//wp_enqueue_style('ubutton_editor', upfront_element_url('css/upfront-button-editor.css', dirname(__FILE__)));
			upfront_add_element_style('upfront_maps_editor', array('css/upfront-map-editor.css', dirname(__FILE__)));
		}

		$msg = esc_html(self::_get_l10n('preloading_msg'));

		return "<div class='ufm-gmap-container' {$element_id} {$map}>{$msg}</div>";
	}

	public static function add_js_defaults($data){
		$data['umaps'] = array(
			'defaults' => self::default_properties(),
		 );
		return $data;
	}

	public static function default_properties(){
		return array(
			'type' => "MapModel",
			'view_class' => "UmapView",
			"class" => "c24 upfront-map_element-object",
			'has_settings' => 1,
			'id_slug' => 'upfront-map_element',

			'controls' => array(),
			'map_center' => array(-37.8180, 144.9760),
			'zoom' => 10,
			'style' => 'ROADMAP',
			'styles' => false,

			'draggable' => true,
			'scrollwheel' => false,

			'fallbacks' => array(
				'script' => self::_get_l10n('default_script'),
			)
		);
	}

	public static function add_l10n_strings ($strings) {
		if (!empty($strings['maps_element'])) return $strings;
		$strings['maps_element'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'element_name' => __('Map', 'upfront'),
			'preloading_msg' => __('This is where the map comes in.', 'upfront'),
			'css' => array(
				'label' => __('Map container', 'upfront'),
				'info' => __('The layer wrapping the map.', 'upfront'),
			),
			'menu' => array(
				'center_map' => __('Center Map Here', 'upfront'),
				'add_marker' => __('Add Marker', 'upfront'),
				'remove_marker' => __('Remove Marker', 'upfront'),
				'change_icon' => __('Change Icon', 'upfront'),
			),
			'connectivity_warning' => __('Please, check your internet connectivity', 'upfront'),
			'instructions' => __('Please Enter Address:', 'upfront'),
			'api_key_empty' => __('Google Maps requires an API Key to work. Please enter your API Key in the field <a href="' . 
			admin_url('admin.php?page=upfront#api-key-gmaps') . 
			'" target="_blank" data-bypass="true">here</a>. Alternatively, if you don\'t have an API Key, one can be registered <a href="https://console.developers.google.com/flows/enableapi?apiid=maps_backend,geocoding_backend,directions_backend,distance_matrix_backend,elevation_backend&keyType=CLIENT_SIDE&reusekey=true" target="_blank" data-bypass="true">here</a>.', 'upfront'),
			'api_key_empty_region' => __('Google Maps requires an API Key to work.<br>Please register and enter your API Key in the WordPress Admin under the Upfront menu, General submenu.', 'upfront'),
			'placeholder' => __('Street, city, country', 'upfront'),
			'or' => __('or', 'upfront'),
			'use_current_location' => __('Use My Current Location', 'upfront'),
			'hold_on' => __('Please, hold on', 'upfront'),
			'edit_this' => __('Edit this...', 'upfront'),
			'image_url' => __('Image URL (.png):', 'upfront'),
			'settings' => __('Map settings', 'upfront'),
			'general_settings' => __('General Settings', 'upfront'),
			'address' => __('Address:', 'upfront'),
			'label' => __('Google Map', 'upfront'),
			'location_label' => __('Map Location', 'upfront'),
			'style' => array(
				'roadmap' => __('Roadmap', 'upfront'),
				'satellite' => __('Satellite', 'upfront'),
				'hybrid' => __('Hybrid', 'upfront'),
				'terrain' => __('Terrain', 'upfront'),
			),
			'ctrl' => array(
				'pan' => __('Pan', 'upfront'),
				'zoom' => __('Zoom', 'upfront'),
				'type' => __('Map Type', 'upfront'),
				'scale' => __('Scale', 'upfront'),
				'street_view' => __('Street View', 'upfront'),
				'overview' => __('Overview Map', 'upfront'),
			),
			'zoom_level' => __('Map Zoom Level:', 'upfront'),
			'map_style' => __('Map Style', 'upfront'),
			'map_controls' => __('Map Controls', 'upfront'),
			'draggable_map' => __('Draggable map', 'upfront'),
			'hide_markers' => __('Hide markers', 'upfront'),
			'use_custom_map_code' => __('Use Custom Map Code', 'upfront'),
			'use_custom_map_code_info' => __('Code generated by Apps like Snazzy Maps', 'upfront'),
			'open_map_code_panel' => __('Open Map Code Panel', 'upfront'),
			'default_script' => __('/* Your code here */', 'upfront'),
			'unable_to_geolocate' => __('We were unable to automatically determine your current location.', 'upfront'),
			'create' => array(
				'change' => __('Click to change', 'upfront'),
				'js_error' => __('JS error:', 'upfront'),
				'ok' => __('OK', 'upfront'),
			),
			'template' => array(
				'custom_map_code' => __('Custom Map Code', 'upfront'),
				'paste_below' => __('Paste your generated code below.', 'upfront'),
				'code_error' => __('There is an error in your JS code', 'upfront'),
				'close' => __('close', 'upfront'),
				'save' => __('Save', 'upfront'),
			),
		);

		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}

function upfront_maps_add_context_menu ($paths) {
	$paths['maps_context_menu'] = upfront_relative_element_url('js/ContextMenu', dirname(__FILE__));
	return $paths;
}
add_filter('upfront-settings-requirement_paths', 'upfront_maps_add_context_menu');

function upfront_maps_add_maps_local_url ($data) {
	$data['upfront_maps'] = array(
		"root_url" => trailingslashit(upfront_element_url('/', dirname(__FILE__))),
		"markers" => trailingslashit(upfront_element_url('img/markers/', dirname(__FILE__))),
	);
	return $data;
}
add_filter('upfront_data', 'upfront_maps_add_maps_local_url');
