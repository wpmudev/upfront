<?php
/**
 * Contains codes that run through wp_list_comment callback
 * 
 * Note: no </li> closure needed
 */


switch ( $comment->comment_type ){
/*	
// Not needed anymore, this is now a toggleable option applied to query directly
	case 'pingback':
	case 'trackback':
		break;
*/
	
	default:
?>

<li <?php comment_class(); ?> id="<?php comment_ID(); ?>">
	<article id="comment-<?php comment_ID(); ?>" class="comment">
		<header class="comment-meta comment-author vcard">
			<?php echo get_avatar($comment, 50); ?>
			<cite class="fn"><?php comment_author_link(); ?></cite>
			<a href="<?php comment_link(); ?>" class="comment-time">
				<time datetime="<?php comment_time('c'); ?>"><?php printf('%1$s at %2$s', get_comment_date(), get_comment_time()) ?></time>
			</a>
		</header>
		<?php if ( '0' == $comment->comment_approved ): ?>
			<p class="comment-awaiting-moderation"><?php _e('Your comment is awaiting moderation.') ?></p>
		<?php endif ?>
		<div class="comment-content">
			<?php comment_text(); ?>
			<?php edit_comment_link( __( 'Edit' ), '<p class="edit-link">', '</p>' ); ?>
		</div>
		<div class="reply">
			<?php comment_reply_link( array_merge( $args, array( 'reply_text' => __( 'Reply' ), 'after' => ' <span>&darr;</span>', 'depth' => $depth, 'max_depth' => $args['max_depth'] ) ) ); ?>
		</div>
	</article>

<?php
		break;
}
?>