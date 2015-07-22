define([
	'elements/upfront-gallery/js/settings/appearance-panel',
	'elements/upfront-gallery/js/settings/thumbnail-fields',
	'scripts/upfront/element-settings/settings'
], function(AppearancePanel, ThumbnailFields, ElementSettings) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var UgallerySettings = ElementSettings.extend({
		initialize: function (opts) {
			this.options = opts;
			var me = this;
			
			this.panels = _([
				new AppearancePanel({model: this.model}),
				new ThumbnailFields({model: this.model})
			]);

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});
		},
		get_title: function () {
			return l10n.settings;
		}
	});

	return UgallerySettings;
});

