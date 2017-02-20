(function ($) {
define(function() {

	// Close select dropdown on outside click
	$('body').on('mouseup', function() {
		$('.upfront-field-select').removeClass('upfront-field-select-expanded');
	});


  // Allow focus on click for inputs and textareas - draggable hijacks it
	/*var nonDraggableSelectors = '#page input[type="text"], #page input[type="email"], #page input[type="password"], #page textarea, #page select, #page .upfront-field-select';
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
	});*/

	/**
	 * Hide color picker when clicked outside of it
	 */
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

	/**
	 * re-Resize Magnific Popup on window resize (iPhone issue) 
	 */
	if(/i(Pad|Phone|Pod)/g.test(navigator.userAgent))
		$(window).on("resize", function(e){
			setTimeout(function(){
				$.magnificPopup.instance.updateSize();
			}, 500);
		});

	/**
	 * Handle navigation
	 */
	// Should only run after Upfront instance load
	$(document).one('upfront-load', function () {
		Upfront.Events.once('Upfront:loaded', function(){
			$(document)
				.on('click', 'a', function(e){
					var bypass, href, a, pathname, search;
		
					if(e.isDefaultPrevented()) return;
		
					bypass = $(e.currentTarget).data('bypass');
					if(bypass) return;
		
					a = e.target;
					pathname = a.pathname;
					href = a.getAttribute('href');
					search = a.search;
		
					if(href == '#' || a.origin != window.location.origin ||
						(pathname == window.location.pathname && search == window.location.search)) return;
		
					//If we are editing text, don't follow the link
					if($(e.target).closest('.redactor_box').length || $(e.target).parents('.redactor-editor').length) {
						return;
					}
		
					// Prevent crazy double url navigation
					if (Upfront.mainData.site.indexOf('localhost') > -1
						&& Upfront.mainData.site + '/' === a.origin + pathname) pathname = '/';
		
					// Make dev=true remain in arguments
					if (window.location.search.indexOf('dev=true') > -1
							&& search.indexOf('dev=true') === -1) {
								if (search === '') search = '?';
								search += 'dev=true';
							}
		
					e.preventDefault();

					if( a.origin === window.location.origin ) // Make should we don't have double pathnames if we are redirecting to our own app
						pathname = pathname.replace( window.location.pathname, '');

					if(!Upfront.PreviewUpdate._is_dirty || confirm(Upfront.Settings.l10n.global.application.navigation_confirm))
						Upfront.Application.navigate(pathname + search, {trigger: true});
				})
				.on('keydown', function(e){
					//Don't let the backspace go back in history
					if(e.which == 8){
						var tag = e.target.tagName.toUpperCase();
						if(tag != 'INPUT' && tag != 'TEXTAREA' && !$(e.target).closest('.redactor_box').length && !e.target.contentEditable)
					e.preventDefault();
					}
				});
		});
	});
});
})(jQuery);
