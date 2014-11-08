define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/font-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'text!elements/upfront-accordion/tpl/preset-style.html'
], function(PresetManager, Util, FontSettingsItem, ColorsSettingsItem, styleTpl) {
	var l10n = Upfront.Settings.l10n.accordion_element;

	var Settings = PresetManager.extend({
		mainDataCollection: 'accordionPresets',
		styleElementPrefix: 'accordion-preset',
		ajaxActionSlug: 'accordion',
		panelTitle: l10n.settings,
		styleTpl: styleTpl,
		presetDefaults: {
			'active-font-size': 14,
			'active-font-family': 'Arial',
			'active-font-color': '808080',
			'active-header-background': '000000',
			'active-content-background': '000000',
			'active-triangle-icon-color': 'ffffff',
			'static-font-size': 14,
			'static-font-family': 'Arial',
			'static-font-color': '606060',
			'static-header-background': '000000',
			'static-triangle-icon-color': 'ffffff'
		},
		stateFields: {
			Active: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						abccolors: [
							{
								name: 'active-header-bg-color',
								label: 'Header BG'
							},
							{
								name: 'active-content-bg-color',
								label: 'Content BG'
							},
							{
								name: 'active-triangle-icon-color',
								label: 'Triangle Icon'
							}
						]
					}
				},
				{
					fieldClass: FontSettingsItem,
					options: {
						state: 'active'
					}
				}
			],
			Static: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						abccolors: [
							{
								name: 'static-header-bg-color',
								label: 'Header BG'
							},
							{
								name: 'static-triangle-icon-color',
								label: 'Triangle Icon'
							}
						]
					}
				},
				{
					fieldClass: FontSettingsItem,
					options: {
						state: 'static'
					}
				}
			]
		}
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('accordion', styleTpl);

	return Settings;
});
