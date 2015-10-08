define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-contact-form/templates/preset-style.html'
], function(ElementSettings, RootSettingsPanel, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.contact_element;

	var GeneralPanel = RootSettingsPanel.extend({
		label: 'Empty label',
		title: l10n.general.label,
		settings: [
			{
				type: 'SettingsItem',
				title: l10n.contact_details,
				className: 'general_settings_item',
				fields: [
					{
						type: 'Email',
						property: 'form_email_to',
						label: l10n.general.send_to
					}
				]
			},
			{
				type: 'SettingsItem',
				title: l10n.fields.label,
				className: 'general_settings_item multiple_radio_no_padding',
				fields: [
					{
						type: 'Optional',
						property: 'show_subject',
						relatedField: 'form_subject_label',
						values: [
							{
								label: l10n.fields.show_subject,
								value: 'true'
							}
						]
					},
					{
						type: 'Optional',
						property: 'show_captcha',
						relatedField: 'form_captcha_label',
						values: [
							{
								label: l10n.fields.show_captcha,
								value: 'true'
							}
						],
					},
					{
						type: 'Select',
						className: 'contact_label_position',
						layout: "vertical",
						label: l10n.fields.label_localtion,
						change : function(e){
							this.model.set_property("form_label_position", this.get_value());
						},
						property: 'form_label_position',
						values: [
							{
								label: l10n.apr.above,
								value: 'above',
								icon: 'contact-above-field'
							},
							{
								label: l10n.apr.over,
								value: 'over',
								icon: 'contact-over-field'
							},
							{
								label: l10n.apr.inline,
								value: 'inline',
								icon: 'contact-inline-field'
							}
						]
					}
				]
			},
			{
				type: 'SettingsItem',
				title: l10n.validation.label,
				className: 'general_settings_item',
				fields: [
					{
						type: 'Radios',
						className: 'inline-radios plaintext-settings',
						property: 'form_validate_when',
						values: [
							{
								label: l10n.validation.on_field,
								value: 'field'
							},
							{
								label: l10n.validation.on_submit,
								value: 'submit'
							}
						]
					}
				]
			}
		]
	});

	var ContactFormSettings = ElementSettings.extend({
		panels: {
			General: GeneralPanel,
			Appearance: {
				mainDataCollection: 'contactPresets',
				styleElementPrefix: 'contact-preset',
				ajaxActionSlug: 'contact',
				panelTitle: l10n.settings,
				presetDefaults: {
					'static-field-bg': 'rgb(255,255,255)',
					'static-button-bg': 'rgb(0,0,0)',
					'static-font-size': 14,
					'static-font-family': 'Arial',
					'static-font-color': 'rgb(96, 96, 96)',
					'static-font-style': '400 normal',
					'static-weight': 400,
					'static-style': 'normal',
					'static-line-height': 1,
					'static-useborder': '',
					'static-borderwidth': 1,
					'static-bordertype': 'solid',
					'static-bordercolor': 'rgb(0, 0, 0)',
					'static-field-labels-font-size': 12,
					'static-field-labels-font-family': 'Arial',
					'static-field-labels-font-color': 'rgb(0, 0, 0)',
					'static-field-labels-weight': 400,
					'static-field-labels-style': 'normal',
					'static-field-labels-line-height': 1,
					'static-field-labels-font-style': '400 normal',
					'hover-field-labels-font-size': 12,
					'hover-field-labels-font-family': 'Arial',
					'hover-field-labels-font-color': 'rgb(0, 0, 0)',
					'hover-field-labels-weight': 400,
					'hover-field-labels-style': 'normal',
					'hover-field-labels-line-height': 1,
					'hover-field-labels-font-style': '400 normal',
					'focus-field-labels-font-size': 12,
					'focus-field-labels-font-family': 'Arial',
					'focus-field-labels-font-color': 'rgb(0, 0, 0)',
					'focus-field-labels-weight': 400,
					'focus-field-labels-style': 'normal',
					'focus-field-labels-line-height': 1,
					'focus-field-labels-font-style': '400 normal',
					'static-field-values-font-size': 12,
					'static-field-values-font-family': 'Arial',
					'static-field-values-font-color': 'rgb(0, 0, 0)',
					'static-field-values-weight': 400,
					'static-field-values-style': 'normal',
					'static-field-values-line-height': 1,
					'static-field-values-font-style': '400 normal',
					'hover-field-values-font-size': 12,
					'hover-field-values-font-family': 'Arial',
					'hover-field-values-font-color': 'rgb(0, 0, 0)',
					'hover-field-values-weight': 400,
					'hover-field-values-style': 'normal',
					'hover-field-values-line-height': 1,
					'hover-field-values-font-style': '400 normal',
					'focus-field-values-font-size': 12,
					'focus-field-values-font-family': 'Arial',
					'focus-field-values-font-color': 'rgb(0, 0, 0)',
					'focus-field-values-weight': 400,
					'focus-field-values-style': 'normal',
					'focus-field-values-line-height': 1,
					'focus-field-values-font-style': '400 normal',
					'static-button-font-size': 12,
					'static-button-font-family': 'Arial',
					'static-button-font-color': 'rgb(0, 0, 0)',
					'static-button-weight': 400,
					'static-button-style': 'normal',
					'static-button-line-height': 1,
					'static-button-font-style': '400 normal',
					'hover-button-font-size': 12,
					'hover-button-font-family': 'Arial',
					'hover-button-font-color': 'rgb(0, 0, 0)',
					'hover-button-weight': 400,
					'hover-button-style': 'normal',
					'hover-button-line-height': 1,
					'hover-button-font-style': '400 normal',
					'focus-button-font-size': 12,
					'focus-button-font-family': 'Arial',
					'focus-button-font-color': 'rgb(0, 0, 0)',
					'focus-button-weight': 400,
					'focus-button-style': 'normal',
					'focus-button-line-height': 1,
					'focus-button-font-style': '400 normal',
					'hover-field-bg': 'rgb(255,255,255)',
					'hover-button-bg': 'rgb(0,0,0)',
					'hover-font-size': 14,
					'hover-font-family': 'Arial',
					'hover-font-color': 'rgb(96, 96, 96)',
					'hover-font-style': '400 normal',
					'hover-weight': 400,
					'hover-style': 'normal',
					'hover-line-height': 1,
					'hover-useborder': '',
					'hover-borderwidth': 1,
					'hover-bordertype': 'solid',
					'hover-bordercolor': 'rgb(0, 0, 0)',
					'hover-transition-duration': 0.3,
					'hover-transition-easing': 'ease-in-out',
					'focus-field-bg': 'rgb(255,255,255)',
					'focus-button-bg': 'rgb(0,0,0)',
					'focus-font-size': 14,
					'focus-font-family': 'Arial',
					'focus-font-color': 'rgb(96, 96, 96)',
					'focus-font-style': '400 normal',
					'focus-weight': 400,
					'focus-style': 'normal',
					'focus-line-height': 1,
					'focus-useborder': '',
					'focus-borderwidth': 1,
					'focus-bordertype': 'solid',
					'focus-bordercolor': 'rgb(0, 0, 0)',
					'static-field-button-useborder': '',
					'static-field-button-borderwidth': 1,
					'static-field-button-bordertype': 'solid',
					'static-field-button-bordercolor': 'rgb(0, 0, 0)',
					'hover-field-button-useborder': '',
					'hover-field-button-borderwidth': 1,
					'hover-field-button-bordertype': 'solid',
					'hover-field-button-bordercolor': 'rgb(0, 0, 0)',
					'focus-field-button-useborder': '',
					'focus-field-button-borderwidth': 1,
					'focus-field-button-bordertype': 'solid',
					'focus-field-button-bordercolor': 'rgb(0, 0, 0)',
					'static-field-useborder': '',
					'static-field-borderwidth': 1,
					'static-field-bordertype': 'solid',
					'static-field-bordercolor': 'rgb(0, 0, 0)',
					'hover-field-useborder': '',
					'hover-field-borderwidth': 1,
					'hover-field-bordertype': 'solid',
					'hover-field-bordercolor': 'rgb(0, 0, 0)',
					'focus-field-useborder': '',
					'focus-field-borderwidth': 1,
					'focus-field-bordertype': 'solid',
					'focus-field-bordercolor': 'rgb(0, 0, 0)',
					'static-button-useborder': '',
					'static-button-borderwidth': 1,
					'static-button-bordertype': 'solid',
					'static-button-bordercolor': 'rgb(0, 0, 0)',
					'hover-button-useborder': '',
					'hover-button-borderwidth': 1,
					'hover-button-bordertype': 'solid',
					'hover-button-bordercolor': 'rgb(0, 0, 0)',
					'focus-button-useborder': '',
					'focus-button-borderwidth': 1,
					'focus-button-bordertype': 'solid',
					'focus-button-bordercolor': 'rgb(0, 0, 0)',
					'id': 'default',
					'name': l10n.default_preset
				},
				styleTpl: styleTpl,
				stateModules: {
					Static: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: false,
								abccolors: [
									{
										name: 'static-field-bg',
										label: l10n.field_bg_label
									},
									{
										name: 'static-button-bg',
										label: l10n.button_bg_label
									},
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.typography_label,
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
									{ label: l10n.field_labels_label, value: "field-labels" },
									{ label: l10n.field_values_label, value: "field-values" },
									{ label: l10n.button_label, value: "button" },
								],
							}
						},
						{
							moduleType: 'Border',
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
									{label: l10n.field_button_label, value: 'field-button'},
									{label: l10n.field_label, value: 'field'},
									{label: l10n.button_label, value: 'button'}
								]
							}
						}
					],

					Hover: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: false,
								toggle: true,
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-use-color',
								},
								abccolors: [
									{
										name: 'hover-field-bg',
										label: l10n.field_bg_label
									},
									{
										name: 'hover-button-bg',
										label: l10n.button_bg_label
									},
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.typography_label,
								state: 'hover',
								toggle: true,
								prepend: 'hover-',
								prefix: 'static',
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
									{ label: l10n.field_labels_label, value: "field-labels" },
									{ label: l10n.field_values_label, value: "field-values" },
									{ label: l10n.button_label, value: "button" },
								],
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'hover',
								title: '',
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-useborder',
									width: 'hover-borderwidth',
									type: 'hover-bordertype',
									color: 'hover-bordercolor',
								},
								default_element: 'field-button',
								elements: [
									{label: l10n.field_button_label, value: 'field-button'},
									{label: l10n.field_label, value: 'field'},
									{label: l10n.button_label, value: 'button'}
								]
							}
						},
						{
							moduleType: 'HovAnimation',
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
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: false,
								toggle: true,
								prepend: 'focus-',
								prefix: 'static',
								fields: {
									use: 'focus-use-color',
								},
								abccolors: [
									{
										name: 'focus-field-bg',
										label: l10n.field_bg_label
									},
									{
										name: 'focus-button-bg',
										label: l10n.button_bg_label
									},
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.typography_label,
								state: 'focus',
								prepend: 'focus-',
								prefix: 'static',
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
									{ label: l10n.field_values_label, value: "field-values" },
									{ label: l10n.button_label, value: "button" },
								],
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'focus',
								title: '',
								prepend: 'focus-',
								prefix: 'static',
								fields: {
									use: 'focus-useborder',
									width: 'focus-borderwidth',
									type: 'focus-bordertype',
									color: 'focus-bordercolor',
								},
								default_element: 'field-button',
								elements: [
									{label: l10n.field_button_label, value: 'field-button'},
									{label: l10n.field_label, value: 'field'},
									{label: l10n.button_label, value: 'button'}
								]
							}
						}
					]
				}
			}
		},
		title: 'Contact Element'
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('contact', styleTpl);

	return ContactFormSettings;
});
