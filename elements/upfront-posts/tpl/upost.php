<span class='uposts-tumbnail_container'>
	<?php if (!empty($properties['post_data']) && in_array('featured_image', $properties['post_data'])) { ?>
	<div class="post_thumbnail">
		 <?php the_post_thumbnail(); ?>
	</div>
	<?php } ?>
</span>
<h1 class='post_title'><a href='<?php the_permalink() ?>'><?php the_title() ?></a></h1>
<!-- post meta -->
<div class="post_meta">
<?php if (!empty($properties['post_data']) && in_array('date', $properties['post_data'])) { ?>
	<time class="entry-date post_date icon" datetime="<?php echo esc_attr( get_the_date( 'c' ) ) ?>"><?php echo get_the_date('F j, Y') ?></time>
<?php } ?>
<?php if (!empty($properties['post_data']) && in_array('author', $properties['post_data'])) { ?>
	/
	<span class="by-author author icon">
		<a class="url fn n post_author" href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) ?>" title="" rel="author"><?php the_author() ?></a>
	</span>
<?php } ?>
<?php if (!empty($properties['post_data']) && in_array('comments_count', $properties['post_data'])) { ?>
	/
	<span class="comments-link icon">
		<?php comments_popup_link( '0', '1 comment', '% comments', 'Off'); ?>
	</span>
<?php } ?>
</div>

<?php if (!empty($properties['content_type']) && 'excerpt' == $properties['content_type']) { ?>
	<div class="post_content post_content-excerpt"><?php the_excerpt(); ?></div>
<?php } else if (!empty($properties['content_type']) && 'none' == $properties['content_type']) { ?>
	<!-- Nothing here -->
<?php } else { ?>
	<div class="post_content post_content-full"><?php the_content(); ?></div>
<?php } ?>


<div class="post-taxonomies">
	<?php if (!empty($properties['post_data']) && in_array('tags', $properties['post_data'])) { ?>
		<div class="post_tags icon">
			<?php the_tags('', ' ') ?>
		</div>
	<?php } ?>
	<?php if (!empty($properties['post_data']) && in_array('categories', $properties['post_data'])) { ?>
		<div class="post_tags icon">
			<?php the_category(' '); ?>
		</div>
	<?php } ?>
</div>

