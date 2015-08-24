/*
* Field names properies
* `use` - Overwrite theme settings
* `element` - Font element
* `typeface` - Font family
* `weight` - Font weight / style
* `size` - Font size
* `line_height` - Font line height
* `color` - Font color
*/
define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var TypographySettingsItem = BaseModule.extend({
		className: 'settings_module typography_settings_item',
		group: true,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				state = this.options.state,
				toggleClass = 'no-toggle',
				fieldCounter = 0,
				current_element = '';

			if(typeof me.options.elements !== "undefined") {
				fieldCounter++;
			}

			//Set default element
			if(typeof this.options.default_element !== "undefined") {
				current_element = this.options.default_element + '-';
			}
			
			if(me.model.get(state + '-element-type') !== "") {
				current_element = me.model.get(state + '-element-type') + '-';
			}

			if(this.options.toggle === true) {
				fieldCounter++;
				toggleClass = 'element-toggled';
			}

			this.fields = _([
				new Upfront.Views.Editor.Field.Typeface_Chosen_Select({
					name: current_element + this.options.fields.typeface,
					model: this.model,
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
					label: l10n.typeface,
					select_width: '225px',
					label_style: 'inline',
					className: state + '-font-face static typeFace ' + toggleClass,
					change: function(value) {
						me.model.set(current_element + me.options.fields.typeface, value);
						me.fields._wrapped[1 + fieldCounter] = new Upfront.Views.Editor.Field.Typeface_Style_Chosen_Select({
							model: this.model,
							name: current_element + me.options.fields.fontstyle,
							values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get(current_element + me.options.fields.typeface)),
							label: l10n.weight_style,
							font_family: me.model.get(me.options.fields.typeface),
							select_width: '225px',
							label_style: 'inline',
							className: state + '-font-style static weightStyle ' + toggleClass,
							change: function(value) {
								//Explode Font style and font weight and save them as separate values
								var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
								me.model.set(current_element + me.options.fields.fontstyle, value);
								me.model.set(current_element + me.options.fields.weight, parsed_variant.weight);
								me.model.set(current_element + me.options.fields.style, parsed_variant.style);
							},
							show: function(value) {
								if(value !== null) {
									me.fields._wrapped[1 + fieldCounter].set_option_font(value);
								}
							}
						});
						me.$el.empty();
						me.render();
					}
				}),

				new Upfront.Views.Editor.Field.Typeface_Style_Chosen_Select({
					model: this.model,
					name: current_element + this.options.fields.fontstyle,
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get(current_element + me.options.fields.typeface)),
					label: l10n.weight_style,
					font_family: me.model.get(this.options.fields.typeface),
					select_width: '225px',
					label_style: 'inline',
					className: state + '-font-style static weightStyle ' + toggleClass,
					change: function(value) {
						//Explode Font style and font weight and save them as separate values
						var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
						me.model.set(current_element + me.options.fields.fontstyle, value);
						me.model.set(current_element + me.options.fields.weight, parsed_variant.weight);
						me.model.set(current_element + me.options.fields.style, parsed_variant.style);
					},
					show: function(value) {
						if(value !== null) {
							me.fields._wrapped[1 + fieldCounter].set_option_font(value);
						}
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-font-size fontSize ' + toggleClass,
					name: current_element + this.options.fields.size,
					label: l10n.size,
					label_style: 'inline',
					suffix: l10n.px,
					default_value: 12,
					change: function(value) {
						me.model.set(current_element + me.options.fields.size, value);
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-font-lineheight lineHeight ' + toggleClass,
					name: current_element + this.options.fields.line_height,
					label: l10n.line_height,
					label_style: 'inline',
					default_value: 1,
					min: 0,
					step: 0.1,
					change: function(value) {
						me.model.set(current_element + me.options.fields.line_height, value);
					}
				}),

				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: state + '-font-color upfront-field-wrap upfront-field-wrap-color sp-cf fontColor ' + toggleClass,
					name: current_element + this.options.fields.color,
					blank_alpha : 0,
					default_value: '#000',
					label_style: 'inline',
					label: l10n.color,
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(current_element + me.options.fields.color, c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(current_element + me.options.fields.color, c);
						}
					}
				}),

			]);


			//Add fields select box
			if(typeof me.options.elements !== "undefined") {
				this.fields.unshift(
					new Upfront.Views.Editor.Field.Select({
						model: this.model,
						label: l10n.type_element,
						label_style: 'inline',
						name: state + '-element-type',
						className: state + '-select-element selectElement ' + toggleClass,
						values: me.options.elements,
						change: function () {
							//Get the value
							var value = this.get_value();

							//Update element type value to keep it on typography re-render
							me.model.set(state + '-element-type', value);

							//Reset typography fields for selected element
							current_element = value + '-';
							me.fields._wrapped[fieldCounter -1].set_value(value);
							me.fields._wrapped[fieldCounter].set_value(me.model.get(current_element + me.options.fields.typeface));
							me.fields._wrapped[fieldCounter].set_option_font(me.model.get(current_element + me.options.fields.typeface));
							me.fields._wrapped[fieldCounter + 1].set_value(me.model.get(current_element + me.options.fields.fontstyle));
							me.fields._wrapped[fieldCounter + 1].set_option_font(me.model.get(current_element + me.options.fields.fontstyle));
							me.fields._wrapped[fieldCounter + 2].set_value(me.model.get(current_element + me.options.fields.size));
							me.fields._wrapped[fieldCounter + 3].set_value(me.model.get(current_element + me.options.fields.line_height));
							me.fields._wrapped[fieldCounter + 4].set_value(me.model.get(current_element + me.options.fields.color));
							me.fields._wrapped[fieldCounter + 4].update_input_border_color(me.model.get(current_element + me.options.fields.color));
						},
					})
				);
			}

			//Add toggle typography checkbox
			if(this.options.toggle === true) {
				this.group = false;
				this.fields.unshift(
					new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						className: 'useTypography checkbox-title ' + toggleClass,
						name: me.options.fields.use,
						label: '',
						default_value: 1,
						multiple: false,
						values: [
							{ label: l10n.typography, value: 'yes' }
						],
						change: function(value) {
							me.model.set(me.options.fields.use, value);
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_modules');
							//Toggle typography fields
							if(value == "yes") {
								stateSettings.find('.'+ state +'-select-element').show();
								stateSettings.find('.'+ state +'-font-face').show();
								stateSettings.find('.'+ state +'-font-style').show();
								stateSettings.find('.'+ state +'-font-size').show();
								stateSettings.find('.'+ state +'-font-lineheight').show();
								stateSettings.find('.'+ state +'-font-color').show();
							} else {
								stateSettings.find('.'+ state +'-select-element').hide();
								stateSettings.find('.'+ state +'-font-face').hide();
								stateSettings.find('.'+ state +'-font-style').hide();
								stateSettings.find('.'+ state +'-font-size').hide();
								stateSettings.find('.'+ state +'-font-lineheight').hide();
								stateSettings.find('.'+ state +'-font-color').hide();
							}
						}
					})
				);
			}
		}
	});

	return TypographySettingsItem;
});
