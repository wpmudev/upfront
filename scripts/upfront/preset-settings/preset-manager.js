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

				// Generate presets styles to page
				Util.generatePresetsToPage(this.ajaxActionSlug, this.styleTpl);
			}


			this.presets = new Backbone.Collection(Upfront.mainData[this.mainDataCollection] || []);

			var savePreset = function(properties) {
				if (!Upfront.Application.user_can("MODIFY_PRESET")) {
					me.model.trigger("preset:updated", properties.id);
					return false;
				}

				me.model.trigger("preset:updated", properties.id);
				Upfront.Application.presetSaver.queue(properties, me.ajaxActionSlug);
			};

			// Let's not flood server on some nuber property firing changes like crazy
			this.debouncedSavePreset = _.debounce(savePreset, 1000);

			var renderParts  = function(render) {
				if(render) {
					me.model.trigger("preset:updated:rerender", properties.id);
				}
			}

			// Prevent multiple re-render
			this.debouncedRenderParts= _.debounce(renderParts, 1000);

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

		migrateElementStyle: function(styles, selector) {
			return styles;
		},

		/**
		 Migrate _default classes
		 */

		migrateDefaultStyle: function(styles) {
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

			if (Upfront.Application.user_can("SWITCH_PRESET")) { // Don't build the control if we can't do this
				this.selectPresetModule = new SelectPresetModule({
					model: this.model,
					presets: this.presets
				});
			}

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

			if (
				Upfront.Application.user_can("SWITCH_PRESET")
				&&
				(Upfront.Application.user_can("MODIFY_PRESET") || Upfront.Application.user_can("DELETE_PRESET"))
			) { // Don't build the control if we can't do this
				this.editPresetModule = new EditPresetModule({
					model: presetModel,
					stateModules: this.stateModules
				});
			}

			if (this.presetCssModule && this.presetCssModule.stopListening) {
				this.presetCssModule.stopListening();
				this.stopListening(this.presetCssModule);
			}

			if (Upfront.Application.user_can("SWITCH_PRESET") && Upfront.Application.user_can("MODIFY_PRESET")) { // Don't build the control if we can't do this
				this.presetCssModule = new PresetCssModule({
					model: this.model,
					preset: presetModel
				});
			}

			//When element is not migrated yet
			this.migratePresetModule = new MigratePresetModule({
				model: this.model,
				presets: this.presets,
				elementPreset: this.styleElementPrefix
			});

			if (Upfront.Application.user_can("SWITCH_PRESET")) {
				if (this.selectPresetModule && Upfront.Application.user_can("SWITCH_PRESET")) this.listenTo(this.selectPresetModule, 'upfront:presets:change', this.changePreset);
				if (this.selectPresetModule && Upfront.Application.user_can("SWITCH_PRESET")) this.listenTo(this.selectPresetModule, 'upfront:presets:migrate', this.migratePreset);

				if (this.editPresetModule && Upfront.Application.user_can("DELETE_PRESET")) this.listenTo(this.editPresetModule, 'upfront:presets:delete', this.deletePreset);
				if (this.editPresetModule && Upfront.Application.user_can("DELETE_PRESET")) this.listenTo(this.editPresetModule, 'upfront:presets:reset', this.resetPreset);

				if (this.editPresetModule && Upfront.Application.user_can("MODIFY_PRESET")) this.listenTo(this.editPresetModule, 'upfront:presets:state_show', this.stateShow);
				if (this.editPresetModule && Upfront.Application.user_can("MODIFY_PRESET")) this.listenTo(this.editPresetModule, 'upfront:presets:update', this.updatePreset);
				if (this.presetCssModule && Upfront.Application.user_can("MODIFY_PRESET")) this.listenTo(this.presetCssModule, 'upfront:presets:update', this.updatePreset);
				if (this.selectPresetModule && Upfront.Application.user_can("MODIFY_PRESET")) this.listenTo(this.selectPresetModule, 'upfront:presets:new', this.createPreset);
			}

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

		getPresetDefaultsMigration: function(presetName) {
			var element = this.styleElementPrefix.replace(/-preset/, '');

			if(element === "tab" || element === "accordion" || element === "contact" || element === "button") {
				return _.extend({}, {
					id: presetName.toLowerCase().replace(/ /g, '-'),
					name: presetName
				});
			} else {
				return _.extend(this.presetDefaults, {
					id: presetName.toLowerCase().replace(/ /g, '-'),
					name: presetName
				});
			}
		},

		getPresetDefaults: function(presetName) {
			return _.extend(this.presetDefaults, {
				id: presetName.toLowerCase().replace(/ /g, '-'),
				name: presetName,
				preset: presetName,
				// should always be empty
				preset_style: ''
			});
		},

		updateCanceledPreset: function(properties) {
			Util.updatePresetStyle(this.styleElementPrefix.replace(/-preset/, ''), properties, this.styleTpl);

			this.debouncedSavePreset(properties);

			this.updateMainDataCollectionPreset(properties);
		},

		updatePreset: function(properties, render) {
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

			this.debouncedRenderParts(render);

			this.updateMainDataCollectionPreset(properties);
		},

		migratePreset: function(presetName) {

			//Check if preset already exist
			var existingPreset = this.presets.findWhere({id: presetName.toLowerCase().replace(/ /g, '-')}),
				default_style = '';

			if(typeof existingPreset !== "undefined") {
				Upfront.Views.Editor.notify(l10n.preset_already_exist.replace(/%s/, presetName), 'error');
				return;
			}

			var elementStyleName = this.property('theme_style');

			// We need to set to _default first so that css editor can get style properly
			if (!elementStyleName) elementStyleName = '_default';

			// If element style is not default we should add _default too
			if(elementStyleName !== '_default') {
				// We need to initialize cssEditor to get element styles
				Upfront.Application.cssEditor.init({
					model: this.model,
					stylename: '_default',
					no_render: true
				});

				//Get _default styles
				default_style = $.trim(Upfront.Application.cssEditor.get_style_element().html().replace(/div#page.upfront-layout-view .upfront-editable_entity.upfront-module/g, '#page'));

				//Make sure we remove #page from default classes
				default_style = default_style.replace(/#page/g, '');

				//Normalize styles
				default_style = this.migrateDefaultStyle(default_style);

				//Prepend styles with preset
				default_style = Upfront.Application.stylesAddSelectorMigration($.trim(default_style), '#page .' + presetName.toLowerCase().replace(/ /g, '-'));
			}

			// We need to initialize cssEditor to get element styles
			Upfront.Application.cssEditor.init({
				model: this.model,
				stylename: elementStyleName,
				no_render: true
			});

			var style = $.trim(Upfront.Application.cssEditor.get_style_element().html().replace(/div#page.upfront-layout-view .upfront-editable_entity.upfront-module/g, '#page'));

			//Apply style only for the current preset
			style = style.replace(new RegExp(elementStyleName, 'g'), presetName.toLowerCase().replace(/ /g, '-'));

			if(elementStyleName !== '_default') {
				style = default_style + style;
			} else {
				//Normalize styles
				style = this.migrateDefaultStyle(style);
				style = Upfront.Application.stylesAddSelectorMigration($.trim(style), '#page .' + presetName.toLowerCase().replace(/ /g, '-'));
			}

			//Migrate element styles
			style = this.migrateElementStyle(style, '#page .' + presetName.toLowerCase().replace(/ /g, '-'));

			newPreset = new Backbone.Model(this.getPresetDefaultsMigration(presetName));

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
			Upfront.Events.trigger('element:preset:updated');
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
			Upfront.Events.trigger('element:preset:updated');
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
			Upfront.Events.trigger('element:preset:updated');
			Upfront.Events.trigger('element:preset:deleted', this.ajaxActionSlug, preset);
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
				Upfront.Events.trigger('element:preset:updated');
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

			// Remove theme style just in case
			this.model.set_property('theme_style', '');

			// Make sure we don't lose our current preset
			this.model.encode_preset(preset);

			//this.setupItems(); // called in render -> getBody
			this.render();

			this.defaultOverlay();

			// run layout change event
			Upfront.Events.trigger('entity:layout:change');

			Upfront.Events.trigger('element:preset:updated');
			//Display notification
			Upfront.Views.Editor.notify(l10n.preset_changed.replace(/%s/, preset));
		},

		previewPreset: function(preset) {
			var element_id = this.property('element_id'),
				elementType = this.styleElementPrefix.replace(/-preset/, ''),
				themeStyle = this.model.get_property_value_by_name('theme_style'),
			  $selector;

			// Handle custom css class
			if (preset === '' && themeStyle) {
				$('#' + element_id).addClass(themeStyle);
			} else if (themeStyle) {
				$('#' + element_id).removeClass(themeStyle);
				$('#' + element_id).find('.' + themeStyle).removeClass(themeStyle);
			}

			//We need to manage Tabs, Accordions & Buttons are they are using another classes for presets
			if(elementType === "accordion") {
				$selector = $('#' + element_id).find(".upfront-accordion-container");

				$selector.removeClass(this.getPresetClasses(elementType));
				if (preset !== '') {
					$selector.addClass(elementType + '-preset-' + preset);
				} else {
					$selector.addClass(elementType + '-preset-' + this.model.get_property_value_by_name('preset'));
        }

			} else if(elementType === "tab") {
				//Remove original preset classes
				$selector = $('#' + element_id).find(".upfront-tabs-container");

				$selector.removeClass(this.getPresetClasses(elementType));
				if (preset !== '') {
					$selector.addClass(elementType + '-preset-' + preset);
				} else {
					$selector.addClass(elementType + '-preset-' + this.model.get_property_value_by_name('preset'));
        }

			} else if(elementType === "button") {
				$selector = $('#' + element_id).find(".upfront_cta");

				$selector.removeClass(this.getPresetClasses(elementType));
				if (preset !== '') {
					$selector.addClass(elementType + '-preset-' + preset);
				} else {
					$selector.addClass(elementType + '-preset-' + this.model.get_property_value_by_name('preset'));
        }

			} else if(_.contains(["image", 'text', 'gallery', 'slider', 'contact'], elementType)) {
				// Temporary setup element model so that is uses preset for rendering
				if (typeof this.actualModelData === 'undefined') {
					this.actualModelData = Upfront.Util.model_to_json(this.model);
				}
				if (preset !== '') {
					this.model.set_property('usingNewAppearance', true, true);
					this.model.set_property('theme_style', '', true);
					this.model.set_property('preset', preset, true);
					this.model.trigger('change');
					this.previousPresetClass = preset;
				} else {
					actualProperties = new Upfront.Collections.Properties(this.actualModelData.properties);
					actualProperties._events = this.model.get('properties')._events;
					this.model.set('properties', actualProperties);
					$('.upfront-active_entity').removeClass(this.previousPresetClass);
				}
			} else {
				//Remove original preset classes
				$('#' + element_id).removeClass(this.getPresetClasses());

				//Add preset class to element
				if (preset !== '') {
					$('#' + element_id).addClass(preset);
				}
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
			var needMigration = this.getModifiedProperties(),
				alreadyMigrated = this.property('usingNewAppearance');

			if(!needMigration && !alreadyMigrated) {
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
				if (!(setting || {}).render) return true;
				if ( ! setting.panel ) setting.panel = me;
				setting.render();
				$body.append(setting.el);
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
