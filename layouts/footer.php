<?php

$footer = upfront_create_region(array(
	'name' => 'footer',
	'title' => __("Footer Area"),
	'scope' => 'global'
));

$footer->add_element('PlainTxt', array(
	'columns' => 24,
	'id' => 'footer-text-default',
	'rows' => 2,
	'margin_top' => 6,
	'options' => array(
    	'has_settings' => 1,
		'content' => '<p style="text-align:center;">Text element in footer</p>',
		"class" => "c24 upfront-plain_txt",
	)
));

$regions->add($footer);
