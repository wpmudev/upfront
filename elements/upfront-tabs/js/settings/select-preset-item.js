define([
	'elements/upfront-tabs/js/settings/select-preset-field'
], function(SelectPresetField) {
	var SelectPresetItem = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function (options) {
			this.options = options || {};
			var me = this;

			this.selectPresetField = new SelectPresetField({
					model: this.model,
					property: 'preset',
					values: this.get_presets(),
					change: function(value) {
						me.model.set_property('preset', value);
					}
				});

			this.fields = _([
				this.selectPresetField
			]);

			this.listenTo(this.selectPresetField, 'upfront:presets:edit', this.editPreset);
		},

		editPreset: function(preset) {
			this.trigger('upfront:presets:edit', preset);
		},

		get_title: function() {
			return 'Select Preset';
		},

		get_presets: function () {
			return _.union([{ label: 'Default', value: 'default'}], _.map(this.options.presets.models, function(model) {
				return { label: model.get('name'), value: model.get('id') };
			}));
		},

		get_values: function () {
			return this.fields._wrapped[0].get_value();
		}
	});

	return SelectPresetItem;
});
