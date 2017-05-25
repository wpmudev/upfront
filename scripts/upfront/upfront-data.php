<?php
if (!Upfront_Permissions::current(Upfront_Permissions::BOOT)) {
	header('Status: 403');
	die();
}
header('Content-Type: application/javascript');

$upfront_data = apply_filters('upfront_data', array('loading' => array(), 'posts' => array()));
$insert_count = intval(Upfront_Cache_Utils::get_option('ueditor_insert_count'));
if(!$insert_count)
	$insert_count = 0;
$upfront_data['ueditor'] = array(
	'selectors' => apply_filters('upfront_post_selectors', array()),
	'filters' => array(
		'date' => apply_filters('upfront_post_date', '%date%'),
		'author' => apply_filters('upfront_post_author', '%display_name%')
	),
	'months' => array(
		__('January'),
		__('February'),
		__('March'),
		__('April'),
		__('May'),
		__('June'),
		__('July'),
		__('August'),
		__('September'),
		__('October'),
		__('November'),
		__('December')
	),
	'days' => array(
		__('Monday'),
		__('Tuesday'),
		__('Wednesday'),
		__('Thursday'),
		__('Friday'),
		__('Saturday'),
		__('Sunday'),
	),
	'insertCount' => $insert_count,
	'authors' => $this->get_authors() //$this references to Upfront_JavascriptMain
);
$upfront_data['region_default_args'] = upfront_get_region_default_args();


//Upfront styles
$dev = Upfront_Behavior::debug()->is_dev() ? 'dev_' : '';
$styles = Upfront_Cache_Utils::get_option('upfront_' . $dev . get_stylesheet() . '_styles');
$elementTypes = array();
if($styles) {
	foreach($styles as $type => $rules){
		if(!is_array($rules))
			continue;
		$elementTypes[$type] = array_keys($rules);
	}
}
$element_styles = apply_filters('upfront_get_theme_styles', $elementTypes);

$upfront_data['styles'] = $elementTypes;
$upfront_data['date'] = array(
    'format' => Upfront_Cache_Utils::get_option('date_format')
);
?>

(function ($, undefined) {
	define({
		data: <?php echo json_encode($upfront_data); ?>
	});
})(jQuery);
