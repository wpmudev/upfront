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
					'static-font-size': 18,
					'static-font-family': 'Arial',
					'static-font-color': 'rgb(96, 96, 96)',
					'static-font-style': '400 normal',
					'static-weight': 400,
					'static-style': 'normal',
					'static-line-height': 2,
					'static-header-bg-color': 'rgba(232, 232, 232, 1)',
					'static-triangle-icon-color': 'rgbа(0, 0, 0, 1)',
					'static-useborder': '',
					'static-borderwidth': 1,
					'static-bordertype': 'solid',
					'static-bordercolor': 'rgbа(0, 0, 0, 0.5)',
					'hover-font-size': 18,
					'hover-font-family': 'Arial',
					'hover-font-color': 'rgb(128, 128, 128)',
					'hover-font-style': '400 normal',
					'hover-weight': 400,
					'hover-style': 'normal',
					'hover-line-height': 2,
					'hover-header-bg-color': 'rgba(232, 232, 232, 1)',
					'hover-triangle-icon-color': 'rgbа(0, 0, 0, 1)',
					'hover-useborder': '',
					'hover-borderwidth': 1,
					'hover-bordertype': 'solid',
					'hover-bordercolor': 'rgbа(0, 0, 0, 0.5)',
					'hover-transition-duration': 0.3,
					'hover-transition-easing': 'ease-in-out',
					'active-font-size': 18,
					'active-font-family': 'Arial',
					'active-font-color': 'rgb(128, 128, 128)',
					'active-font-style': '400 normal',
					'active-weight': 400,
					'active-style': 'normal',
					'active-line-height': 2,
					'active-header-bg-color': 'rgba(232, 232, 232, 1)',
					'active-triangle-icon-color': 'rgbа(0, 0, 0, 1)',
					'active-useborder': '',
					'active-borderwidth': 1,
					'active-bordertype': 'solid',
					'active-bordercolor': 'rgbа(0, 0, 0, 0.5)',
					'active-use-color': 1,
					'active-use-typography': 1,
					'global-useborder': '',
					'global-borderwidth': 2,
					'global-bordertype': 'solid',
					'global-bordercolor': 'rgbа(0, 0, 0, 0.5)',
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
								],
								selectorsForCssCheck: {
									'active-content-bg-color': {
										selector: '.accordion-panel-content',
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
									all: '.accordion-panel-content'
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
								],
								selectorsForCssCheck: {
									'static-header-bg-color': {
										selector: '.accordion-panel:not(.accordion-panel-active) .accordion-panel-title',
										cssProperty: 'background-color'
									},
									'static-triangle-icon-color': {
										skipCheck: true
									}
								}
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
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.accordion-panel:not(.accordion-panel-active) .accordion-panel-title'
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
									all: '.accordion-panel-title'
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
								prefix: 'static',
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
								],
								selectorsForCssCheck: {
									'hover-header-bg-color': {
										selector: '.live-preview-hover .accordion-panel-title',
										cssProperty: 'background-color'
									},
									'hover-triangle-icon-color': {
										skipCheck: true
									}
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'hover',
								toggle: true,
								prepend: 'hover-',
								prefix: 'static',
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
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.live-preview-hover .accordion-panel-title'
									}
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
								},
								selectorsForCssCheck: {
									all: '.live-preview-hover .accordion-panel-title'
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
								prefix: 'static',
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
								],
								selectorsForCssCheck: {
									'active-header-bg-color': {
										selector: '.accordion-panel-active .accordion-panel-title',
										cssProperty: 'background-color'
									},
									'active-triangle-icon-color': {
										skipCheck: true
									}
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'active',
								toggle: true,
								prepend: 'active-',
								prefix: 'static',
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
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.accordion-panel-active .accordion-panel-title'
									}
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
								},
								selectorsForCssCheck: {
									all: '.accordion-panel-active .accordion-panel-title'
								}
							}
						}
					]
				}
			}
		},
		title: 'Accordion Settings'
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('accordion', styleTpl);

	return AccordionSettings;
});
