define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-button/tpl/preset-style.html',
], function(ElementSettings, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.button_element;

	var ButtonSettings = ElementSettings.extend({
		panels: {
			Appearance: {
				mainDataCollection: 'buttonPresets',
				styleElementPrefix: 'button-preset',
				ajaxActionSlug: 'button',
				panelTitle: l10n.settings,
				styleTpl: styleTpl,
				presetDefaults: {
					'useborder': 'yes',
					'bordertype': 'solid',
					'borderwidth': 4,
					'bordercolor': 'rgb(66, 127, 237)',
					'useradius': 'yes',
					'borderradiuslock': 'yes',
					'borderradius1': 100,
					'borderradius2': 100,
					'borderradius3': 100,
					'borderradius4': 100,
					'bgcolor': 'rgb(255, 255, 255)',
					'fontsize': 16,
					'fontface': 'Arial',
					'fontstyle': '600 normal',
					'fontstyle_weight': '600',
					'fontstyle_style': 'normal',
					'lineheight': 3,
					'color': 'rgb(66, 127, 237)',
					'hov_bordertype': 'solid',
					'hov_borderwidth': 4,
					'hov_bordercolor': 'rgb(66, 127, 237)',
					'hov_borderradiuslock': 'yes',
					'hov_borderradius1': 100,
					'hov_borderradius2': 100,
					'hov_borderradius3': 100,
					'hov_borderradius4': 100,
					'hov_bgcolor': 'rgb(66, 127, 237)',
					'hov_fontsize': 16,
					'hov_fontface': 'Arial',
					'hov_fontstyle': '600 normal',
					'hov_fontstyle_weight': '600',
					'hov_fontstyle_style': 'normal',
					'hov_lineheight': 3,
					'hov_color': 'rgb(255, 255, 255)',
					'hov_duration': 0.25,
					'hov_transition': 'linear',
					'hov_duration': 0.3,
					'hov_easing': 'ease-in-out',
					'focus_bordertype': 'solid',
					'focus_borderwidth': 4,
					'focus_bordercolor': 'rgb(66, 127, 237)',
					'focus_borderradiuslock': 'yes',
					'focus_borderradius1': 100,
					'focus_borderradius2': 100,
					'focus_borderradius3': 100,
					'focus_borderradius4': 100,
					'focus_bgcolor': 'rgb(66, 127, 237)',
					'focus_fontsize': 16,
					'focus_fontface': 'Arial',
					'focus_fontstyle': '600 normal',
					'focus_fontstyle_weight': '600',
					'focus_fontstyle_style': 'normal',
					'focus_lineheight': 3,
					'focus_color': 'rgb(255, 255, 255)',
					'id': 'default',
					'name': l10n.default_preset
				},
				stateModules: {
					Static: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.settings.colors_label,
								multiple: false,
								single: true,
								abccolors: [
									{
										name: 'bgcolor',
										label: l10n.settings.button_bg_label
									},
								],
								selectorsForCssCheck: {
									'bgcolor': {
										selector: '.upfront_cta',
										cssProperty: 'background-color'
									}
								},
								fields: {
									use: 'usebgcolor'
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'static',
								title: l10n.settings.typography_label,
								fields: {
									typeface: 'fontface',
									fontstyle: 'fontstyle',
									weight: 'fontstyle_weight',
									style: 'fontstyle_style',
									size: 'fontsize',
									line_height: 'lineheight',
									color: 'color',
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.upfront_cta'
									}
								}
							}
						},
						{
							moduleType: 'Radius',
							options: {
								state: 'static',
								max_value: 100,
								fields: {
									use: 'useradius',
									lock: 'borderradiuslock',
									radius: 'radius',
									radius_number: 'radius_number',
									radius1: 'borderradius1',
									radius2: 'borderradius2',
									radius3: 'borderradius3',
									radius4: 'borderradius4'
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.upfront_cta'
									}
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'static',
								fields: {
									use: 'useborder',
									width: 'borderwidth',
									type: 'bordertype',
									color: 'bordercolor',
								},
								selectorsForCssCheck: {
									all: '.upfront_cta'
								}
							}
						}
					],
					Hover: [
						{
							moduleType: 'Colors',
							options: {
								state: 'hover',
								title: l10n.settings.colors_label,
								multiple: false,
								toggle: true,
								single: true,
								prepend: 'hov_',
								abccolors: [
									{
										name: 'hov_bgcolor',
										label: l10n.settings.button_bg_label
									},
								],
								fields: {
									use: 'hov_usebgcolor'
								},
								selectorsForCssCheck: {
									'hov_usebgcolor': {
										selector: '.live-preview-hover .upfront_cta',
										cssProperty: 'background-color'
									}
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'hover',
								title: l10n.settings.typography_label,
								toggle: true,
								prepend: 'hov_',
								fields: {
									typeface: 'hov_fontface',
									fontstyle: 'hov_fontstyle',
									weight: 'hov_fontstyle_weight',
									style: 'hov_fontstyle_style',
									size: 'hov_fontsize',
									line_height: 'hov_lineheight',
									color: 'hov_color',
									use: 'hov_usetypography'
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.live-preview-hover .upfront_cta'
									}
								}
							}
						},
						{
							moduleType: 'Radius',
							options: {
								state: 'hover',
								max_value: 100,
								prepend: 'hov_',
								fields: {
									use: 'hov_useradius',
									lock: 'hov_borderradiuslock',
									radius: 'hov_radius',
									radius_number: 'hov_radius_number',
									radius1: 'hov_borderradius1',
									radius2: 'hov_borderradius2',
									radius3: 'hov_borderradius3',
									radius4: 'hov_borderradius4'
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.live-preview-hover .upfront_cta'
									}
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'hover',
								prepend: 'hov_',
								fields: {
									use: 'hov_useborder',
									width: 'hov_borderwidth',
									type: 'hov_bordertype',
									color: 'hov_bordercolor',
								},
								selectorsForCssCheck: {
									all: '.live-preview-hover .upfront_cta'
								}
							}
						},
						{
							moduleType: 'HovAnimation',
							options: {
								state: 'hover',
								title: '',
								toggle: true,
								fields: {
									use: 'hov_use_animation',
									duration: 'hov_duration',
									easing: 'hov_transition',
								}
							}
						}
					],
					Focus: [
						{
							moduleType: 'Colors',
							options: {
								state: 'focus',
								title: l10n.settings.colors_label,
								multiple: false,
								toggle: true,
								single: true,
								prepend: 'focus_',
								abccolors: [
									{
										name: 'focus_bgcolor',
										label: l10n.settings.button_bg_label
									},
								],
								fields: {
									use: 'focus_usebgcolor'
								},
								selectorsForCssCheck: {
									'focus_bgcolor': {
										selector: '.live-preview-focus .upfront_cta',
										cssProperty: 'background-color'
									}
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'focus',
								title: l10n.settings.typography_label,
								toggle: true,
								prepend: 'focus_',
								fields: {
									typeface: 'focus_fontface',
									fontstyle: 'focus_fontstyle',
									weight: 'focus_fontstyle_weight',
									style: 'focus_fontstyle_style',
									size: 'focus_fontsize',
									line_height: 'focus_lineheight',
									color: 'focus_color',
									use: 'focus_usetypography'
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.live-preview-focus .upfront_cta'
									}
								}
							}
						},
						{
							moduleType: 'Radius',
							options: {
								state: 'focus',
								max_value: 100,
								prepend: 'focus_',
								fields: {
									use: 'focus_useradius',
									lock: 'focus_borderradiuslock',
									radius: 'focus_radius',
									radius_number: 'focus_radius_number',
									radius1: 'focus_borderradius1',
									radius2: 'focus_borderradius2',
									radius3: 'focus_borderradius3',
									radius4: 'focus_borderradius4'
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.live-preview-focus .upfront_cta'
									}
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'focus',
								prepend: 'focus_',
								fields: {
									use: 'focus_useborder',
									width: 'focus_borderwidth',
									type: 'focus_bordertype',
									color: 'focus_bordercolor',
								},
								selectorsForCssCheck: {
									all: '.live-preview-focus .upfront_cta'
								}
							}
						}
					]
				}
			}
		},
		title: l10n.settings.label
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('button', styleTpl);

	return ButtonSettings;
});
