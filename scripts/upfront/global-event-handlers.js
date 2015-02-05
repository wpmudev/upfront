(function ($) {
define(function() {

	// Close select dropdown on outside click
	$('body').on('mouseup', function() {
		$('.upfront-field-select').removeClass('upfront-field-select-expanded');
	});

  // Allow focus on click for inputs and textareas - draggable hijacks it
	$('#page').on('mouseover', 'input[type="text"], input[type="email"], input[type="password"], textarea', function(event) {
		try {
			$(event.target).closest('.ui-draggable').draggable('disable');
		} catch (event) {
			// We don't do anything but have to guard here
		}
	});
	$('#page').on('mouseout', 'input[type="text"], input[type="email"], input[type="password"], textarea', function(event) {
		try {
			$(event.target).closest('.ui-draggable').draggable('enable');
		} catch (event) {
			// We don't do anything but have to guard here
		}
	});

});
})(jQuery);
