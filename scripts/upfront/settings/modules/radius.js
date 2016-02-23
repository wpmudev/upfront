/*
* Field names properies
* `use` - Toggle radius settings
* `lock` - Lock radius
* `radius` - Radius slider
* `radius_number` - Radius number field
* `radius1` - Top left corner
* `radius2` - Top right corner
* `radius3` - Bottom left corner
* `radius4` - Bottom right corner
*/
define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var RadiusSettingsModule = BaseModule.extend({
		className: 'settings_module corner_radius_settings_item clearfix',
		group: false,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};

			if (this.options.max_value && this.options.max_value < 200) this.options.max_value = 200;
			if (!this.options.max_value) this.options.max_value = 200;

			var me = this,
				state = this.options.state;

			var sliderOnChange = function () {
				//Update border radius
				var value = this.get_value();
				var data = {};
				data[me.options.fields.radius1] = value;
				data[me.options.fields.radius2] = value;
				data[me.options.fields.radius3] = value;
				data[me.options.fields.radius4] = value;
				data[me.options.fields.radius] = value;
				me.model.set(data, {silent: true});
				me.model.set(me.options.fields.radius_number, value);
				me.$el.find("input[name="+ me.options.fields.radius1 +"]").val(value);
				me.$el.find("input[name="+ me.options.fields.radius2 +"]").val(value);
				me.$el.find("input[name="+ me.options.fields.radius3 +"]").val(value);
				me.$el.find("input[name="+ me.options.fields.radius4 +"]").val(value);
				me.$el.find("input[name="+ me.options.fields.radius_number +"]").val(value);

				//Set opacity to 1
				me.$el.closest('.state_modules').find('.'+ state +'-radius-slider').css('opacity', 1);
			};
			var throttledSliderOnChange = _.throttle(sliderOnChange, 16);

			var radiusOnChange = function(value) {
/*
// --- Don't do any of this - it's duplicated code and will fail to update properly as a result ---
				me.model.set(me.options.fields.radius_number, value);
				//Update border radius
				var data = {};
				data[me.options.fields.radius1] = value;
				data[me.options.fields.radius2] = value;
				data[me.options.fields.radius3] = value;
				data[me.options.fields.radius4] = value;
				data[me.options.fields.radius] = value;
				me.model.set(data, {silent: true});

				me.$el.find("input[name="+ me.options.fields.radius1 +"]").val(value);
				me.$el.find("input[name="+ me.options.fields.radius2 +"]").val(value);
				me.$el.find("input[name="+ me.options.fields.radius3 +"]").val(value);
				me.$el.find("input[name="+ me.options.fields.radius4 +"]").val(value);
				me.$el.find("input[name="+ me.options.fields.radius +"]").val(value);
*/
// --- Instead, just update slider value and deal with changes there ---
				//Update slider value
				s = me.fields._wrapped[2];
				s.$el.find('#'+s.get_field_id()).slider('value', value);
				s.get_field().val(value);

				// Now, once we updated the slider value, let that handler take care of it
				sliderOnChange.apply(s);

				//Lower opacity if value is bigger than the slider MAX_VALUE
				if(value > me.options.max_value) {
					me.$el.closest('.state_modules').find('.'+ state +'-radius-slider').css('opacity', 0.6);
				} else {
					me.$el.closest('.state_modules').find('.'+ state +'-radius-slider').css('opacity', 1);
				}
			};
			var throttledRadiusOnChange = _.throttle(radiusOnChange, 16);

			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'useRadius checkbox-title',
					name: me.options.fields.use,
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: l10n.rounded_corners, value: 'yes' }
					],
					change: function(value) {
						me.model.set(me.options.fields.use, value);
						me.reset_fields(value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.state_modules');
						var lock = me.model.get(me.options.fields.lock);
						//Toggle border radius fields
						if(value == "yes") {
							if(lock == "yes") {
								stateSettings.find('.'+ state +'-radius-slider').show();
								stateSettings.find('.'+ state +'-radius-slider-number').show();
							} else {
								stateSettings.find('.'+ state +'-radius-slider').hide();
								stateSettings.find('.'+ state +'-radius-slider-number').hide();
								stateSettings.find('.'+ state +'-radius1').show();
								stateSettings.find('.'+ state +'-radius2').show();
								stateSettings.find('.'+ state +'-radius3').show();
								stateSettings.find('.'+ state +'-radius4').show();
							}
						} else {
							stateSettings.find('.'+ state +'-radius1').hide();
							stateSettings.find('.'+ state +'-radius2').hide();
							stateSettings.find('.'+ state +'-radius3').hide();
							stateSettings.find('.'+ state +'-radius4').hide();
							stateSettings.find('.'+ state +'-radius-slider').hide();
							stateSettings.find('.'+ state +'-radius-slider-number').hide();
						}
					}
				}),

				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: state + '-radius-lock border_radius_lock',
					name: me.options.fields.lock,
					label: "",
					default_value: 0,
					multiple: false,
					values: [
						{ label: '', value: 'yes' }
					],
					show: function(value) {
						me.model.set(me.options.fields.lock, value);

						var stateSettings = me.$el.closest('.state_modules');
						var useRadius = me.model.get(me.options.fields.use);

						//Toggle border radius fields
						if(value == "yes" && useRadius == "yes") {
							stateSettings.find('.'+ state +'-radius-slider').show();
							stateSettings.find('.'+ state +'-radius-slider-number').show();
							stateSettings.find('.'+ state +'-radius1').hide();
							stateSettings.find('.'+ state +'-radius2').hide();
							stateSettings.find('.'+ state +'-radius3').hide();
							stateSettings.find('.'+ state +'-radius4').hide();
						} else {
							if(useRadius == "yes") {
								stateSettings.find('.'+ state +'-radius-slider').hide();
								stateSettings.find('.'+ state +'-radius-slider-number').hide();
								stateSettings.find('.'+ state +'-radius1').show();
								stateSettings.find('.'+ state +'-radius2').show();
								stateSettings.find('.'+ state +'-radius3').show();
								stateSettings.find('.'+ state +'-radius4').show();
							}
						}
					}
				}),


				new Upfront.Views.Editor.Field.Slider({
					className: state + '-radius-slider upfront-field-wrap upfront-field-wrap-slider radius-slider',
					model: this.model,
					name: me.options.fields.radius,
					suffix: l10n.px,
					min: 0,
					max: me.options.max_value,
					step: 10,
					change: throttledSliderOnChange,
					show: function() {
						var value = me.model.get(me.options.fields.radius_number);
						if(value > me.options.max_value) {
							me.$el.closest('.state_modules').find('.'+ state +'-radius-slider').css('opacity', 0.6);
						} else {
							me.$el.closest('.state_modules').find('.'+ state +'-radius-slider').css('opacity', 1);
						}
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius-slider-number border_radius_number',
					name: me.options.fields.radius_number,
					label: '',
					min: 0,
					max: 1000,
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: throttledRadiusOnChange
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius1 border_radius border_radius1',
					name: me.options.fields.radius1,
					label: '',
					min: 0,
					max: 1000,
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set(me.options.fields.radius1, value);
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius2 border_radius border_radius2 border_radius2_static',
					name: me.options.fields.radius2,
					label: '',
					min: 0,
					max: 1000,
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set(me.options.fields.radius2, value);
					}
				}),

				new	Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius4 border_radius border_radius4',
					name: me.options.fields.radius4,
					label: '',
					min: 0,
					max: 1000,
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set(me.options.fields.radius4, value);
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius3 border_radius border_radius3',
					name: me.options.fields.radius3,
					label: '',
					min: 0,
					max: 1000,
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set(me.options.fields.radius3, value);
					}
				}),


			]);
		},
		reset_fields: function(value) {
			if(typeof value !== "undefined" && value === "yes") {
				var settings = this.get_static_field_values(value, this.options.prepend);
				this.update_fields(value, settings);
				this.save_static_values(value, settings);
				this.$el.empty();
				this.render();
			}
		},

		save_static_values: function(value, settings) {
			//Save preset values from static state
			this.model.set(this.options.fields.lock, settings.lock);
			this.model.set(this.options.fields.radius, settings.radius);
			this.model.set(this.options.fields.radius_number, settings.radius_number);
			this.model.set(this.options.fields.radius1, settings.radius1);
			this.model.set(this.options.fields.radius2, settings.radius2);
			this.model.set(this.options.fields.radius3, settings.radius3);
			this.model.set(this.options.fields.radius4, settings.radius4);
		},

		get_static_field_values: function(value, prepend) {
			var settings = {},
				prefix = '';

			if(typeof this.options.prefix !== "undefined") {
				prefix = this.options.prefix + '-';
			}

			settings.lock = this.model.get(this.clear_prepend(prefix + this.options.fields.lock, prepend)) || '';
			settings.radius = this.model.get(this.clear_prepend(prefix + this.options.fields.radius, prepend)) || '';
			settings.radius_number = this.model.get(this.clear_prepend(prefix + this.options.fields.radius_number, prepend)) || '';
			settings.radius1 = this.model.get(this.clear_prepend(prefix + this.options.fields.radius1, prepend)) || '';
			settings.radius2 = this.model.get(this.clear_prepend(prefix + this.options.fields.radius2, prepend)) || '';
			settings.radius3 = this.model.get(this.clear_prepend(prefix + this.options.fields.radius3, prepend)) || '';
			settings.radius4 = this.model.get(this.clear_prepend(prefix + this.options.fields.radius4, prepend)) || '';

			return settings;
		},

		clear_prepend: function(field, prepend) {
			return field.replace(prepend, '');
		},

		update_fields: function(value, settings) {
			//Update slider value
			s = this.fields._wrapped[2];
			s.$el.find('#'+s.get_field_id()).slider('value', settings.radius);
			s.get_field().val(settings.radius);
			s.trigger('changed');
		},
	});

	return RadiusSettingsModule;
});
