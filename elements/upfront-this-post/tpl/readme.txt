These are templates for the parts of a post. If you are used to the usual WP templating function here it is the equivalence to upfront templates:

%title% - the_title()
%contents% - the_contents()
%excerpt% - the_excerpt()
%permalink% - the_permalink()
%author% - the_author()
%author_url% - the_author_posts_link()
%author_meta_{field}% - the_author_meta($field);
%avatar_{size}% - echo get_avatar($author_id, $size);
%date% - the_date();
%date_iso% - the_date('c');
%comments_count% - echo get_comments_number();
%tags% - the_tags();
%categories% - the_category();
%meta_{key}% - echo get_post_meta($post_id, $key, true);
%image% - the_post_thumbnail();
%thumbnail% - get_the_post_thumbnail();
