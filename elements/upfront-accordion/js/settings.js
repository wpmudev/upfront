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
				presetDefaults: Upfront.mainData.presetDefaults.accordion,
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
								]
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
								]
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
								]
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
				
				migrateDefaultStyle: function(styles) {
					//replace image wrapper class
					styles = styles.replace(/(div)?\.upfront-accordion\s/g, '');
					styles = styles.replace(/(div)?\.upfront-object\s/g, '');

					return styles;
				},
				
				migratePresetProperties: function(newPreset) {
					
					var preset = this.property('preset') ? this.clear_preset_name(this.property('preset')) : 'default',
						props = this.presets.findWhere({id: preset}),
						obj = {};

					_.each(props.attributes, function(preset_value, index) {
						
						if(index === 'id' || index === 'name' || index === 'preset_style') {
							return;
						}
						
						obj[index] = preset_value;
					});
					
					//Migrate properties from existing preset
					newPreset.set(obj);
				},
			}
		},
		title: 'Accordion Settings'
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('accordion', styleTpl);

	return AccordionSettings;
});
