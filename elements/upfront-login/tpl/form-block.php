<div class="upfront_login upfront_login-block">
	<div class="upfront_login-form-wrapper">
		<div class="upfront_login-form">
			<?php 
				wp_login_form(array(
					'remember' => true,
					'label_log_in' => $label,
				));
			?>
			<p class="login-lostpassword">
				<small>
					<span class="login-lostpassword-label"><?php echo esc_html($lost_password); ?></span>
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