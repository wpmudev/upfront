<?php

class Upfront_Admin_General
{
	
    function __construct(){

        add_submenu_page( Upfront_Admin::$menu_slugs['main'], __("General Settings", Upfront::TextDomain),  __("General", Upfront::TextDomain), 'edit_theme_options', Upfront_Admin::$menu_slugs['main'], array($this, "render_page") );
    }

	function render_page() {
		?>
		<div class="wrap upfront_admin upfront-general-settings">
            <h1><?php _e("General Settings", Upfront::TextDomain); ?><span class="upfront_logo"></span></h1>
			<div class="upfront-col-left">
				<div class="postbox-container">
					<div class='postbox'>
						<h2 class="title">Version Info</h2>
						<div class="inside version-info">
							<div class="upfront-debug-block">
								Upfront <span>V 1.1</span>
							</div>
							<div class="upfront-debug-block">
								Parrot (Active Theme)<span>V 1.1</span>
							</div>
							<div class="upfront-debug-block">
								Builder<span>V 1.1</span>
							</div>
						</div>
					</div>
				</div>
				<?php $this->_render_debug_options() ?>
			</div>
			<div class="upfront-col-right">
				<div class="postbox-container">
					<div class='postbox'>
						<h2 class="title">Helpful Resources</h2>
						<div class="inside">
							<div class="upfront-debug-block">
								<a href="#" class="documentation">Upfront Documentation</a> <a href="#" class="documentation">Building Upfront Themes</a>
							</div>
							<div class="upfront-debug-block">
								<h4>Online Articles</h4>
								<ul>
									<li><a href='#'>Upfront 1.0</a></li>
									<li><a href='#'>Upfront 1.0: The Basics, Theme Colors and Typography</a></li>
								</ul>
							</div>
							<div class="upfront-debug-block">
								<h4>WPMUDEV Help</h4>
								<button class="visit-forum">Visit Forums</button> <button>Ask a Question</button>
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
				<h2 class="title">Debug Options</h2>
				<div class="inside debug-options">
					<div class="upfront-debug-block lightgrey">
						<p>Here you will find various Debug helpers that you might want to try if something goes wrong. Prior to trying any of the below, please make sure you have performed an <a href="#"><strong>Empty Cache &amp; Hard Reload</strong></a>, that usually resolves most issue.</p>
					</div>
					<div class="upfront-debug-block">
						<p class="left">Can be helpful after core upgrades</p>
						<button id="upfront_reset_cache">Reset Upfront Cache</button>
					</div>
					<div class="upfront-debug-block">
						<p class="left">This will run Upfront in DEV mode. Useful for reporting Console errors to our team.</p>
						<a target="_blank" class="upfront_button" href="<?php echo home_url("?editmode=true&dev=true") ?>">Run in dev mode</a>
					</div>
					<div class="upfront-debug-block lightgrey">
						<p class="left">
							<small>Resets layout to default look, be careful</small>
						</p>
						<p class="left">
							
							<select class="upfront-layouts-list">
								<?php ; foreach( Upfront_Layout::get_db_layouts() as $key => $item ): ?>
									<option value="<?php echo $key ?>"><?php echo Upfront_EntityResolver::db_layout_to_name( $item ); ?></option>
								<?php endforeach; ?>
							</select>
						</p>
						<button id="upfront_reset_layout">Reset Layout</button>
					</div>
					<div class="upfront-debug-block">
						<p class="left">Reset Theme to Default State</p>
						<p class="left"><small><strong class="warning-text">WARNING:</strong> This will return your active theme to the same state it was when you first installed it. This can not be undone, so please back-up before proceeding</small></p>
						<button class="warning" id="upfront_reset_theme">Reset Theme</button>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
}