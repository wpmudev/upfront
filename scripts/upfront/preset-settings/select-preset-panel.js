define([
	'scripts/upfront/preset-settings/select-preset-item',
	'scripts/upfront/preset-settings/edit-preset-item',
	'scripts/upfront/preset-settings/preset-css-settings',
	'scripts/upfront/element-settings/panel'
], function(SelectPresetItem, EditPresetItem, PresetCSS, ElementSettingsPanel) {
	var SelectPresetPanel = ElementSettingsPanel.extend({
		className: 'preset-manager-panel',

		initialize: function (opts) {
			this.options = opts;

			this.selectPresetItem = new SelectPresetItem({
				model: this.model,
				presets: this.options.presets
			});

			var preset = this.property('preset') ? this.clear_preset_name(this.property('preset')) : 'default';

			this.editPresetItem = new EditPresetItem({
				model: this.options.presets.findWhere({id: preset}),
				stateFields: this.options.stateFields
			});
			
			this.presetCSS = new PresetCSS({
				model: this.model,
				preset: this.options.presets.findWhere({id: preset}), 
			});

			this.listenTo(this.selectPresetItem, 'upfront:presets:new', this.createPreset);
			this.listenTo(this.selectPresetItem, 'upfront:presets:edit', this.editPreset);
			this.listenTo(this.editPresetItem, 'upfront:presets:delete', this.deletePreset);
			this.listenTo(this.editPresetItem, 'upfront:presets:reset', this.resetPreset);
			this.listenTo(this.editPresetItem, 'upfront:presets:update', this.onPresetUpdate);
			this.listenTo(this.presetCSS, 'upfront:presets:update', this.onPresetCSSUpdate);
			this.listenTo(this.model.get("properties"), 'change', this.onPresetChange);

			this.settings = _([
				this.selectPresetItem,
				this.editPresetItem,
				this.presetCSS
			]);
		},

		clear_preset_name: function(preset) {
			preset = preset.replace(' ', '-');
			preset = preset.replace(/[^-a-zA-Z0-9]/, '');
			return preset;
		},

		// Propagate to parent
		createPreset: function(presetName) {
			this.trigger('upfront:presets:new', presetName);
		},

		onPresetChange: function(preset) {
			this.trigger('upfront:presets:change', preset);
		},

		onPresetUpdate: function(preset) {
			this.trigger('upfront:presets:update', preset);
		},
		
		onPresetCSSUpdate: function(preset) {
			this.trigger('upfront:presets:update', preset);
		},

		// Propagate to parent
		editPreset: function(preset) {
			this.trigger('upfront:presets:edit', preset);
		},

		deletePreset: function(preset) {
			this.trigger('upfront:presets:delete', preset);
		},
		
		resetPreset: function(preset) {
			this.trigger('upfront:presets:reset', preset);
		},

		property: function(name, value, silent) {
			if(typeof value != "undefined"){
				if(typeof silent == "undefined")
					silent = true;
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		}
	});

	return SelectPresetPanel;
});

