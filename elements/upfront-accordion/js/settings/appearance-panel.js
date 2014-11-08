define(function() {
	var l10n = Upfront.Settings.l10n.accordion_element;

	var AppearancePanel = Upfront.Views.Editor.Settings.Panel.extend({
		className: 'uaccordion-settings-panel',
		initialize: function (opts) {
			this.options = opts;

			this.settings = _([
				new Upfront.Views.Editor.Settings.Item({
					model: this.model,
					title: l10n.appearance,
					fields: []
				})
			]);
		},

		get_label: function () {
			return l10n.appearance;
		},

		get_title: function () {
			return false;
		}
	});

	return AppearancePanel;
});
