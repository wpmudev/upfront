/*
* Field names properties
* `use` - Toggle border settings
* `width` - Border width
* `type` - Border type
* `color` - Border color
*/
define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var BorderSettingsModule = BaseModule.extend({
		className: 'settings_module border_settings_item clearfix',
		group: false,

		initialize: function(options) {
			this.options = options || {};
			this.fieldCounter = 0;
			this.currentElement = '';
			if(typeof this.options.showLabel === "undefined") { 
				this.options.showLabel = true; 
			}
			
			var me = this,
				state = this.options.state,
				custom_class = '';

			// Border toggle is always true
			this.options.toggle = true;

			//If fields added increase field counter
			if(typeof this.options.elements !== "undefined") {
				this.fieldCounter++;
			}

			//Set default element
			if(typeof this.options.default_element !== "undefined") {
				this.currentElement = this.options.default_element + '-';
				custom_class = 'border-with-fields';
			}

			this.fields = _([
				new Upfront.Views.Editor.Field.Toggle({
					model: this.model,
					className: 'useBorder checkbox-title upfront-toggle-field',
					name: me.options.fields.use,
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: me.options.label || l10n.border, value: 'yes' }
					],
					change: function(value) {
						me.model.set(me.options.fields.use, value);
						me.reset_fields(value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.upfront-settings-item-content');

						//Toggle border settings when depending on checkbox value
						if(value == "yes") {
							stateSettings.find('.' + state + '-toggle-wrapper').show();
							stateSettings.find('.' + state + '-border-select-element').css("opacity", "1");
						} else {
							stateSettings.find('.' + state + '-toggle-wrapper').hide();
							stateSettings.find('.' + state + '-border-select-element').css("opacity", "0.5");
						}
					}
				}),
				new Upfront.Views.Editor.Field.Number_Unit({
					model: this.model,
					className: state + '-border-width borderWidth ' + custom_class,
					name: this.currentElement + me.options.fields.width,
					default_value: 1,
					values: [
						{ label: "", value: '1' }
					],
					change: function(value) {
						me.model.set(me.currentElement + me.options.fields.width, value);
						if (typeof me.options.elements !== "undefined") {
							_.each(me.options.elements, function(element) {
								me.model.set(element.value + '-' + me.options.fields.width, value);
							});
						}
						this.trigger('change');
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-border-type borderType ' + custom_class,
					name: this.currentElement + me.options.fields.type,
					default_value: "solid",
					values: [
						{ label: '―', value: 'solid' },
						{ label: '┅', value: 'dashed' },
						{ label: '⋯', value: 'dotted' }
					],
					change: function(value) {
						me.model.set(me.currentElement + me.options.fields.type, value);
						if (typeof me.options.elements !== "undefined") {
							_.each(me.options.elements, function(element) {
								me.model.set(element.value + '-' + me.options.fields.type, value);
							});
						}
					}
				}),

				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: state + '-border-color upfront-field-wrap upfront-field-wrap-color sp-cf borderColor ' + custom_class + ' color-label-' + this.options.showLabel,
					name: this.currentElement + me.options.fields.color,
					blank_alpha : 0,
					label: '',
					default_value: '#000',
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(me.currentElement + me.options.fields.color, c);
							if (typeof me.options.elements !== "undefined") {
								_.each(me.options.elements, function(element) {
									me.model.set(element.value + '-' + me.options.fields.color, c);
								});
							}
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(me.currentElement + me.options.fields.color, c);
							if (typeof me.options.elements !== "undefined") {
								_.each(me.options.elements, function(element) {
									me.model.set(element.value + '-' + me.options.fields.color, c);
								});
							}
						}
					}
				})
			]);

			//Add fields select box
			if (typeof me.options.elements !== "undefined") {
				this.fields.unshift(
					new Upfront.Views.Editor.Field.Select({
						className: state + '-border-select-element border_selectElement',
						name: 'tagsToApply',
						default_value: me.model.get('tagsToApply') || 'field-button',
						values: me.options.elements,
						change: function () {
							var value = this.get_value();
							me.model.set({'tagsToApply': value});
							me.currentElement = value + '-';
						}
					})
				);
			}
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
					this.update_fields(settings);
					this.save_static_values(settings, '');
				}
				this.$el.empty();
				this.render();
			}
		},

		save_static_values: function(settings, element) {
			//Save preset values from static state
			this.model.set(element + this.options.fields.width, settings.width);
			this.model.set(element + this.options.fields.type, settings.type);
			this.model.set(element + this.options.fields.color, settings.color);
		},

		get_static_field_values: function(prepend, element) {
			var settings = {},
				prefix = '';

			if(typeof this.options.prefix !== "undefined") {
				prefix = this.options.prefix + '-';
			}

			settings.width = this.model.get(this.clear_prepend(element + prefix + this.options.fields.width, prepend)) || '';
			settings.type = this.model.get(this.clear_prepend(element + prefix + this.options.fields.type, prepend)) || '';
			settings.color = this.model.get(this.clear_prepend(element + prefix + this.options.fields.color, prepend)) || '';

			return settings;
		},

		clear_prepend: function(field, prepend) {
			return field.replace(prepend, '');
		},

		update_fields: function(settings) {
			//Update selected element
			this.fields._wrapped[this.fieldCounter + 1].set_value(settings.width);
			this.fields._wrapped[this.fieldCounter + 2].set_value(settings.type);
			this.fields._wrapped[this.fieldCounter + 3].set_value(settings.color);
			this.fields._wrapped[this.fieldCounter + 3].update_input_border_color(settings.color);
		}
	});

	return BorderSettingsModule;
});
