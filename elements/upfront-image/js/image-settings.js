define([
	'elements/upfront-image/js/settings/description-panel',
	'scripts/upfront/element-settings'
], function(DescriptionPanel, ElementSettings) {
	var l10n = Upfront.Settings.l10n.image_element;
	var ImageSettings = ElementSettings.extend({
		initialize: function (opts) {
			this.options = opts;
			var me = this;
			this.panels = _([
				new DescriptionPanel({model: this.model})
			]);

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});
		},
		get_title: function () {
			return l10n.settings.label;
		}
	});

	return ImageSettings;
});
