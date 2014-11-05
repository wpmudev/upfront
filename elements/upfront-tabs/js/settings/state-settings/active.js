define([
	'elements/upfront-tabs/js/settings/font-settings-item'
], function(FontSettingsItem) {
	var ActiveStateSettings = Upfront.Views.Editor.Settings.Item.extend({
		state: 'Active',
		group: false,
		className: 'state_settings state_settings_active',

		initialize: function(options) {
			this.options = options || {};

			this.fontSettingsItem = new FontSettingsItem({
				model: this.model,
				state: 'active'
			});

			this.fields = _([
				this.fontSettingsItem
			]);
		}
	});

	return ActiveStateSettings;
});
