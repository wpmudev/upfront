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

function upfront_set_property_value ($prop, $value, &$data) {
	$properties = !empty($data['properties']) ? $data['properties'] : array();
	$updated = false;

	// Try to update if property already exists
	foreach ($properties as $index=>$property) {
		if ($property['name'] === $prop) {
			$properties[$index] = array(
				'name' => $prop,
				'value' => $value
			);
			$updated = true;
			break;
		}
	}

	// Add new one
	if ($updated !== true) {
		$properties[] = array(
			'name' => $prop,
			'value' => $value,
		);
	}
	$data['properties'] = $properties;
	return $data;
}

/**
 * Converts an Upfront Property collection to a normal associative array.
 */
function upfront_properties_to_array ($the_properties, $map=null) {
	$the_array = array();
	foreach ($the_properties as $prop) {
		if ( is_array($map) && ! in_array($prop['name'], $map) ) { continue; }
		$the_array[$prop['name']] = isset($prop['value']) ? $prop['value'] : false;
	}
	return $the_array;
}

/**
 * Reverse of the `upfront_properties_to_array` function: Takes an associtative
 * array and returns an Upfront Property collection.
 */
function upfront_array_to_properties ($the_array, $map=null) {
	$the_properties = array();
	foreach ($the_array as $name=>$value) {
		if ( is_array($map) && ! in_array($name, $map) ) { continue; }
		$the_properties[] = array( 'name' => $name, 'value' => $value );
	}
	return $the_properties;
}

function upfront_get_breakpoint_property_value ($prop, $data, $breakpoint, $return_default = false) {
	$model_breakpoint = upfront_get_property_value('breakpoint', $data);
	$breakpoint_data = $model_breakpoint && !empty($model_breakpoint[$breakpoint->get_id()]) ? $model_breakpoint[$breakpoint->get_id()] : false;
	if ( $breakpoint_data && isset($breakpoint_data[$prop]) ){
		return $breakpoint_data[$prop];
	}
	if ( $return_default ) {
		return upfront_get_property_value($prop, $data);
	}
	return false;
}

function upfront_set_breakpoint_property_value ($prop, $value, &$data, $breakpoint) {
	$model_breakpoint = upfront_get_property_value('breakpoint', $data);
	$breakpoint_data = $model_breakpoint && !empty($model_breakpoint[$breakpoint->get_id()]) ? $model_breakpoint[$breakpoint->get_id()] : array();
	$breakpoint_data[$prop] = $value;
	$model_breakpoint[$breakpoint->get_id()] = $breakpoint_data;
	upfront_set_property_value('breakpoint', $model_breakpoint, $data);
	return $data;
}

function upfront_get_class_num ($classname, $classes) {
	$classes = array_map('trim', explode(' ', $classes));
	$rx = '^' . preg_quote($classname, '/') . '(\d+)$';
	foreach ($classes as $class) {
		if (preg_match("/{$rx}/", $class, $matches)) return intval($matches[1]);
	}
	return false;
}

function upfront_replace_class_num ($classname, $val, $classes) {
	$rx = preg_quote($classname, '/') . '\d+';
	return preg_replace("/{$rx}/", $classname . $val, $classes);
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
	$entity_ids = Upfront_EntityResolver::get_entity_ids();
	
	// if page was still draft and viewed on FE, we should show 404 layout 
	if ( !Upfront_Output::get_post_id() && isset($entity_ids['specificity']) && preg_match('/single-page/i', $entity_ids['specificity']) ) {
		unset($entity_ids['specificity']);
		$entity_ids['item'] = 'single-404_page';
	}
	$args['layout'] = $entity_ids;
	
	if ( current_user_can('switch_themes') && Upfront_Behavior::debug()->is_dev() )
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

	if (!Upfront_Behavior::debug()->is_dev() && !Upfront_Behavior::debug()->is_debug()) { // Yeah, so re-intorduce the hacks
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

	if (!Upfront_Behavior::debug()->is_dev() && !Upfront_Behavior::debug()->is_debug()) { // Yeah, so re-intorduce the hacks
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
	$out .= 'data-sources="' . esc_html(json_encode($srcset)) . '"';
	$out .= '/>';
	return $out;
}

function upfront_get_edited_post_thumbnail ($post_id = null, $return_src = false, $size = 'full') {
	$post_id = ( null === $post_id ) ? get_the_ID() : $post_id;
	$image_id = get_post_thumbnail_id($post_id);
	$data = get_post_meta($post_id, '_thumbnail_data', true);
	if ( $return_src != true && (empty($data) || empty( $data['imageId'] ) || $data['imageId'] != $image_id || empty($data['src']) || $size != 'uf_post_featured_image') ) // no edited thumbnail or don't use edited thumbnail
		return get_the_post_thumbnail($post_id, $size);
	if ( $return_src)
		return $data['src'];
	$image = get_post($image_id);
	$attr = array(
		'src' => $data['src'],
		'width' => $data['cropSize']['width'],
		'height' => $data['cropSize']['height'],
		'alt' => trim(strip_tags( get_post_meta($image, '_wp_attachment_image_alt', true) ))
	);
	if ( empty($attr['alt']) )
		$attr['alt'] = trim(strip_tags( $image->post_excerpt ));
	if ( empty($attr['alt']) )
		$attr['alt'] = trim(strip_tags( $image->post_title ));
	$html = '<img';
	foreach ( $attr as $name => $value )
		$html .= ' ' . $name . '="' . $value . '"';
	$html .= ' />';
	return $html;
}

function upfront_realperson_hash($value) {
	$hash = 5381;
	$value = strtoupper($value);
	for($i = 0; $i < strlen($value); $i++) {
		$hash = (PHP_INT_SIZE === 8) ? (upfront_left_shift32($hash, 5) + $hash) + ord(substr($value, $i)) : (($hash << 5) + $hash) + ord(substr($value, $i));
	}
	return $hash;
}

// Perform a 32bit left shift
function upfront_left_shift32($number, $steps) {
	// convert to binary (string)
	$binary = decbin($number);
	// left-pad with 0's if necessary
	$binary = str_pad($binary, 32, "0", STR_PAD_LEFT);
	// left shift manually
	$binary = $binary.str_repeat("0", $steps);
	// get the last 32 bits
	$binary = substr($binary, strlen($binary) - 32);
	// if it's a positive number return it
	// otherwise return the 2's complement
	return ($binary{0} == "0" ? bindec($binary) :
		-(pow(2, 31) - bindec(substr($binary, 1))));
}

/**
 * Return the maximum allowed upload size, in bytes
 *
 * @return int
 */
function upfront_max_upload_size () {
	return wp_max_upload_size();
}

/**
 * Returns the human-friendly version of maximum upload size.
 *
 * @return string
 */
function upfront_max_upload_size_human () {
	return size_format(upfront_max_upload_size());
}