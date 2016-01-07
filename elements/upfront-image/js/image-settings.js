define([
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/element-settings/settings',
	'text!elements/upfront-image/tpl/preset-style.html'
], function(Util, ElementSettings, styleTpl) {
	var l10n = Upfront.Settings.l10n.image_element;

	var ImageSettings = ElementSettings.extend({
		panels: {
			Appearance: {
				mainDataCollection: 'imagePresets',
				styleElementPrefix: 'image-preset',
				ajaxActionSlug: 'image',
				panelTitle: l10n.settings,
				presetDefaults: {
					'image-style': 'default',
					'useradius': '',
					'borderradiuslock': 'yes',
					'borderradius1': 5,
					'borderradius2': 5,
					'borderradius3': 5,
					'borderradius4': 5,
					'useborder': '',
					'bordertype': 'solid',
					'borderwidth': 1,
					'bordercolor': 'rgb(0, 0, 0)',
					'caption-text': 'rgba(0, 0, 0, 0.9)',
					'caption-bg': 'rgba(255, 255, 255, 0.8)',
					'use_captions': '',
					'caption-position-value': 'nocaption',
					'caption-trigger': 'hover_show',
					'caption-position': 'over_image',
					'caption-alignment': 'bottom',
					'id': 'default',
					'name': l10n.default_preset
				},
				styleTpl: styleTpl,
				stateModules: {
					Global: [
						{
							moduleType: 'Selectbox',
							options: {
								state: 'global',
								default_value: 'default',
								title: l10n.settings.image_style_label,
								custom_class: 'image_style',
								label: l10n.settings.image_style_info,
								fields: {
									name: 'imagestyle'
								},
								values: [
									{ label: "Default", value: 'default' },
									{ label: "Square", value: 'square' },
								]
							}
						},
						{
							moduleType: 'Radius',
							options: {
								state: 'global',
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
										selector: '.upfront-image-caption-container'
									}
								}
							}
						},
						{
							moduleType: 'CaptionLocation',
							options: {
								state: 'global',
								fields: {
									caption: 'image-caption'
								}
							}
						},
						{
							moduleType: 'Colors',
							options: {
								title: l10n.settings.content_area_colors_label,
								multiple: false,
								single: false,
								abccolors: [
									{
										name: 'caption-text',
										label: l10n.settings.caption_text_label
									},
									{
										name: 'caption-bg',
										label: l10n.settings.caption_bg_label
									},
								],
								selectorsForCssCheck: {
									'caption-text': {
										selector: '.upfront-image-caption-container .wp-caption',
										cssProperty: 'color'
									},
									'caption-bg': {
										selector: '.upfront-image-caption-container .wp-caption',
										cssProperty: 'background-color'
									},
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'global',
								title: '',
								fields: {
									use: 'useborder',
									width: 'borderwidth',
									type: 'bordertype',
									color: 'bordercolor',
								},
								selectorsForCssCheck: {
									all: '.upfront-image-caption-container'
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
	Util.generatePresetsToPage('image', styleTpl);

	return ImageSettings;
});
