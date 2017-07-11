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
		className: 'settings_module corner_radius_settings_item upfront-radius-container clearfix',
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

			// Radius toggle is always true
			this.options.toggle = true;

			var radiusOnChange = function(value) {
				var data = {},
					lock = me.model.get(me.options.fields.lock)
				;

				if(lock == "yes") {
					data[me.options.fields.radius1] = value;
					data[me.options.fields.radius2] = value;
					data[me.options.fields.radius3] = value;
					data[me.options.fields.radius4] = value;

					me.model.set(data, {silent: false});

					me.$el.find("input[name=" + me.options.fields.radius1 + "]").val(value);
					me.$el.find("input[name=" + me.options.fields.radius2 + "]").val(value);
					me.$el.find("input[name=" + me.options.fields.radius3 + "]").val(value);
					me.$el.find("input[name=" + me.options.fields.radius4 + "]").val(value);
				}
			};
			var throttledRadiusOnChange = _.throttle(radiusOnChange, 5);

			this.fields = _([
				new Upfront.Views.Editor.Field.Toggle({
					model: this.model,
					className: 'useRadius upfront-toggle-field checkbox-title',
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
						var stateSettings = $el.closest('.upfront-settings-item-content');
						var lock = me.model.get(me.options.fields.lock);
						//Toggle border radius fields
						if(value == "yes") {
							stateSettings.find('.' + state + '-toggle-wrapper').show();
						} else {
							stateSettings.find('.' + state + '-toggle-wrapper').hide();
						}
					}
				}),

				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: state + '-radius-lock border_radius_lock radius-lock',
					name: me.options.fields.lock,
					label: "",
					default_value: 0,
					multiple: false,
					values: [
						{ label: '', value: 'yes' }
					],
					show: function(value) {
						me.model.set(me.options.fields.lock, value);

						var radius_value = me.model.get(me.options.fields.radius1);
						throttledRadiusOnChange(radius_value);
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius1 border_radius border_radius1 upfront-radius-container-top-left field-grid-half',
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
						throttledRadiusOnChange(value);
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius2 border_radius border_radius2 upfront-radius-container-top-right field-grid-half field-grid-half-last',
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
						throttledRadiusOnChange(value);
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius3 border_radius border_radius3 upfront-radius-container-bottom-right field-grid-half',
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
						throttledRadiusOnChange(value);
					}
				}),

				new	Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius4 border_radius border_radius4 upfront-radius-container-bottom-left field-grid-half field-grid-half-last',
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
						throttledRadiusOnChange(value);
					}
				})
			]);
		},

		reset_fields: function(value) {
			if(typeof value !== "undefined" && value === "yes") {
				var settings = this.get_static_field_values(value, this.options.prepend);
				this.save_static_values(value, settings);
				this.$el.empty();
				this.render();
			}
		},

		save_static_values: function(value, settings) {
			//Save preset values from static state
			this.model.set(this.options.fields.lock, settings.lock);
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
			settings.radius1 = this.model.get(this.clear_prepend(prefix + this.options.fields.radius1, prepend)) || '';
			settings.radius2 = this.model.get(this.clear_prepend(prefix + this.options.fields.radius2, prepend)) || '';
			settings.radius3 = this.model.get(this.clear_prepend(prefix + this.options.fields.radius3, prepend)) || '';
			settings.radius4 = this.model.get(this.clear_prepend(prefix + this.options.fields.radius4, prepend)) || '';

			return settings;
		},

		clear_prepend: function(field, prepend) {
			return field.replace(prepend, '');
		}

	});

	return RadiusSettingsModule;
});
