<?php
/*
	This is the default layout for single posts in upfront
 */

$type = !empty($type) ? $type : 'wide';
$left_sidebar = !empty($left_sidebar) ? $left_sidebar : false;
$right_sidebar = !empty($right_sidebar) ? $right_sidebar : false;

$main = upfront_create_region(array(
	'name' => "main",
	'title' => __("Main Area"),
	'scope' => "local",
	'type' => $type,
	'default' => true,
	'allow_sidebar' => true
), array(
	'row' => 140,
	'background_type' => 'color',
	'background_color' => '#c5d0db'
));


$main->add_element('ThisPost', array(
	'id' => 'default-post',
	'columns' => 24,
	'rows' => 20,
	'margin_top' => 1,
	'options' => array(
		'post_data' => array('date'),
		'disable_resize' => false,
		'disable_drag' => false,
		'layout' => array(
			array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'title', 'classes' => 'post-part c24'))),
			array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'date', 'classes' => ' post-part c24'))),
			array('classes' => 'c24 clr', 'objects'=> array(array('slug' => 'contents', 'classes' => ' post-part c24')))
		)
	),
	'sticky' => true
));

$main->add_element('Ucomment', array(
	'id' => 'default-comment',
	'columns' => 24,
	'rows' => 10
));

if ( $left_sidebar ){
	$left = upfront_create_region(array(
		'name' => "left-sidebar",
		'title' => __("Left Sidebar"),
		'scope' => "local",
	), array(
		'col' => 6,
		'background_type' => 'color',
		'background_color' => '#fff'
	));

	$left->add_element('PlainTxt', array(
		'id' => 'default-left-text',
		'columns' => 4,
		'rows' => 50,
		'margin_top' => 10,
		'margin_left' => 1,
		'new_line' => false,
		'options' => array(
			'content' => "Text element on left sidebar",
			"class" => "c24 upfront-plain_txt",
		)
	));

	$main->add_side_region($left, 'left');
}

if ( $right_sidebar ){
	$right = upfront_create_region(array(
		'name' => "right-sidebar",
		'title' => __("Right Sidebar"),
		'scope' => "local",
	), array(
		'col' => 6,
		'background_type' => 'color',
		'background_color' => '#fff'
	));

	$right->add_element('PlainTxt', array(
		'id' => 'default-right-text',
		'columns' => 4,
		'rows' => 50,
		'margin_top' => 10,
		'margin_left' => 1,
		'new_line' => false,
		'options' => array(
			'content' => "Text element on right sidebar",
			"class" => "c24 upfront-plain_txt",
		)
	));

	$main->add_side_region($right, 'right');
}

$regions->add($main);