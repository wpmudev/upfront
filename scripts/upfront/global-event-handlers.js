(function ($) {
define(function() {

	// Close select dropdown on outside click
	$('body').on('mouseup', function() {
		$('.upfront-field-select').removeClass('upfront-field-select-expanded');
	});

  // Allow focus on click for inputs and textareas - draggable hijacks it
	$('body').on('mouseover', '#page input[type="text"], #page input[type="email"], #page input[type="password"], #page textarea', function(event) {
		try {
			$(event.target).closest('.ui-draggable').draggable('disable');
		} catch (event) {
			// We don't do anything but have to guard here
		}
	});
	$('body').on('mouseout', '#page input[type="text"], #page input[type="email"], #page input[type="password"], #page textarea', function(event) {
		try {
			$(event.target).closest('.ui-draggable').draggable('enable');
		} catch (event) {
			// We don't do anything but have to guard here
		}
	});

});
})(jQuery);
