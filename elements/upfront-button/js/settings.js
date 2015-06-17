define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/font-settings-item',
	'scripts/upfront/preset-settings/colors-settings-item',
	'text!elements/upfront-button/tpl/preset-style.html'
], function(PresetManager, Util, FontSettingsItem, ColorsSettingsItem, styleTpl) {
	var l10n = Upfront.Settings.l10n.button_element;
	
	var me = this;

	//Create new field type Separator
	var FieldSeparator = Upfront.Views.Editor.Field.Text.extend({
	  get_field_html: function () {
		return '';
	  }
	});

	//Create new field type Heading
	var FieldHeading = Upfront.Views.Editor.Field.Text.extend({
	  get_field_html: function () {
		return '';
	  }
	});

	var Settings = PresetManager.extend({
		mainDataCollection: 'buttonPresets',
		styleElementPrefix: 'button-preset',
		ajaxActionSlug: 'button',
		panelTitle: l10n.settings,
		styleTpl: styleTpl,
		presetDefaults: {
			'useborder': 'yes',
			'bordertype': 'solid',
			'borderwidth': 4,
			'bordercolor': 'rgb(66, 127, 237)',
			'useradius': 'yes',
			'borderradiuslock': 'yes',
			'borderradius1': 100,
			'borderradius2': 100,
			'borderradius3': 100,
			'borderradius4': 100,
			'bgcolor': 'rgb(255, 255, 255)',
			'fontsize': 16,
			'fontface': 'Arial',
			'fontstyle': '600 normal',
			'fontstyle_weight': '600',
			'fontstyle_style': 'normal',
			'lineheight': 1,
			'color': 'rgb(66, 127, 237)',
			'hov_bordertype': 'solid',
			'hov_borderwidth': 4,
			'hov_bordercolor': 'rgb(66, 127, 237)',
			'hov_borderradiuslock': 'yes',
			'hov_borderradius1': 100,
			'hov_borderradius2': 100,
			'hov_borderradius3': 100,
			'hov_borderradius4': 100,
			'hov_bgcolor': 'rgb(66, 127, 237)',
			'hov_fontsize': 16,
			'hov_fontface': 'Arial',
			'hov_fontstyle': '600 normal',
			'hov_fontstyle_weight': '600',
			'hov_fontstyle_style': 'normal',
			'hov_lineheight': 1,
			'hov_color': 'rgb(255, 255, 255)',
			'hov_duration': 0.25,
			'hov_transition': 'linear',
			'id': 'default',
			'name': l10n.default_preset
		},
		stateFields: {
			Static: [
				{
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						name: 'useborder',
						label: '',
						default_value: 1,
						multiple: false,
						values: [
							{ label: l10n.border, value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'useborder': value});
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_settings');

							//Toggle border settings when depending on checkbox value
							if(value == "yes") {
								stateSettings.find('.borderwidth-static').show();
								stateSettings.find('.bordertype-static').show();
								stateSettings.find('.bordercolor-static').show();
							} else {
								stateSettings.find('.borderwidth-static').hide();
								stateSettings.find('.bordertype-static').hide();
								stateSettings.find('.bordercolor-static').hide();
							}
						}
					}
				},	
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'static borderWidth borderwidth-static',
						name: 'borderwidth',
						label: '',
						default_value: 1,
						suffix: l10n.px,
						values: [
							{ label: "", value: '1' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'borderwidth': value});
						}
						
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						className: 'static borderType bordertype-static',
						name: 'bordertype',
						default_value: "none",
						label: '',
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
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf borderColor bordercolor-static static',
						name: 'bordercolor',
						blank_alpha : 0,
						label: '',
						default_value: '#000',
						spectrum: {
							preferredFormat: "rgb"
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
					fieldClass: FieldSeparator,
					options: {
						className: 'preset-separator',
						name: 'presetseparator'
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color backgroundColor sp-cf',
						name: 'bgcolor',
						blank_alpha : 0,
						label: l10n.bg_color,
						default_value: '#ccc',
						spectrum: {
							preferredFormat: "rgb"
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
					fieldClass: FieldSeparator,
					options: {
						className: 'preset-separator separator-background',
						name: 'presetseparator',
					}
				},
				
				{
					fieldClass: FieldHeading,
					options: {
						className: 'typography-heading',
						name: 'typography-heading',
						label: l10n.typography,
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'fontface',
						values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
						label: l10n.typeface,
						label_style: 'inline',
						className: 'font-face static typeFace',
						change: function(value, parentPanel) {
							parentPanel.model.set({'fontface': value});
						},
						show: function(value, $el) {
							//Create new field to update the fontstyle values.
							var styles = new Upfront.Views.Editor.Field.Select({
								name: 'fontstyle',
								label: l10n.weight_style,
								label_style: 'inline',
								className: 'font-style static weightStyle',
								values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(value)
							});

							$el.closest('.state_settings').find('.font-style').html(styles.get_label_html() + styles.get_field_html());
						}
					},
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'fontstyle',
						values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(),
						label: l10n.weight_style,
						label_style: 'inline',
						className: 'font-style static weightStyle',
						change: function(value, parentPanel) {
							//Explode Font style and font weight and save them as separate values
							var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
							parentPanel.model.set({'fontstyle': value});
							parentPanel.model.set({'fontstyle_weight': parsed_variant.weight});
							parentPanel.model.set({'fontstyle_style': parsed_variant.style});
						},
						show: function(value, $el) {
							//Set selected value to fontstyle field
							var select_value = this.model.get('fontstyle') ? this.model.get('fontstyle') : '';
							$el.closest('.state_settings').find('.font-style').find('.upfront-field-select-value').html('<span>' + select_value + '</span>');
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'static fontSize',
						name: 'fontsize',
						label: l10n.size,
						label_style: 'inline',
						suffix: l10n.px,
						default_value: 12,
						change: function(value, parentPanel) {
							parentPanel.model.set({'fontsize': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'static lineHeight',
						name: 'lineheight',
						label: l10n.line_height,
						label_style: 'inline',
						default_value: 1,
						min: 0,
						step: 0.1,
						change: function(value, parentPanel) {
							parentPanel.model.set({'lineheight': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf fontColor',
						name: 'color',
						blank_alpha : 0,
						default_value: '#000',
						label_style: 'inline',
						label: l10n.color,
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
				{
					fieldClass: FieldSeparator,
					options: {
						className: 'preset-separator separator-corners',
						name: 'presetseparator',
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						name: 'useradius',
						label: '',
						default_value: 1,
						multiple: false,
						values: [
							{ label: l10n.rounded_corners, value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'useradius': value});
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_settings');

							//Toggle border radius fields depending on checkbox value
							if(value == "yes") {
								stateSettings.find('.border_radius1_static').show();
								stateSettings.find('.border_radius2_static').show();
								stateSettings.find('.border_radius3_static').show();
								stateSettings.find('.border_radius4_static').show();
								stateSettings.find('.border_radius_lock_static').show();
							} else {
								stateSettings.find('.border_radius1_static').hide();
								stateSettings.find('.border_radius2_static').hide();
								stateSettings.find('.border_radius3_static').hide();
								stateSettings.find('.border_radius4_static').hide();
								stateSettings.find('.border_radius_lock_static').hide();
							}
						}
					}
				},	
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius1 border_radius1_static static',
						name: 'borderradius1',
						label: '',
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
						className: 'border_radius border_radius2 border_radius2_static static',
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
						className: 'border_radius border_radius4 border_radius4_static static',
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
						className: 'border_radius border_radius3 border_radius3_static static',
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
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						className: 'border_radius_lock border_radius_lock_static static',
						name: 'borderradiuslock',
						label: "",
						default_value: 1,
						multiple: false,
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
			],
			Hover: [
				{
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						name: 'hov_useborder',
						label: '',
						default_value: 0,
						multiple: false,
						values: [
							{ label: l10n.border, value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_useborder': value});
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_settings');

							//Toggle border settings when depending on checkbox value
							if(value == "yes") {
								stateSettings.find('.borderwidth-hover').show();
								stateSettings.find('.bordertype-hover').show();
								stateSettings.find('.bordercolor-hover').show();
							} else {
								stateSettings.find('.borderwidth-hover').hide();
								stateSettings.find('.bordertype-hover').hide();
								stateSettings.find('.bordercolor-hover').hide();
							}
						}
					}
				},	
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'static borderWidth borderwidth-hover borderwidth-hover',
						name: 'hov_borderwidth',
						label: '',
						default_value: 1,
						suffix: l10n.px,
						values: [
							{ label: "", value: '1' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_borderwidth': value});
						}
						
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						className: 'static borderType bordertype-hover bordertype-hover',
						name: 'hov_bordertype',
						label: l10n.border,
						default_value: "none",
						label: '',
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
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf borderColor bordercolor-hover bordercolor-hover hover',
						name: 'hov_bordercolor',
						blank_alpha : 0,
						label: '',
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
					fieldClass: FieldSeparator,
					options: {
						className: 'preset-separator',
						name: 'presetseparator',
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						name: 'hov_usebgcolor',
						className: 'backgroundcolor-hover',
						default_value: 0,
						multiple: false,
						values: [
							{ label: l10n.bg_color, value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_usebgcolor': value});
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_settings');

							if(value == "yes") {
								stateSettings.find('.bgcolor-hover').show();
							} else {
								stateSettings.find('.bgcolor-hover').hide();
							}
						}
					}
				},	
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color backgroundColor bgcolor-hover sp-cf',
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
					fieldClass: FieldSeparator,
					options: {
						className: 'preset-separator',
						name: 'presetseparator',
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						name: 'hov_usetypography',
						label: '',
						className: 'typography-hover',
						multiple: false,
						default_value: 0,
						values: [
							{ label: l10n.typography, value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_usetypography': value});
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_settings');

							if(value == "yes") {
								stateSettings.find('.typeface-hover').show();
								stateSettings.find('.weightstyle-hover').show();
								stateSettings.find('.fontsize-hover').show();
								stateSettings.find('.lineheight-hover').show();
								stateSettings.find('.fontcolor-hover').show();
								stateSettings.find('.typography-heading-hover').show();
							} else {
								stateSettings.find('.typeface-hover').hide();
								stateSettings.find('.weightstyle-hover').hide();
								stateSettings.find('.fontsize-hover').hide();
								stateSettings.find('.lineheight-hover').hide();
								stateSettings.find('.fontcolor-hover').hide();
								stateSettings.find('.typography-heading-hover').hide();
							}
						}
					}
				},	
				{
					fieldClass: FieldHeading,
					options: {
						className: 'typography-heading typography-heading-hover',
						name: 'typography-heading',
						label: l10n.typography,
					}
				},
				
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'hov_fontface',
						values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
						label: l10n.typeface,
						label_style: 'inline',
						className: 'font-face hover typeFace typeface-hover',
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_fontface': value});
						},
						show: function(value, $el) {
							//Create new field to update the fontstyle values.
							var styles = new Upfront.Views.Editor.Field.Select({
								name: 'hov_fontstyle',
								label: l10n.weight_style,
								label_style: 'inline',
								className: 'hov-font-style static weightStyle weightstyle-hover',
								values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(value)
							});

							$el.closest('.state_settings').find('.hov-font-style').html(styles.get_label_html() + styles.get_field_html());
						}
					},
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'hov_fontstyle',
						values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(),
						label: l10n.weight_style,
						label_style: 'inline',
						className: 'hov-font-style hover weightStyle weightstyle-hover',
						change: function(value, parentPanel) {
							//Explode Font style and font weight and save them as separate values
							var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
							parentPanel.model.set({'hov_fontstyle': value});
							parentPanel.model.set({'hov_fontstyle_weight': parsed_variant.weight});
							parentPanel.model.set({'hov_fontstyle_style': parsed_variant.style});
						},
						show: function(value, $el) {
							//Set selected value to hov_fontstyle
							var select_value = this.model.get('hov_fontstyle') ? this.model.get('hov_fontstyle') : '';
							$el.closest('.state_settings').find('.hov-font-style').find('.upfront-field-select-value').html('<span>' + select_value + '</span>');
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'hover fontSize fontsize-hover',
						name: 'hov_fontsize',
						label: l10n.size,
						label_style: 'inline',
						suffix: 'px',
						default_value: 12,
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_fontsize': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'hover lineHeight lineheight-hover',
						name: 'hov_lineheight',
						label: l10n.line_height,
						label_style: 'inline',
						default_value: 1,
						min: 0,
						step: 0.1,
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_lineheight': value});
						}
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Color,
					options: {
						className: 'upfront-field-wrap upfront-field-wrap-color sp-cf fontColor fontcolor-hover',
						name: 'hov_color',
						blank_alpha : 0,
						default_value: '#000',
						label_style: 'inline',
						label: l10n.color,
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
					fieldClass: FieldSeparator,
					options: {
						className: 'preset-separator separator-corners',
						name: 'presetseparator',
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						name: 'hov_useradius',
						label: '',
						default_value: 0,
						multiple: false,
						values: [
							{ label: l10n.rounded_corners, value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_useradius': value});
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_settings');
							
							if(value == "yes") {
								stateSettings.find('.border_radius1_hover').show();
								stateSettings.find('.border_radius2_hover').show();
								stateSettings.find('.border_radius3_hover').show();
								stateSettings.find('.border_radius4_hover').show();
								stateSettings.find('.border_radius_lock_hover').show();
							} else {
								stateSettings.find('.border_radius1_hover').hide();
								stateSettings.find('.border_radius2_hover').hide();
								stateSettings.find('.border_radius3_hover').hide();
								stateSettings.find('.border_radius4_hover').hide();
								stateSettings.find('.border_radius_lock_hover').hide();
							}
						}
					}
				},	
				
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'border_radius border_radius1 border_radius1_hover hover',
						name: 'hov_borderradius1',
						label: '',
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
						className: 'border_radius border_radius2 border_radius2_hover hover',
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
						className: 'border_radius border_radius4 border_radius4_hover hover',
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
						className: 'border_radius border_radius3 border_radius3_hover hover',
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
					fieldClass: Upfront.Views.Editor.Field.Checkboxes,
					options: {
						className: 'border_radius_lock border_radius_lock_hover hover',
						name: 'hov_borderradiuslock',
						label: "",
						default_value: 1,
						multiple: false,
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
					fieldClass: FieldSeparator,
					options: {
						className: 'preset-separator',
						name: 'presetseparator',
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Number,
					options: {
						className: 'duration',
						name: 'hov_duration',
						min: 0,
						label: l10n.animate_hover_changes,
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
						label: l10n.sec,
						step: 0.1,
						label_style: 'inline',
						values: [
							{ label: l10n.ease, value: 'ease' },
							{ label: l10n.linear, value: 'linear' },
							{ label: l10n.ease_in, value: 'ease-in' },
							{ label: l10n.ease_out, value: 'ease-out' },
							{ label: l10n.ease_in_out, value: 'ease-in-out' }
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
