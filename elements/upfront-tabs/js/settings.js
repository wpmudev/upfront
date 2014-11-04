define([
	'elements/upfront-tabs/js/settings/presets-panel'
], function(PresetsPanel) {
	var Settings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function (opts) {
			this.options = opts;
			this.has_tabs = false;
			this.panels = _([
				new PresetsPanel({model: this.model})
			]);
		},

		get_title: function () {
			return 'Tabs settings';
		}
	});

	return Settings;
});
