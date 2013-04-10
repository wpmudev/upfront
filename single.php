<?php
get_header();
while (have_posts()) {
	the_post();
	echo Upfront_Output::get_layout(Upfront_EntityResolver::get_entity_ids());
}
get_footer();