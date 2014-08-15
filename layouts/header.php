<?php 

$header = upfront_create_region(array(
	'name' => 'header',
	'title' => __("Header Area"),
	'scope' => 'global'
));

$header->add_element('PlainTxt', array(
	'columns' => 24,
	'id' => 'header-text-default',
	'rows' => 2,
	'margin_top' => 6,
	'options' => array(
    	'has_settings' => 1,
		'content' => '<p style="text-align:center;">Text element in header</p>',
		"class" => "c24 upfront-plain_txt",
	)
));

$regions->add($header);