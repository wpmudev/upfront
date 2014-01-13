(function ($, undefined) {

function validate_element ($el, data) {
	var rule = data.rule || '^.*$',
		rx = new RegExp(rule),
		value = $el.length ? $el.val() : ''
	;
	if (!rx.test(value)) {
		alert(data.message);
		return false;
	} else return true;
}

function validate_form ($form, form_data) {
	var valid = true;
	$form.find("input,select").each(function () {
		var $el = $(this),
			name = $el.attr("name"),
			data = form_data[name]
		;
		if (!data) return true;
		if (!validate_element($el, data)) {
			valid = false;
			return false;
		}
	});
	return valid;
}

$(function () {
	$("form").each(function () {
		var $form = $(this),
			name = $form.attr("name"),
			form_data = _upfront_form_data[name]
		;
		if (!name || !form_data) return true;
		$form
		// Each element on change
			.on("change", "select,input", function () {
				var $el = $(this),
					name = $el.attr("name"),
					data = form_data[name]
				;
				if (!data) return true;
				return validate_element($el, data);
			})
		// The form on submission
			.on("submit", function () {
				return validate_form($form, form_data);
			})
		;
	});
});
})(jQuery);