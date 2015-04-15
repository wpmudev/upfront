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
					<?php echo esc_html($lost_password); ?>
					<br />
					<a class="login-lostpassword-link" href="<?php echo wp_lostpassword_url(); ?>">
						<?php echo esc_html($click_here); ?>
					</a>
				</small>
			</p>
		</div>
	</div>
</div>