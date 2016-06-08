<div class="upfront_login upfront_login-click">
	<?php echo $trigger; ?>
	<div class="upfront_login-form-wrapper" style="<?php echo esc_attr($offset); ?>">
		<div class="upfront_login-form">
			<?php 
				wp_login_form(array(
					'remember' => true,
					'label_log_in' => $label,
				));
			?>
			<p class="login-lostpassword">
				<small>
					<?php echo esc_html($lost_password); ?>
					<br />
					<a class="login-lostpassword-link" href="<?php echo esc_url(wp_lostpassword_url()); ?>">
						<?php echo esc_html($click_here); ?>
					</a>
				</small>
			</p>
			<?php if ($allow_registration) { ?>
				<p>
					<a href="<?php echo esc_url(wp_registration_url()); ?>"><?php echo esc_html($register); ?></a>
				</p>
			<?php } ?>
		</div>
	</div>
</div>