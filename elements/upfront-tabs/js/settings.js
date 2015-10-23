define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/font-settings-item',
	'text!elements/upfront-tabs/tpl/preset-style.html'
], function(PresetManager, Util, FontSettingsItem, styleTpl) {
	var l10n = Upfront.Settings.l10n.utabs_element;

	var Settings = PresetManager.extend({
		mainDataCollection: 'tabPresets',
		styleElementPrefix: 'tab-preset',
		ajaxActionSlug: 'tab',
		panelTitle: l10n.settings,
		presetDefaults: {
			'active-font-size': 14,
			'active-font-family': 'Arial',
			'active-font-color': 'rgb(128, 128, 128)',
			'hover-font-size': 14,
			'hover-font-family': 'Arial',
			'hover-font-color': 'rgb(0, 0, 0)',
			'hover-transition-duration': 0.3,
			'hover-transition-easing': 'ease-in-out',
			'static-font-size': 14,
			'static-font-family': 'Arial',
			'static-font-color': 'rgb(0, 0, 0)',
			'id': 'default',
			'name': l10n.default_preset
		},
		styleTpl: styleTpl,
		stateFields: {
			Active: [
				{
					fieldClass: FontSettingsItem,
					options: {
						state: 'active'
					}
				}
			],
			Hover: [
				{
					fieldClass: FontSettingsItem,
					options: {
						state: 'hover'
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'duration',
						name: 'hover-transition-duration',
						min: 0,
						label: 'Animate Hover Changes:',
						step: 0.1,
						values: [
							{ label: '', value: '12' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hover-transition-duration': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'hover-transition-easing',
						label: 'sec',
						step: 0.1,
						label_style: 'inline',
						values: [
							{ label: 'ease', value: 'ease' },
							{ label: 'linear', value: 'linear' },
							{ label: 'ease-in', value: 'ease-in' },
							{ label: 'ease-out', value: 'ease-out' },
							{ label: 'ease-in-out', value: 'ease-in-out' }
						],
						className: 'transition hover',
						change: function(value, parentPanel) {
							parentPanel.model.set({'hover-transition-easing': value});
						}
					}
				}
			],
			Static: [
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
	Util.generatePresetsToPage('tab', styleTpl);

	return Settings;
});
