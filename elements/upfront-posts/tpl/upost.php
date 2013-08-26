<span class='uposts-tumbnail_container'>
<?php 
	if($properties['featured_image']){
		the_post_thumbnail();
	} 
?>
</span>
<h1 class='post_title'><a href='<?php the_permalink() ?>'><?php the_title() ?></a></h1>
<div class='post_content'>
<?php 
	if ($properties['content_type'] == 'excerpt')
		the_excerpt();
	else
		the_content();
?>
</div>