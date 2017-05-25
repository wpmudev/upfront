<?php
	//Element properties can be used by the $properties variables
	$classes = $properties['featured_image'] ? 'show-thumbnail ' : '';
	$classes .= 'clearfix ';
?>
<ul class='upostslists-posts'>
<?php
	$posts_array = array();
	while(have_posts()): the_post();
	global $post;//, $wp_query;
		$posts_array[$post->ID] = $post->post_type;
	endwhile;
	foreach($posts_array as $id => $type) {
		$classes = 'upostslist-post upostslist-posts-' . $id . ' ';
?>
	<li <?php apply_filters('upfront_postslists_post_classes', post_class($classes), $post) ?> data-post_id="<?php echo $id ?>">
		<?php echo Upfront_ThisPostView::get_post_markup($id, $type, $properties, $layout, true); ?>
	</li>
<?php }
// Clean up after this post:
global $wp_query;
$wp_query->is_single = false;
?>
</ul>
<?php if ($properties['pagination']): ?>
<div class="upostslist-pagination upfront-pagination <?php echo $properties['pagination'] ?>">
	<?php
		if ($properties['pagination'] == 'prevnext') {
			posts_nav_link( $sep, $prelabel, $nextlabel );
		} else {
			$big = 999999999; // need an unlikely integer
			echo paginate_links(array(
				'base' => str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) ),
				'format' => '?paged=%#%',
				'current' => $properties['editing'] ? 2 : max( 1, get_query_var('paged') ),
				'total' => $properties['editing'] ? 5 : $wp_query->max_num_pages
			));
		}
	?>
</div>
<?php endif ?>
<?php wp_reset_query(); ?>
