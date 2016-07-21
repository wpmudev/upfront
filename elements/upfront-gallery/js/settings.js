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
				presetDefaults: Upfront.mainData.presetDefaults.gallery,
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
									}
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
									color: 'bordercolor'
								}
							}
						}
					]
				},

				migrateDefaultStyle: function(styles) {
					//replace image wrapper class
					styles = styles.replace(/(div)?\.upfront-gallery\s/g, '');
					styles = styles.replace(/(div)?\.upfront-object\s/g, '');

					return styles;
				},

				migratePresetProperties: function(newPreset) {
					var props = {},
						useCaption = '',
						caption_height = 'auto';

					this.model.get('properties').each( function(prop) {
						props[prop.get('name')] = prop.get('value');
					});

					if(typeof props.fitThumbCaptions[0] !== "undefined" && props.fitThumbCaptions[0]) {
						caption_height = 'fixed';
					}

					if(typeof props.captionType !== "undefined" && props.captionType !== "none") {
						useCaption = 'yes';
					}

					newPreset.set({
						'use_captions': useCaption,
						'captionType': props.captionType,
						'showCaptionOnHover': props.showCaptionOnHover && props.showCaptionOnHover[0] && props.showCaptionOnHover[0] === "true" ? '1' : '0',
						'caption-height': caption_height,
						'thumbCaptionsHeight': props.thumbCaptionsHeight,
						'caption-bg': props.captionBackground,
						'caption-text': props.captionColor
					});
				}
			}
		},
		title: l10n.settings
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('gallery', presetTpl);

	return UgallerySettings;
});
