define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-tabs/tpl/preset-style.html'
], function(ElementSettings, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.utabs_element;

	var TabsSettings = ElementSettings.extend({
		panels: {
			Appearance: {
				mainDataCollection: 'tabPresets',
				styleElementPrefix: 'tab-preset',
				ajaxActionSlug: 'tab',
				panelTitle: l10n.settings,
				presetDefaults: Upfront.mainData.presetDefaults.tab,
				styleTpl: styleTpl,
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
										name: 'global-content-bg',
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
							options: {
								title: l10n.colors_label,
								multiple: false,
								single: true,
								abccolors: [
									{
										name: 'static-tab-bg',
										label: l10n.tab_bg_label
									},
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.tab_typography_label,
								state: 'static',
								toggle: false,
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
								multiple: false,
								single: true,
								toggle: true,
								prepend: 'hover-',
								prefix: 'static',
								fields: {
									use: 'hover-use-color',
								},
								abccolors: [
									{
										name: 'hover-tab-bg',
										label: l10n.tab_bg_label
									},
								]
							}
						},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.tab_typography_label,
								state: 'hover',
								toggle: true,
								prepend: 'hover-',
								prefix: 'static',
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
								prefix: 'static',
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
									use: 'hover-use-transition',
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
								multiple: false,
								single: true,
								toggle: true,
								prepend: 'active-',
								prefix: 'static',
								fields: {
									use: 'active-use-color',
							},
							abccolors: [
							{
								name: 'active-tab-bg',
								label: l10n.tab_bg_label
							},
						]
					}
				},
						{
							moduleType: 'Typography',
							options: {
								title: l10n.tab_typography_label,
								state: 'active',
								toggle: true,
								prepend: 'active-',
								prefix: 'static',
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
								prefix: 'static',
								fields: {
									use: 'active-useborder',
									width: 'active-borderwidth',
									type: 'active-bordertype',
									color: 'active-bordercolor',
								}
							}
						}
					]
				},
				
				migrateElementStyle: function(styles) {
					//replace tab container which is one line with preset
					styles = styles.replace(/\.upfront-tabs-container/, '.tabs-wrapper');
					
					return styles;
				},
				
				migrateDefaultStyle: function(styles) {
					//replace image wrapper class
					styles = styles.replace(/(div)?\.upfront-tabs\s/g, '');
					styles = styles.replace(/(div)?\.upfront-object\s/g, '');

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
					
					
					newPreset.set({
						'active-tab-bg': 'rgba(255,255,255, 0)',
						'static-tab-bg': 'rgba(255,255,255, 0)',
						'hover-tab-bg': 'rgba(255,255,255, 0)',
						'static-useborder': '',
						'hover-useborder': '',
						'active-useborder': '',
						'global-content-bg': 'rgba(255,255,255, 0)',
						'global-useborder': '',
						'static-line-height': '1',
						'active-line-height': '1',
						'hover-line-height': '1',
					});
				},
			}
		},
		title: l10n.settings
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('tab', styleTpl);

	return TabsSettings;
});
