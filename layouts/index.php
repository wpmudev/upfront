<?php
/*
Layout File, at least one main region must be added;
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

$main->add_element('Uposts', array(	
	'id' => 'default-posts',
	'columns' => 24,
	'rows' => 20,
	'options' => array(
		'content_type' => 'excerpt',
		'featured_image' => '1',
		'post_data' => array('date')
	)
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

