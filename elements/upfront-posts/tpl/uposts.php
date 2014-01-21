<?php
	//Element properties can be used by the $properties variables
	$classes = $properties['featured_image'] ? 'show-thumbnail ' : '';
?>
<ul class='uposts-posts'>
<?php while(have_posts()): the_post(); 
 	global $post, $wp_query;
	$classes = 'uposts-post uposts-posts-' . get_the_ID() . ' ';

 ?>
	<li <?php apply_filters('upfront_posts_post_classes', post_class($classes), $post) ?> data-post_id="<?php the_ID() ?>">
		<?php echo upfront_get_template('upost', array('properties' => $properties), dirname(__FILE__) . '/upost.php'); ?>
	</li>
<?php endwhile; ?>
</ul>
<?php if ($properties['pagination']): ?>
<div class="uposts-pagination upfront-pagination <?php echo $properties['pagination'] ?>">
	<?php 
		if ($properties['pagination'] == 'prevnext'): 
			posts_nav_link( $sep, $prelabel, $nextlabel ); 
		else:
			$big = 999999999; // need an unlikely integer
			echo paginate_links(array(
				'base' => str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) ),
				'format' => '?paged=%#%',
				'current' => $properties['editing'] ? 2 : max( 1, get_query_var('paged') ),
				'total' => $properties['editing'] ? 5 : $wp_query->max_num_pages			
			));
		endif;
	?>
</div>
<?php endif ?>