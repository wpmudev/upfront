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
							{ label: 'Border', value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'useborder': value});
						},
						show: function(value, $el) {
                            //Toggle border settings when depending on checkbox value
							if(value == "yes") {
								$el.closest('.state_settings').find('.borderwidth-static').show();
								$el.closest('.state_settings').find('.bordertype-static').show();
								$el.closest('.state_settings').find('.bordercolor-static').show();
							} else {
								$el.closest('.state_settings').find('.borderwidth-static').hide();
								$el.closest('.state_settings').find('.bordertype-static').hide();
								$el.closest('.state_settings').find('.bordercolor-static').hide();
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
						suffix: 'px',
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
						label: 'Typography',
					}
				},
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'fontface',
						values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
						label: 'Typeface:',
						label_style: 'inline',
						className: 'font-face static typeFace',
						change: function(value, parentPanel) {
							parentPanel.model.set({'fontface': value});
						},
						show: function(value, $el) {
							//Create new field to update the fontstyle values.
                            var styles = new Upfront.Views.Editor.Field.Select({
								name: 'fontstyle',
								label: 'Weight/Style',
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
						label: 'Weight/Style:',
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
						label: 'Size:',
						label_style: 'inline',
						suffix: 'px',
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
						label: 'Line Height: ',
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
						label: 'Color:',
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
							{ label: 'Rounded Corners', value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'useradius': value});
						},
						show: function(value, $el) {
                            //Toggle border radius fields depending on checkbox value
							if(value == "yes") {
								$el.closest('.state_settings').find('.border_radius1_static').show();
								$el.closest('.state_settings').find('.border_radius2_static').show();
								$el.closest('.state_settings').find('.border_radius3_static').show();
								$el.closest('.state_settings').find('.border_radius4_static').show();
								$el.closest('.state_settings').find('.border_radius_lock_static').show();
							} else {
								$el.closest('.state_settings').find('.border_radius1_static').hide();
								$el.closest('.state_settings').find('.border_radius2_static').hide();
								$el.closest('.state_settings').find('.border_radius3_static').hide();
								$el.closest('.state_settings').find('.border_radius4_static').hide();
								$el.closest('.state_settings').find('.border_radius_lock_static').hide();
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
							{ label: 'Border', value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_useborder': value});
						},
                        show: function(value, $el) {
                            //Toggle border settings when depending on checkbox value
                            if(value == "yes") {
                                $el.closest('.state_settings').find('.borderwidth-hover').show();
                                $el.closest('.state_settings').find('.bordertype-hover').show();
                                $el.closest('.state_settings').find('.bordercolor-hover').show();
                            } else {
                                $el.closest('.state_settings').find('.borderwidth-hover').hide();
                                $el.closest('.state_settings').find('.bordertype-hover').hide();
                                $el.closest('.state_settings').find('.bordercolor-hover').hide();
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
						suffix: 'px',
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
							{ label: 'Background color', value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_usebgcolor': value});
						},
                        show: function(value, $el) {
                            if(value == "yes") {
                                $el.closest('.state_settings').find('.bgcolor-hover').show();
                            } else {
                                $el.closest('.state_settings').find('.bgcolor-hover').hide();
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
							{ label: 'Typography', value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_usetypography': value});
						},
                        show: function(value, $el) {
                            if(value == "yes") {
                                $el.closest('.state_settings').find('.typeface-hover').show();
                                $el.closest('.state_settings').find('.weightstyle-hover').show();
                                $el.closest('.state_settings').find('.fontsize-hover').show();
                                $el.closest('.state_settings').find('.lineheight-hover').show();
                                $el.closest('.state_settings').find('.fontcolor-hover').show();
                                $el.closest('.state_settings').find('.typography-heading-hover').show();
                            } else {
                                $el.closest('.state_settings').find('.typeface-hover').hide();
                                $el.closest('.state_settings').find('.weightstyle-hover').hide();
                                $el.closest('.state_settings').find('.fontsize-hover').hide();
                                $el.closest('.state_settings').find('.lineheight-hover').hide();
                                $el.closest('.state_settings').find('.fontcolor-hover').hide();
                                $el.closest('.state_settings').find('.typography-heading-hover').hide();
                            }
                        }
					}
				},	
				{
					fieldClass: FieldHeading,
					options: {
						className: 'typography-heading typography-heading-hover',
						name: 'typography-heading',
						label: 'Typography',
					}
				},
				
				{
					fieldClass: Upfront.Views.Editor.Field.Select,
					options: {
						name: 'hov_fontface',
						values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
						label: 'Typeface:',
						label_style: 'inline',
						className: 'font-face hover typeFace typeface-hover',
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_fontface': value});
						},
                        show: function(value, $el) {
                            //Create new field to update the fontstyle values.
                            var styles = new Upfront.Views.Editor.Field.Select({
                                name: 'hov_fontstyle',
                                label: 'Weight/Style',
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
						label: 'Weight/Style:',
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
						label: 'Size:',
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
						label: 'Line Height: ',
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
						label: 'Color:',
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
							{ label: 'Rounded Corners', value: 'yes' }
						],
						change: function(value, parentPanel) {
							parentPanel.model.set({'hov_useradius': value});
						},
                        show: function(value, $el) {
                            if(value == "yes") {
                                $el.closest('.state_settings').find('.border_radius1_hover').show();
                                $el.closest('.state_settings').find('.border_radius2_hover').show();
                                $el.closest('.state_settings').find('.border_radius3_hover').show();
                                $el.closest('.state_settings').find('.border_radius4_hover').show();
                                $el.closest('.state_settings').find('.border_radius_lock_hover').show();
                            } else {
                                $el.closest('.state_settings').find('.border_radius1_hover').hide();
                                $el.closest('.state_settings').find('.border_radius2_hover').hide();
                                $el.closest('.state_settings').find('.border_radius3_hover').hide();
                                $el.closest('.state_settings').find('.border_radius4_hover').hide();
                                $el.closest('.state_settings').find('.border_radius_lock_hover').hide();
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
