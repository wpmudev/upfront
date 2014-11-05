<?php

class Upfront_EditorL10n_Server implements IUpfront_Server {
	
	public static function serve () {
		$me = new self;
		$me->_add_hooks();
	}

	private function _add_hooks () {
		add_filter('upfront_l10n', array($this, 'add_l10n_strings'));
	}

	public function add_l10n_strings ($strings) {
		if (!empty($strings['global'])) return $strings;
		$strings['global'] = self::_get_l10n();
		return $strings;
	}

	private static function _get_l10n ($key=false) {
		$l10n = array(
			'application' => array(
				'preview_not_ready' => __('Your preview is not ready yet', 'upfront'),
				'revisions' => __('Revisions', 'upfront'),
				'created_by' => __('created by', 'upfront'),
				'save_layout_pop' => __('Do you wish to save the post layout just for this post or apply it to all posts?', 'upfront'),
				'this_post_only' => __('This post only', 'upfront'),
				'all_posts_of_this_type' => __('All posts of this type', 'upfront'),
				'saving_post_layot' => __('Saving post layout...', 'upfront'),
				'thank_you_for_waiting' => __('Thank you for waiting', 'upfront'),
				'save_part_pop' => __('Do you wish to save this part template only for this element, or for all the elements of this post type?', 'upfront'),
				'this_element_only' => __('This element only', 'upfront'),
				'all_elements' => __('All elements with the same post type', 'upfront'),
				'saved_template' => __('Saved template for %s part.', 'upfront'),
				'post_layout_editor' => __('Post Layout Editor', 'upfront'),
				'loading' => __('Loading...', 'upfront'),
				'preparing_new_post_type' => __('Preparing new %s...', 'upfront'),
				'here_we_are' => __('Here we are!', 'upfront'),
				'loading_path' => __('Loading %s...', 'upfront'),
				'navigation_confirm' => __('You have unsaved changes you\'re about to lose by navigating off this page. Do you really want to leave this page?', 'upfront'),
				'please_hold_on' => __('Please, hold on for just a little bit more', 'upfront'),
			),
			'behaviors' => array(
				'group' => __('Group', 'upfront'),
				'this_post_only' => __('Do you wish to save layout just for this post or apply it to all posts?', 'upfront'),
				'loading_content' => __('Loading content...', 'upfront'),
				'theme_text_fonts' => __('Theme Text Fonts', 'upfront'),
				'ok' => __('OK', 'upfront'),
				'loading' => __('Loading...', 'upfront'),
				'page_layout_name' => __('Page name (leave empty for single-page.php)', 'upfront'),
				'start_fresh' => __('Start fresh', 'upfront'),
				'start_from_existing' => __('Start from existing layout', 'upfront'),
				'create' => __('Create', 'upfront'),
				'create_new_layout' => __('Create New Layout', 'upfront'),
				'no_saved_layout' => __('No saved layout', 'upfront'),
				'edit' => __('Edit', 'upfront'),
				'edit_saved_layout' => __('Edit Saved Layout', 'upfront'),
				'checking_layouts' => __('Checking layouts', 'upfront'),
				'layout_exported' => __('Layout exported!', 'upfront'),
				'select_theme' => __('Select Theme', 'upfront'),
				'new_theme' => __('New theme', 'upfront'),
				'theme_name' => __('Theme Name', 'upfront'),
				'directory' => __('Directory', 'upfront'),
				'author' => __('Author', 'upfront'),
				'author_uri' => __('Author URI', 'upfront'),
				'activate_upon_creation' => __('Activate the new theme upon creation', 'upfront'),
				'export_theme_images' => __('Export images with the theme', 'upfront'),
				'export_button' => __('Export', 'upfront'),
				'export_theme' => __('Export Theme', 'upfront'),
				'creating_theme' => __('Creating theme', 'upfront'),
				'exporting_layout' => __('Exporting layout: ', 'upfront'),
				'excellent_start' => __('Excellent start!', 'upfront'),
				'homepage_created' => __('Your HOMEPAGE — Static layout has been successfully created. You can create more Layouts for your theme by clicking ‘New Layout’ in  the left sidebar. Remember, the best themes in life <del>are free</del> have lots of layouts!', 'upfront'),
				'style_exporter' => __('Style exported.', 'upfront'),
				'style_export_fail' => __('Style could not be exported.', 'upfront'),
				'region_css_cleaned' => __('Region CSS cleaned', 'upfront'),
				'cleaning_region_css' => __('Cleaning Region CSS...', 'upfront'),
				'structure' => __('Structure', 'upfront'),
				'grid_settings' => __('Grid Settings', 'upfront'),
				'recommended_settings' => __('Recommended Settings', 'upfront'),
				'custom_settings' => __('Custom Settings', 'upfront'),
				'padding_large' => __('15px column padding', 'upfront'),
				'padding_medium' => __('10px column padding', 'upfront'),
				'padding_small' => __('5px column padding', 'upfront'),
				'no_padding' => __('no column padding', 'upfront'),
				'page_bg_color' => __('Page Background Color', 'upfront'),
				'column_width' => __('Column Width', 'upfront'),
				'column_padding' => __('Column Padding', 'upfront'),
				'baseline_grid' => __('Baseline Grid', 'upfront'),
				'additional_type_padding' => __('Additional Type Padding', 'upfront'),
				'allow_floats_outside_main_grid' => __('Allow floated areas outside main grid', 'upfront'),
				'delay_before_drag' => __('Delay before drag:', 'upfront'),
				'delay_before_changing_position' => __('Delay before changing position:', 'upfront'),
				'show_debug_info' => __('Show debugging info/outline', 'upfront'),
				'close' => __('Close', 'upfront'),
			),
		);
		return !empty($key)
			? (!empty($l10n[$key]) ? $l10n[$key] : $key)
			: $l10n
		;
	}
}
Upfront_EditorL10n_Server::serve();