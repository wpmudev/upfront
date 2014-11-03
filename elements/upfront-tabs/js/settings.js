define([
	'elements/upfront-tabs/js/settings/appearance-panel'
], function(AppearancePanel) {
	var Settings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function (opts) {
			this.options = opts;
			this.has_tabs = false;
			this.panels = _([
				new AppearancePanel({model: this.model})
			]);
		},

		get_title: function () {
			return 'Tabs settings';
		}
	});

	return Settings;
});
