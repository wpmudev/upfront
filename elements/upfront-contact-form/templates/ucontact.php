<div class="upfront-output-object upfront-contact-form ucontact-style-<?php echo $form_style ?>" id="<?php echo $id ?>">
	<?php if($title): ?>
	<div class="upfront-contact-form-title"><?php echo $title ?></div>
	<?php endif; ?>
	<form action="<?php echo $_SERVER['REQUEST_URI'] ?>" method="POST">
		<div class="ucontact-message-container">
			<?php if($this->msg): ?>
			<div class="ucontact-msg msg <?php echo $this->msg_class ?>"><?php echo $this->msg ?></div>
			<?php endif; ?>
		</div>
		<input type="hidden" name="ucontact" value="sent">
		<input type="hidden" name="contactformid" value="<?php echo $id ?>">
		<input type="hidden" name="entity_ids" value='<?php echo $this->get_entity_ids_value() ?>'>
		<div class="upfront-field-container <?php echo $field_classes ?>">
			<label for="sendername"><?php echo $name_label ?></label>
			<input type="text" class="text-field <?php echo $validate ?>" name="sendername" value="<?php echo $_POST['sendername'] ?>" <?php $this->echo_placeholder($name_label) ?> />
		</div>
		<div class="upfront-field-container <?php echo $field_classes ?>">
			<label for="senderemail"><?php echo $email_label ?></label>
			<input type="email" class="email-field <?php echo $validate ?>" name="senderemail" value="<?php echo $_POST['senderemail'] ?>" <?php $this->echo_placeholder($email_label) ?> />
		</div>
		<?php if($show_subject): ?>
		<div class="upfront-field-container <?php echo $field_classes ?>">
			<label for="subject"><?php echo $subject_label ?></label>
			<input type="text" class="text-field <?php echo $validate ?>" name="subject" value="<?php echo $_POST['subject'] ?>" <?php $this->echo_placeholder($subject_label) ?> />
		</div>
		<?php endif; ?>
		<div class="upfront-field-container <?php echo $field_classes ?>">
			<label for="sendermessage"><?php echo $message_label ?></label>
			<textarea class="textarea-field <?php echo $validate ?>" name="sendermessage" <?php $this->echo_placeholder($message_label) ?>><?php echo $_POST['sendermessage'] ?></textarea>
		</div>
		<div class="upfront-field-container upfront-submit-container <?php echo $field_classes ?>">
			<input type="submit" name="send" value="<?php echo $button_text ?>" class="button submit-field">
		</div>
	</form>
</div>
<script type="text/javascript">
	if(typeof(window.ajaxurl) == 'undefined')
		window.ajaxurl = "<?php echo admin_url('admin-ajax.php'); ?>";
</script>