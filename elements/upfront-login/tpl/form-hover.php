<div class="upfront_login upfront_login-hover triggered">
	<?php echo $trigger; ?>
	<div class="upfront_login-form-wrapper" style="<?php echo esc_attr($offset); ?>">
		<div class="upfront_login-form triggered">
			<?php 
				wp_login_form(array(
					'remember' => true,
					'label_log_in' => $login_button_label,
					'label_username' => $username_label,
					'label_password' => $password_label,
					'label_remember' => $remember_label,
				));
			?>
			<p class="login-lostpassword">
				<small>
					<span class="login-lostpassword-label"><?php echo esc_html($lost_password);  ?></span>
					<br />
					<a class="login-lostpassword-link" href="<?php echo esc_url(wp_lostpassword_url()); ?>">
						<?php echo esc_html($lost_password_link); ?>
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