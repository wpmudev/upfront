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
define(function() {
	var l10n = Upfront.Settings.l10n.button_element;
	var TypographySettingsItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'settings_module typography_settings_item',
		group: true,
		
		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};

			var me = this,
				state = this.options.state;
			
			var current_element = '';
			
			this.fields = _([
				new Upfront.Views.Editor.Field.Select({
					label: l10n.type_element,
					values: me.options.elements,
					change: function () {
						var value = this.get_value();
						current_element = value + '_';
						me.fields._wrapped[1].set_value(me.model.get(current_element + me.options.fields.typeface));
						me.fields._wrapped[2].set_value(me.model.get(current_element + me.options.fields.fontstyle));
						me.fields._wrapped[3].set_value(me.model.get(current_element + me.options.fields.size));
						me.fields._wrapped[4].set_value(me.model.get(current_element + me.options.fields.line_height));
						me.fields._wrapped[5].set_value(me.model.get(current_element + me.options.fields.color));
						me.fields._wrapped[5].update_input_border_color(me.model.get(current_element + me.options.fields.color));
					}
				}),
				new Upfront.Views.Editor.Field.Typeface_Chosen_Select({
					name: this.options.fields.typeface,
					model: this.model,
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
					label: l10n.typeface,
					select_width: '225px',
					label_style: 'inline',
					className: state + '-font-face static typeFace',
					change: function(value) {
						me.model.set(current_element + me.options.fields.typeface, value);
						
						me.fields._wrapped[1] = new Upfront.Views.Editor.Field.Typeface_Style_Chosen_Select({
							model: this.model,
							name: me.options.fields.fontstyle,
							values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get(me.options.fields.typeface)),
							label: l10n.weight_style,
							font_family: me.model.get(me.options.fields.typeface),
							select_width: '225px',
							label_style: 'inline',
							className: state + 'font-style static weightStyle',
							change: function(value) {
								//Explode Font style and font weight and save them as separate values
								var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
								me.model.set(current_element + me.options.fields.fontstyle, value);
								me.model.set(current_element + me.options.fields.weight, parsed_variant.weight);
								me.model.set(current_element + me.options.fields.style, parsed_variant.style);
							},
						}),
						me.$el.empty();
						me.render();
					}
				}),
				
				new Upfront.Views.Editor.Field.Typeface_Style_Chosen_Select({
					model: this.model,
					name: this.options.fields.weight,
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get('fontface')),
					label: l10n.weight_style,
					font_family: me.model.get(this.options.fields.typeface),
					select_width: '225px',
					label_style: 'inline',
					className: state + '-font-style static weightStyle',
					change: function(value) {
						//Explode Font style and font weight and save them as separate values
						var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
						me.model.set(current_element + me.options.fields.fontstyle, value);
						me.model.set(current_element + me.options.fields.weight, parsed_variant.weight);
						me.model.set(current_element + me.options.fields.style, parsed_variant.style);
					},
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + 'font-size fontSize',
					name: this.options.fields.size,
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
					className: state + '-font-lineheight lineHeight',
					name: this.options.fields.line_height,
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
					className: state + '-font-color upfront-field-wrap upfront-field-wrap-color sp-cf fontColor',
					name: this.options.fields.color,
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
			
			//Remove inner elements dropdown if none
			if(typeof me.options.elements === "undefined") {
				this.fields.splice(0,1);
			}
		}
	});

	return TypographySettingsItem;
});
