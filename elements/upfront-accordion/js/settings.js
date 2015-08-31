define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-accordion/tpl/preset-style.html'
], function(ElementSettings, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.accordion_element;

	var AccordionSettings = ElementSettings.extend({
		panels: {
			Appearance: {
				mainDataCollection: 'accordionPresets',
				styleElementPrefix: 'accordion-preset',
				ajaxActionSlug: 'accordion',
				panelTitle: l10n.settings,
				styleTpl: styleTpl,
				presetDefaults: {
					'static-font-size': 14,
					'static-font-family': 'Arial',
					'static-font-color': 'rgb(96, 96, 96)',
					'static-font-style': '400 normal',
					'static-weight': 400,
					'static-style': 'normal',
					'static-line-height': 1,
					'static-header-bg-color': 'rgb(0, 0, 0)',
					'static-triangle-icon-color': 'rgb(255, 255, 255)',
					'static-useborder': '',
					'static-borderwidth': 1,
					'static-bordertype': 'solid',
					'static-bordercolor': 'rgb(0, 0, 0)',
					'hover-font-size': 14,
					'hover-font-family': 'Arial',
					'hover-font-color': 'rgb(128, 128, 128)',
					'hover-font-style': '400 normal',
					'hover-weight': 400,
					'hover-style': 'normal',
					'hover-line-height': 1,
					'hover-header-bg-color': 'rgb(0, 0, 0)',
					'hover-triangle-icon-color': 'rgb(255, 255, 255)',
					'hover-useborder': '',
					'hover-borderwidth': 1,
					'hover-bordertype': 'solid',
					'hover-bordercolor': 'rgb(0, 0, 0)',
					'hover-transition-duration': 0.3,
					'hover-transition-easing': 'ease-in-out',
					'active-font-size': 14,
					'active-font-family': 'Arial',
					'active-font-color': 'rgb(128, 128, 128)',
					'active-font-style': '400 normal',
					'active-weight': 400,
					'active-style': 'normal',
					'active-line-height': 1,
					'active-header-bg-color': 'rgb(0, 0, 0)',
					'active-triangle-icon-color': 'rgb(255, 255, 255)',
					'active-useborder': '',
					'active-borderwidth': 1,
					'active-bordertype': 'solid',
					'active-bordercolor': 'rgb(0, 0, 0)',
					'global-useborder': '',
					'global-borderwidth': 1,
					'global-bordertype': 'solid',
					'global-bordercolor': 'rgb(0, 0, 0)',
					'id': 'default',
					'name': l10n.default_preset
				},
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
										name: 'active-content-bg-color',
										label: l10n.content_area_bg_label
									},
								]
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
								}
							}
						}
					],
					Static: [
						{
							moduleType: 'Colors',
							toggle: false,
							options: {
								title: l10n.colors_label,
								abccolors: [
									{
										name: 'static-header-bg-color',
										label: l10n.header_bg_label
									},
									{
										name: 'static-triangle-icon-color',
										label: l10n.triangle_icon_label
									}
								]
							}
						},
						{
							moduleType: 'Typography',
							toggle: false,
							options: {
								state: 'static',
								title: l10n.typography_tab_label,
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
							moduleType: 'Border',
							options: {
								state: 'static',
								title: '',
								fields: {
									use: 'static-useborder',
									width: 'static-borderwidth',
									type: 'static-bordertype',
									color: 'static-bordercolor',
								}
							}
						}
					],
					Hover: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.colors_label,
								toggle: true,
								prepend: 'hover-',
								fields: {
									use: 'hover-use-colors'
								},
								abccolors: [
									{
										name: 'hover-header-bg-color',
										label: l10n.header_bg_label
									},
									{
										name: 'hover-triangle-icon-color',
										label: l10n.triangle_icon_label
									}
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'hover',
								toggle: true,
								prepend: 'hover-',
								title: l10n.typography_tab_label,
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
									use: 'hover-use-animation',
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
								toggle: true,
								prepend: 'active-',
								fields: {
									use: 'active-use-color'
								},
								abccolors: [
									{
										name: 'active-header-bg-color',
										label: l10n.header_bg_label
									},
									{
										name: 'active-triangle-icon-color',
										label: l10n.triangle_icon_label
									}
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'active',
								toggle: true,
								prepend: 'active-',
								title: l10n.typography_tab_label,
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
		title: 'Accordion Settings'
	});

	return AccordionSettings;
});
