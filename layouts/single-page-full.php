<?php
/*
Layout File, at least one main region must be added;
 */

$extended = $extended ? $extended : false;

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
			'content' => "Text element on navigation area"
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
	
	$regions->add($content);

}

