define([
	'scripts/upfront/preset-settings/select-preset-field'
], function(SelectPresetField) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	
	var SelectPresetItem = Upfront.Views.Editor.Settings.Item.extend({
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

			this.listenTo(this.selectPresetField, 'upfront:presets:edit', this.editPreset);
			this.listenTo(this.selectPresetField, 'upfront:presets:new', this.createPreset);
		},

		createPreset: function(preset) {
			this.trigger('upfront:presets:new', preset);
		},

		editPreset: function(preset) {
			this.trigger('upfront:presets:edit', preset);
		},

		get_title: function() {
			return l10n.select_preset;
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

	return SelectPresetItem;
});
