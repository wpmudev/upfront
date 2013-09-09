<?php
	$classes = $properties['featured_image'] ? 'show-thumbnail ' : '';
?>
<ul class='uposts-posts'>
<?php while(have_posts()): the_post(); 
 	global $post;
	$classes = 'uposts-post uposts-posts-' . get_the_ID() . ' ';

 ?>
	<li <?php apply_filters('upfront_posts_post_classes', post_class($classes), $post) ?> data-post_id="<?php the_ID() ?>">
		<?php echo upfront_get_template('upost', array('properties' => $properties), dirname(__FILE__) . '/upost.php'); ?>
	</li>
<?php endwhile; ?>
</ul>