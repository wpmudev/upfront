define([
	'scripts/upfront/settings/root-modules-panel'
], function(RootModulesPanel) {
	var AdvancedSettings = RootModulesPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel advanced-settings',
		modules: [
			{
				moduleType: 'Padding'
			},
			{
			 moduleType: 'Anchor'
			}
		],
		title: 'Advanced Settings'
	});

	return AdvancedSettings;
});
