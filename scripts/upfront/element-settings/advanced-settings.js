(function ($) {
define([
	'scripts/upfront/element-settings/panel',
	'scripts/upfront/element-settings/settings/padding-settings-module',
], function(ElementSettingsPanel, PaddingSettings) {
	var AdvancedSettings = ElementSettingsPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel advanced-settings',
		initialize: function (opts) {
			this.options = opts;
			this.options.title = this.options.title || 'Advanced Settings';

			this.settings = _([
				new PaddingSettings({
					model: this.model
				}),
				new Upfront.Views.Editor.Settings.AnchorSetting({
					model: this.model
				})
			]);
		}
	});

	return AdvancedSettings;
});
})(jQuery);
