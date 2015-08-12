define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var PaddingSettingsModule = BaseModule.extend({
		className: 'padding-settings sidebar-settings clearfix',
		group: false,

		initialize: function(options) {
			this.options = options || {};
			var me = this;

			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'use-padding checkbox-title',
					name: 'use_padding',
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: 'Customize Padding', value: 'yes' }
					],
					change: function(value) {
						me.model.set('use_padding', value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.upfront-settings-item-content');
						var lock = me.model.get('padding_lock');
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

				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'padding-lock',
					name: 'lock_padding',
					label: "",
					default_value: 0,
					multiple: false,
					values: [
						{ label: '', value: 'yes' }
					],
					show: function(value) {
						me.model.set('lock_padding', value);

						var stateSettings = me.$el;
						var usePadding = me.model.get('use_padding');

						//Toggle border radius fields
						if(value == "yes" && usePadding == "yes") {
							stateSettings.find('.padding-slider').show();
							stateSettings.find('.padding-number').show();
							stateSettings.find('.padding-top').hide();
							stateSettings.find('.padding-bottom').hide();
							stateSettings.find('.padding-left').hide();
							stateSettings.find('.padding-right').hide();
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
						me.model.set('lock_padding', value);
					}
				}),


				new Upfront.Views.Editor.Field.Slider({
					className: 'padding-slider upfront-field-wrap',
					model: this.model,
					name: 'padding',
					suffix: l10n.px,
					min: 1,
					max: 250,
					change: function (value) {
						me.model.set('padding', value);
					},
					show: function() {
						var value = me.model.get('padding_number');
						if(value > 250) {
							me.$el.find('.padding-slider').css('opacity', 0.6);
						} else {
							me.$el.find('.padding-slider').css('opacity', 1);
						}
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-number',
					name: 'padding_number',
					label: '',
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function(value) {
						me.model.set('padding_number', value);

						//Update slider value
						s = me.fields._wrapped[2];
						s.$el.find('#'+s.get_field_id()).slider('value', value);
						s.get_field().val(value);
						s.trigger('changed');

						//Lower opacity if value is bigger than the slider MAX_VALUE
						if(value > 250) {
							me.$el.find('.padding-slider').css('opacity', 0.6);
						} else {
							me.$el.find('.padding-slider').css('opacity', 1);
						}
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-top',
					name: 'padding_top',
					label: '',
					default_value: 0,
					change: function(value) {
						me.model.set('padding_top', value);
					},
					focus: function() {
						me.$el.find('.padding-bottom label').css('border-top', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.padding-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-left',
					name: 'padding_left',
					label: '',
					default_value: 0,
					change: function(value) {
						me.model.set('padding_left', value);
					},
					focus: function() {
						me.$el.find('.padding-bottom label').css('border-left', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.padding-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-right',
					name: 'padding_right',
					label: '',
					default_value: 0,
					change: function(value) {
						me.model.set('padding_right', value);
					},
					focus: function() {
						me.$el.find('.padding-bottom label').css('border-right', '3px solid #7bebc6');
					},
					blur: function() {
						me.$el.find('.padding-bottom label').css('border', '1px dotted #7d99b3');
					}
				}),

				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'padding-bottom',
					name: 'padding_bottom',
					label: '',
					default_value: 0,
					change: function(value) {
						me.model.set('padding_bottom', value);
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
	});

	return PaddingSettingsModule;
});
