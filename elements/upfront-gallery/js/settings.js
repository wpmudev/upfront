define([
	'elements/upfront-gallery/js/settings/layout-panel'
], function(LayoutPanel) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var UgallerySettings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function (opts) {
			var me = this;

			this.has_tabs = false;
			this.options = opts;

			this.panels = _([
				new LayoutPanel({model: this.model})
			]);

			this.on('closed', function(){
				me.model.trigger('settings:closed');
			});
		},
		get_title: function () {
			return l10n.settings;
		}
	});

	return UgallerySettings;
});

