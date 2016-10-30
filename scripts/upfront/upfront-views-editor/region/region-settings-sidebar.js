(function ($) {
define([], function () {
	// Setup basics
	$('body').append('<div id="region-settings-sidebar" />');
	$('#region-settings-sidebar').width(0).css('opacity', 0);

	var destroySettings = function() {
		$('#region-settings-sidebar').width(0).css('opacity', 0).html('');
	};

	var showSettings = function(view) {
		$('#region-settings-sidebar').html(view.el);
		view.open();

		setTimeout(function() { // Remove collapsed class, but allow a bit time for some animation handled elsewhere that does not work always
			$('#region-settings-sidebar').removeClass('collapsed');
		}, 500);
		Upfront.Events.trigger('region:settings:render');
	};

	Upfront.Events.on('region:settings:activate', showSettings);

	//Destroy settings when element is removed
	Upfront.Events.on("entity:removed:after", destroySettings);

	// Also destroy settings when breakpoint is toggled
	Upfront.Events.on('upfront:layout_size:change_breakpoint', destroySettings);
});
})(jQuery);
