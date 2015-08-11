define([
	'scripts/upfront/preset-settings/util',
	'elements/upfront-gallery/js/settings/thumbnail-fields',
	'scripts/upfront/element-settings/settings',
	'text!elements/upfront-gallery/tpl/preset-style.html'
], function(Util, ThumbnailFields, ElementSettings, presetTpl) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var UgallerySettings = ElementSettings.extend({
		panels: {
			Thumbnail: ThumbnailFields,
			Appearance: {
				mainDataCollection: 'galleryPresets',
				styleElementPrefix: 'gallery-preset',
				ajaxActionSlug: 'gallery',
				panelTitle: l10n.settings,
				presetDefaults: {
					'useradius': '',
					'borderradiuslock': 'yes',
					'borderradius1': 100,
					'borderradius2': 100,
					'borderradius3': 100,
					'borderradius4': 100,
					'caption-text': 'rgb(0, 0, 0)',
					'caption-bg': 'rgb(222, 222, 222)',
					'useborder': '',
					'bordertype': 'solid',
					'borderwidth': 1,
					'bordercolor': 'rgb(0, 0, 0)',
					'use_captions': 'yes',
					'captionType': 'nocaption',
					'showCaptionOnHover': 1,
					'caption-height': 'auto',
					'thumbCaptionsHeight': 20,
					'id': 'default',
					'name': l10n.default_preset
				},
				styleTpl: presetTpl,
				stateModules: {
					Global: [
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
								}
							}
						},
						{
							moduleType: 'Colors',
							options: {
								title: l10n.panel.content_area_label,
								multiple: false,
								single: false,
								abccolors: [
									{
										name: 'caption-text',
										label: l10n.panel.caption_text_label
									},
									{
										name: 'caption-bg',
										label: l10n.panel.caption_bg_label
									},
								]
							}
						},
						{
							moduleType: 'GalleryCaptionLocation',
							options: {
								state: 'global',
								fields: {
									caption: 'image-caption'
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
	Util.generatePresetsToPage('gallery', presetTpl);

	return UgallerySettings;
});

