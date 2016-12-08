define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'elements/upfront-newnavigation/js/settings/appearance-panel',
	'elements/upfront-newnavigation/js/menu-util'
], function(ElementSettings, RootSettingsPanel, AppearancePanel, MenuUtil) {
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var getSelectMenuOptions = function() {
		return _.union([{label: l10n.create_new, value: -1}], MenuUtil.getSelectMenuOptions());
	};

	var Menu_Panel = RootSettingsPanel.extend({
		className: 'upfront-settings_panel_wrap menu-settings',
		title: l10n.mnu.title,
		initialize: function(options) {
			var me = this;
			this.constructor.__super__.initialize.call(this, options);
			Upfront.Events.on('menu_element:menu_created', function(menuData) {
				var selectMenuField = me.getSelectMenuField();
				selectMenuField.options.values = getSelectMenuOptions();
				selectMenuField.render();
				selectMenuField.set_value(menuData.term_id);
			});
			this.listenTo(this.model.get('properties'), 'change', function(property) {
				if (!property) return;
				if (property.get('name') !== 'menu_slug' && property.get('name') !== 'menu_id') {
					return;
				}
				var selectMenuField = me.getSelectMenuField();
				selectMenuField.set_value(me.model.get('properties').findWhere({'name': 'menu_id'}).get('value'));
			});
		},

		getSelectMenuField: function() {
			var selectMenuModule = this.settings.findWhere({identifier: 'selectMenuModule'});
			return selectMenuModule.fields.findWhere({identifier: 'selectMenuField'});
		},

		settings: [
			{
				type: 'SettingsItem',
				identifier: 'selectMenuModule',
				className: 'select-menu-box select-presets',
				fields: [
					{
						type: 'Select',
						property: 'menu_id',
						label: l10n.mnu.load,
						className: 'select-menu-field',
						identifier: 'selectMenuField',
						values: getSelectMenuOptions,
						change: function(value, me) {
							if (value == -1) {
								me.model.set_property('menu_slug', false, true);
								me.model.set_property('menu_id', false);
								me.$el.find('.select-menu-box').addClass('create-new');
								return;
							}
							me.$el.find('.select-menu-box').removeClass('create-new');
							// Menu slug is dependent on menu id, update it here
							var slug = MenuUtil.getMenuSlugById(value);
							me.model.set_property('menu_id', value, true);
							me.model.set_property('menu_slug', slug);
						}
					},
					{
						type: 'Button',
						label: l10n.mnu.delete_menu,
						className: 'delete-menu-button delete_preset',
						on_click: function() {
							if (confirm(l10n.are_you_sure_nag)) {
								//Remove navigation
								var menu_id = this.model.get_property_value_by_name('menu_id');
								Upfront.Events.trigger("menu_element:delete", menu_id);

								//Re-render select field
								var selectMenuField = this.panel.getSelectMenuField();
								selectMenuField.options.values = getSelectMenuOptions();
								selectMenuField.render();
								selectMenuField.set_value('-1');
							}
						}
					}
				]
			},
			{
				type: 'MenuStructure',
				identifier: 'menuStructureModule'
			}
		],

		save_settings: function(){
			this.setSelectedBreakpointMenu();
			Upfront.Events.trigger("menu_element:settings:saving");
			Menu_Panel.__super__.save_settings.apply(this, arguments);
			this.model.set_property('menu_items', false, true);
		},
		
		/** 
			setting different menu for each breakpoint
		**/
		setSelectedBreakpointMenu: function() {
			var currentBreakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active(),
				menuId = this.model.get_property_value_by_name('menu_id'),
				slug = this.model.get_property_value_by_name('menu_slug'),
				breakpointMenuData = this.model.get_property_value_by_name('breakpoint_menu_id')
			;
			
			if ( typeof currentBreakpoint.id === 'undefined' ) return;
			breakpointMenuData = ( breakpointMenuData ) ? breakpointMenuData : {};
			breakpointMenuData[currentBreakpoint.id] = {
				menu_id: menuId,
				menu_slug: slug
			};
			this.model.set_property('breakpoint_menu_id', breakpointMenuData, true);
			// menu_slug should always use desktop menu slug
			if ( breakpointMenuData['desktop'] && breakpointMenuData['desktop']['menu_slug'] ) {
				this.model.set_property('menu_slug', breakpointMenuData['desktop']['menu_slug'], true);
			}
		}
	});

	var NavigationSettings = ElementSettings.extend({
		initialize: function(opts) {
			this.constructor.__super__.initialize.call(this, opts);
			var me = this;

			/** before the appearance pannel settings for the menu are being rendered
				for a particular breakpoint, check, if a preset already exists for that
				particular breakpoint. If not, copy one from the preset for the next
				higher breakpoint.
			**/

			this.listenTo(this.appearancePanel, 'upfront:presets:setup-items', function() {
				var panel = me.appearancePanel;
				var preset = panel.property('preset') ? panel.clear_preset_name(panel.property('preset')) : 'default',
					presetModel = panel.presets.findWhere({id: preset});
				
				// If presetModel undefined we should fallback to default preset
				if(typeof presetModel === "undefined") {
					preset = 'default';
					presetModel = panel.presets.findWhere({id: preset});
				}
				
				var allBreakpoints = Upfront.Views.breakpoints_storage.get_breakpoints(),
					currentBreakpoint = allBreakpoints.get_active(),
					breakpointsData = presetModel.get('breakpoint') || {},
					changed = false
				;

				if (!breakpointsData[currentBreakpoint.id] || !breakpointsData[currentBreakpoint.id].menu_style) {

					var higherBPs = _.filter(allBreakpoints.models, function(breakpoint) {
						return breakpoint.get('width') > currentBreakpoint.get('width');
					});

					higherBPs = _.sortBy(higherBPs, function(item) {
						return item.get('width');
					});

					for (var i = 0; i < higherBPs.length; i++) {
						breakpointsData[currentBreakpoint.id] = _.clone(breakpointsData[higherBPs[i].id]);
						if(breakpointsData[currentBreakpoint.id]) {
							console.log("from "+higherBPs[i].id+" to "+currentBreakpoint.id);
							break;
						}
					}

					// if really did acquire settings from the upper bp
					if (breakpointsData[currentBreakpoint.id]) {
						changed = true;
					}


				}


				/** when a preset is being saved with menu_style set to burger,
					make sure that it saves burger_alignment as well
				**/

				if (breakpointsData[currentBreakpoint.id] && breakpointsData[currentBreakpoint.id].menu_style === 'burger' && !breakpointsData[currentBreakpoint.id].burger_alignment ) {
					breakpointsData[currentBreakpoint.id].burger_alignment = 'left';
					changed = true;
				}

				if (changed) {
					presetModel.set('breakpoint', breakpointsData);
				}

			});



		},
		hasBreakpointSettings: true,
		breakpointSpecificPresetSettings: [
			{
				name: 'menu_alignment'
			},
			{
				name: 'burger_alignment'
			},
			{
				name: 'is_floating'
			},
			{
				name: 'burger_over'
			},
			{
				name: 'menu_style'
			},
			{
				name: 'width'
			}
		],
		panels: {
			General: Menu_Panel,
			Appearance: AppearancePanel
		},
		onSaveSettings: function() {
			var menuId = this.model.get_property_value_by_name('menu_id'),
				themenu = _.findWhere(this.for_view.existingMenus, {term_id: menuId})
			;
			// Update slug because it's depending on id and has to be updated properly
			if (themenu) {
				this.model.set_property('menu_slug', themenu.slug, true);
			}
		},
		render: function () {
			this.constructor.__super__.render.call(this);

			var me = this;

			this.currentState = '';
			this.listenTo(this.appearancePanel, 'upfront:presets:state_show', function (state) {
				me.currentState = state;
			});
			this.listenTo(this.for_view, 'rendered', function () {
				if ( me.currentState ) me.stateShow(me.currentState);
			});
		},
		/**
		 * Get the title (goes into settings title area)
		 * @return {string} Title
		 */
		title: l10n.settings
	});


	return NavigationSettings;
});
