<article id="post-<?php echo $post->ID ?>" data-post_id="<?php echo $post->ID ?>">
	<header>
		<h1 class="post_title"><a href="<?php echo get_permalink($post->ID) ?>"><?php the_title(); ?></a></h1>
		<?php /* Meta info */ ?>
		<?php if ( get_post_type() == 'post' ) { ?>
			<div class="post_meta">
			<?php if (!empty($properties['post_data']) && in_array('author', $properties['post_data'])) { ?>
				<span class="post_author author">
					<a class="url fn n" href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) ?>" title="" rel="author"><?php the_author() ?></a>
				</span>
			<?php } ?>
			<?php if (!empty($properties['post_data']) && in_array('date', $properties['post_data'])) { ?>
				<time class="post_date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ) ?>">
					<span class="post_date-date"><?php echo get_the_date(get_option('date_format')) ?></span>
					<span class="post_date-time"><?php echo get_the_date(get_option('time_format')) ?></span>
				</time>
			<?php } ?>
			<?php if (!empty($properties['post_data']) && in_array('comments_count', $properties['post_data'])) { ?>
				<span class="post_comments comments-link">
					<?php comments_popup_link( '0', '1 comment', '% comments', 'Off'); ?>
				</span>
			<?php } ?>
			</div>
		<?php } ?>
		<?php /* Thumbnail */ ?>
		<?php if (has_post_thumbnail() && in_array('featured_image', $properties['post_data'])) { ?>
			<div class="post_thumbnail">
				 <?php the_post_thumbnail(); ?>
			</div>
		<?php } ?>
	</header>
	
	<?php /* Content */ ?>
	<?php if (!empty($properties['content_type']) && 'excerpt' == $properties['content_type']) { ?>
		<div class="post_content post_content-excerpt"><?php the_excerpt(); ?></div>
	<?php } else { ?>
		<div class="post_content post_content-full"><?php the_content(); ?></div>
	<?php } ?>

	<footer>
		<?php if (!empty($properties['post_data']) && in_array('tags', $properties['post_data'])) { ?>
			<div class="post_tags">
				<?php the_tags('', ' '); ?>				
			</div>
		<?php } ?>
	</footer>
</article>