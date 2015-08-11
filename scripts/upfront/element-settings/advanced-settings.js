define([
	'scripts/upfront/element-settings/panel'
], function(ElementSettingsPanel) {
	var AdvancedSettings = ElementSettingsPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel advanced-settings',
		settings: [
			{
				type: 'Padding'
			},
			{
			 type: 'Anchor'
			}
		],
		title: 'Advanced Settings'
	});

	return AdvancedSettings;
});
