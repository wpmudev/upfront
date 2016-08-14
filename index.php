<?php
$layout = Upfront_Output::get_layout(Upfront_EntityResolver::get_entity_ids());

get_header();
echo $layout->apply_layout();
get_footer();
