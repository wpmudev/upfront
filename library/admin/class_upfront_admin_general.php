<?php

class Upfront_Admin_General
{
	
    function __construct(){

        add_submenu_page( Upfront_Admin::$menu_slugs['main'], __("General Settings", Upfront::TextDomain),  __("General", Upfront::TextDomain), 'edit_theme_options', Upfront_Admin::$menu_slugs['main'], array($this, "render_page") );
    }

	function render_page() {
		$core_version = $child_version = '0';
		$current = wp_get_theme();
		// Deal with caches
		if (class_exists('Upfront_Compat') && is_callable(array('Upfront_Compat', 'get_upfront_core_version')) && is_callable(array('Upfront_Compat', 'get_upfront_child_version'))) {
			$core_version = Upfront_Compat::get_upfront_core_version();
			$child_version = Upfront_Compat::get_upfront_child_version();
		}
		?>
		<div class="wrap upfront_admin upfront-general-settings">
            <h1><?php _e("General Settings", Upfront::TextDomain); ?><span class="upfront_logo"></span></h1>
			<div class="upfront-col-left">
				<div class="postbox-container">
					<div class='postbox'>
						<h2 class="title"><?php _e("Version Info", Upfront::TextDomain) ?></h2>
						<div class="inside version-info">
							<div class="upfront-debug-block">
								Upfront <span>V <?php echo $core_version; ?></span>
							</div>
							<div class="upfront-debug-block">
								<?php echo $current->Name; ?> (Active Theme)<span>V <?php echo $child_version; ?></span>
							</div>
							<?php if (class_exists('UpfrontThemeExporter') && is_callable(array('UpfrontThemeExporter', 'upfront_exporter_version'))) { ?>
							<div class="upfront-debug-block">
								Builder<span>V <?php echo UpfrontThemeExporter::upfront_exporter_version(); ?></span>
							</div>
							<?php } ?>
						</div>
					</div>
				</div>
				<?php $this->_render_debug_options() ?>
			</div>
			<div class="upfront-col-right">
				<div class="postbox-container">
					<div class='postbox'>
						<h2 class="title"><?php _e("Helpful Resources", Upfront::TextDomain) ?></h2>
						<div class="inside">
							<!--
							* Hide until we have documentation
							<div class="upfront-debug-block">
								<a href="#" class="documentation">Upfront Documentation</a> <a href="#" class="documentation">Building Upfront Themes</a>
							</div>
							-->
							<div class="upfront-debug-block">
								<h4><?php _e("Online Articles", Upfront::TextDomain) ?></h4>
								<ul>
								
									<li><a href='https://premium.wpmudev.org/blog/upfront-1-0/' target="_blank"><?php _e("Upfront 1.0", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-basics/' target="_blank"><?php _e("Upfront Part 1: The Basics, Theme Colors and Typography", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-regions/' target="_blank"><?php _e("Upfront Part 2: Structuring Your Site with Regions", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-elements/' target="_blank"><?php _e("Upfront Part 3: Laying Out Your Site with Elements", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-custom-css/' target="_blank"><?php _e("Upfront Part 4: Tweaking Elements with Custom Code", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-plugins/' target="_blank"><?php _e("Upfront Part 5: Adding Plugins and Styling Gravity Forms", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-responsive/' target="_blank"><?php _e("Upfront Part 6: Creating Responsive Websites", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-pages-posts/' target="_blank"><?php _e("Upfront Part 7: Working With Pages and Posts", Upfront::TextDomain) ?></a></li>
								</ul>
							</div>
							<div class="upfront-debug-block">
								<h4><?php _e("WPMUDEV Help", Upfront::TextDomain) ?></h4>
								<a class="upfront_button visit-forum" href="http://premium.wpmudev.org/support/" target="_blank"><?php _e("Visit Forums", Upfront::TextDomain) ?></a> <a class="upfront_button" href="http://premium.wpmudev.org/forums/forum/support#question" target="_blank"><?php _e("Ask a Question", Upfront::TextDomain) ?></a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<?php
		
	}

	private function _render_debug_options(){
		if( !Upfront_Permissions::current( Upfront_Permissions::SEE_USE_DEBUG ) ) return;
		Upfront_Layout::get_db_layouts();
		?>
		<div class="postbox-container">
			<div class='postbox'>
				<h2 class="title"><?php _e("Debug Options", Upfront::TextDomain) ?></h2>
				<div class="inside debug-options">
					<div class="upfront-debug-block lightgrey">
						<p><?php printf( __('Here you will find various Debug helpers that you might want to try if something goes wrong. Prior to trying any of the below, please make sure you have performed an <a target="_blank" href="%s"><strong>Empty Cache &amp; Hard Reload</strong></a>, that usually resolves most issue.', Upfront::TextDomain ), "http://refreshyourcache.com/en/home/"); ?> </p>
					</div>
					<div class="upfront-debug-block">
						<p class="left"><?php _e("Can be helpful after core upgrades", Upfront::TextDomain) ?></p>
						<button id="upfront_reset_cache"><?php _e("Reset Upfront Cache", Upfront::TextDomain) ?></button>
					</div>
					<div class="upfront-debug-block">
						<p class="left"><?php _e("Reset Upfront CacheThis will run Upfront in DEV mode. Useful for reporting Console errors to our team.", Upfront::TextDomain) ?><i class="upfront_help_icon" title="<?php _e("DEV Mode will load default layouts. Don’t worry, your customized layouts are still in the database & live on your site.", Upfront::TextDomain) ?>">&nbsp;</i></p>
						<a target="_blank" class="upfront_button" href="<?php echo home_url("?editmode=true&dev=true") ?>"><?php _e("Run in dev mode", Upfront::TextDomain) ?></a>
					</div>
					<div class="upfront-debug-block lightgrey">
						<p class="left">
							<small><?php _e("Resets layout to default look, be careful", Upfront::TextDomain) ?></small>
						</p>
						<p class="left">
							<?php
							$db_layouts = Upfront_Layout::get_db_layouts();
							if( $db_layouts ): ?>
								<select class="upfront-layouts-list">
									<option value="0"><?php _e("Please select layout to reset", Upfront::TextDomain); ?></option>
									<?php ; foreach( $db_layouts as $key => $item ): ?>
										<option value="<?php echo $item ?>"><?php echo Upfront_EntityResolver::db_layout_to_name( $item ); ?></option>
									<?php endforeach; ?>
								</select>
							<?php else: ?>
								<h4><?php _e("You have no saved layout to reset", Upfront::TextDomain); ?></h4>
							<?php endif; ?>

						</p>
						<button id="upfront_reset_layout" disabled="disabled" ><?php _e("Reset Layout", Upfront::TextDomain) ?></button>
					</div>
					<div class="upfront-debug-block">
						<p class="left"><?php _e("Reset Theme to Default State", Upfront::TextDomain) ?></p>
						<p class="left"><?php _e('<small><strong class="warning-text">WARNING:</strong> This will return your active theme to the same state it was when you first installed it. This can not be undone, so please back-up before proceeding</small>', Upfront::TextDomain); ?></p>
						<button class="warning" id="upfront_reset_theme"><?php _e("Reset Theme", Upfront::TextDomain) ?></button>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}