<?php
/**
* No need to escape html for labels as also expecting <span> icon
*/
?>
<div class="upfront_login upfront_login-hover">
	<?php echo $trigger; ?>
	<div class="upfront_login-form-wrapper" style="<?php echo esc_attr($offset); ?>">
		<div class="upfront_login-form">
			<?php 
				$login_form = wp_login_form(array(
					'echo' => false,
					'remember' => true,
					'label_username' => $username_label,
					'label_password' => $password_label,
					'label_remember' => $remember_label,
				));
				echo htmlspecialchars_decode($login_form);
			?>
			<button type="submit" name="wp-submit" class="button-primary upfront-login-button">
				<span class="upfront-login-button-label"><?php echo $login_button_label; ?></span>
			</button>
			<p class="login-lostpassword">
				<small>
					<span class="login-lostpassword-label"><?php echo $lost_password;  ?></span>
					<br />
					<a class="login-lostpassword-link" href="<?php echo esc_url(wp_lostpassword_url()); ?>">
						<?php echo $lost_password_link; ?>
					</a>
				</small>
			</p>
			<?php if ($allow_registration) { ?>
				<p>
					<a href="<?php echo esc_url(wp_registration_url()); ?>"><?php echo $register; ?></a>
				</p>
			<?php } ?>
		</div>
	</div>
</div>