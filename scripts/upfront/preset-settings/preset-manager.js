(function($) {
define([
	'scripts/upfront/element-settings/base-panel',
	'scripts/upfront/preset-settings/select-preset-panel',
	'scripts/upfront/preset-settings/util'
], function(BasePanel, SelectPresetPanel, Util) {
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
	var PresetManager = BasePanel.extend({
		initialize: function (options) {
			this.options = options;
			_.each(this.options, function(option, index) {
				this[index] = option;
			}, this);
			this.has_tabs = false;

			var defaultPreset = false,
				preset;
			_.each(Upfront.mainData[this.mainDataCollection], function(preset, presetIndex) {
				if (preset.id === 'default') {
					defaultPreset = true;
				}
			});
			if(!defaultPreset) {
				Upfront.mainData[this.mainDataCollection] = _.isArray(Upfront.mainData[this.mainDataCollection]) ?
						Upfront.mainData[this.mainDataCollection] : [];

				Upfront.mainData[this.mainDataCollection].unshift(this.presetDefaults);
			}

			this.presets = new Backbone.Collection(Upfront.mainData[this.mainDataCollection] || []);

			this.showSelectPresetPanel(false);
		},

		getTitle: function() {
			return 'Appearance';
		},

		showSelectPresetPanel: function(render) {
			var me = this;
			this.selectPresetPanel = new SelectPresetPanel({
				model: this.model,
				presets: this.presets,
				stateFields: this.stateFields
			});
			this.panels = _([
				this.selectPresetPanel
			]);

			this.delegateEvents();

			this.listenTo(this.selectPresetPanel, 'upfront:presets:new', this.createPreset);
			this.listenTo(this.selectPresetPanel, 'upfront:presets:delete', this.deletePreset);
			this.listenTo(this.selectPresetPanel, 'upfront:presets:reset', this.resetPreset);
			this.listenTo(this.selectPresetPanel, 'upfront:presets:change', this.changePreset);
			this.listenTo(this.selectPresetPanel, 'upfront:presets:update', this.updatePreset);

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
				//css = Util.generateCss(properties, this.styleTpl),
				styleElementId;
			/* // Note: killed, because we already do this in Util
			styleElementId = this.styleElementPrefix + '-' + properties.id;
			if ($('style#' + styleElementId).length === 0) {
				$('body').append('<style id="' + styleElementId + '"></style>');
			}
			$('style#' + styleElementId).text(css);
			*/
			Util.updatePresetStyle(this.styleElementPrefix.replace(/-preset/, ''), properties, this.styleTpl);
			Upfront.Util.post({
				action: 'upfront_save_' + this.ajaxActionSlug + '_preset',
				data: properties
			});
			_.each(Upfront.mainData[this.mainDataCollection], function(preset, presetIndex) {
				if (preset.id === properties.id) {
					index = presetIndex;
				}
			});
			if (_.isUndefined(index) === false) {
				Upfront.mainData[this.mainDataCollection].splice(index, 1);
			}
			Upfront.mainData[this.mainDataCollection].push(properties);

			this.model.trigger("preset:updated");
		},

		createPreset: function(presetName) {
			var preset = this.getPresetDefaults(presetName);

			this.presets.add(preset);
			this.model.set_property('preset', preset.id);
			this.updatePreset(preset);
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

		resetPreset: function(preset) {
			var index;
			var me = this;

			Upfront.Util.post({
				data: preset.toJSON(),
				action: 'upfront_reset_' + this.ajaxActionSlug + '_preset'
			}).success(function (ret) {
				//Update preset CSS with reset properties
				Util.updatePresetStyle(me.styleElementPrefix.replace(/-preset/, ''), ret.data, me.styleTpl);

				_.each(Upfront.mainData[me.mainDataCollection], function(preset, presetIndex) {
					if (preset.id === ret.data.id) {
						index = presetIndex;
					}
				});
				if (_.isUndefined(index) === false) {
					Upfront.mainData[me.mainDataCollection].splice(index, 1);
				}
				Upfront.mainData[me.mainDataCollection].push(ret.data);

				me.presets = new Backbone.Collection(Upfront.mainData[me.mainDataCollection] || []);

				//Notify preset is reset
				Upfront.Views.Editor.notify('Preset '+ preset.get('id') +' was reset');

				me.$el.empty();
				me.selectPresetPanel.remove();
				me.showSelectPresetPanel(true);
			}).error(function (ret) {
				//Notify error
				Upfront.Views.Editor.notify(ret);
			});
		},

		changePreset: function(preset) {
			this.$el.empty();
			this.selectPresetPanel.remove();
			this.showSelectPresetPanel(true);
		},

		getBody: function () {
			var $body = $('<div class="" />');

			this.panels.each(function (panel) {
				panel.render();
				panel.parent_view = me;
				$body.append(panel.el);
			});

			return $body;
		},

		save_settings: function() {
			this.panels.each(function(panel){
				panel.save_settings();
			});
		},

		cleanUp: function() {

		}
	});

	return PresetManager;
});
})(jQuery);
