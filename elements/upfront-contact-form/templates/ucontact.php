<div class="upfront-output-object upfront-contact-form ucontact-style-<?php echo $form_style ?>" id="<?php echo $id ?>">
	<?php if($title): ?>
	<div class="upfront-contact-form-title"><?php echo $title ?></div>
	<?php endif; ?>
	<?php if($this->msg): ?>
	<div class="ucontact-msg msg <?php echo $this->msg_class ?>"><?php echo $this->msg ?></div>
	<?php endif; ?>
	<form action="<?php echo $_SERVER['REQUEST_URI'] ?>" method="POST">
		<input type="hidden" name="ucontact" value="sent">
		<input type="hidden" name="contactformid" value="id">
		<div class="upfront-field-container <?php echo $field_classes ?>">
			<label for="name"><?php echo $name_label ?></label>
			<input type="text" class="text-field" name="sendername" />
		</div>
		<div class="upfront-field-container <?php echo $field_classes ?>">
			<label for="email"><?php echo $email_label ?></label>
			<input type="email" class="email-field" name="senderemail" />
		</div>
		<?php if($show_subject): ?>
		<div class="upfront-field-container <?php echo $field_classes ?>">
			<label for="subject"><?php echo $subject_label ?></label>
			<input type="text" class="text-field" name="subject" />
		</div>
		<?php endif; ?>
		<div class="upfront-field-container <?php echo $field_classes ?>">
			<label for="message"><?php echo $message_label ?></label>
			<textarea class="textarea-field" name="sendermessage"></textarea>
		</div>
		<div class="upfront-field-container upfront-submit-container <?php echo $field_classes ?>">
			<input type="submit" name="send" value="<?php echo $button_text ?>" class="button submit-field">
		</div>
	</form>
</div>