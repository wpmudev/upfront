<?php

/**
 * Add region support for the current request
 *
 * @TODO deprecate this
 *
 * @param string $region Region key
 */
function upfront_region_support ($region) {
	return Upfront_Theme::get_instance()->add_region_support($region);
}

/**
 * Check region support for current request
 *
 * @TODO deprecate this
 *
 * @param string $region Region key
 *
 * @return bool
 */
function upfront_region_supported ($region) {
	return Upfront_Theme::get_instance()->has_region_support($region);
}

/**
 * Sets default region arguments
 *
 * @param array $args Default arguments
 *
 * @return bool
 */
function upfront_set_region_default_args ($args) {
	return Upfront_Theme::get_instance()->set_region_default_args($args);
}

/**
 * Gets default region arguments
 *
 * @return array
 */
function upfront_get_region_default_args () {
	return Upfront_Theme::get_instance()->get_region_default_args();
}

/**
 * Adds a region
 *
 * @param array $args Region arguments
 */
function upfront_add_region ($args) {
	return Upfront_Theme::get_instance()->add_region($args);
}

/**
 * Adds multiple regions
 *
 * @param array $regions Array of region argument arrays
 */
function upfront_add_regions ($regions) {
	return Upfront_Theme::get_instance()->add_regions($regions);
}

/**
 * Checks region presence
 *
 * @param string $name Region name
 *
 * @return bool
 */
function upfront_has_region ($name) {
	return Upfront_Theme::get_instance()->has_region($name);
}

/**
 * Gets known regions
 *
 * @return array
 */
function upfront_get_regions () {
	return Upfront_Theme::get_instance()->get_regions();
}

/**
 * Gets default layout for a cascade
 *
 * @param array $cascade Cascade
 * @param string $layout_slug Optional layout slug
 * @param bool $add_global_regions Optionally include global regions
 *
 * @return array
 */
function upfront_get_default_layout ($cascade, $layout_slug = '', $add_global_regions = false) {
	return Upfront_Theme::get_instance()->get_default_layout($cascade, $layout_slug, $add_global_regions);
}

/**
 * Create a region object
 *
 * @param array $args Region arguments
 * @param array $region_properties Optional region properties
 *
 * @return object
 */
function upfront_create_region ($args, $region_properties = array()) {
	return new Upfront_Virtual_Region($args, $region_properties);
}

/**
 * Gets contents of a resolved template
 *
 * @param array $slugs A list of slugs to be used to resolve template
 * @param array $args Optional additional variables for the template
 * @param string $default_file Optional fallback file
 *
 * @return string
 */
function upfront_get_template ($slugs, $args = array(), $default_file = '') {
	$args = apply_filters('upfront-theme-template_arguments', $args, $slugs, $default_file);
	return Upfront_Theme::get_instance()->get_template($slugs, $args, $default_file);
}

/**
 * Resolves a template URL
 *
 * @param array $slugs A list of slugs to be used to resolve template
 * @param string $default_file Optional fallback file
 *
 * @return string
 */
function upfront_get_template_url ($slugs, $default_file = '') {
	return Upfront_Theme::get_instance()->get_template_uri($slugs, $default_file, true);
}

/**
 * Resolves a template path
 *
 * @param array $slugs A list of slugs to be used to resolve template
 * @param string $default_file Optional fallback file
 *
 * @return string
 */
function upfront_get_template_path ($slugs, $default_file = '') {
	return Upfront_Theme::get_instance()->get_template_uri($slugs, $default_file, true);
}

/**
 * Check whether we're dealing with a page template for a layout
 *
 * @param string|array $page_template The specific template name or array of templates to match
 * @param mixed $layout_ids Optional layout cascade
 *
 * @return bool
 */
function upfront_is_page_template ($page_template, $layout_ids = null) {
	if ( defined("DOING_AJAX") && DOING_AJAX ) {
		if ( is_array($layout_ids) ) $layout = $layout_ids;
		else if ( isset($_POST['layout']) ) $layout = $_POST['layout'];
		else if ( isset($_GET['layout']) ) $layout = $_GET['layout'];
		else if ( Upfront_Layout::get_instance() ) $layout = Upfront_Layout::get_instance()->get('layout');

		if ( ! $layout ) return false;
		return $page_template == upfront_get_page_template_slug($layout);
	} else {
		return is_page_template($page_template);
	}
}

/**
 * Resolve page template slug from layout cascade
 *
 * @param array $layout Layout cascade
 *
 * @return mixed Page template slug, or (bool)false
 */
function upfront_get_page_template_slug ($layout) {
	if ( $layout['type'] == 'single' && $layout['item'] == 'single-page' && ! empty($layout['specificity']) ) {
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
	define("UPFRONT_INTERNAL_FLAG_EDITOR_BOOT_REQUESTED", true);
	return '<script>' .
		'(function ($) { $(document).data("upfront-auto_start", true); $(document).on("upfront-load", function () { Upfront.Application.start(' . ( $mode ? '"' . $mode . '"' : '' ) . '); }); })(jQuery);' .
	'</script>';
}

/**
 * Locate a template
 *
 * @param array $template_names Template names to locate
 *
 * @return string
 */
function upfront_locate_template ($template_names) {
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
