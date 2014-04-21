<?php
$main = upfront_create_region(
        array(
"name" => "main", 
"title" => "main", 
"type" => "main", 
"scope" => "local"
),
        array(
"row" => 140, 
"background_type" => "color", 
"background_color" => "#c5d0db"
)
        );

$main->add_element("PlainTxt", array(
"columns" => "11", 
"margin_left" => "0", 
"margin_right" => "0", 
"margin_top" => "0", 
"margin_bottom" => "0", 
"id" => "module-1397503248100-1664-module-module-module-module-module", 
"rows" => 10, 
"options" => array(
	"view_class" => "PlainTxtView", 
	"id_slug" => "plain_text", 
	"content" => "<p>Algo facil!!</p>


", 
	"type" => "PlainTxtModel", 
	"element_id" => "text-object-1397503248099-1379", 
	"class" => "c24 c24 c24 c24 c24 c24 upfront-plain_txt", 
	"has_settings" => 1, 
	"is_edited" => true
	)
));

$main->add_element("PlainTxt", array(
"columns" => "11", 
"margin_left" => "0", 
"margin_right" => "0", 
"margin_top" => "2", 
"margin_bottom" => "0", 
"id" => "module-1397503327545-1311-module-module-module-module-module", 
"rows" => 10, 
"options" => array(
	"view_class" => "PlainTxtView", 
	"id_slug" => "plain_text", 
	"content" => "<p>My awesome stub content goes here</p>", 
	"type" => "PlainTxtModel", 
	"element_id" => "text-object-1397503327544-1127", 
	"class" => "c24 c24 c24 c24 c24 c24 upfront-plain_txt", 
	"has_settings" => 1
	)
));

$main->add_element("Uimage", array(
"columns" => "24", 
"margin_left" => "0", 
"margin_right" => "0", 
"margin_top" => "3", 
"margin_bottom" => "0", 
"id" => "module-1397503921886-1143-module-module-module", 
"rows" => 51, 
"options" => array(
	"src" => "http://local.wordpress/wp-content/uploads/2014/04/feb-14-how-space-really-looks-like-cal-1920x1080-1080x225-7789.jpg", 
	"srcFull" => "http://local.wordpress/wp-content/uploads/2014/04/feb-14-how-space-really-looks-like-cal-1920x1080.jpg", 
	"srcOriginal" => "http://local.wordpress/wp-content/uploads/2014/04/feb-14-how-space-really-looks-like-cal-1920x1080.jpg", 
	"image_title" => "", 
	"alternative_text" => "", 
	"when_clicked" => "do_nothing", 
	"image_link" => "", 
	"include_image_caption" => false, 
	"image_caption" => "My awesome image caption", 
	"caption_position" => "below_image", 
	"caption_alignment" => "top", 
	"caption_trigger" => "always_show", 
	"image_status" => "ok", 
	"size" => array(
		"width" => 1180, 
		"height" => 664
		), 
	"fullSize" => array(
		"width" => 1920, 
		"height" => 1080
		), 
	"position" => array(
		"top" => 219.5, 
		"left" => 50
		), 
	"marginTop" => 0, 
	"element_size" => array(
		"width" => 1080, 
		"height" => 225
		), 
	"rotation" => 0, 
	"color" => "#ffffff", 
	"background" => "#000000", 
	"captionBackground" => "0", 
	"image_id" => "8295", 
	"align" => "center", 
	"stretch" => true, 
	"vstretch" => true, 
	"quick_swap" => false, 
	"gifImage" => 0, 
	"type" => "UimageModel", 
	"view_class" => "UimageView", 
	"has_settings" => 1, 
	"class" => "c24 c24 c24 upfront-image", 
	"id_slug" => "image", 
	"element_id" => "image-1397503921882-1949"
	)
));

$main->add_element("LikeBox", array(
"columns" => "7", 
"margin_left" => "0", 
"margin_right" => "0", 
"margin_top" => "7", 
"margin_bottom" => "0", 
"id" => "module-1397548714725-1883-module-module", 
"rows" => 18, 
"options" => array(
	"id_slug" => "Like-box-object", 
	"type" => "LikeBox", 
	"view_class" => "LikeBoxView", 
	"class" => "c24 c24 c24 upfront-like-box", 
	"has_settings" => 1, 
	"element_size" => array(
		"width" => 278, 
		"height" => 270
		), 
	"element_id" => "Like-box-object-object-1397548714724-1722"
	)
));

$main->add_element("Umap", array(
"columns" => "12", 
"margin_left" => "1", 
"margin_right" => "0", 
"margin_top" => "6", 
"margin_bottom" => "0", 
"id" => "module-1397583033983-1002", 
"rows" => 66, 
"options" => array(
	"type" => "MapModel", 
	"view_class" => "UmapView", 
	"class" => "c24 upfront-map_element-object", 
	"has_settings" => 1, 
	"id_slug" => "upfront-map_element", 
	"controls" => array(), 
	"zoom" => 10, 
	"style" => "ROADMAP", 
	"styles" => false, 
	"element_id" => "upfront-map_element-object-1397583033982-1916", 
	"markers" => array(array(
			"lat" => 37.3880961, 
			"lng" => -5.9823299
			)), 
	"map_center" => array(37.3880961, -5.9823299)
	)
));

$regions->add($main);
