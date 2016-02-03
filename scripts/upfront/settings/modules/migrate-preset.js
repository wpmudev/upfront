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
						width: '171px'
					});

					return this;
				},

				get_value_html: function (value, index) {
					var selected = '';
					var currentPreset = this.get_saved_value() ? this.get_saved_value() : 'default';
					if (this.model.get_property_value_by_name('theme_style')) {
						currentPreset = '';
					}
					if (value.value === this.clear_preset_name(currentPreset)) selected = ' selected="selected"';
					return ['<option value="', value.value, '"', selected, '>', value.label, '</option>'].join('');
				},

				clear_preset_name: function(preset) {
					preset = preset.replace(' ', '-');
					preset = preset.replace(/[^-a-zA-Z0-9]/, '');
					return preset;
				},

				on_change: function(e) {
					this.trigger('change', this.get_value());
				}
			});

			this.selectPresetField = new SelectPresetField({
					model: this.model,
					label: '',
					values: this.get_presets(),
					change: function(value) {
						//me.model.set_property('preset', this.get_value());
					}
				}),

			this.listenTo(this.selectPresetField, 'change', this.previewPreset);

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
						default_value: me.suggestPresetName(this.options.elementPreset),
						className: 'new-preset-button-input',
					}),

					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: l10n.ok_label,
						className: 'new-preset-button-submit',
						compact: true,
						on_click: function() {
							var preset_name = me.$el.find('.new-preset-button-input input').val();

							if (preset_name.trim() === '') {
								alert(l10n.not_empty_label);
								return;
							}
							if (preset_name.match(/[^A-Za-z0-9 ]/)) {
								alert(l10n.special_character_label);
								return;
							}

							me.trigger('upfront:presets:new', preset_name.trim());
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

					this.selectPresetField,

					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: l10n.apply_label,
						className: 'migrate-preset-apply',
						compact: true,
						on_click: function() {
							me.trigger('upfront:presets:change', me.selectPresetField.get_value());
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

		/**
		 * Suggests an unique preset name, based on the preset argument
		 *
		 * @param {String} presetName Preset name prefix
		 *
		 * @return {String} Unique preset name
		 */
		suggestPresetName: function(presetName) {
			var preset = this.capitalisePreset(presetName.replace(/-preset/, '')),
				raw_name = preset + l10n.preset,
				name = raw_name,
				counter = 1,
				all_names = this.get_all_preset_names()
			;
			// Increment counter next to preset name until we get an unique one
			while (0 < all_names.indexOf(name)) {
				name = raw_name + counter;
				counter++;
			}
			return name;
		},

		capitalisePreset: function(preset) {
			return preset.charAt(0).toUpperCase() + preset.slice(1).toLowerCase();
		},

		hide_new_preset_fields: function () {
			var me = this;
			me.$el.find('.new-preset-button-cancel').hide();
			me.$el.find('.new-preset-button-input').hide();
			me.$el.find('.new-preset-button-submit').hide();
			me.$el.find('.migrate-preset-button').show();

			me.$el.find('.existing-preset-overlay-layout').remove();
		},

		show_new_preset_fields: function () {
			var me = this;
			me.$el.find('.new-preset-button-cancel').show();
			me.$el.find('.new-preset-button-input').show();
			me.$el.find('.new-preset-button-submit').show();
			me.$el.find('.migrate-preset-button').hide();

			me.$el.find('.existing-preset-module').append('<div class="existing-preset-overlay-layout">&nbsp;</div>');
		},

		previewPreset: function(value) {
			this.trigger('upfront:presets:preview', value);
		},

		/**
		 * Gets *all* preset names - legacy or otherwise
		 *
		 * @return {Array} Array of preset names as strings
		 */
		get_all_preset_names: function () {
			var presets = [];

			_.each(this.options.presets.models, function(model) {
				var name = 'undefined' === typeof model.get('name')
					? model.get('id')
					: model.get('name')
				;
				presets.push(name);
			});

			return presets;
		},

		get_presets: function () {
			var presets = [{ label: 'No preset', value: ''}];

			_.each(this.options.presets.models, function(model) {
				if(typeof model.get('legacy') !== "undefined") {
					return;
				}

				if('undefined' === typeof model.get('name')) {
					presets.push({ label: model.get('id'), value: model.get('id') });
				} else {
					presets.push({ label: model.get('name'), value: model.get('id') });
				}
			});

			return presets;
		}
	});

	return MigratePresetModule;
});
