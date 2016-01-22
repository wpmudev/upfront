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
				presetDefaults: Upfront.mainData.presetDefaults.text,
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
								]
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
							}
						},
						
						{
							moduleType: 'Checkbox',
							options: {
								state: 'static',
								label: l10n.settings.padding_label,
								tooltip: true,
								tooltip_label: l10n.settings.tooltip_label,
								fields: {
									checkbox: 'additional_padding'
								}
							}
						},
					]
				},
				
				migrateElementStyle: function(styles) {
					//replace container class
					styles = styles.replace(/\.upfront-plain_txt/, ' .plain-text-container');
					
					return styles;
				},
				
				migratePresetProperties: function(newPreset) {
					var props = {},
						useBorder = '',
						usePadding = '';

					this.model.get('properties').each( function(prop) {
						props[prop.get('name')] = prop.get('value');
					});

					if((typeof props.border_color !== "undefined" && props.border_color !== "rgba(0, 0, 0, 0)") && 
					   (typeof props.border_style !== "undefined" && props.border_style !== "none") && 
					   (typeof props.border_width !== "undefined" && props.border_width !== 1)) {
							useBorder = 'yes';
					}
					
					if((typeof props.background_color !== "undefined" && props.background_color) || useBorder === 'yes') {
						usePadding = 'yes';
					}

					newPreset.set({
						'useborder': useBorder,
						'bg_color': props.background_color,
						'border_width': props.border_width,
						'border_style': props.border_style,
						'border_color': props.border_color,
						'additional_padding': usePadding
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
					
					if((typeof props.border_color !== "undefined" && props.border_color !== "rgba(0, 0, 0, 0)") || 
					   (typeof props.border_style !== "undefined" && props.border_style !== "none") || 
					   (typeof props.border_width !== "undefined" && props.border_width !== 1)) {
						return true;
					}
					
					if(typeof props.bg_color !== "undefined" && props.bg_color !== "rgba(0, 0, 0, 0)") {
						return true;
					}

					return false;
				}
			}
		},
		title: l10n.appearance
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('text', styleTpl);

	return TextSettings;
});
