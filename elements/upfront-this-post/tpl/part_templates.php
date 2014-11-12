<?php

$templates = array();
ob_start();

//*** AUTHOR
?><a class="post_author" href="%author_url%">%author%</a><?php
$templates['author'] = ob_get_contents();
ob_clean();


//** AUTHOR_GRAVATAR
?><span class="author_gravatar">%avatar_{size}%</span><?php
$templates['author_gravatar'] = ob_get_contents();
ob_clean();


//*** CATEGORIES
?><div class="post_categories">%categories%</div><?php
$templates['categories'] = ob_get_contents();
ob_clean();

//*** COMMENTS COUNT
?><div class="post_comments">%comments_count%</div><?php
$templates['comments_count'] = ob_get_contents();
ob_clean();

//*** CONTENTS
?><div class="post_content">%contents%</div><?php
$templates['contents'] = ob_get_contents();
ob_clean();

//*** DATE
?><time class="post_date" datetime="%date_iso%">%date%</time><?php
$templates['date'] = ob_get_contents();
ob_clean();

?><time class="post_update" datetime="%date_iso%">%update%</time><?php
$templates['update'] = ob_get_contents();
ob_clean();

//*** EXCERPT
?><div class="post_excerpt">%excerpt%</div><?php
$templates['excerpt'] = ob_get_contents();
ob_clean();

//*** FEATURED IMAGE
?><div class="post_thumbnail">%image%</div><?php
$templates['featured_image'] = ob_get_contents();
ob_clean();

//*** TAGS
?><div class="post_tags">%tags%</div><?php
$templates['tags'] = ob_get_contents();
ob_clean();

//*** TITLE
?><h1 class="post_title"><a href="%permalink%">%title%</a></h1><?php
$templates['title'] = ob_get_contents();
ob_clean();


ob_end_clean();
return $templates;