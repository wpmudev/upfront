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
						change : function(value, parent){
							parent.model.set_property("form_label_position", value);
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
				presetDefaults: Upfront.mainData.presetDefaults.contact,
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
								state: 'static-fields',
								title: '',
								label: 'Fields Border',
								fields: {
									use: 'static-fields-useborder',
									width: 'static-fields-borderwidth',
									type: 'static-fields-bordertype',
									color: 'static-fields-bordercolor',
								},
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'static-button',
								title: '',
								label: 'Button Border',
								fields: {
									use: 'static-button-useborder',
									width: 'static-button-borderwidth',
									type: 'static-button-bordertype',
									color: 'static-button-bordercolor',
								},
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
								state: 'hover-fields',
								title: '',
								label: 'Fields Border',
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-fields-useborder',
									width: 'hover-fields-borderwidth',
									type: 'hover-fields-bordertype',
									color: 'hover-fields-bordercolor',
								},
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'hover-button',
								title: '',
								label: 'Button Border',
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-button-useborder',
									width: 'hover-button-borderwidth',
									type: 'hover-button-bordertype',
									color: 'hover-button-bordercolor',
								},
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
								state: 'focus-fields',
								title: '',
								label: 'Fields Border',
								prepend: 'focus-',
								prefix: 'static',
								fields: {
									use: 'focus-fields-useborder',
									width: 'focus-fields-borderwidth',
									type: 'focus-fields-bordertype',
									color: 'focus-fields-bordercolor',
								},
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'focus-button',
								title: '',
								label: 'Button Border',
								prepend: 'focus-',
								prefix: 'static',
								fields: {
									use: 'focus-button-useborder',
									width: 'focus-button-borderwidth',
									type: 'focus-button-bordertype',
									color: 'focus-button-bordercolor',
								},
							}
						}
					]
				},
				
				migrateDefaultStyle: function(styles) {
					//replace image wrapper class
					styles = styles.replace(/(div)?\.upfront-contact-form\s/g, '');
					styles = styles.replace(/(div)?\.upfront-object\s/g, '');

					return styles;
				},
			}
		},
		title: 'Contact Element'
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('contact', styleTpl);

	return ContactFormSettings;
});
