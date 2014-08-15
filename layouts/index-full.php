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
	
	$content->add_element('PlainTxt', array(	
		'id' => 'default-content-text',
		'columns' => 24,
		'rows' => 2,
		'margin_top' => 6,
		'options' => array(
	    'has_settings' => 1,
			'content' => '<p style="text-align:center;">Text element in content</p>',
			"class" => "c24 upfront-plain_txt",
		)
	));
	
	$regions->add($content);

}

