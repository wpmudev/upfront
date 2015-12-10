define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var PaddingSettingsModule = BaseModule.extend({
		className: 'padding-settings sidebar-settings clearfix',

		initialize: function(options) {
			this.options = options || {};
			var me = this,
				column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding;

			this.listenTo(Upfront.Events, "upfront:paddings:updated", this.refresh);

			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'use-padding checkbox-title',
					use_breakpoint_property: true,
					property: 'use_padding',
					label: '',
					default_value: this.model.get_breakpoint_property_value('top_padding_use') || this.model.get_breakpoint_property_value('bottom_padding_use') || this.model.get_breakpoint_property_value('left_padding_use') || this.model.get_breakpoint_property_value('right_padding_use'),
					multiple: false,
					values: [
						{ label: 'Customize Padding', value: 'yes' }
					],
					change: function(value) {
						me.model.set_property('use_padding', value);
						
						if(typeof value === "undefined") {
							//Disable custom padding, update to theme default padding
							me.model.set_property('left_padding_num', column_padding, true);
							me.model.set_property('top_padding_num', column_padding, true);
							me.model.set_property('right_padding_num', column_padding, true);
							me.model.set_property('bottom_padding_num', column_padding, true);
							padding_left.get_field().val(column_padding);
							padding_top.get_field().val(column_padding);
							padding_right.get_field().val(column_padding);
							padding_bottom.get_field().val(column_padding);
							
							//Disable paddings
							me.disable_paddings();
						}
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.upfront-settings-item-content');
						var lock = me.model.get_property_value_by_name('lock_padding');
						//Toggle padding fields
						if(value == "yes") {
							if(lock == "yes") {
								stateSettings.find('.padding-slider').show();
								stateSettings.find('.padding-number').show();
							} else {
								stateSettings.find('.padding-top').show();
								stateSettings.find('.padding-bottom').show();
								stateSettings.find('.padding-left').show();
								stateSettings.find('.padding-right').show();
							}
						} else {
							stateSettings.find('.padding-top').hide();
							stateSettings.find('.padding-bottom').hide();
							stateSettings.find('.padding-left').hide();
							stateSettings.find('.padding-right').hide();
							stateSettings.find('.padding-slider').hide();
							stateSettings.find('.padding-number').hide();
						}
					}
				}),

				lock_padding = new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'padding-lock',
					use_breakpoint_property: true,
					property: 'lock_padding',
					label: "",
					default_value: 0,
					multiple: false,
					values: [
						{ label: '', value: 'yes' }
					],
					show: function(value) {
						me.model.set_property('lock_padding', value);

						var stateSettings = me.$el;
						var usePadding = me.model.get_property_value_by_name('use_padding');
						var padding = me.model.get_property_value_by_name('padding_number');

						//Toggle border radius fields
						if(value == "yes" && usePadding == "yes") {
							stateSettings.find('.padding-slider').show();
							stateSettings.find('.padding-number').show();
							stateSettings.find('.padding-top').hide();
							stateSettings.find('.padding-bottom').hide();
							stateSettings.find('.padding-left').hide();
							stateSettings.find('.padding-right').hide();
							
							me.model.set_property('left_padding_num', padding);
							me.model.set_property('top_padding_num', padding);
							me.model.set_property('right_padding_num', padding);
							me.model.set_property('bottom_padding_num', padding);
							padding_left.get_field().val(padding);
							padding_top.get_field().val(padding);
							padding_right.get_field().val(padding);
							padding_bottom.get_field().val(padding);
						} else {
							if(usePadding == "yes") {
								stateSettings.find('.padding-slider').hide();
								stateSettings.find('.padding-number').hide();
								stateSettings.find('.padding-top').show();
								stateSettings.find('.padding-bottom').show();
								stateSettings.find('.padding-left').show();
								stateSettings.find('.padding-right').show();
							}
						}
					},
					change: function(value) {
						me.model.set_property('lock_padding', value);
					}
				}),


				locked_slider = new Upfront.Views.Editor.Field.Slider({
					className: 'padding-slider upfront-field-wrap',
					model: this.model,
					use_breakpoint_property: true,
					property: 'padding_slider',
					default_value: this.model.get_breakpoint_property_value('padding_slider'),
					suffix: l10n.px,
					step: 5,
					min: 0,
					max: 250,
					change: function (value) {
						//Update all padding values
						me.model.set_property('padding_slider', value);
						me.model.set_property('padding_number', value, true);
						me.model.set_property('left_padding_num', value, true);
						me.model.set_property('top_padding_num', value, true);
						me.model.set_property('right_padding_num', value, true);
						me.model.set_property('bottom_padding_num', value, true);
						
						locked_num.get_field().val(value);
						padding_left.get_field().val(value);
						padding_top.get_field().val(value);
						padding_right.get_field().val(value);
						padding_bottom.get_field().val(value);
						
						//Enable padding fields
						me.enable_lock_padding();
					},
					show: function() {
						var value = me.model.get_property_value_by_name('padding_number');
						if(value > 250) {
							me.$el.find('.padding-slider').css('opacity', 0.6);
						} else {
							me.$el.find('.padding-slider').css('opacity', 1);
						}
					}
				}),

				locked_num = new Upfront.Views.Editor.Field.Number({
					className: 'padding-number',
					model: this.model,
					use_breakpoint_property: true,
					property: 'padding_number',
					default_value: this.model.get_breakpoint_property_value('padding_number'),
					label: '',
					step: 5,
					min: 0,
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set('padding_number', value);
						me.model.set_property('padding_slider', value);
						me.model.set_property('padding_number', value);
						locked_slider.$el.find('#'+locked_slider.get_field_id()).slider('value', value);
						
						//Update all padding values
						me.model.set_property('left_padding_num', value, true);
						me.model.set_property('top_padding_num', value, true);
						me.model.set_property('right_padding_num', value, true);
						me.model.set_property('bottom_padding_num', value, true);
						padding_left.get_field().val(value);
						padding_top.get_field().val(value);
						padding_right.get_field().val(value);
						padding_bottom.get_field().val(value);
						
						//Enable padding fields
						me.enable_lock_padding();
						
						//Lower opacity if value is bigger than the slider MAX_VALUE
						if(value > 250) {
							me.$el.find('.padding-slider').css('opacity', 0.6);
						} else {
							me.$el.find('.padding-slider').css('opacity', 1);
						}
					}
				}),

				padding_top = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-top',
					use_breakpoint_property: true,
					property: 'top_padding_num',
					label: '',
					step: 5,
					min: 0,
					default_value: this.model.get_breakpoint_property_value('top_padding_num') || column_padding,
					change: function(value) {
						me.model.set_property('top_padding_num', value);
						me.enable_padding('top_padding_use');
					},
					focus: function() {
						me.$el.find('.padding-bottom label').css('border-top', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.padding-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				padding_left = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-left',
					use_breakpoint_property: true,
					property: 'left_padding_num',
					label: '',
					step: 5,
					min: 0,
					default_value: this.model.get_breakpoint_property_value('left_padding_num') || column_padding,
					change: function(value) {
						me.model.set_property('left_padding_num', value);
						me.enable_padding('left_padding_use');
					},
					focus: function() {
						me.$el.find('.padding-bottom label').css('border-left', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.padding-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				padding_right = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-right',
					use_breakpoint_property: true,
					property: 'right_padding_num',
					label: '',
					step: 5,
					min: 0,
					default_value: this.model.get_breakpoint_property_value('right_padding_num') || column_padding,
					change: function(value) {
						me.model.set_property('right_padding_num', value);
						me.enable_padding('right_padding_use');
					},
					focus: function() {
						me.$el.find('.padding-bottom label').css('border-right', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.padding-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				padding_bottom = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-bottom',
					use_breakpoint_property: true,
					property: 'bottom_padding_num',
					label: '',
					step: 5,
					min: 0,
					default_value: this.model.get_breakpoint_property_value('bottom_padding_num') || column_padding,
					change: function(value) {
						me.model.set_property('bottom_padding_num', value);
						me.enable_padding('bottom_padding_use');
					},
					focus: function() {
						me.$el.find('.padding-bottom label').css('border-bottom', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.padding-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

			]);
		},
		
		refresh: function() {
			//Check use_padding when default settings are overwriten
			this.model.set_property('use_padding', 'yes');

			//Update fields when element padding is changed
			var topPadding = this.model.get_property_value_by_name('top_padding_num');
			var bottomPadding = this.model.get_property_value_by_name('bottom_padding_num');
			var leftPadding = this.model.get_property_value_by_name('left_padding_num');
			var rightPadding = this.model.get_property_value_by_name('right_padding_num');

			this.fields._wrapped[4].get_field().val(topPadding);
			this.fields._wrapped[5].get_field().val(leftPadding);
			this.fields._wrapped[6].get_field().val(rightPadding);
			this.fields._wrapped[7].get_field().val(bottomPadding);
		},
		
		enable_padding: function(field) {
			//Enable padding when settings is changed
			this.model.set_breakpoint_property(field, 'yes');
			
			Upfront.Events.trigger("upfront:paddings:updated");
		},
		
		disable_paddings: function() {
			//Enable padding when settings is changed
			this.model.set_breakpoint_property('top_padding_use', '');
			this.model.set_breakpoint_property('bottom_padding_use', '');
			this.model.set_breakpoint_property('left_padding_use', '');
			this.model.set_breakpoint_property('right_padding_use', '');
			Upfront.Events.trigger("upfront:paddings:updated");
		},
		
		enable_lock_padding: function() {
			var is_group = this.model instanceof Upfront.Models.ModuleGroup;
			
			this.enable_padding('top_padding_use');
			this.enable_padding('bottom_padding_use');
			if( ! is_group ) {
				this.enable_padding('left_padding_use');
				this.enable_padding('right_padding_use');
			}
		}
	});

	return PaddingSettingsModule;
});
