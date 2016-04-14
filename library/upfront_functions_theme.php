<?php

/**
 * Add region support for the current request
 * @TODO deprecate this
 */
function upfront_region_support ($region) {
	return Upfront_Theme::get_instance()->add_region_support($region);
}

/**
 * Check region support for current request
 * @TODO deprecate this
 */
function upfront_region_supported ($region) {
	return Upfront_Theme::get_instance()->has_region_support($region);
}

function upfront_set_region_default_args ($args) {
	return Upfront_Theme::get_instance()->set_region_default_args($args);
}

function upfront_get_region_default_args () {
	return Upfront_Theme::get_instance()->get_region_default_args();
}

function upfront_add_region ($args) {
	return Upfront_Theme::get_instance()->add_region($args);
}

function upfront_add_regions ($regions) {
	return Upfront_Theme::get_instance()->add_regions($regions);
}

function upfront_has_region ($name) {
	return Upfront_Theme::get_instance()->has_region($name);
}

function upfront_get_regions () {
	return Upfront_Theme::get_instance()->get_regions();
}

function upfront_get_default_layout($cascade, $layout_slug = '', $add_global_regions = false){
	return Upfront_Theme::get_instance()->get_default_layout($cascade, $layout_slug, $add_global_regions);
}

function upfront_create_region($args, $region_properties = array()){
	return new Upfront_Virtual_Region($args, $region_properties);
}


function upfront_get_template ($slugs, $args = array(), $default_file = '') {
	$args = apply_filters('upfront-theme-template_arguments', $args, $slugs, $default_file);
	return Upfront_Theme::get_instance()->get_template($slugs, $args, $default_file);
}
function upfront_get_template_url($slugs, $default_file = '') {
	return Upfront_Theme::get_instance()->get_template_uri($slugs, $default_file, true);
}
function upfront_get_template_path($slugs, $default_file = '') {
	return Upfront_Theme::get_instance()->get_template_uri($slugs, $default_file, true);
}


function upfront_is_page_template ($page_template, $layout_ids = null) {
	if ( defined("DOING_AJAX") && DOING_AJAX ){
		if ( is_array($layout_ids) )
			$layout = $layout_ids;
		else if ( isset($_POST['layout']) )
			$layout = $_POST['layout'];
		else if ( isset($_GET['layout']) )
			$layout = $_GET['layout'];
		else if ( Upfront_Layout::get_instance() )
			$layout = Upfront_Layout::get_instance()->get('layout');
		if ( ! $layout )
			return false;
		return $page_template == upfront_get_page_template_slug($layout);
	}
	else {
		return is_page_template($page_template);
	}
}

function upfront_get_page_template_slug ($layout) {
	if ( $layout['type'] == 'single' && $layout['item'] == 'single-page' && ! empty($layout['specificity']) ){
		$post_id = intval(preg_replace('/^.*?(\d+)$/is', '\\1', $layout['specificity']));
		return get_page_template_slug($post_id);
	}
	return false;
}


/**
 * Returns some JS to automatically boot the editor
 *
 * @param string $mode Mode to boot into
 *
 * @return mixed (string)Boot sequence script, or (bool)false if not able to boot
 */
function upfront_boot_editor_trigger ($mode = '') {
	if (class_exists('Upfront_Server_LayoutRevisions') && Upfront_Server_LayoutRevisions::is_preview()) return false; // Never auto-boot when in preview mode
	if (defined("UPFRONT_INTERNAL_FLAG_EDITOR_BOOT_REQUESTED")) return false; // Already done this
	define("UPFRONT_INTERNAL_FLAG_EDITOR_BOOT_REQUESTED", true, true);
	return '<script>' .
		'(function ($) { $(document).data("upfront-auto_start", true); $(document).on("upfront-load", function () { Upfront.Application.start(' . ( $mode ? '"'.$mode.'"' : '' ) . '); }); })(jQuery);' .
	'</script>';
}

function upfront_locate_template ($template_names) {
	//if (!(defined('UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF') && UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF)) return locate_template($template_names); // Not a grandchild theme!
	$located = '';
	foreach ((array)$template_names as $template_name) {
		if (!$template_name) continue;
		if (file_exists(get_stylesheet_directory() . '/' . $template_name)) {
			$located = get_stylesheet_directory() . '/' . $template_name;
			break;
		} else if (defined('UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF') && UPFRONT_GRANDCHILD_THEME_IS_DESCENDANT_OF && file_exists(UPFRONT_GRANDCHILD_THEME_PARENT_PATH . '/' . $template_name)) {
			$located = UPFRONT_GRANDCHILD_THEME_PARENT_PATH . '/' . $template_name;
			break;
		} else if (file_exists(get_template_directory() . '/' . $template_name)) {
			$located = get_template_directory() . '/' . $template_name;
			break;
		}
	}
	return $located;
}
