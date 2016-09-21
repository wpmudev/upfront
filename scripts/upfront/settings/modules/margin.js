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
						var lock = me.model.get(me.options.fields.lock);
						//Toggle margin fields
						if(value == "yes") {
							if(lock == "yes") {
								stateSettings.find('.margin-left').find('input').prop( "disabled", true ).css('opacity', 0.4);
								stateSettings.find('.margin-bottom').find('input').prop( "disabled", true ).css('opacity', 0.4);
								stateSettings.find('.margin-right').find('input').prop( "disabled", true ).css('opacity', 0.4);
							}
							
							stateSettings.find('.margin-top').show();
							stateSettings.find('.margin-bottom').show();
							stateSettings.find('.margin-left').show();
							stateSettings.find('.margin-right').show();
							stateSettings.find('.margin-lock').show();
							stateSettings.find('.margin-reset-posts-length').show();
							stateSettings.find('.margin-reset-posts').show();
						} else {
							stateSettings.find('.margin-top').hide();
							stateSettings.find('.margin-bottom').hide();
							stateSettings.find('.margin-left').hide();
							stateSettings.find('.margin-right').hide();
							stateSettings.find('.margin-lock').hide();
							stateSettings.find('.margin-reset-posts-length').hide();
							stateSettings.find('.margin-reset-posts').hide();
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
							stateSettings.find('.margin-left').find('input').prop( "disabled", true ).css('opacity', 0.4);
							stateSettings.find('.margin-bottom').find('input').prop( "disabled", true ).css('opacity', 0.4);
							stateSettings.find('.margin-right').find('input').prop( "disabled", true ).css('opacity', 0.4);

							me.model.set(me.options.fields.left_num, margin);
							me.model.set(me.options.fields.top_num, margin);
							me.model.set(me.options.fields.right_num, margin);
							me.model.set(me.options.fields.bottom_num, margin);
							margin_left.get_field().val(margin);
							margin_top.get_field().val(margin);
							margin_right.get_field().val(margin);
							margin_bottom.get_field().val(margin);
							
						} else {
							stateSettings.find('.margin-left').find('input').prop( "disabled", false ).css('opacity', 1);
							stateSettings.find('.margin-bottom').find('input').prop( "disabled", false ).css('opacity', 1);
							stateSettings.find('.margin-right').find('input').prop( "disabled", false ).css('opacity', 1);
						}
					},
					change: function(value) {
						me.model.set(me.options.fields.lock, value);
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
					}
				}),
				
				reset_posts = new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'margin-reset-posts',
					name: me.options.fields.reset_posts,
					label: "",
					values: [
						{ label: "", value: 'yes' }
					],
					show: function(value) {
						if(value == "yes") {
							me.$el.find('.margin-reset-posts-length').find('input').prop( "disabled", false ).css('opacity', 1);
						} else {
							me.$el.find('.margin-reset-posts-length').find('input').prop( "disabled", true ).css('opacity', 0.4);
						}
					},
					change: function(value) {
						me.model.set(me.options.fields.reset_posts, value);
					}
				}),

				posts_number = new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: 'margin-reset-posts-length',
					name: me.options.fields.reset_posts_length,
					label: l10n.reset_posts,
					label_style: 'inline',
					suffix: l10n.posts_label,
					min: 1,
					max: 50,
					step: 1,
					default_value: 1,
					change: function(value) {
						me.model.set(me.options.fields.reset_posts_length, value);
					}
				}),

			]);
		},
	});

	return MarginSettingsModule;
});
