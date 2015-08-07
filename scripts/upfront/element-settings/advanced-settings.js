(function ($) {
define([
	'scripts/upfront/element-settings/panel',
	'scripts/upfront/element-settings/settings/padding-settings-module',
], function(ElementSettingsPanel, PaddingSettings) {
	var AdvancedSettings = ElementSettingsPanel.extend({
		className: 'upfront-settings_panel_wrap advanced-settings',
		initialize: function (opts) {
			this.options = opts;
			var me = this;

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
