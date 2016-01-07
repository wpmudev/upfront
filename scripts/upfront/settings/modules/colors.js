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
	var ColorsSettingsModule = BaseModule.extend({
		className: 'settings_module colors_settings_item clearfix',
		group: true,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};
			this.fieldCounter = 0;
			var me = this,
				state = this.options.state,
				per_row = 'single',
				toggleClass = 'no-toggle',
				fields = [];

			if(this.options.toggle === true) {
				this.fieldCounter++;
			}

			if(this.options.single !== true) {
				per_row = 'two';
			}
			_.each(this.options.abccolors, function(color) {
				if(me.options.toggle === true) {
					toggleClass = 'element-toggled';
				}
				var colorField = new Upfront.Views.Editor.Field.Color({
					className: state + '-color-field upfront-field-wrap-color color-module module-color-field ' + toggleClass + ' ' + per_row,
					blank_alpha : 0,
					model: me.model,
					name: color.name,
					default_value: me.model.get(color.name),
					label_style: 'inline',
					label: color.label,
					spectrum: {
						preferredFormat: 'hex',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(color.name, c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(color.name, c);
						}
					}
				});
				fields.push(colorField);
			});

			this.fields = _(fields);

			//Add toggle colors checkbox
			if(this.options.toggle === true) {
				this.group = false;
				this.fields.unshift(
					new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						className: 'useColors checkbox-title',
						name: me.options.fields.use,
						label: '',
						multiple: false,
						values: [
							{
								label: l10n.color,
								value: 'yes',
								checked: this.model.get(me.options.fields.use)
							}
						],
						change: function(value) {
							me.model.set(me.options.fields.use, value);
							me.reset_fields(value);
						},
						show: function(value, $el) {
							var stateSettings = $el.closest('.state_modules');
							//Toggle color fields
							if(value == "yes") {
								stateSettings.find('.'+ state +'-color-field').show();
							} else {
								stateSettings.find('.'+ state +'-color-field').hide();
							}
						}
					})
				);
			}

			this.listenForCssOverrides();
		},

		isCssOverridden: function() {
			var view = this.options.elementView;
			var selectors = this.options.selectorsForCssCheck;
			if (typeof view === 'undefined' || typeof selectors === 'undefined') return false;

			// Don't check if border is not used
			if (this.options.toggle && !this.model.get(this.options.fields.use)) return false;

			var isOverridden = false;

			_.each(this.options.abccolors, function(color) {
				// Some colors are for pseudo elements which can't be accessed with JavaScript, allow module definitiions
				// to skip check for those
				var convertedColor = hexToRgb(
					Upfront.Util.colors.to_color_value(
						this.model.get(color.name)
					)
				);

				// So apparently we have RGBA format in the model that's named RGB :/
				// How the hell this happens???
				if (convertedColor.match(/rgb\((\d+,\s?){3}\s?\d+\)/)) {
					convertedColor = convertedColor.replace(/^rgb/, 'rgba');
				}

				var elementColor = view.$el.find(selectors[color.name].selector).css(selectors[color.name].cssProperty);
				if (elementColor && this.to_normalized_color_comparison_string(convertedColor) !== this.to_normalized_color_comparison_string(elementColor)) {
					isOverridden = true;
				}

			}, this);
			return isOverridden;
		},

		/**
		 * Attempt to make sure color representations are uniform.
		 * Doesn't yield back the usable color, but rather a comparison string.
		 *
		 * @param {String} str Color representation in string form
		 *
		 * @return {String} Uniform color comparison string
		 */
		to_normalized_color_comparison_string: function (str) {
			var color = hexToRgb(Upfront.Util.colors.to_color_value(str)),
				bare = '',
				parts = []
			;
			// So apparently we have RGBA format in the model that's named RGB :/
			// How the hell this happens???
			if (color.match(/rgb\((\d+,\s?){3}\s?\d+\)/)) {
				color = color.replace(/^rgb/, 'rgba');
			}
			bare = color.replace(/\s+/, '').replace(/rgba?\(/, '').replace(/\)?$/, ''); // Remove all but comma-separated numbers
			parts = bare.split(",");

			// Something went wrong, bail out
			if (!parts.length || parts.length < 3) return color;

			if (parts.length < 4) parts[3] = parts[3] || "1"; // Force alpha

			return JSON.stringify({
				r: parseFloat(parts[0], 10),
				g: parseFloat(parts[1], 10),
				b: parseFloat(parts[2], 10),
				a: parseFloat(parts[3], 10),
			});
		},

		reset_fields: function(value) {
			var me = this;
			if(typeof value !== "undefined" && value === "yes") {
				_.each(this.options.abccolors, function(color) {
					var settings = me.get_static_field_value(color, me.options.prepend);
					me.update_field(color, settings);
					me.save_static_value(color, settings);
					this.fieldCounter++;
				});

				this.$el.empty();
				this.render();
			}
		},

		save_static_value: function(color, settings) {
			//Save preset values from static state
			this.model.set(color.name, settings.color);
		},

		get_static_field_value: function(color, prepend) {
			var settings = {},
				prefix = '';

			if(typeof this.options.prefix !== "undefined") {
				prefix = this.options.prefix + '-';
			}

			settings.color = this.model.get(this.clear_prepend(prefix + color.name, prepend)) || '';

			return settings;
		},

		clear_prepend: function(field, prepend) {
			return field.replace(prepend, '');
		},

		update_field: function(color, settings) {
			//Update selected element
			this.fields._wrapped[this.fieldCounter].set_value(settings.color);
			this.fields._wrapped[this.fieldCounter].update_input_border_color(settings.color);
		},
		render: function() {
			var me = this;
			this.constructor.__super__.render.call(this);
			this.fields.each( function (field) {
				if(typeof field.spectrumOptions !== "undefined") {
					var color = me.model.get(field.name);
					field.set_value(color);
					field.update_input_border_color(Upfront.Util.colors.to_color_value(color));
				}
      });
		}
	});

	return ColorsSettingsModule;
});
