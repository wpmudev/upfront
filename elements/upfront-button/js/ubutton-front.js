;(function($){

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
		$(".upfront-button").each(function () {
			var $root = $(this),
				rmap = $root.attr("data-preset_map"),
				map = rmap ? JSON.parse(rmap) : {},
				$items
			;
			if (!map[breakpoint]) return true;

			$items = $root.find(".upfront_cta");
			$.each(map, function (bp, preset) {
				$items.removeClass('button-preset-' + preset);
				if (bp === breakpoint) $items.addClass('button-preset-' + preset);
			});

		});
	});
})(jQuery);
