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
				<div class="postbox-container">
					<div class='postbox'>
						<h2 class="title">Debug Options</h2>
						<div class="inside debug-options">
							<div class="upfront-debug-block lightgrey">
								<p>Here you will find various Debug helpers that you might want to try if something goes wrong. Prior to trying any of the below, please make sure you have performed an <a href="#"><strong>Empty Cache &amp; Hard Reload</strong></a>, that usually resolves most issue.</p>
							</div>
							<div class="upfront-debug-block">
								<p class="left">Can be helpful after core upgrades</p> <button>Reset Upfront Cache</button>
							</div>
							<div class="upfront-debug-block">
								<p class="left">This will run Upfront in DEV mode. Useful for reporting Console errors to our team.</p> <button>Run in dev mode</button>
							</div>
							<div class="upfront-debug-block lightgrey">
								<p class="left">
									<small>Resets layout to default look, be careful</small>
								</p>
								<p class="left">
									<select>
										<option>Hello World</option>
										<option>Hello World</option>
										<option>Hello World</option>
									</select>
								</p>
								<button>Reset Layout</button>
							</div>
							<div class="upfront-debug-block">
								<p class="left">Reset Theme to Default State</p>
								<p class="left"><small><strong class="warning-text">WARNING:</strong> This will return your active theme to the same state it was when you first installed it. This can not be undone, so please back-up before proceeding</small></p>
								<button class="warning">Reset Theme</button>
							</div>
						</div>
					</div>
				</div>
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
}