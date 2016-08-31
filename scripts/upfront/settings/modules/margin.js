define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var MarginSettingsModule = BaseModule.extend({
		className: 'margin-settings sidebar-settings clearfix',

		initialize: function(options) {
			this.options = options || {};
			var me = this,
				column_margin = Upfront.Settings.LayoutEditor.Grid.column_margin;

			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'use-margin checkbox-title',
					use_breakpoint_property: true,
					name: me.options.fields.use,
					label: '',
					multiple: false,
					values: [
						{ label: l10n.margin, value: 'yes' }
					],
					change: function(value) {
						me.model.set(me.options.fields.use, value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.upfront-settings-item-content');
						var lock = me.model.get('lock_margin');
						//Toggle margin fields
						if(value == "yes") {
							if(lock == "yes") {
								stateSettings.find('.margin-slider').show();
								stateSettings.find('.margin-number').show();
							} else {
								stateSettings.find('.margin-top').show();
								stateSettings.find('.margin-bottom').show();
								stateSettings.find('.margin-left').show();
								stateSettings.find('.margin-right').show();
							}
						} else {
							stateSettings.find('.margin-top').hide();
							stateSettings.find('.margin-bottom').hide();
							stateSettings.find('.margin-left').hide();
							stateSettings.find('.margin-right').hide();
							stateSettings.find('.margin-slider').hide();
							stateSettings.find('.margin-number').hide();
						}
					}
				}),

				lock_margin = new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'margin-lock',
					name: me.options.fields.lock,
					label: "",
					default_value: 0,
					multiple: false,
					values: [
						{ label: '', value: 'yes' }
					],
					show: function(value) {
						var stateSettings = me.$el;
						var usemargin = me.model.get(me.options.fields.use);
						var margin = me.model.get(me.options.fields.margin_number);

						//Toggle border radius fields
						if(value == "yes" && usemargin == "yes") {
							stateSettings.find('.margin-slider').show();
							stateSettings.find('.margin-number').show();
							stateSettings.find('.margin-top').hide();
							stateSettings.find('.margin-bottom').hide();
							stateSettings.find('.margin-left').hide();
							stateSettings.find('.margin-right').hide();

							me.model.set(me.options.fields.left_num, margin);
							me.model.set(me.options.fields.top_num, margin);
							me.model.set(me.options.fields.right_num, margin);
							me.model.set(me.options.fields.bottom_num, margin);
							margin_left.get_field().val(margin);
							margin_top.get_field().val(margin);
							margin_right.get_field().val(margin);
							margin_bottom.get_field().val(margin);
						} else {
							if(usemargin == "yes") {
								stateSettings.find('.margin-slider').hide();
								stateSettings.find('.margin-number').hide();
								stateSettings.find('.margin-top').show();
								stateSettings.find('.margin-bottom').show();
								stateSettings.find('.margin-left').show();
								stateSettings.find('.margin-right').show();
							}
						}
					},
					change: function(value) {
						me.model.set(me.options.fields.lock, value);
					}
				}),


				locked_slider = new Upfront.Views.Editor.Field.Slider({
					className: 'margin-slider upfront-field-wrap',
					model: this.model,
					name: me.options.fields.slider,
					suffix: l10n.px,
					step: 5,
					min: 0,
					max: 250,
					change: function (value) {
						//Update all margin values
						me.model.set(me.options.fields.slider, value);
						me.model.set(me.options.fields.margin_number, value, true);
						me.model.set(me.options.fields.left_num, value, true);
						me.model.set(me.options.fields.top_num, value, true);
						me.model.set(me.options.fields.right_num, value, true);
						me.model.set(me.options.fields.bottom_num, value, true);

						locked_num.get_field().val(value);
						margin_left.get_field().val(value);
						margin_top.get_field().val(value);
						margin_right.get_field().val(value);
						margin_bottom.get_field().val(value);

						//Enable margin fields
						me.enable_lock_margin();
					},
					show: function() {
						var value = me.model.get(me.options.fields.margin_number);
						if(value > 250) {
							me.$el.find('.margin-slider').css('opacity', 0.6);
						} else {
							me.$el.find('.margin-slider').css('opacity', 1);
						}
					}
				}),

				locked_num = new Upfront.Views.Editor.Field.Number({
					className: 'margin-number',
					model: this.model,
					name: me.options.fields.margin_number,
					label: '',
					step: 5,
					min: 0,
					change: function(value) {
						// me.model.set('margin_number', value);
						me.model.set(me.options.fields.slider, value);
						me.model.set(me.options.fields.margin_number, value, true);
						locked_slider.$el.find('#'+locked_slider.get_field_id()).slider('value', value);

						//Update all margin values
						me.model.set(me.options.fields.left_num, value, true);
						me.model.set(me.options.fields.top_num, value, true);
						me.model.set(me.options.fields.right_num, value, true);
						me.model.set(me.options.fields.bottom_num, value, true);
						margin_left.get_field().val(value);
						margin_top.get_field().val(value);
						margin_right.get_field().val(value);
						margin_bottom.get_field().val(value);

						//Enable margin fields
						me.enable_lock_margin();

						//Lower opacity if value is bigger than the slider MAX_VALUE
						if(value > 250) {
							me.$el.find('.margin-slider').css('opacity', 0.6);
						} else {
							me.$el.find('.margin-slider').css('opacity', 1);
						}
					}
				}),

				margin_top = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'margin-top',
					name: me.options.fields.top_num,
					label: '',
					step: 5,
					min: 0,
					change: function(value) {
						me.model.set(me.options.fields.top_num, value);
					},
					focus: function() {
						me.$el.find('.margin-bottom label').css('border-top', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.margin-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				margin_left = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'margin-left',
					name: me.options.fields.left_num,
					label: '',
					step: 5,
					min: 0,
					change: function(value) {
						me.model.set(me.options.fields.left_num, value);
					},
					focus: function() {
						me.$el.find('.margin-bottom label').css('border-left', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.margin-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				margin_right = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'margin-right',
					name: me.options.fields.right_num,
					label: '',
					step: 5,
					min: 0,
					change: function(value) {
						me.model.set(me.options.fields.right_num, value);
					},
					focus: function() {
						me.$el.find('.margin-bottom label').css('border-right', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.margin-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				margin_bottom = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'margin-bottom',
					name: me.options.fields.bottom_num,
					label: '',
					step: 5,
					min: 0,
					change: function(value) {
						me.model.set(me.options.fields.bottom_num, value);
					},
					focus: function() {
						me.$el.find('.margin-bottom label').css('border-bottom', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.margin-bottom label').css('border', '1px dotted #7d99b3');
					}
				})

			]);
		},
	});

	return MarginSettingsModule;
});
