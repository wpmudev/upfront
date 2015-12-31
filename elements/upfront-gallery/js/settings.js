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
					'borderradius1': 5,
					'borderradius2': 5,
					'borderradius3': 5,
					'borderradius4': 5,
					'caption-text': 'rgba(0, 0, 0, 1)',
					'caption-bg': 'rgba(255, 255, 255, 0.8)',
					'useborder': '',
					'bordertype': 'solid',
					'borderwidth': 3,
					'bordercolor': 'rgba(0, 0, 0, 0.5)',
					'use_captions': '',
					'captionType': 'over',
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
								},
								selectorsForCssCheck: {
									'all': {
										selector: '.ugallery_item_image'
									}
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
								],
								selectorsForCssCheck: {
									'caption-text': {
										selector: '.ugallery-thumb-title',
										cssProperty: 'color'
									},
									'caption-bg': {
										selector: '.ugallery-thumb-title',
										cssProperty: 'background-color'
									},
								}
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
								},
								selectorsForCssCheck: {
									all: '.ugallery_item_image'
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

