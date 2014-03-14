<?php
/*
	This is the default layout for single posts in upfront
 */

$main = upfront_create_region(array(
	'name' => "main",
	'title' => __("Main Area"),
	'scope' => "local"
));

$main->add_element('ThisPost', array(
	'id' => 'default-post',
	'columns' => 22,
	'rows' => 20,
	'margin_top' => 1,
	'options' => array(
		'post_data' => array('date'),
		'disable_resize' => false,
		'disable_drag' => false
	),
	'sticky' => true
));

$main->add_element('Ucomment', array(
	'id' => 'default-comment',
	'columns' => 22,
	'rows' => 10
));

$regions->add($main);