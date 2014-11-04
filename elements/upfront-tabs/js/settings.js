define([
	'elements/upfront-tabs/js/settings/presets-panel'
], function(PresetsPanel) {
	var l10n = Upfront.Settings.l10n.utabs_element;

	var Settings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function (opts) {
			this.options = opts;
			this.has_tabs = false;
			this.panels = _([
				new PresetsPanel({model: this.model})
			]);
		},

		get_title: function () {
			return l10n.settings;
		}
	});

	return Settings;
});
