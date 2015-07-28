define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/typography-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/hov-animation-settings-item',
	'text!elements/upfront-contact-form/templates/preset-style.html'
], function(ElementSettings, PresetManager, Util, TypographySettingsItem, ColorsSettingsItem, BorderSettingsItem, HovAnimationSettingsItem, styleTpl) {
	var l10n = Upfront.Settings.l10n.contact_element;

	var AppearancePanel = PresetManager.extend({
		mainDataCollection: 'contactPresets',
		styleElementPrefix: 'contact-preset',
		ajaxActionSlug: 'contact',
		panelTitle: l10n.settings,
		presetDefaults: {
			'id': 'default',
			'name': l10n.default_preset
		},
		styleTpl: styleTpl,
		stateFields: {
			Static: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						multiple: false,
						single: false,
						abccolors: [
							{
								name: 'static-field-bg',
								label: 'Field BG'
							},
							{
								name: 'static-button-bg',
								label: 'Button BG'
							},
						]
					}
				},
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
						},
						default_element: "field-labels",
						elements: [
							{ label: "Field Labels", value: "field-labels" },
							{ label: "Field Values", value: "field-values" },
							{ label: "Button", value: "button" },
						],
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'static',
						title: '',
						fields: {
							use: 'static-useborder',
							width: 'static-borderwidth',
							type: 'static-bordertype',
							color: 'static-bordercolor',
						},
						default_element: 'field-button',
						elements: [
							{label: 'Field & Button', value: 'field-button'},
							{label: 'Field', value: 'field'},
							{label: 'Button', value: 'button'}
						]
					}
				}
			],

			Hover: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						multiple: false,
						single: false,
						toggle: true,
						fields: {
							use: 'hover-use-color',
						},
						abccolors: [
							{
								name: 'hover-field-bg',
								label: 'Field BG'
							},
							{
								name: 'hover-button-bg',
								label: 'Button BG'
							},
						]
					}
				},
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
						},
						default_element: "field-labels",
						elements: [
							{ label: "Field Labels", value: "field-labels" },
							{ label: "Field Values", value: "field-values" },
							{ label: "Button", value: "button" },
						],
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'hover',
						title: '',
						fields: {
							use: 'hover-useborder',
							width: 'hover-borderwidth',
							type: 'hover-bordertype',
							color: 'hover-bordercolor',
						},
						default_element: 'field-button',
						elements: [
							{label: 'Field & Button', value: 'field-button'},
							{label: 'Field', value: 'field'},
							{label: 'Button', value: 'button'}
						]
					}
				},
				{
					fieldClass: HovAnimationSettingsItem,
					options: {
						state: 'hover',
						title: '',
						toggle: true,
						fields: {
							use: 'hover-use-transition',
							duration: 'hover-transition-duration',
							easing: 'hover-transition-easing',
						}
					}
				}
			],

			Focus: [
				{
					fieldClass: ColorsSettingsItem,
					options: {
						title: 'Colors',
						multiple: false,
						single: false,
						toggle: true,
						fields: {
							use: 'focus-use-color',
						},
						abccolors: [
							{
								name: 'focus-field-bg',
								label: 'Field BG'
							},
							{
								name: 'focus-button-bg',
								label: 'Button BG'
							},
						]
					}
				},
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
						},
						default_element: "field-labels",
						elements: [
							{ label: "Field Values", value: "field-values" },
							{ label: "Button", value: "button" },
						],
					}
				},
				{
					fieldClass: BorderSettingsItem,
					options: {
						state: 'focus',
						title: '',
						fields: {
							use: 'focus-useborder',
							width: 'focus-borderwidth',
							type: 'focus-bordertype',
							color: 'focus-bordercolor',
						},
						default_element: 'field-button',
						elements: [
							{label: 'Field & Button', value: 'field-button'},
							{label: 'Field', value: 'field'},
							{label: 'Button', value: 'button'}
						]
					}
				}
			]
		}
	});

	return AppearancePanel;
});
