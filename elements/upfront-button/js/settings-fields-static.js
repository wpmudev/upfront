define(function() {
	var l10n = Upfront.Settings.l10n.button_element;
	
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
	
	var ButtonSettingsStatic = Upfront.Views.Editor.Settings.Item.extend({
		className: 'button_settings_static',
		group: false,

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				state = this.options.state;		
			
			this.fields = _([

				new Upfront.Views.Editor.Field.Color({
					className: 'upfront-field-wrap upfront-field-wrap-color backgroundColor sp-cf',
					model: this.model,
					name: 'bgcolor',
					blank_alpha : 0,
					label: l10n.bg_color,
					default_value: '#ccc',
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('bgcolor', c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('bgcolor', c);
						}
					}
				}),
				
				new FieldSeparator({
					className: 'preset-separator separator-background',
					name: 'presetseparator'
				}),
				
				new FieldHeading({
					className: 'typography-heading',
						name: 'typography-heading',
						label: l10n.typography,
				}),

				new Upfront.Views.Editor.Field.Typeface_Chosen_Select({
					name: 'fontface',
					model: this.model,
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
					label: l10n.typeface,
					select_width: '110px',
					label_style: 'inline',
					className: 'font-face static typeFace',
					change: function(value) {
						me.model.set({'fontface': value});
						
						me.fields._wrapped[4] = new Upfront.Views.Editor.Field.Typeface_Style_Chosen_Select({
							model: this.model,
							name: 'fontstyle',
							values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get('fontface')),
							label: l10n.weight_style,
							select_width: '100px',
							label_style: 'inline',
							className: 'font-style static weightStyle',
							change: function(value) {
								//Explode Font style and font weight and save them as separate values
								var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
								me.model.set({'fontstyle': value});
								me.model.set({'fontstyle_weight': parsed_variant.weight});
								me.model.set({'fontstyle_style': parsed_variant.style});
							},
						}),
						me.$el.empty();
						me.render();
					}
				}),
				
				new Upfront.Views.Editor.Field.Typeface_Style_Chosen_Select({
					model: this.model,
					name: 'fontstyle',
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get('fontface')),
					label: l10n.weight_style,
					select_width: '100px',
					label_style: 'inline',
					className: 'font-style static weightStyle',
					change: function(value) {
						//Explode Font style and font weight and save them as separate values
						var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
						me.model.set({'fontstyle': value});
						me.model.set({'fontstyle_weight': parsed_variant.weight});
						me.model.set({'fontstyle_style': parsed_variant.style});
					},
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'static fontSize',
					name: 'fontsize',
					label: l10n.size,
					label_style: 'inline',
					suffix: l10n.px,
					default_value: 12,
					change: function(value) {
						me.model.set({'fontsize': value});
					}
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'static lineHeight',
					name: 'lineheight',
					label: l10n.line_height,
					label_style: 'inline',
					default_value: 1,
					min: 0,
					step: 0.1,
					change: function(value) {
						me.model.set({'lineheight': value});
					}
				}),
				
				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf fontColor',
					name: 'color',
					blank_alpha : 0,
					default_value: '#000',
					label_style: 'inline',
					label: l10n.color,
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('color', c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('color', c);
						}
					}
				}),

				new FieldSeparator({
					className: 'preset-separator useBorderSeparator',
					name: 'presetseparator'
				}),
				
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'useBorder',
					name: 'useborder',
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: l10n.border, value: 'yes' }
					],
					change: function(value) {
						me.model.set({'useborder': value});
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
				}),
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'static borderWidth borderwidth-static',
					name: 'borderwidth',
					label: '',
					default_value: 1,
					suffix: l10n.px,
					values: [
						{ label: "", value: '1' }
					],
					change: function(value) {
						me.model.set({'borderwidth': value});
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
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
					change: function(value) {
						me.model.set({'bordertype': value});
					}
				}),
				
				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf borderColor bordercolor-static static',
					name: 'bordercolor',
					blank_alpha : 0,
					label: '',
					default_value: '#000',
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('bordercolor', c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('bordercolor', c);
						}
					}
				}),
				
				new FieldSeparator({
					className: 'preset-separator separator-corners',
					name: 'presetseparator'
				}),
				
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'useRadius',
					name: 'useradius',
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: l10n.rounded_corners, value: 'yes' }
					],
					change: function(value) {
						me.model.set({'useradius': value});
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
				}),	
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'border_radius border_radius1 border_radius1_static static',
					name: 'borderradius1',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set({'borderradius1': value});
						var isLocked = me.model.get('borderradiuslock');
						if(typeof isLocked !== "undefined" && isLocked.length > 0) {
							me.model.set('borderradius2', value);
							me.model.set('borderradius3', value);
							me.model.set('borderradius4', value);
							me.$el.find("input[name*=borderradius]").val(value);
						}	
					}
				}),	
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'border_radius border_radius2 border_radius2_static static',
					name: 'borderradius2',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set({'borderradius2': value});
						var isLocked = me.model.get('borderradiuslock');
						if(typeof isLocked !== "undefined" && isLocked.length > 0) {
							me.model.set('borderradius1', value);
							me.model.set('borderradius3', value);
							me.model.set('borderradius4', value);
							me.$el.find("input[name*=borderradius]").val(value);
						}	
					}
				}),		
				
				new	Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'border_radius border_radius4 border_radius4_static static',
					name: 'borderradius4',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set({'borderradius4': value});
						var isLocked = me.model.get('borderradiuslock');
						if(typeof isLocked !== "undefined" && isLocked.length > 0) {
							me.model.set('borderradius1', value);
							me.model.set('borderradius2', value);
							me.model.set('borderradius3', value);
							me.$el.find("input[name*=borderradius]").val(value);
						}	
					}
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'border_radius border_radius3 border_radius3_static static',
					name: 'borderradius3',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set({'borderradius3': value});
						var isLocked = me.model.get('borderradiuslock');
						if(typeof isLocked !== "undefined" && isLocked.length > 0) {
							me.model.set('borderradius1', value);
							me.model.set('borderradius2', value);
							me.model.set('borderradius4', value);
							me.$el.find("input[name*=borderradius]").val(value);
						}	
					}
				}),	
				
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'border_radius_lock border_radius_lock_static static',
					name: 'borderradiuslock',
					label: "",
					default_value: 0,
					multiple: false,
					values: [
						{ label: '', value: 'yes' }
					],
					change: function(value) {
						me.model.set({'borderradiuslock': value});
						
						if(typeof value !== "undefined" && value.length > 0) {
							var firstRadio = me.model.get('borderradius1');
							me.model.set('borderradius2', firstRadio);
							me.model.set('borderradius3', firstRadio);
							me.model.set('borderradius4', firstRadio);
							me.$el.find("input[name*=borderradius]").val(firstRadio);
						}	
						
					}
				}),

			]);
		}
	});

	return ButtonSettingsStatic;
});