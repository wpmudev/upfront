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


function upfront_get_template ($slugs, $args = array(), $default_file = '') {
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


function upfront_boot_editor_trigger () {
	if (defined("UPFRONT_INTERNAL_FLAG_EDITOR_BOOT_REQUESTED")) return false;
	define("UPFRONT_INTERNAL_FLAG_EDITOR_BOOT_REQUESTED", true, true);
	return '<script>' .
		'(function ($) { $(document).on("upfront-load", function () { Upfront.Application.LayoutEditor.dispatch_layout_loading(); }); })(jQuery);' .
	'</script>';
}