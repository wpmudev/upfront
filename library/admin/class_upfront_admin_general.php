<?php

class Upfront_Admin_General extends Upfront_Admin_Page {

	function __construct(){
		if ($this->_can_access( Upfront_Permissions::SEE_USE_DEBUG )) {
			add_submenu_page( Upfront_Admin::$menu_slugs['main'], __("General Settings", Upfront::TextDomain), __("General", Upfront::TextDomain), 'manage_options', Upfront_Admin::$menu_slugs['main'], array($this, "render_page") );
		}
	}

	public function render_page() {
		$core_version = $child_version = '0.0.0';
		$current = wp_get_theme();
		// Deal with caches
		if (class_exists('Upfront_Compat') && is_callable(array('Upfront_Compat', 'get_upfront_core_version')) && is_callable(array('Upfront_Compat', 'get_upfront_child_version'))) {
			$core_version = Upfront_Compat::get_upfront_core_version();
			$child_version = Upfront_Compat::get_upfront_child_version();

			$child_version = !empty($child_version)
				? $child_version
				: '0.0.0'
			;
		}
		?>
		<div class="wrap upfront_admin upfront-general-settings">
			<h1><?php esc_html_e("General Settings", Upfront::TextDomain); ?><span class="upfront_logo"></span></h1>
			<div class="upfront-col-left">
				<div class="postbox-container version-info">
					<div class='postbox'>
						<h2 class="title"><?php esc_html_e("Version Info", Upfront::TextDomain) ?></h2>
						<div class="inside version-info">
							<div class="upfront-debug-block">
								Upfront <span>V <?php echo esc_html($core_version); ?></span>
							</div>
							<div class="upfront-debug-block">
								<?php echo esc_html(sprintf(__('%s (Active Theme)', Upfront::TextDomain), $current->Name)); ?>
									<span>V <?php echo esc_html($child_version); ?></span>
							</div>

							<?php do_action('upfront-admin-general_settings-versions'); ?>
						</div>
					</div>
				</div>
				<?php $this->_render_under_construction_box(); ?>
				<?php $this->_render_api_options(); ?>
				<?php $this->_render_debug_options(); ?>
			</div>
			<div class="upfront-col-right">
				<div class="postbox-container helpful-resources">
					<div class='postbox'>
						<h2 class="title"><?php esc_html_e("Helpful Resources", Upfront::TextDomain) ?></h2>
						<div class="inside">
							<div class="upfront-debug-block">
								<a target="_blank" href="https://premium.wpmudev.org/upfront-documentation/" class="documentation">Upfront Documentation</a> <a target="_blank" href="https://premium.wpmudev.org/upfront-documentation/upfront-builder/" class="documentation">Building Upfront Themes</a>
							</div>
							<div class="upfront-debug-block">
								<h4><?php esc_html_e("Online Articles", Upfront::TextDomain) ?></h4>
								<ul>

									<li><a href='https://premium.wpmudev.org/blog/upfront-1-0/' target="_blank"><?php esc_html_e("Upfront 1.0", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-basics/' target="_blank"><?php esc_html_e("Upfront Part 1: The Basics, Theme Colors and Typography", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-regions/' target="_blank"><?php esc_html_e("Upfront Part 2: Structuring Your Site with Regions", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-elements/' target="_blank"><?php esc_html_e("Upfront Part 3: Laying Out Your Site with Elements", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-custom-css/' target="_blank"><?php esc_html_e("Upfront Part 4: Tweaking Elements with Custom Code", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-plugins/' target="_blank"><?php esc_html_e("Upfront Part 5: Adding Plugins and Styling Gravity Forms", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-responsive/' target="_blank"><?php esc_html_e("Upfront Part 6: Creating Responsive Websites", Upfront::TextDomain) ?></a></li>
									<li><a href='https://premium.wpmudev.org/blog/upfront-pages-posts/' target="_blank"><?php esc_html_e("Upfront Part 7: Working With Pages and Posts", Upfront::TextDomain) ?></a></li>
								</ul>
							</div>
							<div class="upfront-debug-block">
								<h4><?php _e("WPMUDEV Help", Upfront::TextDomain) ?></h4>
								<a class="upfront_button visit-forum" href="http://premium.wpmudev.org/support/" target="_blank"><?php esc_html_e("Visit Forums", Upfront::TextDomain) ?></a> <a class="upfront_button" href="http://premium.wpmudev.org/forums/forum/support#question" target="_blank"><?php esc_html_e("Ask a Question", Upfront::TextDomain) ?></a>
							</div>
						</div>
					</div>
				</div>
				<?php $this->_render_changelog_box(); ?>
			</div>
		</div>
		<?php

	}

	private function _render_api_options () {
		$admin_keys = new Upfront_Admin_ApiKeys;
		if (!$admin_keys->can_access()) return false;

		$services = $admin_keys->get_services();
		if (empty($services)) return false;

		$admin_keys->process_submissions();

		?>
<div class="postbox-container api_keys">
	<div class='postbox'>
		<h2 class="title"><?php esc_html_e("API Keys", Upfront::TextDomain) ?></h2>
		<div class="inside api_keys">
			<form method="POST">
				<?php
				foreach ($services as $service => $label) {
					$admin_keys->render_key_box($service);
				}
				?>
				<p>
					<button class="upfront_button">
						<?php esc_html_e('Save', 'upfront'); ?>
					</button>
				</p>
			</form>
		</div>
	</div>
</div>
		<?php
	}

	private function _render_debug_options(){
		if( !Upfront_Permissions::current( Upfront_Permissions::SEE_USE_DEBUG ) ) return;
		Upfront_Layout::get_db_layouts();
		?>
		<div class="postbox-container debug-options">
			<div class='postbox'>
				<h2 class="title"><?php esc_html_e("Debug Options", Upfront::TextDomain) ?></h2>
				<div class="inside debug-options">
					<div class="upfront-debug-block lightgrey">
						<p><?php printf( __('Here you will find various Debug helpers that you might want to try if something goes wrong. Prior to trying any of the below, please make sure you have performed an <a target="_blank" href="%s"><strong>Empty Cache &amp; Hard Reload</strong></a>, that usually resolves most issue.', Upfront::TextDomain ), "http://refreshyourcache.com/en/home/"); ?> </p>
					</div>
					<div class="upfront-debug-block">
						<p class="left"><?php esc_html_e("Can be helpful after core upgrades", Upfront::TextDomain) ?></p>
						<button id="upfront_reset_cache"><?php esc_html_e("Reset Upfront Cache", Upfront::TextDomain) ?></button>
					</div>
					<div class="upfront-debug-block lightgrey">
						<p class="left">
							<small><?php esc_html_e("Resets layout to default look, be careful", Upfront::TextDomain) ?></small>
						</p>
						<div class="upfront-layout-reset">
							<?php
							$db_layouts = Upfront_Server_PageLayout::get_instance()->parse_theme_layouts(Upfront_Debug::get_debugger()->is_dev());
							if( $db_layouts ): ?>
								<select class="upfront-layouts-list">
									<option value="0"><?php esc_html_e("Please select layout to reset", Upfront::TextDomain); ?></option>
									<?php ; foreach( $db_layouts as $key => $item ): ?>
										<option value="<?php echo (is_array($item)) ? esc_attr($item['name']) : esc_attr($item); ?>"><?php echo esc_html(Upfront_Server_PageLayout::get_instance()->db_layout_to_name($item)); ?></option>
									<?php endforeach; ?>
								</select>
								<div class="upfront-reset-global-option">
									<div class="upfront_toggle">
										<input value="1" type="checkbox" name="upfront_reset_include_global" class="upfront_toggle_checkbox" id="upfront_reset_include_global" >
										<label class="upfront_toggle_label" for="upfront_reset_include_global">
											<span class="upfront_toggle_inner"></span>
											<span class="upfront_toggle_switch"></span>
										</label>
									</div>
									<small><?php esc_html_e("Include Global Regions", Upfront::TextDomain); ?></small>
								</div>
							<?php else: ?>
								<h4><?php esc_html_e("You have no saved layout to reset", Upfront::TextDomain); ?></h4>
							<?php endif; ?>
						</div>
						<button id="upfront_reset_layout" disabled="disabled" data-dev="<?php echo (int)Upfront_Debug::get_debugger()->is_dev();?>"><?php esc_html_e("Reset Layout", Upfront::TextDomain) ?></button>
					</div>
					<div class="upfront-debug-block">
						<p class="left"><?php esc_html_e("Reset Theme to Default State", Upfront::TextDomain) ?></p>
						<p class="left"><?php _e('<small><strong class="warning-text">WARNING:</strong> This will return your active theme to the same state it was when you first installed it. This can not be undone, so please back-up before proceeding</small>', Upfront::TextDomain); ?></p>
						<button class="warning" id="upfront_reset_theme"><?php esc_html_e("Reset Theme", Upfront::TextDomain) ?></button>
					</div>
				</div>
			</div>
		</div>
		<?php
	}
	
	/**
	 * Renders the site under construction box
	 */
	private function _render_under_construction_box () {
		$maintenance_mode = get_option(Upfront_Server::MAINTENANCE_MODE, false);
		$enable_maintenance_mode = false;
		if ( $maintenance_mode ) {
			$maintenance_mode = json_decode($maintenance_mode);
			$maintenance_mode = ( $maintenance_mode && is_object($maintenance_mode) ) ? $maintenance_mode : new stdClass();
			$enabled = (isset($maintenance_mode->enabled)) ? (int)$maintenance_mode->enabled : 0;
			$enable_maintenance_mode = ( $enabled == 1 ) ? true : false;
		}
		?>
		<div class="postbox-container under-construction">
			<div class='postbox'>
				<h2 class="title"><?php esc_html_e("Site Maintenance", Upfront::TextDomain) ?></h2>
				<div class="inside">
					<p class="label"><?php esc_html_e("Enable site maintenance mode", Upfront::TextDomain) ?></p>
					<div class="upfront_toggle">
						<input value="1" type="checkbox" name="upfront_under_construction" class="upfront_toggle_checkbox" id="upfront_under_construction" <?php checked(true, $enable_maintenance_mode ); ?> data-current="<?php echo $enable_maintenance_mode;?>" >
						<label class="upfront_toggle_label" for="upfront_under_construction">
							<span class="upfront_toggle_inner"></span>
							<span class="upfront_toggle_switch"></span>
						</label>
					</div>
					<?php
					if ( $maintenance_mode && isset($maintenance_mode->permalink) ) {
						echo '<span class="link">' . sprintf(
							__('You can edit the maintenance page <a href="%s" target="_blank">here</a>', 'upfront'),
							$maintenance_mode->permalink . '?editmode=true'
						) . '</span>';
					}
					?>
					<p><button id="upfront_save_under_construction" disabled="disabled"><?php esc_html_e("Save", Upfront::TextDomain) ?></button></p>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Renders the changelog box
	 */
	private function _render_changelog_box () {
		$changelog = $this->_get_changelog();
		if (empty($changelog)) return false;
		?>
		<div class="postbox-container changelog">
			<div class='postbox'>
				<h2 class="title"><?php esc_html_e("Changelog", Upfront::TextDomain) ?></h2>
				<div class="inside changelog">
				<?php
					reset($changelog);
				 	$current = each($changelog);
				?>
					<div class="current">
						<dl>
							<dt><?php echo $current['key']; ?></dt>
							<dd><?php echo $current['value']; ?></dd>
						</dl>
					</div>

					<div class="changelog navigation">
						<a href="#more"><?php esc_html_e('Previous entries', 'upfront'); ?></a>
					</div>

					<div class="previous">
						<dl>
						<?php while (false !== ($changeset = each($changelog))) { ?>
							<dt><?php echo $changeset['key']; ?></dt>
							<dd><?php echo $changeset['value']; ?></dd>
						<?php } ?>
						</dl>
					</div>
				</div>
			</div>
		<?php
	}

	/**
	 * Gets the raw changelog entries from the file
	 *
	 * @return array
	 */
	private function _get_raw_changelog_entries () {

		$path = trailingslashit(wp_normalize_path(Upfront::get_root_dir())) . 'CHANGELOG.md';
		$entries = array();
		if (!file_exists($path) || !is_readable($path)) return $entries;

		$fp = fopen($path, 'r');
		$idx = '';
		while (false !== ($line = fgets($fp, 4096))) {
			if (preg_match('/-{3,}/', $line)) continue; // drop line junk
			if (preg_match('/^\d\.\d.*?-\s\d{4}/', $line)) {
				$idx = $line;
				continue;
			}
			if (empty($idx)) continue; // Sanity check, header junk

			if (empty($entries[$idx])) $entries[$idx] = array();
			$entries[$idx][] = $line;
		}
		fclose($fp);

		return $entries;
	}

	/**
	 * Gets the changelog entries array
	 *
	 * @return array
	 */
	private function _get_changelog () {
		$entries = $this->_get_raw_changelog_entries();
		$changelog = array();
		$df = get_option('date_format');
		foreach ($entries as $version => $entry) {
			if (empty($entry)) continue;

			$tmp = explode('-', $version, 2);
			if (empty($tmp[1])) continue;

			$date = strtotime($tmp[1]);
			if (empty($date)) continue;

			$key = "" .
				"<b>{$tmp['0']}</b>" .
				'&nbsp;' .
				'(' .
					date_i18n($df, $date) .
				')' .
			"";

			$changeset = array();
			$separated = false;
			$total_lines = count($entry);
			for ($i=0; $i<$total_lines; $i++) {
				$line = trim(ltrim($entry[$i], '- '));
				if (empty($line)) {
					if ($separated) continue;

					$next_line = isset($entry[$i+1])
						? trim(ltrim($entry[$i+1], '- '))
						: false
					;
					if (empty($next_line)) continue;

					$line = '</li></ul><div class="extra-toggle">' .
						'<a href="#toggle" data-expanded="' . esc_attr(__('Show less', 'upfront')) . '" data-contracted="' . esc_attr(__('Show more', 'upfront')) . '">' . esc_html(__('Show more', 'upfront')) . '</a>' .
					'</div><ul class="extra"><li>';
					$separated = true;
				}

				$changeset[] = $line;
			}

			if (empty($changeset)) continue;

			$changelog[$key] = '<ul><li>' . join('</li><li>', $changeset) . '</li></ul>';
		}
		return $changelog;
	}
}
