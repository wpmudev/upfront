define([
	'elements/upfront-tabs/js/settings/select-preset-item',
	'elements/upfront-tabs/js/settings/new-preset-item'
], function(SelectPresetItem, NewPresetItem) {
	var SelectPresetPanel = Upfront.Views.Editor.Settings.Panel.extend({
		className: 'preset-manager-panel',

		initialize: function (opts) {
			this.options = opts;

			this.newPresetItem = new NewPresetItem({
				model: this.model
			});

			this.selectPresetItem = new SelectPresetItem({
				model: this.model,
				presets: this.options.presets
			});

			this.listenTo(this.newPresetItem, 'upfront:presets:new', this.createPreset);
			this.listenTo(this.selectPresetItem, 'upfront:presets:edit', this.editPreset);

			this.settings = _([
				this.selectPresetItem,
				this.newPresetItem
			]);
		},

		// Propagate to parent
		createPreset: function(presetName) {
			this.trigger('upfront:presets:new', presetName);
		},

		editPreset: function(preset) {
			this.trigger('upfront:presets:edit', preset);
		}
	});

	return SelectPresetPanel;
});
