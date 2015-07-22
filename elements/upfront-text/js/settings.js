define([
	'elements/upfront-text/js/appearance',
	'scripts/upfront/element-settings/settings'
], function(AppearancePanel, ElementSettings) {
	var l10n = Upfront.Settings.l10n.text_element;

	var TextSettings = ElementSettings.extend({
		initialize: function (opts) {
			this.options = opts;
			var me = this;
			this.panels = _([
				new AppearancePanel({
					model: this.model
				})
			]);

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});
		},

		get_title: function () {
			return l10n.appearance;
		}
	});

	return TextSettings;
});
