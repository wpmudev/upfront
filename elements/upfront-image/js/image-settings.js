define([
	'elements/upfront-image/js/settings/description-panel'
], function(DescriptionPanel) {
	var l10n = Upfront.Settings.l10n.image_element;
	var ImageSettings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function (opts) {
			this.has_tabs = false;
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
