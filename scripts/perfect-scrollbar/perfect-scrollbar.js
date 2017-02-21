// Container for JS Library that updates the raw library's object to have debounced updating to help with initialization timing issues. 
(function($) {
define([
	// The raw library.
	'scripts/perfect-scrollbar/perfect-scrollbar-library'
], function(perfectScrollbar) {
	/* Update scrollbar to fix any timing issues (if scrollbar does not show up until scroll).
	 *
	 * @params {DOM element} el The DOM element for the scroll container.
	 * @params {boolean} runFirst Whether to run the call first or after the debouncing.
	 * @params {string} event The event name to listen to for future updates.
	 * @params {boolean} initialize Initialize scrollbar also.
	 *
	 */
	perfectScrollbar.withDebounceUpdate = function(el, runFirst, event, initialize) {
		// Initialize the JS scrollbar.
		if (
			// Do not load if library not loaded.
			typeof initialize !== 'undefined'
			// Do not load if already initialized.
			&& !$(el).hasClass('ps-container')
		) {
			perfectScrollbar.initialize(el, {
				// Do not allow X axis scrolling.
				suppressScrollX: true
			});
		}

		// Debounce the update for performance.
		// runFirst determines whether to run at first or not.
		var _debouncedUpdate = _.debounce(function () {
			perfectScrollbar.update(el);
		}, 500, runFirst); // Once in 500ms

		// If an event argument exists, use it.
		if (typeof event !== 'undefined') {
			Upfront.Events.on(event, _debouncedUpdate);
		}

		// Run once off stack.
		setTimeout(_debouncedUpdate);
	}
	return perfectScrollbar;
});
})(jQuery);
