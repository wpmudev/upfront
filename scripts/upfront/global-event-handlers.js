(function ($) {
define(function() {

	// Close select dropdown on outside click
	$('body').on('mouseup', function() {
		$('.upfront-field-select').removeClass('upfront-field-select-expanded');
	});


  // Allow focus on click for inputs and textareas - draggable hijacks it
	var nonDraggableSelectors = '#page input[type="text"], #page input[type="email"], #page input[type="password"], #page textarea, #page select, #page .upfront-field-select';
	$('body').on('mouseover', nonDraggableSelectors, function(event) {
		try {
			$(event.target).closest('.ui-draggable').draggable('disable');
		} catch (event) {
			// We don't do anything but have to guard here
		}
	});
	$('body').on('mouseout', nonDraggableSelectors, function(event) {
		try {
			$(event.target).closest('.ui-draggable').draggable('enable');
		} catch (event) {
			// We don't do anything but have to guard here
		}
	});

	$(document).on("click", function(e){
		if( $(".sp-container").length === $(".sp-container.sp-hidden").length ) return;

		$(".sp-container").not(".sp-hidden").each(function(){
			var $this = $(this),
				options = $this.data("sp-options");
			if( !options || !options.flat  ){
				var $replacer = $this.parent().find(".sp-replacer");
				$replacer.removeClass("sp-active");
				$this.addClass("sp-hidden");
				setTimeout(function(){
					$replacer.removeClass("sp-active");
					$this.addClass("sp-hidden");
				}, 10);
			}
		});
	});

});
})(jQuery);
