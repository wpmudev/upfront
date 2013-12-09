<?php
if(!current_user_can('edit_posts')){
	header('Status: 403');
	die();
}

$upfront_data = apply_filters('upfront_data', array('loading' => array(), 'posts' => array()));
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
	'authors' => $this->get_authors() //$this references to Upfront_JavascriptMain
);
$upfront_data['region_default_args'] = upfront_get_region_default_args();

?>

(function ($, undefined) {
	define({
		data: <?php echo json_encode($upfront_data); ?>
	});
})(jQuery);