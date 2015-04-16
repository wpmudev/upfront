define([
	'scripts/upfront/preset-settings/select-preset-field'
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
			return _.union([{ label: 'None', value: 'default'}], _.map(this.options.presets.models, function(model) {
        if('undefined' === typeof model.get('name')) {
          return { label: model.get('id'), value: model.get('id') };
        } else {
          return { label: model.get('name'), value: model.get('id') };
        }
			}));
		}
	});

	return SelectPresetItem;
});
