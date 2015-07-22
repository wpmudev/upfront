define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/typography-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/hov-animation-settings-item',
	'elements/upfront-newnavigation/js/settings/menu-style',
	'text!elements/upfront-newnavigation/tpl/preset-style.html'
], function(ElementSettings, PresetManager, Util, TypographySettingsItem, ColorsSettingsItem, BorderSettingsItem, HovAnimationSettingsItem, MenuStyle, styleTpl) {
		var l10n = Upfront.Settings.l10n.newnavigation_element;

		var AppearancePanel = PresetManager.extend({
			mainDataCollection: 'navPresets',
			styleElementPrefix: 'nav-preset',
			ajaxActionSlug: 'nav',
			panelTitle: l10n.settings,
			presetDefaults: {
				'id': 'default',
				'name': l10n.default_preset
			},
			styleTpl: styleTpl,
			stateFields: {
				Global: [
					{
						fieldClass: MenuStyle,
						options: {
							title: 'Menu Kind',
							state: 'global',
						}
					},
				],
				Static: [
					{
						fieldClass: TypographySettingsItem,
						options: {
							title: 'Typography',
							state: 'static',
							toggle: false,
							fields: {
								typeface: 'static-font-family',
								fontstyle: 'static-font-style',
								weight: 'static-weight',
								style: 'static-style',
								size: 'static-font-size',
								line_height: 'static-line-height',
								color: 'static-font-color',
							}
						}
					},
					{
						fieldClass: ColorsSettingsItem,
						options: {
							title: 'Colors',
							multiple: false,
							single: true,
							abccolors: [
								{
									name: 'static-nav-bg',
									label: 'Background'
								},
							]
						}
					},
				],
				Hover: [
					{
						fieldClass: TypographySettingsItem,
						options: {
							title: 'Typography',
							state: 'hover',
							toggle: true,
							fields: {
								use: 'hover-use-typography',
								typeface: 'hover-font-family',
								fontstyle: 'hover-font-style',
								weight: 'hover-weight',
								style: 'hover-style',
								size: 'hover-font-size',
								line_height: 'hover-line-height',
								color: 'hover-font-color',
							}
						}
					},
					{
						fieldClass: ColorsSettingsItem,
						options: {
							title: 'Colors',
							multiple: false,
							single: true,
							toggle: true,
							fields: {
								use: 'hover-use-color',
							},
							abccolors: [
								{
									name: 'hover-nav-bg',
									label: 'Background'
								},
							]
						}
					},
				],
				Focus: [
					{
						fieldClass: TypographySettingsItem,
						options: {
							title: 'Typography',
							state: 'focus',
							toggle: true,
							fields: {
								use: 'focus-use-typography',
								typeface: 'focus-font-family',
								fontstyle: 'focus-font-style',
								weight: 'focus-weight',
								style: 'focus-style',
								size: 'focus-font-size',
								line_height: 'focus-line-height',
								color: 'focus-font-color',
							}
						}
					},
					{
						fieldClass: ColorsSettingsItem,
						options: {
							title: 'Colors',
							multiple: false,
							single: true,
							toggle: true,
							fields: {
								use: 'focus-use-color',
							},
							abccolors: [
								{
									name: 'focus-nav-bg',
									label: 'Background'
								},
							]
						}
					},
				],
			}
		});

		return AppearancePanel;
});
