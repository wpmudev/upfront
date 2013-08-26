<article id="post-<?php echo $post->ID ?>" data-post_id="<?php echo $post->ID ?>">
	<h1 class="post_title"><a href="<?php echo get_permalink($post->ID) ?>">Mamona: <?php the_title() ?></a></h1>
	<div class="post_content"><?php the_content() ?></div>
</article>