<?php
get_header();
while (have_posts()) {
	the_post();
	echo Upfront_Output::get_layout(get_the_ID());
}
get_footer();