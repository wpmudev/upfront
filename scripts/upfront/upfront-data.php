<?php
if(!current_user_can('edit_posts')){
	header('Status: 403');
	die();
}

$upfront_data = apply_filters('upfront_data', array('loading' => array()));
$upfront_data['post_selectors'] = apply_filters('upfront_post_selectors', array(
	'h2.entry-title' => 'title',
	'.entry-content' => 'content',
	'.entry-summary' => 'excerpt',
	'.entry-thumbnail' => 'thumbnail'
));

?>

(function ($, undefined) {
	define({
		data: <?php echo json_encode($upfront_data); ?>
	});
})(jQuery);