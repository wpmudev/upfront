define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-button/tpl/preset-style.html',
], function(ElementSettings, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.button_element;

	var ButtonSettings = ElementSettings.extend({
		panels: {
			Appearance: {
				mainDataCollection: 'buttonPresets',
				styleElementPrefix: 'button-preset',
				ajaxActionSlug: 'button',
				panelTitle: l10n.settings,
				styleTpl: styleTpl,
				presetDefaults: Upfront.mainData.presetDefaults.button,
				stateModules: {
					Static: [
						{
							moduleType: 'Colors',
							options: {
								title: l10n.settings.colors_label,
								multiple: false,
								single: true,
								abccolors: [
									{
										name: 'bgcolor',
										label: l10n.settings.button_bg_label
									},
								],
								fields: {
									use: 'usebgcolor'
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'static',
								title: l10n.settings.typography_label,
								fields: {
									typeface: 'fontface',
									fontstyle: 'fontstyle',
									weight: 'fontstyle_weight',
									style: 'fontstyle_style',
									size: 'fontsize',
									line_height: 'lineheight',
									color: 'color',
								}
							}
						},
						{
							moduleType: 'Radius',
							options: {
								state: 'static',
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
							moduleType: 'Border',
							options: {
								state: 'static',
								fields: {
									use: 'useborder',
									width: 'borderwidth',
									type: 'bordertype',
									color: 'bordercolor',
								}
							}
						}
					],
					Hover: [
						{
							moduleType: 'Colors',
							options: {
								state: 'hover',
								title: l10n.settings.colors_label,
								multiple: false,
								toggle: true,
								single: true,
								prepend: 'hov_',
								abccolors: [
									{
										name: 'hov_bgcolor',
										label: l10n.settings.button_bg_label
									},
								],
								fields: {
									use: 'hov_usebgcolor'
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'hover',
								title: l10n.settings.typography_label,
								toggle: true,
								prepend: 'hov_',
								fields: {
									typeface: 'hov_fontface',
									fontstyle: 'hov_fontstyle',
									weight: 'hov_fontstyle_weight',
									style: 'hov_fontstyle_style',
									size: 'hov_fontsize',
									line_height: 'hov_lineheight',
									color: 'hov_color',
									use: 'hov_usetypography'
								}
							}
						},
						{
							moduleType: 'Radius',
							options: {
								state: 'hover',
								max_value: 100,
								prepend: 'hov_',
								fields: {
									use: 'hov_useradius',
									lock: 'hov_borderradiuslock',
									radius: 'hov_radius',
									radius_number: 'hov_radius_number',
									radius1: 'hov_borderradius1',
									radius2: 'hov_borderradius2',
									radius3: 'hov_borderradius3',
									radius4: 'hov_borderradius4'
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'hover',
								prepend: 'hov_',
								fields: {
									use: 'hov_useborder',
									width: 'hov_borderwidth',
									type: 'hov_bordertype',
									color: 'hov_bordercolor',
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
									use: 'hov_use_animation',
									duration: 'hov_duration',
									easing: 'hov_transition',
								}
							}
						}
					],
					Focus: [
						{
							moduleType: 'Colors',
							options: {
								state: 'focus',
								title: l10n.settings.colors_label,
								multiple: false,
								toggle: true,
								single: true,
								prepend: 'focus_',
								abccolors: [
									{
										name: 'focus_bgcolor',
										label: l10n.settings.button_bg_label
									},
								],
								fields: {
									use: 'focus_usebgcolor'
								}
							}
						},
						{
							moduleType: 'Typography',
							options: {
								state: 'focus',
								title: l10n.settings.typography_label,
								toggle: true,
								prepend: 'focus_',
								fields: {
									typeface: 'focus_fontface',
									fontstyle: 'focus_fontstyle',
									weight: 'focus_fontstyle_weight',
									style: 'focus_fontstyle_style',
									size: 'focus_fontsize',
									line_height: 'focus_lineheight',
									color: 'focus_color',
									use: 'focus_usetypography'
								}
							}
						},
						{
							moduleType: 'Radius',
							options: {
								state: 'focus',
								max_value: 100,
								prepend: 'focus_',
								fields: {
									use: 'focus_useradius',
									lock: 'focus_borderradiuslock',
									radius: 'focus_radius',
									radius_number: 'focus_radius_number',
									radius1: 'focus_borderradius1',
									radius2: 'focus_borderradius2',
									radius3: 'focus_borderradius3',
									radius4: 'focus_borderradius4'
								}
							}
						},
						{
							moduleType: 'Border',
							options: {
								state: 'focus',
								prepend: 'focus_',
								fields: {
									use: 'focus_useborder',
									width: 'focus_borderwidth',
									type: 'focus_bordertype',
									color: 'focus_bordercolor',
								}
							}
						}
					]
				},
				
				migrateElementStyle: function(styles) {
					//replace button class
					styles = styles.replace(/upfront-button/, 'upfront_cta');
					
					return styles;
				},
				
				migratePresetProperties: function(newPreset) {
					
					var preset = this.property('preset') ? this.clear_preset_name(this.property('preset')) : 'default',
						props = this.presets.findWhere({id: preset}),
						obj = {};

					_.each(props.attributes, function(preset_value, index) {
						
						if(index === 'id' || index === 'name' || index === 'theme_preset') {
							return;
						}
						
						obj[index] = preset_value;
					});
					
					//Migrate properties from existing preset
					newPreset.set(obj);
				},
			}
		},
		title: l10n.settings.label
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('button', styleTpl);

	return ButtonSettings;
});
