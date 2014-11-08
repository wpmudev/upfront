(function($) {
define([
	'scripts/upfront/preset-settings/select-preset-panel',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/edit-preset-panel'
], function(SelectPresetPanel, Util, EditPresetPanel) {
	/**
	 * Handles presets: load, edit, delete and update for elements.
	 *
	 * API
	 * ---
	 * Options that are needed for this to work:
	 * mainDataCollection - name of property that holds preset collection
	 * styleElementPrefix - this will be used to identify style elements in page
	 * ajaxActionSlug - slug that will be used to call ajax actions for updating and deleting presets
	 * panelTitle - title of panel
	 * presetDefaults - these include all preset properties except name and id that will be usde to
	 *		create new presets
	 * stateFields - presets handle element states like hover, static and active; for each state all
	 *		properties can be set this is object containing all states and their properties see Tab Element
	 *		settings for example.
	 *		In state fields, fields that have change callback can use second parameter which will be parent
	 *		element, using parent element change function can set value on model.
	 *
	 * styleTpl - Upfront.Util.template parsed styles template
	 */
	var PresetManager = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function (options) {
			this.options = options;
			this.has_tabs = false;

			this.presets = new Backbone.Collection(Upfront.mainData[this.mainDataCollection] || []);

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
			return _.extend(this.presetDefaults, {
				id: presetName.toLowerCase().replace(/ /g, '-'),
				name: presetName
			});
		},

		updatePreset: function(properties) {
			var index,
				css = Util.generateCss(properties, this.styleTpl),
				styleElementId;

			styleElementId = this.styleElementPrefix + '-' + properties.id;
			if ($('style#' + styleElementId).length === 0) {
				$('body').append('<style id="' + styleElementId + '"></style>');
			}
			$('style#' + styleElementId).text(css);

			Upfront.Util.post({
				action: 'upfront_save_' + this.ajaxActionSlug + '_preset',
				data: properties
			});
			_.each(Upfront.mainData[this.mainDataCollection], function(preset, presetIndex) {
				if (preset.id === properties.id) {
					index = presetIndex;
				}
			});
			Upfront.mainData[this.mainDataCollection].splice(index, 1);
			Upfront.mainData[this.mainDataCollection].push(properties);
		},

		createPreset: function(presetName) {
			var preset = this.getPresetDefaults(presetName);

			this.presets.add(preset);
			this.model.set_property('preset', preset.id);
			this.updatePreset(preset);
			this.editPreset(preset.id);
		},

		deletePreset: function(preset) {
			var index;

			Upfront.Util.post({
				data: preset.toJSON(),
				action: 'upfront_delete_' + this.ajaxActionSlug + '_preset'
			});

			_.each(Upfront.mainData[this.mainDataCollection], function(storedPreset, presetIndex) {
				if (storedPreset.id === preset.get('id')) {
					index = presetIndex;
				}
			});
			Upfront.mainData[this.mainDataCollection].splice(index, 1);

			this.model.set_property('preset', 'default');

			this.presets.remove(preset);

			this.showSelectPresetPanel(true);
		},

		editPreset: function(preset) {
			this.editPresetPanel = new EditPresetPanel({
				model: this.model,
				preset: this.presets.findWhere({id: preset}),
				stateFields: this.stateFields
			});

			this.panels = _([
				this.editPresetPanel
			]);

			this.listenTo(this.editPresetPanel, 'upfront:presets:update', this.updatePreset);
			this.listenTo(this.editPresetPanel, 'upfront:presets:delete', this.deletePreset);

			this.$el.html('');
			this.render();
		},

		get_title: function () {
			return this.panelTitle;
		}
	});

	return PresetManager;
});
})(jQuery);
