;(function($){
	$(function () {
		$('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();	
		
		$('body').on('touchstart click', '.accordion-panel', function(event) {
			var $panel = $(event.currentTarget);
			var contentId;

			if ($panel.hasClass('accordion-panel-active')) {
				return;
			}
			$panel.addClass('accordion-panel-active').find('.accordion-panel-content').slideDown();
			$panel.siblings().removeClass('accordion-panel-active').find('.accordion-panel-content').slideUp();
		});
	});

	/**
	 * Fix DOM children responsive preset classes
	 *
	 * Legacy preset elements double up their preset classes in DOM children,
	 * which doesn't get pick up by the responsive preset processing in `layout.js`.
	 *
	 * This is where we handle those cases, for the current element
	 *
	 * @param {Object} e Event - ignore
	 * @param {String} breakpoint The current breakpoint to inherit
	 */
	$(document).on("upfront-responsive_presets-changed", function (e, breakpoint) {
		$(".upfront-accordion").each(function () {
			var $root = $(this),
				rmap = $root.attr("data-preset_map"),
				map = rmap ? JSON.parse(rmap) : {},
				$items
			;
			// we have to provide proper fallback here, mobile -> tablet -> desktop
			if ( breakpoint == 'mobile' ) {
				map[breakpoint] = map[breakpoint] || map['tablet'] || map['desktop'];
			} else if ( breakpoint == 'tablet' ) {
				map[breakpoint] = map[breakpoint] || map['desktop'];
			} else {
				map[breakpoint] = map[breakpoint];
			}

			$items = $root.find(".upfront-accordion-container");
			$.each(map, function (bp, preset) {
				$items.removeClass('accordion-preset-' + preset);
				if (bp === breakpoint && typeof preset !== "undefined") $items.addClass('accordion-preset-' + preset);
			});

		});
	});
})(jQuery);
