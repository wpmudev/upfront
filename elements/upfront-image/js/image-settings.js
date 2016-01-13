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
				presetDefaults: Upfront.mainData.presetDefaults.image,
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
								]
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
				},
				
				migratePresetProperties: function(newPreset) {
					var props = {},
						useCaption = '';

					this.model.get('properties').each( function(prop) {
						props[prop.get('name')] = prop.get('value');
					});
					
					if(props.caption_position && props.caption_trigger) {
						useCaption = 'yes';
					}

					newPreset.set({
						'use_captions': useCaption,
						'caption-position-value': props.caption_position,
						'caption-position': props.caption_position,
						'caption-alignment': props.caption_alignment,
						'caption-trigger': props.caption_trigger,
						'caption-bg' : props.background,
					});
				},
			}
		},
		
		title: l10n.settings.label
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('image', styleTpl);

	return ImageSettings;
});
