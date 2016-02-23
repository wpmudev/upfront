;(function($){
var check_email = function(email){
		return /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(email);
	},
	show_message = function($form, message, info){
		var infoclass = info ? 'info' : 'error';
		$form.find('.ucontact-message-container').html(
			$('<div>').addClass('ucontact-msg msg ' + infoclass).html(message)
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
	}
}
jQuery(function($){
	
	// Boot realperson with proper options
	$('[name="realPerson"]').each(function () {
		var $me = $(this),
			refresh = $me.attr('data-string'),
			opts = {}
		;
		if (refresh) opts.regenerate = refresh;
		$me.realperson(opts);
	});

	var $form = $('div.upfront-contact-form');
	$form.on('blur', '.ucontact-validate-field', function(e){
		var $elem = $(this),
			$container = $elem.parents('.upfront-contact-form'),
			field = $elem.attr('name'),
			errors = []
		;
		
		switch(field){
			case 'sendername':
				error = $elem.val().trim() ? false : ($elem.attr('data-string') || 'You must write your name.');
				break;
			case 'senderemail':
				error = check_email($elem.val().trim()) ? false : ($elem.attr('data-string') || 'The email address is not valid.');
				break;
			case 'subject':
				error = $elem.val().trim() ? false : ($elem.attr('data-string') || 'You must write a subject for the message.');
				break;
			case 'sendermessage':
				error = $elem.val().trim() ? false : ($elem.attr('data-string') || 'You forgot to write a message.')
		}
		
		if (error){
			$elem.addClass('ucontact-field-error');
			show_message($container, error);
		} else{
			$elem.removeClass('ucontact-field-error');
			hide_message($container);
		}
	});
	
	$form.find('form').on('submit', function(e){
		e.preventDefault();
		e.stopPropagation();
		var $this = $(this),
			name = $this.find('input[name=sendername]'),
			email = $this.find('input[name=senderemail]'),
			subject = $this.find('input[name=subject]'),
			message = $this.find('textarea[name=sendermessage]'),
			realPerson = $this.find('input[name="realPerson"]'),
			errors = []
		;

		if (!name.val().trim()) add_error(
			(name.attr("data-string") || 'You must write your name.'), 
			errors, name
		);
		if (!check_email(email.val().trim())) add_error(
			(email.attr("data-string") || 'The email address is not valid.'), 
			errors, email
		);
		if (subject.length > 0 && !subject.val().trim()) add_error(
			(subject.attr("data-string") || 'You must write a subject for the message.'), 
			errors, subject
		);
		if(!message.val().trim()) add_error(
			(message.attr("data-string") || 'You forgot to write a message.'), 
			errors, message
		);

		if (errors.length > 0){
			//Stop sending
			show_message($this.parent(), errors.join('<br />'));
		} else{
			//Everything ok, try to send it via ajax
			$.ajax({
				url: ajax_url,
				type: 'POST',
				data: {
					action: 'upfront_contact-form',
					sendername: name.val().trim(),
					senderemail: email.val().trim(),
					subject: subject.length ? subject.val().trim() : '',
					sendermessage: message.val().trim(),
					ucontact: $this.find('input[name=ucontact]').val(),
					contactformid: $this.find('input[name=contactformid]').val(),
					entity_ids: $this.find('input[name=entity_ids]').val(),
					realPerson: realPerson.length ? realPerson.val() : '',
					realPersonHash: realPerson.length ? realPerson.realperson('getHash') : ''
				},
				success: function(data){
					var msg = (data.data && "message" in data.data ? data.data.message : ''),
						err = (data.data && "error" in data.data ? !!data.data.error : true)
					;
					if (!err) {
						msg = '<div><p>' + msg + '</p></div>'; 
					}
					show_message($this, msg, !err);
					if (!err) {
						$form.find(".ucontact-message-container").addClass("ucontact-success-response")
						//$form.find("input,button,textarea").attr("disabled", true);

						$form.find(".ucontact-message-container").bind('click', function() {
							$(this).removeClass("ucontact-success-response").html("");
							$(this).unbind('click')
						});

						name.val('');
						email.val('');
						if (subject.length)	{subject.val('');}
						message.val('');

						if (realPerson.length) {
							realPerson.val('');
							realPerson.realperson('destroy');
							realPerson.realperson();
						}
					}
				},
				error: function(error){
					var response = JSON.parse(error.responseText);
					show_message($this, response.error);
				}
			});
		}
		return false;
	});
});
})(jQuery);