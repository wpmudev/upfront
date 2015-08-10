(function ($) {
define([
	'scripts/upfront/element-settings/saveable-settings-panel'
], function (SaveableSettingsPanel) {
	var SettingsSubpanel = SaveableSettingsPanel.extend({
		className: 'uf-settings-subpanel',

		render: function() {
			var me = this;

			this.settings.each(function (setting) {
				if ( ! setting.panel ) setting.panel = me;
				setting.render();
				me.$el.append(setting.el)
			});
		}
	});
	return SettingsSubpanel;
});
})(jQuery);
