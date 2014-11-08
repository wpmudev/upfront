define([
	'elements/upfront-accordion/js/settings/appearance-panel'
], function(AppearancePanel) {
	var l10n = Upfront.Settings.l10n.accordion_element;

	var AccordionSettings = Upfront.Views.Editor.Settings.Settings.extend({
		has_tabs: false,

		initialize: function (opts) {
		this.options = opts;
			this.panels = _([
				new AppearancePanel({model: this.model})
			]);
		},

		get_title: function () {
			return l10n.settings;
		}
	});

	return AccordionSettings;
});
