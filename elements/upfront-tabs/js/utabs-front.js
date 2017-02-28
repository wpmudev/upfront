;(function($){
	$(function () {
		$('body').on('touchstart click', '.tabs-tab', function(event) {
			var $tab = $(event.currentTarget);
			var contentId;

			if ($tab.hasClass('tabs-tab-active')) {
				return;
			}

			$tab.addClass('tabs-tab-active');
			$tab.siblings().removeClass('tabs-tab-active');

			contentId = $tab.data('content-id');
			$('#' + contentId).addClass('utab-content-active')
				.siblings().removeClass('utab-content-active');
		});
		
		/**
		 * Activate focused tab with Enter keydown
		 */
		$('.tabs-tab').keydown(function(e) {
			if (e.which == 13) {
				$(this).click();
			}
			if (e.which == 37) {
				$(this).prev('.tabs-tab').focus().click();
			}
			
			if (e.which == 39) {
				$(this).next('.tabs-tab').focus().click();
			}
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
		$(".upfront-tabs").each(function () {
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

			$items = $root.find(".upfront-tabs-container");
			$.each(map, function (bp, preset) {
				$items.removeClass('tab-preset-' + preset);
				if (bp === breakpoint && typeof preset !== "undefined") $items.addClass('tab-preset-' + preset);
			});

		});
	});
})(jQuery);
