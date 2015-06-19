define(function() {
	var l10n = Upfront.Settings.l10n.button_element;
	
	var FieldSeparator = Upfront.Views.Editor.Field.Text.extend({
	  get_field_html: function () {
		return '';
	  }
	});

	var FieldHeading = Upfront.Views.Editor.Field.Text.extend({
	  get_field_html: function () {
		return '';
	  }
	});
	
	var ButtonSettingsHover = Upfront.Views.Editor.Settings.Item.extend({
		className: 'button_settings_hover',
		group: false,

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				state = this.options.state;

			this.fields = _([
				
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					name: 'hov_usebgcolor',
					className: 'backgroundcolor-hover',
					default_value: 0,
					multiple: false,
					values: [
						{ label: l10n.bg_color, value: 'yes' }
					],
					change: function(value) {
						me.model.set({'hov_usebgcolor': value});
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.state_settings');

						if(value == "yes") {
							stateSettings.find('.bgcolor-hover').show();
						} else {
							stateSettings.find('.bgcolor-hover').hide();
						}
					}
				}),
				
				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: 'upfront-field-wrap upfront-field-wrap-color backgroundColor bgcolor-hover sp-cf',
					name: 'hov_bgcolor',
					blank_alpha : 0,
					label: l10n.bg_color,
					default_value: '#ccc',
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('hov_bgcolor', c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('hov_bgcolor', c);
						}
					}
				}),
				
				new FieldSeparator({
					className: 'preset-separator',
					name: 'presetseparator'
				}),
				
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					name: 'hov_usetypography',
					label: '',
					className: 'typography-hover',
					multiple: false,
					default_value: 0,
					values: [
						{ label: l10n.typography, value: 'yes' }
					],
					change: function(value) {
						me.model.set({'hov_usetypography': value});
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
				}),
				
				new FieldHeading({
					className: 'typography-heading typography-heading-hover',
					name: 'typography-heading',
					label: l10n.typography,
				}),

				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					name: 'hov_fontface',
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
					label: l10n.typeface,
					label_style: 'inline',
					className: 'font-face hover typeFace typeface-hover',
					change: function(value) {
						me.model.set({'hov_fontface': value});
						var styles = new Upfront.Views.Editor.Field.Select({
							name: 'hov_fontstyle',
							label: l10n.weight_style,
							label_style: 'inline',
							className: 'hov-font-style static weightStyle weightstyle-hover',
							values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(value)
						});

						me.$el.closest('.state_settings').find('.hov-font-style').html(styles.get_label_html() + styles.get_field_html());
					}
				}),
				
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					name: 'hov_fontstyle',
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get('hov_fontface')),
					label: l10n.weight_style,
					label_style: 'inline',
					className: 'hov-font-style hover weightStyle weightstyle-hover',
					change: function(value) {
						//Explode Font style and font weight and save them as separate values
						var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
						me.model.set({'hov_fontstyle': value});
						me.model.set({'hov_fontstyle_weight': parsed_variant.weight});
						me.model.set({'hov_fontstyle_style': parsed_variant.style});
					},
					show: function(value, $el) {
						//Set selected value to hov_fontstyle
						var select_value = me.model.get('hov_fontstyle') ? me.model.get('hov_fontstyle') : '';
						$el.closest('.state_settings').find('.hov-font-style').find('.upfront-field-select-value').html('<span>' + select_value + '</span>');
					}
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'hover fontSize fontsize-hover',
					name: 'hov_fontsize',
					label: l10n.size,
					label_style: 'inline',
					suffix: 'px',
					default_value: 12,
					change: function(value) {
						me.model.set({'hov_fontsize': value});
					}
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'hover lineHeight lineheight-hover',
					name: 'hov_lineheight',
					label: l10n.line_height,
					label_style: 'inline',
					default_value: 1,
					min: 0,
					step: 0.1,
					change: function(value) {
						me.model.set({'hov_lineheight': value});
					}
				}),
				
				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf fontColor fontcolor-hover',
					name: 'hov_color',
					blank_alpha : 0,
					default_value: '#000',
					label_style: 'inline',
					label: l10n.color,
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('hov_color', c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('hov_color', c);
						}
					}
				}),
				
				new FieldSeparator({
					className: 'preset-separator',
					name: 'presetseparator'
				}),

				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					name: 'hov_useborder',
					label: '',
					default_value: 0,
					multiple: false,
					values: [
						{ label: l10n.border, value: 'yes' }
					],
					change: function(value) {
						me.model.set({'hov_useborder': value});
						
						if(value === "yes") {
							var borderwidth = me.model.get('borderwidth');
							var bordertype = me.model.get('bordertype');
							var bordercolor = me.model.get('bordercolor');
							console.log(me);
							me.model.set('hov_borderwidth', borderwidth);
							me.model.set('hov_bordertype', bordertype);
							me.model.set('hov_bordercolor', bordercolor);
						}
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
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'static borderWidth borderwidth-hover borderwidth-hover',
					name: 'hov_borderwidth',
					label: '',
					default_value: 1,
					suffix: l10n.px,
					values: [
						{ label: "", value: '1' }
					],
					change: function(value) {
						me.model.set({'hov_borderwidth': value});
					}
				}),
				
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
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
					change: function(value) {
						me.model.set({'hov_bordertype': value});
					}
				}),
				
				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf borderColor bordercolor-hover bordercolor-hover hover',
					name: 'hov_bordercolor',
					blank_alpha : 0,
					label: '',
					default_value: '#000',
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('hov_bordercolor', c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set('hov_bordercolor', c);
						}
					}
				}),
				
				new FieldSeparator({
					className: 'preset-separator separator-corners-hov',
					name: 'presetseparator'
				}),
				
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					name: 'hov_useradius',
					label: '',
					default_value: 0,
					multiple: false,
					values: [
						{ label: l10n.rounded_corners, value: 'yes' }
					],
					change: function(value) {
						me.model.set({'hov_useradius': value});
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
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'border_radius border_radius1 border_radius1_hover hover',
					name: 'hov_borderradius1',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set({'hov_borderradius1': value});
						var isLocked = me.model.get('hov_borderradiuslock') ? me.model.get('hov_borderradiuslock') : 0;
						if(typeof isLocked !== "undefined" && isLocked.length > 0) {
							me.model.set('hov_borderradius2', value);
							me.model.set('hov_borderradius3', value);
							me.model.set('hov_borderradius4', value);
							me.$el.find("input[name*=hov_borderradius]").val(value);
						}	
					}
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'border_radius border_radius2 border_radius2_hover hover',
					name: 'hov_borderradius2',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set({'hov_borderradius2': value});
						var isLocked = me.model.get('hov_borderradiuslock') ? me.model.get('hov_borderradiuslock') : 0;
						if(typeof isLocked !== "undefined" && isLocked.length > 0) {
							me.model.set('hov_borderradius1', value);
							me.model.set('hov_borderradius3', value);
							me.model.set('hov_borderradius4', value);
							me.$el.find("input[name*=hov_borderradius]").val(value);
						}	
					}
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'border_radius border_radius4 border_radius4_hover hover',
					name: 'hov_borderradius4',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set({'hov_borderradius4': value});
						var isLocked = me.model.get('hov_borderradiuslock') ? me.model.get('hov_borderradiuslock') : 0;
						if(typeof isLocked !== "undefined" && isLocked.length > 0) {
							me.model.set('hov_borderradius1', value);
							me.model.set('hov_borderradius2', value);
							me.model.set('hov_borderradius3', value);
							me.$el.find("input[name*=hov_borderradius]").val(value);
						}	
					}
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'border_radius border_radius3 border_radius3_hover hover',
					name: 'hov_borderradius3',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set({'hov_borderradius3': value});
						var isLocked = me.model.get('hov_borderradiuslock') ? me.model.get('hov_borderradiuslock') : 0;
						if(typeof isLocked !== "undefined" && isLocked.length > 0) {
							me.model.set('hov_borderradius1', value);
							me.model.set('hov_borderradius2', value);
							me.model.set('hov_borderradius4', value);
							me.$el.find("input[name*=hov_borderradius]").val(value);
						}	
					}
				}),
				
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'border_radius_lock border_radius_lock_hover hover',
					name: 'hov_borderradiuslock',
					label: "",
					default_value: 0,
					multiple: false,
					values: [
						{ label: '', value: 'yes' }
					],
					change: function(value) {
						me.model.set({'hov_borderradiuslock': value});
						
						if(typeof value !== "undefined" && value.length > 0) {
							var firstRadio = me.model.get('hov_borderradius1');
							me.model.set('hov_borderradius2', firstRadio);
							me.model.set('hov_borderradius3', firstRadio);
							me.model.set('hov_borderradius4', firstRadio);
							me.$el.find("input[name*=hov_borderradius]").val(firstRadio);
						}	
					}
				}),
				
				new FieldSeparator({
					className: 'preset-separator',
					name: 'presetseparator'
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'duration',
					name: 'hov_duration',
					min: 0,
					label: l10n.animate_hover_changes,
					step: 0.1,
					values: [
						{ label: '', value: '12' }
					],
					change: function(value) {
						me.model.set({'hov_duration': value});
					}
				}),
				
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
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
					change: function(value) {
						me.model.set({'hov_transition': value});
					}
				})

			]);
		}
	});

	return ButtonSettingsHover;
});