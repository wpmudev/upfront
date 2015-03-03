<?php

// ----- Core -----



function upfront_get_property_value ($prop, $data) {
	$properties = !empty($data['properties']) ? $data['properties'] : array();
	if (empty($properties)) return false;

	$value = false;
	foreach ($properties as $property) {
		if ($prop != $property['name']) continue;
		$value = isset($property['value']) ? $property['value'] : false;
		break;
	}
	return $value;
}

function upfront_set_property_value ($prop, $value, $data) {
	$properties = !empty($data['properties']) ? $data['properties'] : array();
	$properties[] = array(
		'name' => $prop,
		'value' => $value,
	);
	$data['properties'] = $properties;
	return $data;
}

function upfront_get_breakpoint_property_value ($prop, $data, $breakpoint, $return_default = false) {
	$model_breakpoint = upfront_get_property_value('breakpoint', $data);
	$breakpoint_data = $model_breakpoint && !empty($model_breakpoint[$breakpoint->get_id()]) ? $model_breakpoint[$breakpoint->get_id()] : false;
	if ( $breakpoint_data && isset($breakpoint_data[$prop]) )
		return $breakpoint_data[$prop];
	if ( $return_default )
		return upfront_get_property_value($prop, $data);
	return false;
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

function upfront_switch_stylesheet ($stylesheet) {
	global $upfront_stylesheet;
	if ( $stylesheet && get_stylesheet() != $stylesheet ){
		$upfront_stylesheet = $stylesheet;
		add_filter('stylesheet', '_upfront_stylesheet');
		// Prevent theme mods to current theme being used on theme being previewed
		add_filter('pre_option_theme_mods_' . get_option( 'stylesheet' ), '__return_empty_array');
		return true;
	}
	return false;
}

function _upfront_stylesheet ($stylesheet) {
	global $upfront_stylesheet;
	return $upfront_stylesheet ? $upfront_stylesheet : $stylesheet;
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
	$hook = apply_filters('upfront-access-ajax_hook', $hook, $action);
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
	$stylesheet = $layout_ids = $storage_key = $load_dev = false;
	// Automatically instantiate Upfront_Layout object
	if ( $_SERVER['REQUEST_METHOD'] == 'POST' ){
		$layout_ids = !empty($_POST['layout']) ? $_POST['layout'] : false;
		$storage_key = !empty($_POST['storage_key']) ? $_POST['storage_key'] : false;
		$stylesheet = !empty($_POST['stylesheet']) ? $_POST['stylesheet'] : false;
		$load_dev = !empty($_POST['load_dev']) && $_POST['load_dev'] == 1 ? true : false;
	}
	else if ( isset($_GET['layout']) ){
		$layout_ids = !empty($_GET['layout']) ? $_GET['layout'] : false;
		$storage_key = !empty($_GET['storage_key']) ? $_GET['storage_key'] : false;
		$stylesheet = !empty($_GET['stylesheet']) ? $_GET['stylesheet'] : false;
		$load_dev = !empty($_GET['load_dev']) && $_GET['load_dev'] == 1 ? true : false;
	}

	if ($stylesheet === false) $stylesheet = apply_filters('upfront_get_stylesheet', $stylesheet);

	upfront_switch_stylesheet($stylesheet);
	if ( !is_array($layout_ids) )
		return;
	$layout = Upfront_Layout::from_entity_ids($layout_ids, $storage_key, $load_dev);
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
	if ( current_user_can('switch_themes') && !empty($_GET['dev']) )
		$args['load_dev'] = 1;
	return admin_url( 'admin-ajax.php?' . http_build_query($args) );
}

/**
 * Register scripts
 */

function upfront_register_vendor_scripts() {
	//Magnific lightbox
	if(defined( "SCRIPT_DEBUG" ) && SCRIPT_DEBUG) {
		wp_register_script(
			'magnific',
			Upfront::get_root_url() . '/scripts/magnific-popup/magnific-popup.js',
			array('jquery'),
			'1.0',
			true
		);
	} else {
		wp_register_script(
			'magnific',
			Upfront::get_root_url() . '/scripts/magnific-popup/magnific-popup.min.js',
			array('jquery'),
			'1.0',
			true
		);
	}

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

	if (empty($_GET['dev']) && empty($_GET['debug'])) { // Yeah, so re-intorduce the hacks
		$hub = Upfront_PublicStylesheets_Registry::get_instance();
		return $hub->set($slug, $path_info);
	} else {
		wp_enqueue_style($slug, upfront_element_url($path_info[0], $path_info[1]));
	}
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

	if (empty($_GET['dev']) && empty($_GET['debug'])) { // Yeah, so re-intorduce the hacks
		$hub = Upfront_PublicScripts_Registry::get_instance();
		return $hub->set($slug, $path_info);
	} else {
		wp_enqueue_script($slug, upfront_element_url($path_info[0], $path_info[1]), array('jquery'));
	}
}



function upfront_get_attachment_image_lazy ($attachment_id, $ref_size = 'full') {
	$attachment = get_post($attachment_id);
  // Safe guard for builder mode for slider images. This is only triggered on initial
  // page load which in builder will be instantly replaced by js app so it's safe to
  // skip this in builder mode.
  if (!is_object($attachment)) {
    return;
  }
	$imagedata = wp_get_attachment_metadata($attachment_id);
	$full_src = wp_get_attachment_image_src($attachment_id, 'full');
	$ref_src = wp_get_attachment_image_src($attachment_id, $ref_size);
	$srcset = array();
	$alt = trim(strip_tags( get_post_meta($attachment_id, '_wp_attachment_image_alt', true) ));
	if ( empty($alt) )
		$alt = trim(strip_tags( $attachment->post_excerpt )); // If not, Use the Caption
	if ( empty($alt) )
		$alt = trim(strip_tags( $attachment->post_title )); // Finally, use the title
	$out = '<img class="upfront-image-lazy" src="' . get_template_directory_uri() . '/img/blank.gif" width="' . $ref_src[1] . '" height="' . $ref_src[2]. '" alt="' . $alt . '" ';

    if( isset( $imagedata['sizes'] ) ){
        foreach ( $imagedata['sizes'] as $size => $data ){
            $src = wp_get_attachment_image_src($attachment_id, $size);
            $srcset[] = array($src[0], $src[1], $src[2]);
        }
    }

	$srcset[] = array($full_src[0], $full_src[1], $full_src[2]);
	$out .= "data-sources='" . json_encode($srcset) . "'";
	$out .= '/>';
	return $out;
}


