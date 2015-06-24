define([
	'elements/upfront-text/js/appearance',
	'scripts/upfront/element-settings/settings'
], function(AppearancePanel, ElementSettings) {
	var l10n = Upfront.Settings.l10n.text_element;

	var Settings = ElementSettings.extend({
		initialize: function (opts) {
			this.has_tabs = false;
			this.options = opts;
			this.panels = _([
				new AppearancePanel({model: this.model})
			]);
		},

		get_title: function () {
			return l10n.appearance;
		}
	});

	return Settings;
});
