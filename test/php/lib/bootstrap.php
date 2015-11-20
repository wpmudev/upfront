<?php

$_tests_dir = getenv( 'WP_TESTS_DIR' );
if ( ! $_tests_dir ) {
	$_tests_dir = '/tmp/wp-tests/upfront-tests-lib';
}

require_once $_tests_dir . '/includes/functions.php';

/**
 * Set active theme to Upfront
 */
function _manually_load_theme() {
	return 'upfront';
}
tests_add_filter( 'stylesheet', '_manually_load_theme' );
tests_add_filter( 'template', '_manually_load_theme' );

/**
 * Register Upfront theme as valid theme directory
 */
function _manually_register_theme() {
	register_theme_directory( dirname(dirname(dirname(dirname(dirname(__FILE__))))) );
}
tests_add_filter( 'muplugins_loaded', '_manually_register_theme' );

require $_tests_dir . '/includes/bootstrap.php';
