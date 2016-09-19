(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;
	define([
		'scripts/upfront/upfront-views-editor/commands/command'
	], function ( Command ) {

		return Command.extend({
			render: function () {
				this.$el.html(l10n.help_and_support);
			},
			on_click: function () {
				var url = 'https://premium.wpmudev.org/upfront-documentation',
					win = window.open(url, "_blank")
				;
				win.focus();
			}
		});

	});
}(jQuery));