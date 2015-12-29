define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-text/tpl/preset-style.html'
], function(ElementSettings, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.text_element;

	var TextSettings = ElementSettings.extend({
		panels: {
			Appearance: {
				mainDataCollection: 'textPresets',
				styleElementPrefix: 'text-preset',
				ajaxActionSlug: 'text',
				panelTitle: l10n.settings,
				presetDefaults: {
					'id': 'default',
					'name': l10n.default_preset,
					'bg_color': 'rgb(0, 0, 0, 0)',
					'useborder': '',
					'border_width': 2,
					'border_style': 'solid',
					'border_color': 'rgba(0, 0, 0, 1)',
					'usetypography': '',
					'fontface': 'Arial',
					'fontstyle': '400 normal',
					'weight': '400',
					'style': 'normal',
					'fontsize': 14,
					'lineheight': 1,
					'color': 'rgb(0, 0, 0)',
				},
				styleTpl: styleTpl,
				stateModules: {
					Global: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.settings.colors_label,
								multiple: false,
								single: true,
								abccolors: [
									{
										name: 'bg_color',
										label: l10n.settings.content_area_bg
									},
								],
								selectorsForCssCheck: {
									bg_color: {
										selector: '.plain-text-container',
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
									use: 'useborder',
									width: 'border_width',
									type: 'border_style',
									color: 'border_color',
								},
								selectorsForCssCheck: {
									all: '.plain-text-container'
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'static',
								title: l10n.settings.typography_label,
								toggle: true,
								global_typography: true,
								fields: {
									typeface: 'fontface',
									fontstyle: 'fontstyle',
									weight: 'weight',
									style: 'style',
									size: 'fontsize',
									line_height: 'lineheight',
									color: 'color',
									use: 'usetypography'
								},
								default_element: 'h1',
								elements: [
									{ label: l10n.h1, value: "h1" },
									{ label: l10n.h2, value: "h2" },
									{ label: l10n.h3, value: "h3" },
									{ label: l10n.h4, value: "h4" },
									{ label: l10n.h5, value: "h5" },
									{ label: l10n.h6, value: "h6" },
									{ label: l10n.p, value: "p" },
									{ label: l10n.a, value: "a" },
									{ label: l10n.ahover, value: "a-hover" },
									{ label: l10n.ul, value: "ul" },
									{ label: l10n.ol, value: "ol" },
									{ label: l10n.bq, value: "blockquote" },
									{ label: l10n.bqalt, value: "blockquote-alternative" },
								],
								selectorsForCssCheck: {
									all: {
										selector: '.plain-text-container'
									}
								}
							}
						},
					]
				}
			}
		},
		title: l10n.appearance
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('text', styleTpl);

	return TextSettings;
});
