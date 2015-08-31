(function($) {
define([
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/settings/modules/select-preset',
	'scripts/upfront/settings/modules/edit-preset',
	'scripts/upfront/settings/modules/preset-css',
	'scripts/upfront/preset-settings/util'
], function(RootSettingsPanel, SelectPresetModule, EditPresetModule, PresetCssModule, Util) {
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
	 * stateModules - presets handle element states like hover, static and active; for each state all
	 *		properties can be set this is object containing all states and their properties see Tab Element
	 *		settings for example.
	 *		In state fields, fields that have change callback can use second parameter which will be parent
	 *		element, using parent element change function can set value on model.
	 *
	 * styleTpl - Upfront.Util.template parsed styles template
	 */
	var PresetManager = RootSettingsPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel preset-manager-panel',

		initialize: function (options) {
			this.options = options;
			_.each(this.options, function(option, index) {
				this[index] = option;
			}, this);

			var defaultPreset = false;

			_.each(Upfront.mainData[this.mainDataCollection], function(preset, presetIndex) {
				if (preset.id === 'default') {
					defaultPreset = true;
				}
			});

			if(!defaultPreset) {
				Upfront.mainData[this.mainDataCollection] = _.isArray(Upfront.mainData[this.mainDataCollection]) ?
						Upfront.mainData[this.mainDataCollection] : [];

				Upfront.mainData[this.mainDataCollection].unshift(this.getPresetDefaults('default'));
			}
			
			this.presets = new Backbone.Collection(Upfront.mainData[this.mainDataCollection] || []);
			
			this.setupItems();
		},

		setupItems: function() {
			var preset = this.property('preset') ? this.clear_preset_name(this.property('preset')) : 'default';

			// Add items
			this.selectPresetModule = new SelectPresetModule({
				model: this.model,
				presets: this.presets
			});

			this.editPresetModule = new EditPresetModule({
				model: this.presets.findWhere({id: preset}),
				stateModules: this.stateModules
			});

			this.presetCssModule = new PresetCssModule({
				model: this.model,
				preset: this.presets.findWhere({id: preset}),
			});

			this.listenTo(this.selectPresetModule, 'upfront:presets:new', this.createPreset);
			this.listenTo(this.selectPresetModule, 'upfront:presets:change', this.changePreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:delete', this.deletePreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:reset', this.resetPreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:update', this.updatePreset);
			this.listenTo(this.presetCssModule, 'upfront:presets:update', this.updatePreset);

			this.settings = _([
				this.selectPresetModule,
				this.editPresetModule,
				this.presetCssModule
			]);
		},

		getTitle: function() {
			return 'Appearance';
		},

		getPresetDefaults: function(presetName) {
			return _.extend(this.presetDefaults, {
				id: presetName.toLowerCase().replace(/ /g, '-'),
				name: presetName
			});
		},

		updatePreset: function(properties) {
			var index,
				styleElementId;

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
			this.render();
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

			this.render();
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
				me.render();
			}).error(function (ret) {
				//Notify error
				Upfront.Views.Editor.notify(ret);
			});
		},

		changePreset: function(preset) {
			// Add items
			this.stopListening();
			this.setupItems();
			this.render();
		},

		getBody: function () {
			this.setupItems();
			var $body = $('<div />'),
				me = this;

			this.settings.each(function (setting) {
				if ( ! setting.panel ) setting.panel = me;
				setting.render();
				$body.append(setting.el)
			});

			return $body;
		},

		// utils
		clear_preset_name: function(preset) {
			preset = preset.replace(' ', '-');
			preset = preset.replace(/[^-a-zA-Z0-9]/, '');
			return preset;
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

	return PresetManager;
});
})(jQuery);
