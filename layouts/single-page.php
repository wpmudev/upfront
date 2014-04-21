<?php
/*
	This is the default layout for single posts in upfront
 */
 
$type = $type ? $type : 'wide';
$left_sidebar = $left_sidebar ? $left_sidebar : false;
$right_sidebar = $right_sidebar ? $right_sidebar : false;

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


$main->add_element('ThisPage', array(	
	'id' => 'default-page-title',
	'columns' => 24,
	'rows' => 3,
	'margin_top' => 3,
	'options' => array(
		'display' => 'title',
		'disable_resize' => false,
		'disable_drag' => false
	),
	'sticky' => true
));

$main->add_element('ThisPage', array(	
	'id' => 'default-page-content',
	'columns' => 24,
	'rows' => 20,
	'margin_top' => 3,
	'options' => array(
		'display' => 'content',
		'disable_resize' => false,
		'disable_drag' => false
	),
	'sticky' => true
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
			'content' => "Text element on left sidebar"
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
			'content' => "Text element on right sidebar"
		)
	));
	
	$main->add_side_region($right, 'right');
}

$regions->add($main);