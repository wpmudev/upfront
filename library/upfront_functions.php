<?php

// ----- Core -----



function upfront_get_property_value ($prop, $data) {
	$properties = !empty($data['properties']) ? $data['properties'] : array();
	if (empty($properties)) return false;

	$value = false;
	foreach ($properties as $property) {
		if ($prop != $property['name']) continue;
		$value = $property['value'];
		break;
	}
	return $value;
}

function upfront_get_class_num ($classname, $classes) {
	$classes = array_map('trim', explode(' ', $classes));
	$rx = '^' . preg_quote($classname, '/') . '(\d+)$';
	foreach ($classes as $class) {
		if (preg_match("/{$rx}/", $class, $matches))
			return intval($matches[1]);
	}
	return false;
}

function upfront_element_relative_path ($relpath, $filepath) {
	$templatepath = str_replace('|/+|','/',str_replace('\\','/',get_template_directory())); // normalize slashes
	$filepath = trailingslashit(str_replace('|/+|','/',str_replace('\\','/',dirname($filepath)))); // normalize slashes
	$element_path = preg_replace('/' . preg_quote(trailingslashit($templatepath), '/') . '/i', '', $filepath);
	$relpath = ($element_path ? trim($element_path, '/') . '/' : '') . trim($relpath, '/');
	return $relpath;
}

function upfront_element_url ($relpath, $filepath) {
	$relpath = upfront_element_relative_path($relpath, $filepath);
	return trailingslashit(Upfront::get_root_url()) . $relpath;
}

function upfront_relative_element_url ($relpath, $filepath) {
	return upfront_element_relative_path($relpath, $filepath);
}

function upfront_element_dir ($relpath, $filepath) {
	$relpath = upfront_element_relative_path($relpath, $filepath);
	return trailingslashit(Upfront::get_root_dir()) . $relpath;
}

function upfront_get_unique_id ($pfx = '') {
	return sprintf("%s-%s-%s", ($pfx ? $pfx : "entity"), time(), rand(1000,99999));
}



// ----- API -----

/**
 * Registers LayoutEditor Entity (Module/Object) resource.
 * @param  string $name Entity name, as used for registering
 * @param  string $path Entity main resource URL
 */
function upfront_add_layout_editor_entity ($name, $path) {
	$entities = Upfront_Entity_Registry::get_instance();
	return $entities->set($name, $path);
}

/**
 * Register AJAX action to WordPress, additionally, also register upfront_ajax_init
 */
function upfront_add_ajax ($action, $callback, $admin = true) {
	$hook = 'wp_ajax_' . ( !$admin ? 'nopriv_' : '' ) . $action;
	add_action($hook, 'upfront_ajax_init');
	add_action($hook, $callback);
}

function upfront_add_ajax_nopriv ($action, $callback) {
	return upfront_add_ajax($action, $callback, false);
}

/**
 * Run first on each AJAX action registered with upfront_add_ajax
 */
function upfront_ajax_init () {
	// Automatically instantiate Upfront_Layout object
	if ( $_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['layout']) )
		$layout_ids = $_POST['layout'];
	else if ( isset($_GET['layout']) )
		$layout_ids = $_GET['layout'];
	if ( !is_array($layout_ids) )
		return;
	$layout = Upfront_Layout::from_entity_ids($layout_ids);
	if ( $layout->is_empty() )
		$layout = Upfront_Layout::create_layout($layout_ids);
}

/**
 * Get AJAX URL with layout entity id added to arguments
 */
function upfront_ajax_url ($action, $args = '') {
	$args = wp_parse_args($args);
	$args['action'] = $action;
	$args['layout'] = Upfront_EntityResolver::get_entity_ids();
	return admin_url( 'admin-ajax.php?' . http_build_query($args) );
}

/**
 * Register scripts
 */

function upfront_register_vendor_scripts() {
	//Magnific lightbox
	if(SCRIPT_DEBUG)
		wp_register_script(
			'magnific',
			Upfront::get_root_url() . '/scripts/magnific-popup/magnific-popup.js',
			array('jquery')
		);
	else
		wp_register_script(
			'magnific',
			Upfront::get_root_url() . '/scripts/magnific-popup/magnific-popup.min.js',
			array('jquery')
		);

	wp_register_style(
		'magnific',
		Upfront::get_root_url() . '/scripts/magnific-popup/magnific-popup.css'
	);
}
add_action('init', 'upfront_register_vendor_scripts');



/* ----- Elements dependencies enqueueing wrappers----- */


/**
 * Adds element style resource.
 * @param string $slug Stylesheet ID to be keyed under (hopefully unique)
 * @param array $path_info Two-member array, describing resource location. The members are like arguments for upfront_element_dir/upfront_element_url
 * @return bool False on failure/invalid arguments, true on success
 */
function upfront_add_element_style ($slug, $path_info) {
	if (empty($slug) || empty($path_info)) return false;
	if (!is_array($path_info)) return false;
	if (count($path_info) != 2) return false;

	if (current_theme_supports($slug)) return true; // Current theme supports this style

	$hub = Upfront_PublicStylesheets_Registry::get_instance();
	return $hub->set($slug, $path_info);
}

/**
 * Adds element script resource.
 * @param string $slug Script ID to be keyed under (hopefully unique)
 * @param array $path_info Two-member array, describing resource location. The members are like arguments for upfront_element_dir/upfront_element_url
 * @return bool False on failure/invalid arguments, true on success
 */
function upfront_add_element_script ($slug, $path_info) {
	if (empty($slug) || empty($path_info)) return false;
	if (!is_array($path_info)) return false;
	if (count($path_info) != 2) return false;

	if (
		current_theme_supports("upfront-element_scripts")
		&&
		current_theme_supports("{$slug}-script")
	) return true; // Current theme supports element scripts, and this script in particular

	$hub = Upfront_PublicScripts_Registry::get_instance();
	return $hub->set($slug, $path_info);
}
