define([
	'scripts/upfront/preset-settings/edit-preset-item',
	'scripts/upfront/element-settings/panel'
], function(EditPresetItem, ElementSettingsPanel) {
	var EditPresetPanel = ElementSettingsPanel.extend({
		className: 'preset-manager-panel',

		initialize: function (options) {
			this.options = options || {};

			this.editPresetItem = new EditPresetItem({
				model: this.options.preset,
				stateFields: this.options.stateFields
			});

			this.listenTo(this.options.preset, 'change', this.onPresetChange);
			this.listenTo(this.editPresetItem, 'upfront:presets:delete', this.deletePreset);
			this.listenTo(this.editPresetItem, 'upfront:presets:reset', this.resetPreset);

			this.settings = _([
				this.editPresetItem
			]);
		},

		onPresetChange: function() {
			this.trigger('upfront:presets:update', this.options.preset.toJSON());
		},

		deletePreset: function(preset) {
			this.trigger('upfront:presets:delete', preset);
		},
		
		resetPreset: function(preset) {
			this.trigger('upfront:presets:reset', preset);
		}
	});

	return EditPresetPanel;
});
