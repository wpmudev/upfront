<?php
/**
 * This is the default blank layout for upfront themes
 */

$main = upfront_create_region(array(
	'name' => "main",
	'title' => __("Main Area"),
	'scope' => "local"
));

$main->add_element('Uposts', array(
	'id' => 'default-posts',
	'columns' => 22,
	'rows' => 20,
	'options' => array(
		'content_type' => 'excerpt',
		'featured_image' => '1',
		'post_data' => array('date')
	)
));

$regions->add($main);