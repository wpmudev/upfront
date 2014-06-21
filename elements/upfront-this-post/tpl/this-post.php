<?php //We need a wrapper to make the editor work properly ?>
<article id="post-<?php echo $post->ID ?>" data-post_id="<?php echo $post->ID ?>" <?php post_class('upfront-this_post clearfix') ?>>
	<?php echo Upfront_ThisPostView::get_post_markup($post->ID, $post->post_type, $properties); ?>
</article>