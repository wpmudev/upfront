define([
	'elements/upfront-tabs/js/settings/font-settings-item'
], function(FontSettingsItem) {
	var StaticStateSettings = Upfront.Views.Editor.Settings.Item.extend({
		state: 'Active',
		group: false,
		className: 'state_settings state_settings_static',

		initialize: function(options) {
			this.options = options || {};

			this.fontSettingsItem = new FontSettingsItem({
				model: this.model,
				state: 'static'
			});

			this.fields = _([
				this.fontSettingsItem
			]);
		}
	});

	return StaticStateSettings;
});
