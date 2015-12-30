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
	var hexToRgb = function (color) {
		if (!/^#[0-9A-F]{6}$/i.test(color)) {
			return color;
		}
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
		return result ? 'rgb('+ parseInt(result[1], 16) + ', '+
				parseInt(result[2], 16) + ', ' +
				parseInt(result[3], 16) + ')'
				: color;
	};

	var l10n = Upfront.Settings.l10n.preset_manager;
	var TypographySettingsItem = BaseModule.extend({
		className: 'settings_module typography_settings_item',
		group: true,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};
			this.fieldCounter = 0;
			this.currentElement = '';
			var me = this,
				state = this.options.state,
				toggleClass = 'no-toggle';

			//Increase field counter if inner elements
			if(typeof me.options.elements !== "undefined") {
				this.fieldCounter++;
			}

			//Set default element
			if(typeof this.options.default_element !== "undefined") {
				this.currentElement = this.options.default_element + '-';
			}

			//Set saved element to default element
			if(typeof this.model.get(state + '-element-type') !== "undefined" && typeof this.options.elements !== "undefined") {
				this.currentElement = this.model.get(state + '-element-type') + '-';
			}

			if(this.options.toggle === true) {
				this.fieldCounter++;
				toggleClass = 'element-toggled';
			}

			this.fields = _([
				new Upfront.Views.Editor.Field.Typeface_Chosen_Select({
					name: this.currentElement + this.options.fields.typeface,
					model: this.model,
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_fonts_for_select(),
					default_value: this.model.get(this.currentElement + this.options.fields.typeface),
					label: l10n.typeface,
					select_width: '225px',
					label_style: 'inline',
					className: state + '-font-face static typeFace ' + toggleClass,
					change: function(value) {
						me.model.set(me.currentElement + me.options.fields.typeface, value);
						me.fields._wrapped[1 + me.fieldCounter] = new Upfront.Views.Editor.Field.Typeface_Style_Chosen_Select({
							model: this.model,
							name: me.currentElement + me.options.fields.fontstyle,
							values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get(me.currentElement + me.options.fields.typeface)),
							label: l10n.weight_style,
							font_family: me.model.get(me.options.fields.typeface),
							select_width: '225px',
							label_style: 'inline',
							className: state + '-font-style static weightStyle ' + toggleClass,
							change: function(value) {
								//Explode Font style and font weight and save them as separate values
								var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
								me.model.set(me.currentElement + me.options.fields.fontstyle, value);
								me.model.set(me.currentElement + me.options.fields.weight, parsed_variant.weight);
								me.model.set(me.currentElement + me.options.fields.style, parsed_variant.style);
							},
							show: function(value) {
								if(value !== null) {
									me.fields._wrapped[1 + me.fieldCounter].set_option_font(value);
								}
							}
						});
						me.$el.empty();
						me.render();
					}
				}),

				new Upfront.Views.Editor.Field.Typeface_Style_Chosen_Select({
					model: this.model,
					name: this.currentElement + this.options.fields.fontstyle,
					values: Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(me.model.get(this.currentElement + me.options.fields.typeface)),
					default_value: this.model.get(this.currentElement + this.options.fields.fontstyle),
					label: l10n.weight_style,
					font_family: me.model.get(this.options.fields.typeface),
					select_width: '225px',
					label_style: 'inline',
					className: state + '-font-style static weightStyle ' + toggleClass,
					change: function(value) {
						//Explode Font style and font weight and save them as separate values
						var parsed_variant = Upfront.Views.Font_Model.parse_variant(value);
						me.model.set(me.currentElement + me.options.fields.fontstyle, value);
						me.model.set(me.currentElement + me.options.fields.weight, parsed_variant.weight);
						me.model.set(me.currentElement + me.options.fields.style, parsed_variant.style);
					},
					show: function(value) {
						if(value !== null) {
							me.fields._wrapped[1 + me.fieldCounter].set_option_font(value);

						}
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-font-size fontSize ' + toggleClass,
					name: this.currentElement + this.options.fields.size,
					default_value: this.model.get(this.currentElement + this.options.fields.size),
					label: l10n.size,
					label_style: 'inline',
					suffix: l10n.px,
					change: function(value) {
						me.model.set(me.currentElement + me.options.fields.size, value);
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-font-lineheight lineHeight ' + toggleClass,
					name: this.currentElement + this.options.fields.line_height,
					label: l10n.line_height,
					label_style: 'inline',
					default_value: this.model.get(this.currentElement + this.options.fields.line_height),
					min: 0,
					step: 0.1,
					change: function(value) {
						me.model.set(me.currentElement + me.options.fields.line_height, value);
					}
				}),

				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: state + '-font-color upfront-field-wrap upfront-field-wrap-color sp-cf fontColor ' + toggleClass,
					name: this.currentElement + this.options.fields.color,
					default_value: this.model.get(this.currentElement + this.options.fields.color),
					blank_alpha : 0,
					label_style: 'inline',
					label: l10n.color,
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(me.currentElement + me.options.fields.color, c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(me.currentElement + me.options.fields.color, c);
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
						change: function (value) {
							//Update element type value to keep it on typography re-render
							me.model.set(state + '-element-type', value);
							me.$el.empty();
							me.render();
						},
						show: function(value) {
							me.currentElement = value + '-';
							var settings = me.get_field_values(value);
							me.update_fields(settings);
						}
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
						multiple: false,
						values: [
							{
								label: l10n.typography,
								value: 'yes',
								checked: this.model.get(me.options.fields.use)
							}
						],
						change: function(value) {
							console.log('triggered change on checkbox');
							me.model.set(me.options.fields.use, value);
							me.reset_fields(value);
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

			this.listenForCssOverrides();
		},

		isCssOverridden: function() {
			var view = this.options.elementView,
				selectors = this.options.selectorsForCssCheck,
				expected,
				actual,
				font_size
			;
			if (typeof view === 'undefined' || typeof selectors === 'undefined') return false;

			// Don't check if border is not used
			if (this.options.toggle && !this.model.get(this.options.fields.use)) return false;

			// Check overrides
			expected = this.model.get(this.currentElement + this.options.fields.typeface);
			actual = view.$el.find(selectors.all.selector).css('font-family');
			if (!!expected && !(expected === actual || '"' + expected + '"' === actual || "'" + expected + "'" === actual)) {
				// Okay, so they differ. Is the actual style inherited? (could be, let's check)
				var parent = view.$el.find(selectors.all.selector).parent().css('font-family');
				if (parent !== actual) return true; // Nope. Let's bail out now
			}
			// Font style is very complicated to check, skipping for now
			// var fontstyle = this.model.get(this.currentElement + this.options.fields.fontstyle);
			// if (typeof fontstyle !== 'undefined' && fontstyle !== '' &&
				// fontstyle !== view.$el.find(selectors.all.selector).css('font-style')) {
				// return true;
			// }
			
			expected = parseInt(this.model.get(this.currentElement + this.options.fields.size), 10);
			actual = parseInt(view.$el.find(selectors.all.selector).css('font-size'), 10);
			font_size = actual;
			if (!!expected && expected !== actual) {
				return true;
			}
			expected = parseInt(this.model.get(this.currentElement + this.options.fields.line_height), 10);
			actual = parseInt(view.$el.find(selectors.all.selector).css('line-height'), 10);
			if (!!expected && expected !== actual) {
				if (!font_size) return true;
				if (!!font_size && actual/font_size !== expected) return true; // Line height can be also expressed in pixels by the browser, so let's keep up
			}

			expected = hexToRgb(
				Upfront.Util.colors.to_color_value(
					this.model.get(this.currentElement + this.options.fields.color)
				)
			);
			actual = view.$el.find(selectors.all.selector).css('color');
			if (!!expected && expected !== actual) {
				return true;
			}

			return false;
		},

		reset_fields: function(value) {
			var settings,
				me = this;
			if(typeof value !== "undefined" && value === "yes") {
				if(typeof this.options.elements !== "undefined") {
					_.each(this.options.elements, function(element) {
						var currentElementValue = element.value + '-';
						settings = me.get_static_field_values(me.options.prepend, currentElementValue);
						me.update_fields(settings);
						me.save_static_values(settings, currentElementValue);
					});
				} else {
					settings = this.get_static_field_values(this.options.prepend, '');
					me.update_fields(settings);
					this.save_static_values(settings, '');
				}
				this.$el.empty();
				this.render();
			}
		},

		save_static_values: function(settings, element) {
			//Save preset values from static state
			var parsed_variant = Upfront.Views.Font_Model.parse_variant(settings.fontstyle);
			this.model.set(element + this.options.fields.typeface, settings.typeface);
			this.model.set(element + this.options.fields.fontstyle, settings.fontstyle);
			this.model.set(element + this.options.fields.weight, parsed_variant.weight);
			this.model.set(element + this.options.fields.style, parsed_variant.style);
			this.model.set(element + this.options.fields.size, settings.fontsize);
			this.model.set(element + this.options.fields.line_height, settings.line_height);
			this.model.set(element + this.options.fields.color, settings.color);
		},

		get_static_field_values: function(prepend, element) {
			var settings = {},
				prefix = '';

			if(typeof this.options.prefix !== "undefined") {
				prefix = this.options.prefix + '-';
			}

			settings.typeface = this.model.get(this.clear_prepend(element + prefix + this.options.fields.typeface, prepend)) || '';
			settings.fontstyle = this.model.get(this.clear_prepend(element + prefix + this.options.fields.fontstyle, prepend)) || '';
			settings.fontsize = this.model.get(this.clear_prepend(element + prefix + this.options.fields.size, prepend)) || '';
			settings.line_height = this.model.get(this.clear_prepend(element + prefix + this.options.fields.line_height, prepend)) || '';
			settings.color = this.model.get(this.clear_prepend(element + prefix + this.options.fields.color, prepend)) || '';

			return settings;
		},

		clear_prepend: function(field, prepend) {
			return field.replace(prepend, '');
		},

		get_field_values: function(value) {
			var settings = {};
			//Get stored values else load from Global Typography settings
			if(typeof this.options.global_typography !== "undefined" && this.options.global_typography === true) {
				var font_settings = Upfront.mainData.global_typography[this.normalize_elements_selector(value)] || {};
				settings.typeface = this.model.get(this.currentElement + this.options.fields.typeface) || font_settings.font_face || '';
				settings.fontstyle = this.model.get(this.currentElement + this.options.fields.fontstyle) || font_settings.weight + ' ' + font_settings.style || '';
				settings.fontsize = this.model.get(this.currentElement + this.options.fields.size) || font_settings.size || '';
				settings.line_height = this.model.get(this.currentElement + this.options.fields.line_height) || font_settings.line_height || '';
				settings.color = this.model.get(this.currentElement + this.options.fields.color) || font_settings.color || '';
			} else {
				settings.typeface = this.model.get(this.currentElement + this.options.fields.typeface) || '';
				settings.fontstyle = this.model.get(this.currentElement + this.options.fields.fontstyle) || '';
				settings.fontsize = this.model.get(this.currentElement + this.options.fields.size) || '';
				settings.line_height = this.model.get(this.currentElement + this.options.fields.line_height) || '';
				settings.color = this.model.get(this.currentElement + this.options.fields.color) || '';
			}

			return settings;
		},

		update_fields: function(settings) {
			//Update selected element

			//Update typography fields for selected element
			this.fields._wrapped[this.fieldCounter].set_value(settings.typeface);
			this.fields._wrapped[this.fieldCounter].set_option_font(settings.typeface);
			this.fields._wrapped[this.fieldCounter + 1].options.values = Upfront.Views.Editor.Fonts.theme_fonts_collection.get_variants_for_select(settings.typeface);
			this.fields._wrapped[this.fieldCounter + 1].set_value(settings.fontstyle);
			this.fields._wrapped[this.fieldCounter + 1].set_option_font(settings.fontstyle);
			this.fields._wrapped[this.fieldCounter + 2].set_value(settings.fontsize);
			this.fields._wrapped[this.fieldCounter + 3].set_value(settings.line_height);
			this.fields._wrapped[this.fieldCounter + 4].set_value(settings.color);
			this.fields._wrapped[this.fieldCounter + 4].update_input_border_color(settings.color);
		},

		normalize_elements_selector: function(value) {
			if(value === 'a-hover') {
				return 'a:hover';
			}
			if(value === "blockquote-alternative") {
				return 'blockquote.upfront-quote-alternative';
			}
			return value;
		}
	});

	return TypographySettingsItem;
});
