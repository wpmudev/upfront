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
			var me = this;
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

			var savePreset = function(properties) {
				Upfront.Util.post({
					action: 'upfront_save_' + this.ajaxActionSlug + '_preset',
					data: properties
				}).done( function() {
					me.model.trigger("preset:updated");
				});
			};

			// Let's not flood server on some nuber property firing changes like crazy
			this.debouncedSavePreset = _.debounce(savePreset, 1000);

			this.migrateElementToPreset();
			this.setupItems();
		},

		migrateElementToPreset: function() {
			// Simply add element style to preset css and name preset as element style was named.
			// Only button, accordion and tabs had presets in old version, we won't merge those because that gets
			// too complicated.
			var hadPresets = _.contains(['UtabsView', 'UaccordionView', 'ButtonView'], this.property('view_class')),
				elementStyleName,
				newPresetName,
				existingPreset,
				style,
				newPreset;

			if (hadPresets) {
				this.migrateExistingPresets();
				return;
			}

			if (this.property('preset')) return;

			elementStyleName = this.property('theme_style');

			// We need to set to _default first so that css editor can get style properly
			if (!elementStyleName) elementStyleName = '_default';

			Upfront.Application.cssEditor.init({
				model: this.model,
				stylename: elementStyleName,
				no_render: true
			});

			// Add element style to preset model. Now change _default to new name
			newPresetName = elementStyleName === '_default' ? this.styleElementPrefix.replace('-preset', '') + '-theme-style' : elementStyleName + '-m';
			existingPreset = this.presets.findWhere({id: newPresetName});

			if (existingPreset) {
				this.property('preset', existingPreset.id);
				this.property('theme_style', '');
				return;
			}

			style = $.trim(Upfront.Application.cssEditor.get_style_element().html().replace(/div#page.upfront-layout-view .upfront-editable_entity.upfront-module/g, '#page'));
			style = style.replace(new RegExp(elementStyleName, 'g'), newPresetName);

			// Create new preset and assign style to preset
			newPreset = new Backbone.Model(this.getPresetDefaults(newPresetName));
			newPreset.set({
				preset_style: style
			});

			this.migratePresetProperties(newPreset);

			// And remove element style
			this.property('theme_style', '');
			this.property('preset', newPreset.id);
			this.presets.add(newPreset);
			var properties = newPreset.toJSON();
			Util.updatePresetStyle(this.styleElementPrefix.replace(/-preset/, ''), properties, this.styleTpl);

			this.debouncedSavePreset(properties);

			_.each(Upfront.mainData[this.mainDataCollection], function(preset, presetIndex) {
				if (preset.id === properties.id) {
					index = presetIndex;
				}
			});

			if (_.isUndefined(index) === false) {
				Upfront.mainData[this.mainDataCollection].splice(index, 1);
			}
			Upfront.mainData[this.mainDataCollection].push(properties);

			// Trigger change so that whole element re-renders again.
			// (to replace element style class with preset class, look upfront-views.js
			this.model.get('properties').trigger('change');
		},

		/**
		 * Allow element appearance panels to migrate properties from old type of settings
		 * to new preset based settings.
		 */
		migratePresetProperties: function(newPreset) {
			// Generic populating  of preset with old values
			_.each(newPreset.attributes, function(value, name) {
				var data,
					oldValue = this.model.get_property_value_by_name(name);

				// Do not overwrite identifiers
				if (name === 'id') return;
				if (name === 'name') return;

				if (typeof oldValue !== 'undefined' && oldValue !== false) {
					data = {};
					data[name] = this.model.get_property_value_by_name(name);
					newPreset.set(data);
				}
			}, this);
		},

		migrateExistingPresets: function() {
			var elementStyleName = this.property('theme_style');
			var preset = this.presets.findWhere({id: this.property('preset')});
			var presetStyle = preset.get('preset_style');

			if (preset.get('migrated') === true) return;
			preset.set({'migrated': true});

			// We need to set to _default first so that css editor can get style properly
			if (!elementStyleName) elementStyleName = '_default';

			Upfront.Application.cssEditor.init({
				model: this.model,
				stylename: elementStyleName,
				no_render: true
			});

			style = $.trim(Upfront.Application.cssEditor.get_style_element().html().replace(/div#page.upfront-layout-view .upfront-editable_entity.upfront-module/g, '#page'));
			style = style.replace(new RegExp(elementStyleName, 'g'), preset.get('name'));

			preset.set({
				preset_style: style
			});

			this.property('theme_style', '');

			var properties = preset.toJSON();
			Util.updatePresetStyle(this.styleElementPrefix.replace(/-preset/, ''), properties, this.styleTpl);

			this.debouncedSavePreset(properties);

			_.each(Upfront.mainData[this.mainDataCollection], function(preset, presetIndex) {
				if (preset.id === properties.id) {
					index = presetIndex;
				}
			});

			if (_.isUndefined(index) === false) {
				Upfront.mainData[this.mainDataCollection].splice(index, 1);
			}
			Upfront.mainData[this.mainDataCollection].push(properties);
			// Trigger change so that whole element re-renders again.
			// (to replace element style class with preset class, look upfront-views.js
			this.model.get('properties').trigger('change');
		},

		setupItems: function() {
			var preset = this.property('preset') ? this.clear_preset_name(this.property('preset')) : 'default',
				presetModel = this.presets.findWhere({id: preset}),
				currentBreakpoint,
				breakpointsData,
				breakpointData;

			// Add items
			this.selectPresetModule = new SelectPresetModule({
				model: this.model,
				presets: this.presets
			});

			// Setup preset model so that it uses breakpoint values
			if (this.options.hasBreakpointSettings === true) {
				currentBreakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active();
				breakpointsData = presetModel.get('breakpoint') || {};
				breakpointData = breakpointsData[currentBreakpoint.id] || {};
				_.each(this.options.breakpointSpecificPresetSettings, function(settingOptions) {
					if (!_.isUndefined(breakpointData[settingOptions.name])) {
						var data = {};
						data[settingOptions.name] = breakpointData[settingOptions.name];
						presetModel.set(data, {silent: true});
					}
				}, this);
			}

			this.editPresetModule = new EditPresetModule({
				model: presetModel,
				stateModules: this.stateModules
			});

			this.presetCssModule = new PresetCssModule({
				model: this.model,
				preset: presetModel
			});

			this.listenTo(this.selectPresetModule, 'upfront:presets:new', this.createPreset);
			this.listenTo(this.selectPresetModule, 'upfront:presets:change', this.changePreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:delete', this.deletePreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:reset', this.resetPreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:update', this.updatePreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:state_show', this.stateShow);
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
				styleElementId,
			  currentBreakpoint,
				breakpointsData;

			// Setup model so that it saves breakpoint values to breakpoint property
			if (this.options.hasBreakpointSettings === true) {
				currentBreakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active();
				breakpointsData = properties.breakpoint || {};
				breakpointsData[currentBreakpoint.id] = breakpointsData[currentBreakpoint.id] || {};
				_.each(this.options.breakpointSpecificPresetSettings, function(settingOptions) {
					breakpointsData[currentBreakpoint.id][settingOptions.name] = properties[settingOptions.name];
					// Delete property from root properties so that model remians clean (these properties should only be saved in breakpoint data)
					delete properties[settingOptions.name];
				}, this);
				// Finally update breakpoints in model
				properties.breakpoint = breakpointsData;
			}
			Util.updatePresetStyle(this.styleElementPrefix.replace(/-preset/, ''), properties, this.styleTpl);

			this.debouncedSavePreset(properties);

			_.each(Upfront.mainData[this.mainDataCollection], function(preset, presetIndex) {
				if (preset.id === properties.id) {
					index = presetIndex;
				}
			});

			if (_.isUndefined(index) === false) {
				Upfront.mainData[this.mainDataCollection].splice(index, 1);
			}
			Upfront.mainData[this.mainDataCollection].push(properties);
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
				var resetPreset = ret.data;
				if(_.isEmpty(ret.data) || ret.data === false) {
					resetPreset = me.getPresetDefaults('default');
				}

				//Update preset CSS with reset properties
				Util.updatePresetStyle(me.styleElementPrefix.replace(/-preset/, ''), resetPreset, me.styleTpl);

				_.each(Upfront.mainData[me.mainDataCollection], function(preset, presetIndex) {
					if (preset.id === resetPreset.id) {
						index = presetIndex;
					}
				});
				if (_.isUndefined(index) === false) {
					Upfront.mainData[me.mainDataCollection].splice(index, 1);
				}
				Upfront.mainData[me.mainDataCollection].push(resetPreset);

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

		stateShow: function(state) {
			this.trigger('upfront:presets:state_show', state);
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
		},

		save_settings: function() {
			// Deliberately disable save_settings, preset manager saves preset as it changes
		}
	});

	return PresetManager;
});
})(jQuery);
