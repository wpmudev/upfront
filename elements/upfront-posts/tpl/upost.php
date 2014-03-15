	<span class='uposts-tumbnail_container'>
	<?php if (!empty($properties['post_data']) && in_array('featured_image', $properties['post_data'])) { ?>
	<div class="post_thumbnail">
		 <?php the_post_thumbnail(); ?>
	</div>
	<?php } ?>
</span>
<h1 class='post_title'><a href='<?php the_permalink() ?>'><?php the_title() ?></a></h1>
<?php if (!empty($properties['content_type']) && 'excerpt' == $properties['content_type']) { ?>
	<div class="post_content post_content-excerpt"><?php the_excerpt(); ?></div>
<?php } else if (!empty($properties['content_type']) && 'none' == $properties['content_type']) { ?>
	<!-- Nothing here -->
<?php } else { ?>
	<div class="post_content post_content-full"><?php the_content(); ?></div>
<?php } ?>