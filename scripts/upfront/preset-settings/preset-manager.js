(function($) {
define([
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/settings/modules/select-preset',
	'scripts/upfront/settings/modules/edit-preset',
	'scripts/upfront/settings/modules/migrate-preset',
	'scripts/upfront/settings/modules/preset-css',
	'scripts/upfront/preset-settings/util',
	'scripts/upfront/preset-settings/preset-css-editor'
], function(RootSettingsPanel, SelectPresetModule, EditPresetModule, MigratePresetModule, PresetCssModule, Util, PresetCSSEditor) {
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
	var l10n = Upfront.Settings.l10n.preset_manager;

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

			this.createBackup();

			this.defaultOverlay();

			this.listenToOnce(Upfront.Events, 'element:settings:canceled', function() {
				this.updateCanceledPreset(this.backupPreset);
			});

			// Listen to breakpoint change and close off the interface
			this.listenToOnce(Upfront.Events, 'upfront:layout_size:change_breakpoint', this.cancelPresetChanges);
		},

		createBackup: function() {
			var preset = this.property('preset') ? this.clear_preset_name(this.property('preset')) : 'default',
				backupModel = this.presets.findWhere({id: preset});

			if(typeof backupModel === "undefined") {
				backupModel = this.presets.findWhere({id: 'default'});
			}

			// Backup preset model properties for later use in reset (on settings cancel)
			if(typeof this.backupPreset === "undefined") {
				this.backupPreset = Upfront.Util.clone(backupModel.toJSON());
			}
		},

		defaultOverlay: function() {
			var me = this,
				preset = this.property('preset') ? this.clear_preset_name(this.property('preset')) : 'default';

			if(preset === "default") {
				setTimeout( function() {
					//Wrap settings and preset styles
					me.$el.find('.preset_specific').next().andSelf().wrapAll('<div class="default-overlay-wrapper" />');

					//Append overlay div
					me.$el.find('.default-overlay-wrapper').append('<div class="default-overlay">' +
					'<div class="overlay-title">' + l10n.default_overlay_title + '</div>' +
					'<div class="overlay-text">' + l10n.default_overlay_text + '</div>' +
					'<div class="overlay-button"><button type="button" class="overlay-button-input">'+ l10n.default_overlay_button +'</button></div>' +
					'</div>');

					//Disable preset reset button
					me.$el.find('.delete_preset input').prop('disabled', true);
					me.$el.find('.delete_preset input').css({ opacity: 0.6 });
				}, 100);
			}

			this.$el.on('click', '.overlay-button-input', function(event) {
				event.preventDefault();

				//Remove overlay div
				me.$el.find('.default-overlay').remove();

				//Update wrapper min-height
				me.$el.find('.default-overlay-wrapper').css('min-height', '30px');

				//Enable preset reset button
				me.$el.find('.delete_preset input').prop('disabled', false);
				me.$el.find('.delete_preset input').css({ opacity: 1 });
			});
		},

		updateMainDataCollectionPreset: function(properties) {
			var index;

			_.each(Upfront.mainData[this.mainDataCollection], function(preset, presetIndex) {
				if (preset.id === properties.id) {
					index = presetIndex;
				}
			});

			if (typeof index !== 'undefined') {
				Upfront.mainData[this.mainDataCollection][index] = properties;
			} else {
				Upfront.mainData[this.mainDataCollection].push(properties);
			}
		},

		/**
		 * Allow element appearance panels to migrate properties from old type of settings
		 * to new preset based settings.
		 */
		migratePresetProperties: function(newPreset) {
			return newPreset;
		},

		/**
		 Migrate theme_style classes
		 */

		migrateElementStyle: function(styles) {
			return styles;
		},

		setupItems: function() {
			this.trigger('upfront:presets:setup-items', this);
			var preset = this.clear_preset_name(this.model.decode_preset() || 'default'),
				presetModel = this.presets.findWhere({id: preset}),
				currentBreakpoint,
				breakpointsData,
				breakpointData;

			if(typeof presetModel === "undefined") {
				presetModel = this.presets.findWhere({id: 'default'});
			}

			// Add items
			if (this.selectPresetModule && this.selectPresetModule.stopListening) {
				this.selectPresetModule.stopListening();
				this.stopListening(this.selectPresetModule);
			}
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

			if (this.editPresetModule && this.editPresetModule.stopListening) {
				this.editPresetModule.stopListening();
				this.stopListening(this.editPresetModule);
			}
			this.editPresetModule = new EditPresetModule({
				model: presetModel,
				stateModules: this.stateModules
			});

			if (this.presetCssModule && this.presetCssModule.stopListening) {
				this.presetCssModule.stopListening();
				this.stopListening(this.presetCssModule);
			}
			this.presetCssModule = new PresetCssModule({
				model: this.model,
				preset: presetModel
			});

			//When element is not migrated yet
			this.migratePresetModule = new MigratePresetModule({
				model: this.model,
				presets: this.presets,
				elementPreset: this.styleElementPrefix
			});

			this.listenTo(this.selectPresetModule, 'upfront:presets:new', this.createPreset);
			this.listenTo(this.selectPresetModule, 'upfront:presets:change', this.changePreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:delete', this.deletePreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:reset', this.resetPreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:update', this.updatePreset);
			this.listenTo(this.editPresetModule, 'upfront:presets:state_show', this.stateShow);
			this.listenTo(this.presetCssModule, 'upfront:presets:update', this.updatePreset);
			this.listenTo(this.selectPresetModule, 'upfront:presets:migrate', this.migratePreset);

			//Migration listeners
			this.listenTo(this.migratePresetModule, 'upfront:presets:preview', this.previewPreset);
			this.listenTo(this.migratePresetModule, 'upfront:presets:change', this.applyExistingPreset);
			this.listenTo(this.migratePresetModule, 'upfront:presets:new', this.migratePreset);

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

		updateCanceledPreset: function(properties) {
			Util.updatePresetStyle(this.styleElementPrefix.replace(/-preset/, ''), properties, this.styleTpl);

			this.debouncedSavePreset(properties);

			this.updateMainDataCollectionPreset(properties);
		},

		updatePreset: function(properties) {
			var index,
				styleElementId,
			 	currentBreakpoint,
				breakpointsData
			;

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

			this.updateMainDataCollectionPreset(properties);
		},

		migratePreset: function(presetName) {

			//Check if preset already exist
			var existingPreset = this.presets.findWhere({id: presetName.toLowerCase().replace(/ /g, '-')});

			if(typeof existingPreset !== "undefined") {
				Upfront.Views.Editor.notify(l10n.preset_already_exist.replace(/%s/, presetName), 'error');
				return;
			}

			var elementStyleName = this.property('theme_style');

			// We need to set to _default first so that css editor can get style properly
			if (!elementStyleName) elementStyleName = '_default';

			// We need to initialize cssEditor to get element styles
			Upfront.Application.cssEditor.init({
				model: this.model,
				stylename: elementStyleName,
				no_render: true
			});

			var style = $.trim(Upfront.Application.cssEditor.get_style_element().html().replace(/div#page.upfront-layout-view .upfront-editable_entity.upfront-module/g, '#page'));

			//Apply style only for the current preset
			style = style.replace(new RegExp('.' + elementStyleName, 'g'), '');

			style = Upfront.Application.stylesAddSelectorMigration($.trim(style), '');

			//Migrate element styles
			style = this.migrateElementStyle(style);

			newPreset = new Backbone.Model(this.getPresetDefaults(presetName));

			//Migrate element styles to preset
			if(typeof style !== "undefined") {
				newPreset.set({
					preset_style: style
				});
			}

			//Migrate element properties to preset
			this.migratePresetProperties(newPreset);

			// And remove element style
			this.property('preset', newPreset.id);
			this.presets.add(newPreset);
			presetOptions = newPreset;
			properties = newPreset.toJSON();

			this.property('theme_style', '');

			//Render new preset
			Util.updatePresetStyle(this.styleElementPrefix.replace(/-preset/, ''), properties, this.styleTpl);

			//Save preset
			this.debouncedSavePreset(properties);
			this.updateMainDataCollectionPreset(properties);

			//Set element as migrated
			this.property('usingNewAppearance', true);

			// Trigger change so that whole element re-renders again.
			// (to replace element style class with preset class, look upfront-views.js
			this.model.get('properties').trigger('change');

			//Notify preset is created
			Upfront.Views.Editor.notify(l10n.preset_created.replace(/%s/, presetName));

			this.render();
		},

		createPreset: function(presetName) {
			//Check if preset already exist

			var existingPreset = this.presets.findWhere({id: presetName.toLowerCase().replace(/ /g, '-')});
			if(typeof existingPreset !== "undefined") {
				Upfront.Views.Editor.notify(l10n.preset_already_exist.replace(/%s/, presetName), 'error');
				return;
			}

			var preset = this.getPresetDefaults(presetName);

			this.presets.add(preset);
			this.model.set_property('preset', preset.id);
			this.updatePreset(preset);

			// Make sure we don't lose our current preset
			this.model.encode_preset(preset.id);

			//Notify preset is created
			Upfront.Views.Editor.notify(l10n.preset_created.replace(/%s/, presetName));

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
			this.model.encode_preset('default');

			this.presets.remove(preset);

			this.render();

			this.defaultOverlay();
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

				me.updateMainDataCollectionPreset(resetPreset);

				me.presets = new Backbone.Collection(Upfront.mainData[me.mainDataCollection] || []);

				//Notify preset is reset
				Upfront.Views.Editor.notify(l10n.preset_reset.replace(/%s/, preset.get('id')));

				me.$el.empty();
				me.render();
			}).error(function (ret) {
				//Notify error
				Upfront.Views.Editor.notify(ret);
			});
		},

		applyExistingPreset: function(preset) {
			//Set element as already migrated
			this.property('usingNewAppearance', true);

			//Set existing preset
			this.changePreset(preset);

			this.defaultOverlay();
		},

		changePreset: function(preset) {
			// Add items
			this.stopListening();

			// Make sure we don't lose our current preset
			this.model.encode_preset(preset);

			//this.setupItems(); // called in render -> getBody
			this.render();

			this.defaultOverlay();

			//Display notification
			Upfront.Views.Editor.notify(l10n.preset_changed.replace(/%s/, preset));
		},

		previewPreset: function(preset) {
			var element_id = this.property('element_id'),
				elementType = this.styleElementPrefix.replace(/-preset/, '');

			//We need to manage Tabs, Accordions & Buttons are they are using another classes for presets
			if(elementType === "accordion") {
				var $selector = $('#' + element_id).find(".upfront-accordion-container");

				$selector.removeClass(this.getPresetClasses(elementType));
				$selector.addClass(elementType + '-preset-' + preset);

			} else if(elementType === "tab") {
				//Remove original preset classes
				var $selector = $('#' + element_id).find(".upfront-tabs-container");

				$selector.removeClass(this.getPresetClasses(elementType));
				$selector.addClass(elementType + '-preset-' + preset);

			} else if(elementType === "button") {
				var $selector = $('#' + element_id).find(".upfront_cta");

				$selector.removeClass(this.getPresetClasses(elementType));
				$selector.addClass(elementType + '-preset-' + preset);

			} else {
				//Remove original preset classes
				$('#' + element_id).removeClass(this.getPresetClasses());

				//Add preset class to element
				$('#' + element_id).addClass(preset);
			}

		},

		getPresetClasses: function(elementType) {
			var presetClasses = '';

			_.map(this.presets.models, function(model) {
				if(typeof elementType !== "undefined" && elementType) {
					presetClasses += elementType + '-preset-' + model.get('id') + ' ';
				} else {
					presetClasses += model.get('id') + ' ';
				}
			});

			return presetClasses;
		},

		stateShow: function(state) {
			this.trigger('upfront:presets:state_show', state);
		},
		
		/**
		 * Allow element appearance panels to migrate properties from old type of settings
		 * to new preset based settings.
		 */
		getModifiedProperties: function() {
			return true;
		},
		
		migrateToDefault: function() {
			var needMigration = this.getModifiedProperties();
			
			if(!needMigration) {
				//Set element as already migrated
				this.property('usingNewAppearance', true);

				//Set preset to default
				this.property('preset', 'default');

				this.defaultOverlay();
			}
			
			return false;
		},

		getBody: function () {
			this.setupItems();
			var $body = $('<div />'),
				me = this;
			
			/**
			 *	Automatically migrate Text & Accordion elements to Default if no options are not modified.
			 */
			this.migrateToDefault();

			if(this.property('usingNewAppearance') !== true) {
				this.settings = _([
					this.migratePresetModule
				]);
			}

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
