;(function($){
var check_email = function(email){
		return /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email);
	},
	show_message = function($form, message){
		$form.find('.ucontact-message-container').html(
			$('<div>').addClass('ucontact-msg msg error').html(message)
		);
	},
	hide_message = function($form){
		$form.find('.ucontact-message-container').html('');
	},
	add_error = function(error, errors, $elem){
		$elem.addClass('ucontact-field-error');
		return errors.push(error);
	}
;
if(!String.prototype.trim){
	String.prototype.trim = function(){
		return this.replace(/^\s+|\s+$/g, '');
	};
}
jQuery(function($){
	var $form = $('div.upfront-contact-form');
	$form.on('blur', '.ucontact-validate-field', function(e){
		var $elem = $(this),
			field = $elem.attr('name'),
			errors = []
		;
		switch(field){
			case 'sendername':
				error = $elem.val().trim() ? false : 'You must write your name.';
				break;
			case 'senderemail':
				error = check_email($elem.val().trim()) ? false : 'The email address is not valid.';
				break;
			case 'subject':
				error = $elem.val().trim() ? false : 'You must write a subject for the message.';
				break;
			case 'sendermessage':
				error = $elem.val().trim() ? false : 'You forgot to write a message.';
		}
		if(error){
			$elem.addClass('ucontact-field-error');
			show_message($form, error);
		}
		else{
			$elem.removeClass('ucontact-field-error');
			hide_message($form);
		}
	});

	$form.find('form').on('submit', function(e){
		var name = $form.find('input[name=sendername]'),
			email = $form.find('input[name=senderemail]'),
			subject = $form.find('input[name=senderemail]'),
			message = $form.find('textarea[name=sendermessage]'),
			errors = []
		;

		if(!name.val().trim())
			add_error('You must write your name.', errors, name);
		if(!check_email(email.val().trim()))
			add_error('The email address is not valid.', errors, email);
		if(subject.length > 0 && !subject.val().trim())
			add_error('You must write a subject for the message.', errors, subject);
		if(!message.val().trim())
			add_error('You forgot to write a message.', errors, message);

		if(errors.length > 0){
			//Stop sending
			e.preventDefault();
			show_message($form, errors.join('<br />'));
		}
	});
});
})(jQuery);
