define([
	'scripts/upfront/settings/root-modules-panel'
], function(RootModulesPanel) {
	var AdvancedSettings = RootModulesPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel advanced-settings',
		modules: [
			/* We wont use padding in sidebar anymore
			{
				moduleType: 'Padding'
			},
			*/
			{
				moduleType: 'Anchor'
			}
		],

		getAdditionalModules: function(modulesConfig) {
			var hadPresets = _.contains(['UtabsView', 'UaccordionView', 'ButtonView'], this.model.get_property_value_by_name('view_class')),
				elementStyleName;

			// Show only for tab, accordion and button
			if (!hadPresets) return modulesConfig;

			// And only if element used element styles
			elementStyleName = this.model.get_property_value_by_name('theme_style');
			if (!elementStyleName || elementStyleName === '_default') return modulesConfig;

			modulesConfig.unshift({moduleType:'ElementStyle'});
			return modulesConfig;
		},

		title: 'Advanced Settings'
	});

	return AdvancedSettings;
});
