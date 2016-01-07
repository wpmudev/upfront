define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-tabs/tpl/preset-style.html'
], function(ElementSettings, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.utabs_element;

	var TabsSettings = ElementSettings.extend({
		panels: {
			Appearance: {
				mainDataCollection: 'tabPresets',
				styleElementPrefix: 'tab-preset',
				ajaxActionSlug: 'tab',
				panelTitle: l10n.settings,
				presetDefaults: {
					'global-content-bg': 'rgba(255, 255, 255, 1)',
					'global-useborder': '',
					'global-borderwidth': 1,
					'global-bordertype': 'solid',
					'static-bordercolor': 'rgba(0, 0, 0, 0.5)',
					'static-font-size': 18,
					'static-font-family': 'Arial',
					'static-font-color': 'rgba(0, 0, 0, 0.6)',
					'static-font-style': '400 normal',
					'static-weight': 400,
					'static-style': 'normal',
					'static-line-height': 2,
					'static-tab-bg': 'rgba(255, 255, 255, .8)',
					'static-useborder': '',
					'static-borderwidth': 1,
					'static-bordertype': 'solid',
					'hover-bordercolor': 'rgba(0, 0, 0, 0.5)',
					'hover-font-size': 18,
					'hover-font-family': 'Arial',
					'hover-font-color': 'rgba(0, 0, 0, 0.6)',
					'hover-font-style': '400 normal',
					'hover-weight': 400,
					'hover-style': 'normal',
					'hover-line-height': 2,
					'hover-tab-bg': 'rgba(255, 255, 255, .8)',
					'hover-useborder': '',
					'hover-borderwidth': 1,
					'hover-bordertype': 'solid',
					'hover-transition-duration': 0.3,
					'hover-transition-easing': 'ease-in-out',
					'active-bordercolor': 'rgba(0, 0, 0, 0.5)',
					'active-font-size': 18,
					'active-font-family': 'Arial',
					'active-font-color': 'rgba(0, 0, 0, 0.6)',
					'active-font-style': '400 normal',
					'active-weight': 400,
					'active-style': 'normal',
					'active-line-height': 2,
					'active-tab-bg': 'rgba(255, 255, 255, .8)',
					'active-useborder': '',
					'active-borderwidth': 1,
					'active-bordertype': 'solid',
					'id': 'default',
					'name': l10n.default_preset
				},
				styleTpl: styleTpl,
				stateModules: {
					Global: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.content_area_colors_label,
								multiple: false,
								single: true,
								abccolors: [
									{
										name: 'global-content-bg',
										label: l10n.content_area_bg_label
									},
								],
								selectorsForCssCheck: {
									'global-content-bg': {
										selector: '.utabs-content',
										cssProperty: 'background-color'
									}
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'static',
								title: '',
								fields: {
									use: 'global-useborder',
									width: 'global-borderwidth',
									type: 'global-bordertype',
									color: 'global-bordercolor',
								},
								selectorsForCssCheck: {
									all: '.utabs-content'
								}
							}
						}
					],
					Static: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: true,
								abccolors: [
									{
										name: 'static-tab-bg',
										label: l10n.tab_bg_label
									},
								],
								selectorsForCssCheck: {
									'static-tab-bg': {
										selector: '.tabs-tab .inner-box',
										cssProperty: 'background-color'
									}
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.tab_typography_label,
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
								selectorsForCssCheck: {
									'all': {
										selector: '.tabs-tab .inner-box'
									}
								}
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
								selectorsForCssCheck: {
									all: '.tabs-tab'
								}
							}
						}
					],

					Hover: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: true,
								toggle: true,
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-use-color',
								},
								abccolors: [
									{
										name: 'hover-tab-bg',
										label: l10n.tab_bg_label
									},
								],
								selectorsForCssCheck: {
									'hover-tab-bg': {
										selector: '.live-preview-hover .tabs-tab .inner-box',
										cssProperty: 'background-color'
									}
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.tab_typography_label,
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
								}
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
									use: 'hover-use-transition',
									duration: 'hover-transition-duration',
									easing: 'hover-transition-easing',
								}
							}
						}
					],

					Active: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: true,
								toggle: true,
								prepend: 'active-',
								prefix: 'static',
								fields: {
									use: 'active-use-color',
							},
							abccolors: [
							{
								name: 'active-tab-bg',
								label: l10n.tab_bg_label
							},
						],
						selectorsForCssCheck: {
							'active-tab-bg': {
								selector: '.live-preview-active .tabs-tab .inner-box',
								cssProperty: 'background-color'
							}
						}
					}
				},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.tab_typography_label,
								state: 'active',
								toggle: true,
								prepend: 'active-',
								prefix: 'static',
								fields: {
									use: 'active-use-typography',
									typeface: 'active-font-family',
									fontstyle: 'active-font-style',
									weight: 'active-weight',
									style: 'active-style',
									size: 'active-font-size',
									line_height: 'active-line-height',
									color: 'active-font-color',
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'active',
								title: '',
								prepend: 'active-',
								prefix: 'static',
								fields: {
									use: 'active-useborder',
									width: 'active-borderwidth',
									type: 'active-bordertype',
									color: 'active-bordercolor',
								}
							}
						}
					]
				}
			}
		},
		title: l10n.settings
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('tab', styleTpl);

	return TabsSettings;
});
