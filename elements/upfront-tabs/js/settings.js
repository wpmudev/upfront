(function($) {
define([
	'elements/upfront-tabs/js/settings/select-preset-panel',
	'elements/upfront-tabs/js/settings/edit-preset-panel'
], function(SelectPresetPanel, EditPresetPanel) {
	var l10n = Upfront.Settings.l10n.utabs_element;

	var TabPresetModel = Backbone.Model.extend({
		get_property_by_name: function(name) {
			return this.get(name);
		}
	});

	var TabPresetsCollection = Backbone.Collection.extend({
		model: TabPresetModel
	});

	var Settings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function (options) {
			this.options = options;
			this.has_tabs = false;

			this.presets = new TabPresetsCollection(Upfront.mainData.tabPresets || []);

			this.showSelectPresetPanel(false);
		},

		showSelectPresetPanel: function(render) {
			this.selectPresetPanel = new SelectPresetPanel({
				model: this.model,
				presets: this.presets
			});
			this.panels = _([
				this.selectPresetPanel
			]);

			this.listenTo(this.selectPresetPanel, 'upfront:presets:new', this.createPreset);
			this.listenTo(this.selectPresetPanel, 'upfront:presets:edit', this.editPreset);

			if (render) {
				this.render();
			}
		},

		getPresetDefaults: function(presetName) {
			return {
				id: presetName.toLowerCase().replace(/ /g, '-'),
				name: presetName,
				'active-font-size': 14,
				'active-font-family': 'Arial',
				'active-font-color': '808080',
				'hover-font-size': 14,
				'hover-font-family': 'Arial',
				'hover-font-color': '000000',
				'hover-transition-duration': 0.3,
				'hover-transition-easing': 'ease-in-out',
				'static-font-size': 14,
				'static-font-family': 'Arial',
				'static-font-color': '606060'
			};
		},

		updatePresetStyle: function(properties) {
			var index,
				css;

			css = ['.tab-preset-' + properties.id + ' .tabs-tab:hover {'];
			css.push('	color: #' + properties['hover-font-color'] + ';');
			css.push('	font-family: ' + properties['hover-font-family'] + ';');
			css.push('	font-size: ' + properties['hover-font-size'] + 'px;');
			css.push('}');
			css.push('.tab-preset-' + properties.id + ' .tabs-tab.tabs-tab-active {');
			css.push('	color: #' + properties['active-font-color'] + ';');
			css.push('	font-family: ' + properties['active-font-family'] + ';');
			css.push('	font-size: ' + properties['active-font-size'] + 'px;');
			css.push('	transition: none;');
			css.push('}');
			css.push('.tab-preset-' + properties.id + ' .tabs-tab {');
			css.push('	color: #' + properties['static-font-color'] + ';');
			css.push('	font-family: ' + properties['static-font-family'] + ';');
			css.push('	font-size: ' + properties['static-font-size'] + 'px;');
			css.push('	transition: all ' + properties['hover-transition-duration'] + 's ' + properties['hover-transition-easing'] + ';');
			css.push('}');

			if ($('style#tab-preset-' + properties.id).length === 0) {
				$('body').append('<style id="tab-preset-' + properties.id + '"></style>');
			}
			$('style#tab-preset-' + properties.id).text(css.join('\n'));

			Upfront.Util.post({
				action: 'upfront_save_tab_preset',
				data: properties
			});
			_.each(Upfront.mainData.tabPresets, function(preset, presetIndex) {
				if (preset.id === properties.id) {
					index = presetIndex;
				}
			});
			Upfront.mainData.tabPresets.splice(index, 1);
			Upfront.mainData.tabPresets.push(properties);
		},

		createPreset: function(presetName) {
			var preset = this.getPresetDefaults(presetName);

			this.presets.add(preset);
			this.model.set_property('preset', preset.id);
			this.updatePresetStyle(preset);
			this.editPreset(preset.id);
		},

		deletePreset: function(preset) {
			var index;

			Upfront.Util.post({
				data: preset.toJSON(),
				action: 'upfront_delete_tab_preset'
			});

			_.each(Upfront.mainData.tabPresets, function(tabPreset, presetIndex) {
				if (tabPreset.id === preset.get('id')) {
					index = presetIndex;
				}
			});
			Upfront.mainData.tabPresets.splice(index, 1);

			this.model.set_property('preset', 'default');

			this.presets.remove(preset);

			this.showSelectPresetPanel(true);
		},

		editPreset: function(preset) {
			this.editPresetPanel = new EditPresetPanel({
				model: this.model,
				preset: this.presets.findWhere({id: preset})
			});

			this.panels = _([
				this.editPresetPanel
			]);

			this.listenTo(this.editPresetPanel, 'upfront:presets:update', this.updatePresetStyle);
			this.listenTo(this.editPresetPanel, 'upfront:presets:delete', this.deletePreset);

			this.$el.html('');
			this.render();
		},

		get_title: function () {
			return l10n.settings;
		}
	});

	return Settings;
});
})(jQuery);
