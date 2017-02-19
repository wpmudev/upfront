<?php
/**
 * Default search form override.
 * Implements the submit button wrapping.
 * Can be further overridden by implementing this template in child themes.
 */
?>
<form role="search" method="get" class="search-form" role="search" action="<?php echo esc_url( home_url( '/' ) ); ?>">
	<label>
		<span class="screen-reader-text"><?php echo _x( 'Search for:', 'label' ); ?></span>
		<input type="search" class="search-field" placeholder="<?php echo esc_attr_x( 'Search &hellip;', 'placeholder' ); ?>" value="<?php echo get_search_query(); ?>" name="s" title="<?php echo esc_attr_x( 'Search for:', 'label' ); ?>" />
	</label>
	<div class="upfront-search-submit_group">
		<input type="submit" class="search-submit" value="<?php echo esc_attr_x( 'Search', 'submit button' ); ?>" />
	</div>
</form>