define([
	'scripts/upfront/settings/modules/base-module',
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var MigratePresetModule = BaseModule.extend({
		className: 'migrate-preset-overlay',

		initialize: function(options) {
			this.options = options || {};
			
			var me = this;
			
			var SimpleTextField = Upfront.Views.Editor.Field.Text.extend({
				get_field_html: function () {
					return '';
				}
			});
			
			var SelectPresetField = Upfront.Views.Editor.Field.Chosen_Select.extend({
				className: 'preset select-preset-field-overlay',
				render: function() {
					Upfront.Views.Editor.Field.Chosen_Select.prototype.render.call(this);
					var me = this;
					var preset = this.$el.find('.upfront-chosen-select').val();

					this.$el.find('.upfront-chosen-select').chosen({
						search_contains: true,
						width: '172px'
					});

					return this;
				},

				get_value_html: function (value, index) {
					var selected = '';
					var currentPreset = this.get_saved_value() ? this.get_saved_value() : 'default';
					if (value.value === this.clear_preset_name(currentPreset)) selected = ' selected="selected"';
					return ['<option value="', value.value, '"', selected, '>', value.label, '</option>'].join('');
				},

				clear_preset_name: function(preset) {
					preset = preset.replace(' ', '-');
					preset = preset.replace(/[^-a-zA-Z0-9]/, '');
					return preset;
				}
			});

			this.listenTo(this.model, 'change', this.onPresetUpdate);

			var fields = [
				new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				className: 'new-preset-module',
				fields: [
					new SimpleTextField({
						model: this.model,
						label: l10n.convert_preset_info,
						className: 'migrate-preset-info migrate-info-icon',
					}),
					
					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: l10n.convert_style_to_preset,
						className: 'migrate-preset-button',
						compact: true,
						on_click: function() {
							me.show_new_preset_fields();
						}
					}),
					
					//New preset fields
					
					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: l10n.cancel_label,
						className: 'new-preset-button-cancel',
						compact: true,
						on_click: function() {
							me.hide_new_preset_fields();
						}
					}),
					
					new Upfront.Views.Editor.Field.Text({
						model: this.model,
						label: '',
						className: 'new-preset-button-input',
					}),
					
					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: l10n.ok_label,
						className: 'new-preset-button-submit',
						compact: true,
						on_click: function() {
							//Do something
						}
					}),
				]
				//End new preset fields
			}),
			new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				className: 'existing-preset-module migrate-separator',
				fields: [
					new SimpleTextField({
						model: this.model,
						label: l10n.select_preset_info,
						className: 'migrate-preset-info',
					}),

					new SelectPresetField({
						model: this.model,
						label: '',
						property: 'preset',
						values: this.get_presets(),
						change: function(value) {
							//me.model.set_property('preset', this.get_value());
						}
					}),
					
					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: l10n.apply_label,
						className: 'migrate-preset-apply',
						compact: true,
						on_click: function() {
							//Do something
						}
					}),
				]
			})
			]
			
			setTimeout(function(){
				me.hide_new_preset_fields();
			}, 20);

			this.fields =_(fields);
		},
		
		hide_new_preset_fields() {
			var me = this;
			me.$el.find('.new-preset-button-cancel').hide();
			me.$el.find('.new-preset-button-input').hide();
			me.$el.find('.new-preset-button-submit').hide();
			me.$el.find('.migrate-preset-button').show();
			
			me.$el.find('.existing-preset-overlay-layout').remove();
		},
		
		show_new_preset_fields() {
			var me = this;
			me.$el.find('.new-preset-button-cancel').show();
			me.$el.find('.new-preset-button-input').show();
			me.$el.find('.new-preset-button-submit').show();
			me.$el.find('.migrate-preset-button').hide();
			
			me.$el.find('.existing-preset-module').append('<div class="existing-preset-overlay-layout">&nbsp;</div>');
		},
		
		get_presets: function () {
			return _.map(this.options.presets.models, function(model) {
				if('undefined' === typeof model.get('name')) {
				  return { label: model.get('id'), value: model.get('id') };
				} else {
				  return { label: model.get('name'), value: model.get('id') };
				}
			});
		}
	});

	return MigratePresetModule;
});
