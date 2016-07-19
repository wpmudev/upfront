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

$main->add_element("Posts", array (
  'columns' => '24',
  'margin_left' => '0',
  'margin_right' => '0',
  'margin_top' => '0',
  'margin_bottom' => '0',
  'class' => 'default-posts',
  'id' => 'default-posts',
  'options' =>
  array (
    'type' => 'PostsModel',
    'view_class' => 'PostsView',
    'has_settings' => 1,
    'class' => 'c24 uposts-object',
    'id_slug' => 'posts',
    'display_type' => 'list',
    'list_type' => 'generic',
    'offset' => 1,
    'taxonomy' => '',
    'term' => '',
    'content' => 'excerpt',
    'limit' => 5,
    'pagination' => '',
    'sticky' => '',
    'posts_list' => '',
    'thumbnail_size' => 'large',
    'custom_thumbnail_width' => 200,
    'custom_thumbnail_height' => 200,
    'post_parts' =>
    array (
      0 => 'date_posted',
      1 => 'author',
      2 => 'gravatar',
      3 => 'comment_count',
      4 => 'featured_image',
      5 => 'title',
      6 => 'content',
      7 => 'read_more',
      8 => 'tags',
      9 => 'categories',
    ),
    'enabled_post_parts' =>
    array (
      0 => 'date_posted',
      1 => 'author',
      2 => 'gravatar',
      3 => 'comment_count',
      4 => 'featured_image',
      5 => 'title',
      6 => 'content',
      7 => 'read_more',
      8 => 'tags',
      9 => 'categories',
    ),
    'default_parts' =>
    array (
      0 => 'date_posted',
      1 => 'author',
      2 => 'gravatar',
      3 => 'comment_count',
      4 => 'featured_image',
      5 => 'title',
      6 => 'content',
      7 => 'read_more',
      8 => 'tags',
      9 => 'categories',
      10 => 'meta',
    ),
    'date_posted_format' => 'F j, Y g:i a',
    'categories_limit' => 3,
    'tags_limit' => 3,
    'comment_count_hide' => 0,
    'content_length' => 0,
    'resize_featured' => '1',
    'gravatar_size' => 200,
    'preset' => 'default',
    'post-part-date_posted' => '<div class="uposts-part date_posted">
	Posted on <span class="datetime">{{datetime}}</span></div>',
    'post-part-author' => '<div class="uposts-part author">
	By <a href="{{url}}">{{name}}</a></div>',
    'post-part-gravatar' => '<div class="uposts-part gravatar">
	{{gravatar}}
</div>',
    'post-part-comment_count' => '<div class="uposts-part comment_count">
	{{comment_count||No comments}}
</div>',
    'post-part-featured_image' => '<div class="uposts-part thumbnail" data-resize="{{resize}}">
	{{thumbnail}}
</div>',
    'post-part-title' => '<div class="uposts-part title">
	<h3><a href="{{permalink}}" title="{{title}}">{{title}}</a></h3>
</div>',
    'post-part-content' => '<div class="uposts-part content {{content_type}}">
	{{content}}
</div>',
    'post-part-read_more' => '<div class="uposts-part read_more">
	<a href="{{permalink}}">Read more</a></div>',
    'post-part-tags' => '<div class="uposts-part post_tags">
	{{tags}}
</div>',
    'post-part-categories' => '<div class="uposts-part post_categories">
	{{categories}}
</div>',
    'post-part-meta' => '<div class="uposts-part meta">

</div>
',
    'content_type' => 'excerpt',
    'featured_image' => '1',
    'post_data' =>
    array (
      0 => 'date',
    ),
    'element_id' => 'default-posts-object',
    'padding_slider' => 15,
    'top_padding_num' => 15,
    'bottom_padding_num' => 15,
    'use_padding' => 'yes',
    'lock_padding' => 0,
    'padding_number' => 15,
    'left_padding_num' => 15,
    'right_padding_num' => 15,
    'anchor' => '',
    'current_preset' => 'default',
  ),
  'row' => 20,
  'sticky' => false,
  'default_hide' => 0,
  'hide' => 0,
  'toggle_hide' => 1,
  'wrapper_id' => 'default-posts-wrapper',
  'wrapper_breakpoint' =>
  array (
    'tablet' =>
    array (
      'col' => 12,
      'clear' => true,
      'order' => 1,
    ),
    'mobile' =>
    array (
      'col' => 7,
      'clear' => true,
      'order' => 1,
    ),
    'current_property' =>
    array (
      0 => 'order',
    ),
  ),
  'breakpoint' =>
  array (
    'tablet' =>
    array (
      'col' => 12,
    ),
    'current_property' =>
    array (
      0 => 'col',
    ),
    'mobile' =>
    array (
      'col' => 7,
    ),
  ),
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
