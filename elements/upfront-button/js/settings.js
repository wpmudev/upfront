define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/font-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'text!elements/upfront-button/tpl/preset-style.html'
], function(PresetManager, Util, FontSettingsItem, ColorsSettingsItem, styleTpl) {
	var l10n = Upfront.Settings.l10n.button_element;

	var Settings = PresetManager.extend({
		mainDataCollection: 'buttonPresets',
		styleElementPrefix: 'button-preset',
		ajaxActionSlug: 'button',
		panelTitle: l10n.settings,
		styleTpl: styleTpl,
		presetDefaults: {
			'bordertype': '',
			'borderwidth': 1,
			'bordercolor': 'rgb(0, 0, 0)',
			'borderradiuslock': '',
			'borderradius1': 0,
			'borderradius2': 0,
			'borderradius3': 0,
			'borderradius4': 0,
			'bgcolor': 'rgb(128, 128, 128)',
			'fontsize': 14,
			'fontface': 'Arial',
			'color': 'rgb(255, 255, 255)',
			'hov_bordertype': '',
			'hov_borderwidth': 1,
			'hov_bordercolor': 'rgb(0, 0, 0)',
			'hov_borderradiuslock': '',
			'hov_borderradius1': 0,
			'hov_borderradius2': 0,
			'hov_borderradius3': 0,
			'hov_borderradius4': 0,
			'hov_bgcolor': 'rgb(128, 128, 128)',
			'hov_fontsize': 14,
			'hov_fontface': 'Arial',
			'hov_color': 'rgb(0, 0, 0)',
			'hov_duration': 0.25,
			'hov_transition': 'linear'
		},
		stateFields: {
			Static: [
				{
					fieldClass: Upfront.Views.Editor.Field.Radios,
					options: {
						className: 'inline-radios plaintext-settings static',
						name: 'bordertype',
						label: l10n.border,
						default_value: "none",
						values: [
							{ label: l10n.none, value: 'none' },
							{ label: l10n.solid, value: 'solid' },
							{ label: l10n.dashed, value: 'dashed' },
							{ label: l10n.dotted, value: 'dotted' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'bordertype': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'inline-number plaintext-settings static',
						name: 'borderwidth',
						label: l10n.width,
						default_value: 1,
						values: [
							{ label: "", value: '1' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'borderwidth': value});
						}
						
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf plaintext-settings inline-color border-color static',
						name: 'bordercolor',
						blank_alpha : 0,
						label: l10n.color,
						default_value: '#000',
						spectrum: {
							preferredFormat: "rgb",
						},
						change: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'bordercolor': value});
						},
						move: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'bordercolor': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						className: 'border_radius_lock static',
						name: 'borderradiuslock',
						label: "Lock Border Radius",
						default_value: 1,
						values: [
							{ label: '', value: 'yes' }
						],
						change: function(value, parentPanel) {
							if(value.length > 0) {
								var firstRadio = parentPanel.model.get('borderradius1');
								parentPanel.model.set('borderradius2', firstRadio);
								parentPanel.model.set('borderradius3', firstRadio);
								parentPanel.model.set('borderradius4', firstRadio);
								parentPanel.$el.find("input[name*=borderradius]").val(firstRadio);
							}	
							parentPanel.model.set({'borderradiuslock': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius1 static',
						name: 'borderradius1',
						label: 'Rounded Corners',
						default_value: 0,
						values: [
							{ label: "", value: '0' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'borderradius1': value});
							var isLocked = parentPanel.model.get('borderradiuslock');
							if(isLocked.length > 0) {
								parentPanel.model.set('borderradius2', value);
								parentPanel.model.set('borderradius3', value);
								parentPanel.model.set('borderradius4', value);
								parentPanel.$el.find("input[name*=borderradius]").val(value);
							}	
						}
					}
				},		
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius2 static',
						name: 'borderradius2',
						label: '',
						default_value: 0,
						values: [
							{ label: "", value: '0' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'borderradius2': value});
							var isLocked = parentPanel.model.get('borderradiuslock');
							if(isLocked.length > 0) {
								parentPanel.model.set('borderradius1', value);
								parentPanel.model.set('borderradius3', value);
								parentPanel.model.set('borderradius4', value);
								parentPanel.$el.find("input[name*=borderradius]").val(value);
							}	
						}
					}
				},			
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius4 static',
						name: 'borderradius4',
						label: '',
						default_value: 0,
						values: [
							{ label: "", value: '0' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'borderradius4': value});
							var isLocked = parentPanel.model.get('borderradiuslock');
							if(isLocked.length > 0) {
								parentPanel.model.set('borderradius1', value);
								parentPanel.model.set('borderradius2', value);
								parentPanel.model.set('borderradius3', value);
								parentPanel.$el.find("input[name*=borderradius]").val(value);
							}	
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius3 static',
						name: 'borderradius3',
						label: '',
						default_value: 0,
						values: [
							{ label: "", value: '0' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'borderradius3': value});
							var isLocked = parentPanel.model.get('borderradiuslock');
							if(isLocked.length > 0) {
								parentPanel.model.set('borderradius1', value);
								parentPanel.model.set('borderradius2', value);
								parentPanel.model.set('borderradius4', value);
								parentPanel.$el.find("input[name*=borderradius]").val(value);
							}	
						}
					}
				},	
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  bg-color static',
						name: 'bgcolor',
						blank_alpha : 0,
						label: l10n.bg_color,
						default_value: '#ccc',
						spectrum: {
							preferredFormat: "rgb",
						},
						change: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'bgcolor': value});
						},
						move: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'bgcolor': value});
						}
						
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'font static',
						name: 'fontsize',
						label: 'Font: ',
						default_value: 12,
						change: function(value, parentPanel) {
							parentPanel.model.set({'fontsize': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'fontface',
						values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
						label: 'px',
						label_style: 'inline',
						className: 'font-face static',
						change: function(value, parentPanel) {
							parentPanel.model.set({'fontface': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf font_color bg-color static',
						name: 'color',
						blank_alpha : 0,
						default_value: '#000',
						label_style: 'inline',
						label: '',
						spectrum: {
							preferredFormat: "rgb",
						},
						change: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'color': value});
						},
						move: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'color': value});
						}
						
					}
				},
			],
			Hover: [
				{
					fieldClass: Upfront.Views.Editor.Field.Radios,
					options: {
						className: 'inline-radios plaintext-settings hover',
						name: 'hov_bordertype',
						label: l10n.border,
						default_value: "none",
						values: [
							{ label: l10n.none, value: 'none' },
							{ label: l10n.solid, value: 'solid' },
							{ label: l10n.dashed, value: 'dashed' },
							{ label: l10n.dotted, value: 'dotted' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_bordertype': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'inline-number plaintext-settings hover',
						name: 'hov_borderwidth',
						label: l10n.width,
						default_value: 1,
						values: [
							{ label: "", value: '1' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_borderwidth': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf plaintext-settings inline-color border-color hover',
						name: 'hov_bordercolor',
						blank_alpha : 0,
						label: l10n.color,
						default_value: '#000',
						spectrum: {
							preferredFormat: "rgb",
						},
						change: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'hov_bordercolor': value});
						},
						move: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'hov_bordercolor': value});
						}
						
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						className: 'border_radius_lock static',
						name: 'hov_borderradiuslock',
						label: "Lock Border Radius",
						default_value: 1,
						values: [
							{ label: '', value: 'yes' }
						],
						change: function(value, parentPanel) {
							if(value.length > 0) {
								var firstRadio = parentPanel.model.get('hov_borderradius1');
								parentPanel.model.set('hov_borderradius2', firstRadio);
								parentPanel.model.set('hov_borderradius3', firstRadio);
								parentPanel.model.set('hov_borderradius4', firstRadio);
								parentPanel.$el.find("input[name*=hov_borderradius]").val(firstRadio);
							}	
							parentPanel.model.set({'hov_borderradiuslock': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius1 static',
						name: 'hov_borderradius1',
						label: 'Rounded Corners',
						default_value: 0,
						values: [
							{ label: "", value: '0' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_borderradius1': value});
							var isLocked = parentPanel.model.get('hov_borderradiuslock');
							if(isLocked.length > 0) {
								parentPanel.model.set('hov_borderradius2', value);
								parentPanel.model.set('hov_borderradius3', value);
								parentPanel.model.set('hov_borderradius4', value);
								parentPanel.$el.find("input[name*=hov_borderradius]").val(value);
							}	
						}
					}
				},		
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius2 static',
						name: 'hov_borderradius2',
						label: '',
						default_value: 0,
						values: [
							{ label: "", value: '0' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_borderradius2': value});
							var isLocked = parentPanel.model.get('hov_borderradiuslock');
							if(isLocked.length > 0) {
								parentPanel.model.set('hov_borderradius1', value);
								parentPanel.model.set('hov_borderradius3', value);
								parentPanel.model.set('hov_borderradius4', value);
								parentPanel.$el.find("input[name*=hov_borderradius]").val(value);
							}	
						}
					}
				},			
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius4 static',
						name: 'hov_borderradius4',
						label: '',
						default_value: 0,
						values: [
							{ label: "", value: '0' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_borderradius4': value});
							var isLocked = parentPanel.model.get('hov_borderradiuslock');
							if(isLocked.length > 0) {
								parentPanel.model.set('hov_borderradius1', value);
								parentPanel.model.set('hov_borderradius2', value);
								parentPanel.model.set('hov_borderradius3', value);
								parentPanel.$el.find("input[name*=hov_borderradius]").val(value);
							}	
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius3 static',
						name: 'hov_borderradius3',
						label: '',
						default_value: 0,
						values: [
							{ label: "", value: '0' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_borderradius3': value});
							var isLocked = parentPanel.model.get('hov_borderradiuslock');
							if(isLocked.length > 0) {
								parentPanel.model.set('hov_borderradius1', value);
								parentPanel.model.set('hov_borderradius2', value);
								parentPanel.model.set('hov_borderradius4', value);
								parentPanel.$el.find("input[name*=hov_borderradius]").val(value);
							}	
						}
					}
				},	
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  bg-color hover',
						name: 'hov_bgcolor',
						blank_alpha : 0,   
						label: l10n.bg_color,
						default_value: '#ccc',
						spectrum: {
							preferredFormat: "rgb",
						},
						change: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'hov_bgcolor': value});
						},
						move: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'hov_bgcolor': value});
						}	
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'font static',
						name: 'hov_fontsize',
						label: 'Font: ',
						default_value: 12,
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_fontsize': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'hov_fontface',
						values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
						label: 'px',
						label_style: 'inline',
						className: 'font-face hover',
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_fontface': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf font_color bg-color hover',
						name: 'hov_color',
						blank_alpha : 0,
						default_value: '#000',
						label_style: 'inline',
						label: '',
						spectrum: {
							preferredFormat: "rgb",
						},
						change: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'hov_color': value});
						},
						move: function(value, parentPanel) {
							if (!value) return false;
							parentPanel.model.set({'hov_color': value});
						}
						
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'duration',
						name: 'hov_duration',
						min: 0,
						label: 'Animate Hover Changes:',
						step: 0.1,
						values: [
							{ label: '', value: '12' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_duration': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'hov_transition',
						label: 'sec',
						step: 0.1,
						label_style: 'inline',
						values: [
							{ label: 'ease', value: 'ease' },
							{ label: 'linear', value: 'linear' },
							{ label: 'ease-in', value: 'ease-in' },
							{ label: 'ease-out', value: 'ease-out' },
							{ label: 'ease-in-out', value: 'ease-in-out' }
						],
						className: 'transition hover',
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_transition': value});
						}
					}
				}	
			]
		}
	});

	// Generate presets styles to page
	Util.generatePresetsToPage('button', styleTpl);

	return Settings;
});
