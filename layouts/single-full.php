<?php
/*
Layout File, at least one main region must be added;
 */

$extended = !empty($extended) ? $extended : false;

$main = upfront_create_region(array(
	'name' => "main", 
	'title' => __("Main Area"),
	'scope' => "local",
	'type' => 'full',
	'default' => true
), array(
	'nav_region' => ( $extended ? 'bottom' : '' ),
	'background_type' => 'color',
	'background_color' => '#c5d0db'
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

if ( $extended ){
	$nav = upfront_create_region(array(
		'name' => "main-nav", 
		'title' => __("Navigation"),
		'scope' => "local",
	), array(
		'background_type' => 'color',
		'background_color' => '#fff'
	));
	
	$nav->add_element('PlainTxt', array(	
		'id' => 'default-nav-text',
		'columns' => 24,
		'rows' => 12,
		'margin_top' => 6,
		'new_line' => false,
		'options' => array(
			'content' => "Text element on navigation area",
			"class" => "c24 upfront-plain_txt",
		)
	));
	
	$main->add_side_region($nav, 'bottom');
}

$regions->add($main);

if ( $extended ){

	$content = upfront_create_region(array(
		'name' => "content", 
		'title' => __("Content Area"),
		'scope' => "local",
		'type' => 'wide'
	), array(
		'row' => 80,
		'background_type' => 'color',
		'background_color' => '#c5d0db'
	));

	$main->add_element('Ucomment', array(
		'id' => 'default-comment',
		'columns' => 22,
		'rows' => 10
	));
	
	$regions->add($content);

}

