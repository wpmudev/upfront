define([
	'scripts/upfront/settings/modules/base-module',
	'scripts/upfront/settings/fields/select-preset'
], function(BaseModule, SelectPresetField) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var SelectPresetModule = BaseModule.extend({
		className: 'select-presets',
		initialize: function (options) {
			this.options = options || {};
			this.group = false;
			var me = this;

			this.selectPresetField = new SelectPresetField({
					model: this.model,
					label: l10n.select_preset_label,
					property: 'preset',
					values: this.get_presets(),
					change: function(value) {
						me.model.set_property('preset', this.get_value());
					}
				});

			this.fields = _([
				this.selectPresetField
			]);

			this.listenTo(this.selectPresetField, 'upfront:presets:new', this.createPreset);
			this.listenTo(this.selectPresetField, 'changed', this.changePreset);
		},

		changePreset: function() {
			this.trigger('upfront:presets:change', this.selectPresetField.get_value());
		},

		createPreset: function(preset) {
			this.trigger('upfront:presets:new', preset);
		},

		get_title: function() {
			return l10n.select_preset;
		},

		get_presets: function () {
			var presets = [];
			
			_.each(this.options.presets.models, function(model) {
				if(typeof model.get('legacy') !== "undefined" && model.get('legacy') === true) {
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

	return SelectPresetModule;
});
