<?php

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wp-tests/upfront-tests-lib';
}

require_once $_tests_dir . '/includes/functions.php';


/**
 * Say we're testing
 */
if (!defined('IS_UPFRONT_TESTING_ENVIRONMENT')) define('IS_UPFRONT_TESTING_ENVIRONMENT', true);

/**
 * Set active template
 */
function _manually_load_theme() {
	return 'upfront';
}
/**
 * Set active chil theme to an Upfront one
 */
function _manually_load_child_theme() {
	$child = getenv('WP_UPFRONT_CHILD');
	$child = $child ? $child : 'upfront';
	return $child;
}
tests_add_filter( 'stylesheet', '_manually_load_child_theme' );
tests_add_filter( 'template', '_manually_load_theme' );

/**
 * Register Upfront theme as valid theme directory
 */
function _manually_register_theme() {
	require_once(dirname(dirname(dirname(dirname(__FILE__)))) . '/functions.php');
}
//tests_add_filter( 'muplugins_loaded', '_manually_register_theme' );

function _fix_template_directory_resolution () {
	return dirname(dirname(dirname(dirname(__FILE__))));
}
tests_add_filter( 'template_directory', '_fix_template_directory_resolution' );

require $_tests_dir . '/includes/bootstrap.php';

require (dirname(__FILE__) . '/class_upfront_tests.php');
