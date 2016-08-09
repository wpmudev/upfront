<?php
$layout_version = '1.0.0';

$main = upfront_create_region(
			array (
  'name' => 'main',
  'title' => 'Main Area',
  'type' => 'wide',
  'scope' => 'local',
  'container' => 'main',
  'position' => 10,
  'allow_sidebar' => true,
),
			array (
  'row' => 200,
  'background_type' => 'color',
  'background_color' => 'rgba(247,247,247,1)',
  'version' => '1.0.0',
  'breakpoint' =>
  (array)(array(
     'tablet' =>
    (array)(array(
       'edited' => false,
       'col' => 24,
    )),
     'mobile' =>
    (array)(array(
       'edited' => false,
       'col' => 24,
    )),
  )),
  'use_padding' => 0,
  'sub_regions' =>
  array (
    0 => false,
  ),
  'bg_padding_type' => 'varied',
  'top_bg_padding_slider' => 0,
  'top_bg_padding_num' => 0,
  'bottom_bg_padding_slider' => 0,
  'bottom_bg_padding_num' => 0,
  'bg_padding_slider' => 0,
  'bg_padding_num' => 0,
)
			);

$main->add_element("Uimage", array (
  'columns' => '24',
  'margin_left' => '0',
  'margin_top' => '0',
  'class' => 'upfront-image_module',
  'id' => 'module-1468468775154-1739',
  'options' =>
  array (
    'src' => get_template_directory_uri() . '/img/uf_logo-47x47.png',
    'srcFull' => get_template_directory_uri() . '/img/uf_logo.png',
    'srcOriginal' => get_template_directory_uri() . '/img/uf_logo.png',
    'image_title' => '',
    'alternative_text' => '',
    'include_image_caption' => true,
    'image_caption' => '<p>My awesome image caption</p>',
    'caption_position' => false,
    'caption_alignment' => false,
    'caption_trigger' => 'always_show',
    'image_status' => 'ok',
    'size' =>
    (array)(array(
       'width' => 47,
       'height' => 47,
    )),
    'fullSize' =>
    (array)(array(
       'width' => 90,
       'height' => 90,
    )),
    'position' =>
    (array)(array(
       'top' => 0,
       'left' => 0,
    )),
    'marginTop' => 36.5,
    'element_size' =>
    (array)(array(
       'width' => 1050,
       'height' => 90,
    )),
    'rotation' => 0,
    'color' => '#ffffff',
    'background' => '#000000',
    'captionBackground' => '0',
    'image_id' => '16651',
    'align' => 'center',
    'stretch' => false,
    'vstretch' => false,
    'quick_swap' => false,
    'is_locked' => true,
    'gifImage' => 0,
    'placeholder_class' => '',
    'preset' => 'default',
    'display_caption' => 'showCaption',
    'type' => 'UimageModel',
    'view_class' => 'UimageView',
    'has_settings' => 1,
    'class' => 'upfront-image',
    'id_slug' => 'image',
    'when_clicked' => false,
    'image_link' => '',
    'link' =>
    (array)(array(
       'type' => false,
       'url' => '',
       'target' => false,
    )),
    'element_id' => 'image-1468468775152-1436',
    'padding_slider' => 15,
    'top_padding_num' => '80',
    'bottom_padding_num' => '40',
    'use_padding' => 'yes',
    'usingNewAppearance' => true,
    'row' => 24,
    'valign' => 'center',
    'isDotAlign' => true,
    'lock_padding' => '',
    'top_padding_use' => 'yes',
    'top_padding_slider' => '80',
    'bottom_padding_use' => 'yes',
    'bottom_padding_slider' => '40',
  ),
  'row' => 24,
  'wrapper_id' => 'wrapper-1468469358762-1976',
  'edited' => true,
  'new_line' => true,
  'wrapper_breakpoint' =>
  array (
    'tablet' =>
    array (
      'clear' => true,
      'col' => 12,
      'order' => 1,
    ),
    'current_property' =>
    array (
      0 => 'order',
    ),
    'mobile' =>
    array (
      'clear' => true,
      'col' => 7,
      'order' => 1,
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

$main->add_element("PlainTxt", array (
  'columns' => '24',
  'margin_left' => '0',
  'margin_right' => '0',
  'margin_top' => '0',
  'margin_bottom' => '0',
  'class' => 'module-1468409923827-1672',
  'id' => 'module-1468409923827-1672',
  'options' =>
  array (
    'view_class' => 'PlainTxtView',
    'id_slug' => 'plain_text',
    'content' => '<h1 style="text-align: center;">Welcome to Upfront</h1>',
    'type' => 'PlainTxtModel',
    'element_id' => 'text-object-1468409923826-1943',
    'class' => 'c24 upfront-plain_txt',
    'has_settings' => 1,
    'preset' => 'default',
    'padding_slider' => 15,
    'top_padding_num' => 15,
    'bottom_padding_num' => 15,
    'use_padding' => 'yes',
    'usingNewAppearance' => true,
    'lock_padding' => '',
    'padding_number' => 15,
    'left_padding_num' => 15,
    'right_padding_num' => 15,
    'anchor' => '',
    'current_preset' => 'default',
    'breakpoint_presets' =>
    (array)(array(
       'desktop' =>
      (array)(array(
         'preset' => 'default',
      )),
    )),
    'is_edited' => true,
    'theme_style' => '',
  ),
  'row' => 6,
  'sticky' => false,
  'default_hide' => 0,
  'hide' => 0,
  'toggle_hide' => 1,
  'wrapper_id' => 'wrapper-1468409954037-1564',
  'edited' => true,
  'new_line' => true,
  'wrapper_breakpoint' =>
  array (
    'tablet' =>
    array (
      'clear' => true,
      'col' => 12,
      'order' => 2,
    ),
    'mobile' =>
    array (
      'clear' => true,
      'col' => 7,
      'order' => 2,
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

$main->add_element("PlainTxt", array (
  'columns' => '24',
  'margin_left' => '0',
  'margin_top' => '0',
  'class' => '',
  'id' => 'module-1468468185982-1850',
  'options' =>
  array (
    'content' => '<p style="text-align: center;">Choose from our collection of starter themes and get started customizing your site right away.</p> <p style="text-align: center;">Or start from scratch with the Upfront Builder and bring the site you’ve always dreamed of to life.</p>',
    'type' => 'PlainTxtModel',
    'view_class' => 'PlainTxtView',
    'element_id' => 'text-object-1468468185981-1427',
    'class' => 'c24 upfront-plain_txt',
    'has_settings' => 1,
    'id_slug' => 'plain_text',
    'preset' => 'default',
    'padding_slider' => 15,
    'top_padding_num' => 15,
    'bottom_padding_num' => '0',
    'use_padding' => 'yes',
    'usingNewAppearance' => true,
    'is_edited' => true,
    'lock_padding' => '',
    'padding_number' => 15,
    'left_padding_num' => 15,
    'right_padding_num' => 15,
    'anchor' => '',
    'current_preset' => 'default',
    'bottom_padding_use' => 'yes',
    'bottom_padding_slider' => '0',
    'row' => 12,
  ),
  'row' => 12,
  'wrapper_id' => 'wrapper-1468471260996-1730',
  'edited' => true,
  'new_line' => true,
  'wrapper_breakpoint' =>
  array (
    'tablet' =>
    array (
      'clear' => true,
      'col' => 12,
      'order' => 3,
    ),
    'current_property' =>
    array (
      0 => 'order',
    ),
    'mobile' =>
    array (
      'clear' => true,
      'col' => 7,
      'order' => 3,
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

$main->add_element("Uspacer", array (
  'columns' => '10',
  'class' => 'upfront-module-spacer',
  'id' => 'module-1468471512621-1498',
  'options' =>
  array (
    'type' => 'UspacerModel',
    'view_class' => 'UspacerView',
    'element_id' => 'spacer-object-1468471512621-1659',
    'class' => 'c24 upfront-object-spacer',
    'has_settings' => 0,
    'id_slug' => 'uspacer',
  ),
  'wrapper_id' => 'wrapper-1468471512619-1439',
  'default_hide' => 1,
  'toggle_hide' => 0,
  'hide' => 0,
  'edited' => true,
  'new_line' => true,
));

$main->add_element("Uspacer", array (
  'columns' => '10',
  'class' => 'upfront-module-spacer',
  'id' => 'module-1468471515177-1567',
  'options' =>
  array (
    'type' => 'UspacerModel',
    'view_class' => 'UspacerView',
    'element_id' => 'spacer-object-1468471515176-1792',
    'class' => 'c24 upfront-object-spacer',
    'has_settings' => 0,
    'id_slug' => 'uspacer',
  ),
  'wrapper_id' => 'wrapper-1468471515175-1153',
  'default_hide' => 1,
  'toggle_hide' => 0,
  'hide' => 0,
  'edited' => true,
));

$regions->add($main);
