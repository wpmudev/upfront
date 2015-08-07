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
				'menu_style': 'horizontal',
				'menu_alingment': 'center',
				'burger_alignment': 'left',
				'static-font-size': 14,
				'static-font-family': 'Arial',
				'static-font-color': 'rgb(0, 0, 0)',
				'static-font-style': '400 normal',
				'static-weight': 400,
				'static-style': 'normal',
				'static-line-height': 1,
				'static-nav-bg': 'rgb(255, 255, 255)',
				'hover-font-size': 14,
				'hover-font-family': 'Arial',
				'hover-font-color': 'rgb(0, 0, 0)',
				'hover-font-style': '400 normal',
				'hover-weight': 400,
				'hover-style': 'normal',
				'hover-line-height': 1,
				'hover-transition-duration': 0.3,
				'hover-transition-easing': 'ease-in-out',
				'hover-nav-bg': 'rgb(255, 255, 255)',
				'focus-font-size': 14,
				'focus-font-family': 'Arial',
				'focus-font-color': 'rgb(0, 0, 0)',
				'focus-font-style': '400 normal',
				'focus-weight': 400,
				'focus-style': 'normal',
				'focus-line-height': 1,
				'focus-nav-bg': 'rgb(255, 255, 255)',
				'id': 'default',
				'name': l10n.default_preset
			},
			styleTpl: styleTpl,
			stateFields: {
				Global: [
					{
						fieldClass: MenuStyle,
						options: {
							title: l10n.panel.menu_kind_label,
							state: 'global',
						}
					},
				],
				Static: [
					{
						fieldClass: TypographySettingsItem,
						options: {
							title: l10n.panel.typography_label,
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
							title: l10n.panel.colors_label,
							multiple: false,
							single: true,
							abccolors: [
								{
									name: 'static-nav-bg',
									label: l10n.panel.background_label
								},
							]
						}
					},
				],
				Hover: [
					{
						fieldClass: TypographySettingsItem,
						options: {
							title: l10n.panel.typography_label,
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
							title: l10n.panel.colors_label,
							multiple: false,
							single: true,
							toggle: true,
							fields: {
								use: 'hover-use-color',
							},
							abccolors: [
								{
									name: 'hover-nav-bg',
									label: l10n.panel.background_label
								},
							]
						}
					},
				],
				Focus: [
					{
						fieldClass: TypographySettingsItem,
						options: {
							title: l10n.panel.typography_label,
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
							title: l10n.panel.colors_label,
							multiple: false,
							single: true,
							toggle: true,
							fields: {
								use: 'focus-use-color',
							},
							abccolors: [
								{
									name: 'focus-nav-bg',
									label: l10n.panel.background_label
								},
							]
						}
					},
				],
			}
		});
		
		// Generate presets styles to page
		Util.generatePresetsToPage('nav', styleTpl);

		return AppearancePanel;
});
