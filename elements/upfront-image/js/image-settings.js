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
									{ label: "Square", value: 'square' }
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
								single: true,
								abccolors: [
									{
										name: 'caption-text',
										label: l10n.settings.caption_text_label
									},
									{
										name: 'caption-bg',
										label: l10n.settings.caption_bg_label
									}
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
									color: 'bordercolor'
								}
							}
						}
					]
				},

				migrateElementStyle: function(styles, selector) {
					//replace image wrapper class
					styles = styles.replace(/\.upfront-image/g, '.upfront-image-wrapper');
					styles = styles.replace(/\.upfront-image-wrapper-container/g, '.upfront-image-container');

					return styles;
				},

				migrateDefaultStyle: function(styles) {
					//replace image wrapper class
					styles = styles.replace(/(div)?\.upfront-image\s/g, '');
					styles = styles.replace(/(div)?\.upfront-object\s/g, '');

					return styles;
				},

				migratePresetProperties: function(newPreset) {
					var props = {},
						useCaption = '',
						captionValue = ''
					;

					this.model.get('properties').each( function(prop) {
						props[prop.get('name')] = prop.get('value');
					});

					if(props.caption_position && props.caption_trigger) {
						useCaption = 'yes';
					}

					//Determinate caption value from settings
					if(props.caption_position === 'over_image' && props.caption_alignment === 'top') {
						captionValue = 'topOver';
					} else if(props.caption_position === 'over_image' && props.caption_alignment === 'bottom') {
						captionValue = 'bottomOver';
					} else if(props.caption_position === 'over_image' && props.caption_alignment === 'fill') {
						captionValue = 'topCover';
					} else if(props.caption_position === 'over_image' && props.caption_alignment === 'fill_middle') {
						captionValue = 'middleCover';
					} else if(props.caption_position === 'below_image' && props.caption_alignment === 'fill_bottom') {
						captionValue = 'bottomCover';
					} else {
						captionValue = 'below';
					}

					newPreset.set({
						'use_captions': useCaption,
						'caption-position-value': captionValue,
						'caption-position': props.caption_position,
						'caption-alignment': props.caption_alignment,
						'caption-trigger': props.caption_trigger,
						'caption-bg' : props.background
					});
				},

				getModifiedProperties: function() {
					var props = {};

					this.model.get('properties').each( function(prop) {
						props[prop.get('name')] = prop.get('value');
					});

					if(typeof props.theme_style !== "undefined" && (props.theme_style !== "_default" && props.theme_style !== "" && props.theme_style !== " ")) {
						return true;
					}

					if((typeof props.caption_position !== "undefined" && props.caption_position !== false) ||
					   (typeof props.caption_alignment !== "undefined" && props.caption_alignment !== false) ||
					   (typeof props.caption_trigger !== "undefined" && props.caption_trigger !== "always_show")) {
						return true;
					}

					if(typeof props.background !== "undefined" && props.background !== "#000000") {
						return true;
					}

					return false;
				}
			}
		},

		title: l10n.settings.label
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('image', styleTpl);

	return ImageSettings;
});
