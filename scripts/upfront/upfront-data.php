<?php
if(!current_user_can('edit_posts')){
	header('Status: 403');
	die();
}

$upfront_data = apply_filters('upfront_data', array('loading' => array()));
?>

(function ($, undefined) {
	define({
		data: <?php echo json_encode($upfront_data); ?>
	});
})(jQuery);