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
define(function() {	
	var l10n = Upfront.Settings.l10n.button_element;
	var RadiusSettingsItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'corner_radius_settings_item clearfix',
		group: false,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};
			var me = this,
				state = this.options.state;

			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'useRadius',
					name: me.options.fields.use,
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: l10n.rounded_corners, value: 'yes' }
					],
					change: function(value) {
						me.model.set(me.options.fields.use, value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.state_settings');
						var lock = me.model.get(me.options.fields.lock); 
						//Toggle border radius fields
						if(value == "yes") {
							if(lock == "yes") {
								stateSettings.find('.'+ state +'-radius-slider').show();
								stateSettings.find('.'+ state +'-radius-slider-number').show();
							} else {
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
						
						var stateSettings = me.$el.closest('.state_settings');
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
					min: 1,
					max: me.options.max_value,
					change: function () {
						//Update border radius
						var value = this.get_value();
						me.model.set(me.options.fields.radius1, value);
						me.model.set(me.options.fields.radius2, value);
						me.model.set(me.options.fields.radius3, value);
						me.model.set(me.options.fields.radius4, value);
						me.model.set(me.options.fields.radius, value);
						me.model.set(me.options.fields.radius_number, value);
						me.$el.find("input[name="+ me.options.fields.radius1 +"]").val(value);
						me.$el.find("input[name="+ me.options.fields.radius2 +"]").val(value);
						me.$el.find("input[name="+ me.options.fields.radius3 +"]").val(value);
						me.$el.find("input[name="+ me.options.fields.radius4 +"]").val(value);
						me.$el.find("input[name="+ me.options.fields.radius_number +"]").val(value);
						
						//Set opacity to 1
						me.$el.closest('.state_settings').find('.'+ state +'-radius-slider').css('opacity', 1);
					},
					show: function() {
						var value = me.model.get(me.options.fields.radius_number);
						if(value > me.options.max_value) {
							me.$el.closest('.state_settings').find('.'+ state +'-radius-slider').css('opacity', 0.6);
						} else {
							me.$el.closest('.state_settings').find('.'+ state +'-radius-slider').css('opacity', 1);
						}
					}
				}),
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius-slider-number border_radius_number',
					name: me.options.fields.radius_number,
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set(me.options.fields.radius_number, value);
						
						//Update border radius
						var value = this.get_value();
						me.model.set(me.options.fields.radius1, value);
						me.model.set(me.options.fields.radius2, value);
						me.model.set(me.options.fields.radius3, value);
						me.model.set(me.options.fields.radius4, value);
						me.model.set(me.options.fields.radius, value);
						me.$el.find("input[name="+ me.options.fields.radius1 +"]").val(value);
						me.$el.find("input[name="+ me.options.fields.radius2 +"]").val(value);
						me.$el.find("input[name="+ me.options.fields.radius3 +"]").val(value);
						me.$el.find("input[name="+ me.options.fields.radius4 +"]").val(value);
						me.$el.find("input[name="+ me.options.fields.radius +"]").val(value);
						
						//Update slider value
						s = me.fields._wrapped[2];
						s.$el.find('#'+s.get_field_id()).slider('value', value);
						s.get_field().val(value);
						s.trigger('changed');
						
						//Lower opacity if value is bigger than the slider MAX_VALUE
						if(value > me.options.max_value) {
							me.$el.closest('.state_settings').find('.'+ state +'-radius-slider').css('opacity', 0.6);
						} else {
							me.$el.closest('.state_settings').find('.'+ state +'-radius-slider').css('opacity', 1);
						} 
					}
				}),	
				
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-radius1 border_radius border_radius1',
					name: me.options.fields.radius1,
					label: '',
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
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set(me.options.fields.radius3, value);
					}
				}),	
				

			]);
		}
	});

	return RadiusSettingsItem;
});