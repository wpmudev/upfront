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


$main->add_element("PostData", array (
  "columns" => "24",
  "margin_left" => "0",
  "margin_top" => "0",
  "class" => "upfront-post_data_module",
  "id" => "module-1467787537272-1394",
  "options" =>
  array (
    "data_type" => "post_data",
    "row" => 40,
    "type" => "PostDataModel",
    "view_class" => "PostDataView",
    "has_settings" => 1,
    "class" => "c24 upost-data-object upost-data-object-post_data",
    "id_slug" => "post-data",
    "type_parts" =>
    array (
      0 => "date_posted",
      1 => "title",
      2 => "content",
    ),
    "date_posted_format" => "F j, Y g:i a",
    "content" => "content",
    "post-part-date_posted" => "<div class=\"upostdata-part date_posted\">
	Posted on <span class=\"date\">{{date}}</span></div>",
    "post-part-title" => "<div class=\"upostdata-part title\">
	<h1>{{title}}</h1>
</div>
",
    "post-part-content" => "<div class=\"upostdata-part content\">
	{{content}}
</div>",
    "preset" => "default",
    "element_id" => "post-data-object-1467787537271-1215",
    "top_padding_num" => 15,
    "bottom_padding_num" => 15,
    "use_padding" => "yes",
    "usingNewAppearance" => true,
  ),
  "row" => 40,
  "wrapper_id" => "wrapper-1467787553104-1347",
  "new_line" => true,
  "wrapper_breakpoint" =>
  array (
    "tablet" =>
    array (
      "clear" => true,
      "col" => 12,
      "order" => 1,
    ),
    "current_property" =>
    array (
      0 => "order",
    ),
    "mobile" =>
    array (
      "clear" => true,
      "col" => 7,
      "order" => 1,
    ),
  ),
  "objects" =>
  array (
    0 =>
    array (
      "columns" => "24",
      "class" => "upfront-post-data-part part-date_posted",
      "view_class" => "PostDataPartView",
      "part_type" => "date_posted",
      "wrapper_id" => "wrapper-1467787537269-1141",
      "type" => "PostDataPartModel",
      "id_slug" => "post-data-part",
      "element_id" => "post-data-part-object-1467787537270-1276",
      "padding_slider" => 15,
      "use_padding" => "yes",
      "wrapper_breakpoint" =>
      array (
        "tablet" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 1,
        ),
        "current_property" =>
        array (
          0 => "order",
        ),
        "mobile" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 1,
        ),
      ),
    ),
    1 =>
    array (
      "columns" => "24",
      "class" => "upfront-post-data-part part-title",
      "view_class" => "PostDataPartView",
      "part_type" => "title",
      "wrapper_id" => "wrapper-1467787537270-1335",
      "type" => "PostDataPartModel",
      "id_slug" => "post-data-part",
      "element_id" => "post-data-part-object-1467787537270-1762",
      "padding_slider" => 15,
      "use_padding" => "yes",
      "wrapper_breakpoint" =>
      array (
        "tablet" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 2,
        ),
        "current_property" =>
        array (
          0 => "order",
        ),
        "mobile" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 2,
        ),
      ),
    ),
    2 =>
    array (
      "columns" => "24",
      "class" => "upfront-post-data-part part-content",
      "view_class" => "PostDataPartView",
      "part_type" => "content",
      "wrapper_id" => "wrapper-1467787537270-1603",
      "type" => "PostDataPartModel",
      "id_slug" => "post-data-part",
      "element_id" => "post-data-part-object-1467787537271-1078",
      "padding_slider" => 15,
      "use_padding" => "yes",
      "wrapper_breakpoint" =>
      array (
        "tablet" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 3,
        ),
        "current_property" =>
        array (
          0 => "order",
        ),
        "mobile" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 3,
        ),
      ),
    ),
  ),
));

$main->add_element("PostData", array (
  "columns" => "24",
  "margin_left" => "0",
  "margin_top" => "0",
  "class" => "upfront-post_data_module",
  "id" => "module-1467787537282-1320",
  "options" =>
  array (
    "data_type" => "comments",
    "row" => 40,
    "type" => "PostDataModel",
    "view_class" => "PostDataView",
    "has_settings" => 1,
    "class" => "c24 upost-data-object upost-data-object-comments",
    "id_slug" => "post-data",
    "type_parts" =>
    array (
      0 => "comment_count",
      1 => "comments",
      2 => "comments_pagination",
      3 => "comment_form",
    ),
    "comment_count_hide" => 0,
    "disable_showing" =>
    array (
      0 => "trackbacks",
    ),
    "disable" =>
    array (
      0 => "trackbacks",
      1 => "comments",
    ),
    "order" => "comment_date_gmt",
    "direction" => "DESC",
    "limit" => 50,
    "paginated" => 0,
    "post-part-comment_count" => "<div class=\"upostdata-part comment_count\">
	{{comment_count||No comments}}
</div>",
    "post-part-comments" => "<div class=\"upostdata-part comments\">
	{{comments}}
</div>",
    "post-part-comments_pagination" => "<div class=\"upostdata-part comments comments_pagination\">
	{{pagination}}
</div>",
    "post-part-comment_form" => "<div class=\"upostdata-part comment_form\">
	{{comment_form}}
</div>",
    "preset" => "default",
    "element_id" => "post-data-object-1467787537281-1775",
    "top_padding_num" => 15,
    "bottom_padding_num" => 15,
    "use_padding" => "yes",
    "usingNewAppearance" => true,
  ),
  "row" => 40,
  "wrapper_id" => "wrapper-1467787557685-1082",
  "new_line" => true,
  "wrapper_breakpoint" =>
  array (
    "tablet" =>
    array (
      "clear" => true,
      "col" => 12,
      "order" => 2,
    ),
    "current_property" =>
    array (
      0 => "order",
    ),
    "mobile" =>
    array (
      "clear" => true,
      "col" => 7,
      "order" => 2,
    ),
  ),
  "objects" =>
  array (
    0 =>
    array (
      "columns" => "24",
      "class" => "upfront-post-data-part part-comment_count",
      "view_class" => "PostDataPartView",
      "part_type" => "comment_count",
      "wrapper_id" => "wrapper-1467787537279-1294",
      "type" => "PostDataPartModel",
      "id_slug" => "post-data-part",
      "element_id" => "post-data-part-object-1467787537280-1490",
      "padding_slider" => 15,
      "use_padding" => "yes",
      "wrapper_breakpoint" =>
      array (
        "tablet" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 1,
        ),
        "current_property" =>
        array (
          0 => "order",
        ),
        "mobile" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 1,
        ),
      ),
    ),
    1 =>
    array (
      "columns" => "24",
      "class" => "upfront-post-data-part part-comments",
      "view_class" => "PostDataPartView",
      "part_type" => "comments",
      "wrapper_id" => "wrapper-1467787537280-1224",
      "type" => "PostDataPartModel",
      "id_slug" => "post-data-part",
      "element_id" => "post-data-part-object-1467787537280-1798",
      "padding_slider" => 15,
      "use_padding" => "yes",
      "wrapper_breakpoint" =>
      array (
        "tablet" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 2,
        ),
        "current_property" =>
        array (
          0 => "order",
        ),
        "mobile" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 2,
        ),
      ),
    ),
    2 =>
    array (
      "columns" => "24",
      "class" => "upfront-post-data-part part-comments_pagination",
      "view_class" => "PostDataPartView",
      "part_type" => "comments_pagination",
      "wrapper_id" => "wrapper-1467787537280-1050",
      "type" => "PostDataPartModel",
      "id_slug" => "post-data-part",
      "element_id" => "post-data-part-object-1467787537280-1262",
      "padding_slider" => 15,
      "use_padding" => "yes",
      "wrapper_breakpoint" =>
      array (
        "tablet" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 3,
        ),
        "current_property" =>
        array (
          0 => "order",
        ),
        "mobile" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 3,
        ),
      ),
    ),
    3 =>
    array (
      "columns" => "24",
      "class" => "upfront-post-data-part part-comment_form",
      "view_class" => "PostDataPartView",
      "part_type" => "comment_form",
      "wrapper_id" => "wrapper-1467787537281-1408",
      "type" => "PostDataPartModel",
      "id_slug" => "post-data-part",
      "element_id" => "post-data-part-object-1467787537281-1359",
      "padding_slider" => 15,
      "use_padding" => "yes",
      "wrapper_breakpoint" =>
      array (
        "tablet" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 4,
        ),
        "current_property" =>
        array (
          0 => "order",
        ),
        "mobile" =>
        array (
          "clear" => true,
          "col" => 0,
          "order" => 4,
        ),
      ),
    ),
  ),
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
