define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'elements/upfront-newnavigation/js/settings/appearance-panel',
	'elements/upfront-newnavigation/js/menu-util'
], function(ElementSettings, RootSettingsPanel, AppearancePanel, MenuUtil) {
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var Menu_Panel = RootSettingsPanel.extend({
		className: 'upfront-settings_panel_wrap menu-settings',
		title: l10n.mnu.title,
		initialize: function(options) {
			var me = this;
			this.constructor.__super__.initialize.call(this, options);
			Upfront.Events.on('menu_element:menu_created', function(menuData) {
				me.settings._wrapped[0].fields._wrapped[0].options.values = MenuUtil.getMenuList();
				me.settings._wrapped[0].fields._wrapped[0].render();
				me.settings._wrapped[0].fields._wrapped[0].set_value(menuData.id);
			});
		},
		settings: [
			{
				type: 'SettingsItem',
				title: l10n.mnu.load,
				fields: [
					{
						type: 'Select',
						property: 'menu_id',
						label: "",
						values: MenuUtil.getMenuList(),
						change: function(value, me) {
							if (value == -1) {
								MenuUtil.set({menu_id: false, menu_slug: false});
								me.model.set_property('menu_slug', false);
								me.model.set_property('menu_id', false);
								return;
							}
							// Menu slug is dependent on menu id, update it here
							var slug = MenuUtil.getMenuSlugById(value);
							me.model.set_property('menu_id', value, true);
							me.model.set_property('menu_slug', slug);
						}
					}
				]
			},
			{
				type: 'MenuStructure'
			}
		],
		save_settings: function(){
			Menu_Panel.__super__.save_settings.apply(this, arguments);
			this.model.set_property('menu_items', false, true);
		},
		on_save: function() {
			//TODO this needs to be re-written to catch values from settings not from fields
			return;
			var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
			var current_set_value = this.settings._wrapped[0].fields._wrapped[1].$el.find('input:checked').val();
			var current_set_alignment = this.settings._wrapped[1].fields._wrapped[0].$el.find('input:checked').val();
			var current_set_over = this.settings._wrapped[1].fields._wrapped[1].$el.find('input:checked').val();
			var current_set_style = this.settings._wrapped[2].fields._wrapped[0].$el.find('input:checked').val();
			var current_set_menu_alignment = this.settings._wrapped[3].fields._wrapped[0].$el.find('input:checked').val();
			var current_set_is_floating = this.settings._wrapped[4].fields._wrapped[1].$el.find('input:checked').val();
			if(typeof(current_set_is_floating) == 'undefined')
				current_set_is_floating = 'no';

			model_breakpoint = Upfront.Util.clone(this.model.get_property_value_by_name('breakpoint') || {});

			if ( breakpoint && !breakpoint.default ){
				if ( !_.isObject(model_breakpoint[breakpoint.id]) ) model_breakpoint[breakpoint.id] = {};
				breakpoint_data = model_breakpoint[breakpoint.id];
				breakpoint_data.burger_menu = current_set_value || '';
				breakpoint_data.burger_alignment = current_set_alignment;
				breakpoint_data.burger_over = current_set_over;
				breakpoint_data.menu_style = current_set_style;
				breakpoint_data.menu_alignment = current_set_menu_alignment;
				breakpoint_data.is_floating = current_set_is_floating;

				if(this.model.get_property_value_by_name('burger_menu') == 'yes') {
					this.settings._wrapped[0].fields._wrapped[1].$el.find('input').attr("checked", 'checked');
				} else {
					this.settings._wrapped[0].fields._wrapped[1].$el.find('input').removeAttr("checked");
				}

				this.settings._wrapped[1].fields._wrapped[0].$el.find('input').removeAttr("checked");
				this.settings._wrapped[1].fields._wrapped[0].$el.find('input[value="'+this.model.get_property_value_by_name('burger_alignment')+'"]').attr("checked", 'checked');

				this.settings._wrapped[2].fields._wrapped[0].$el.find('input').removeAttr("checked");
				this.settings._wrapped[2].fields._wrapped[0].$el.find('input[value="'+this.model.get_property_value_by_name('menu_style')+'"]').attr("checked", 'checked');

				this.settings._wrapped[3].fields._wrapped[0].$el.find('input').removeAttr("checked");
				this.settings._wrapped[3].fields._wrapped[0].$el.find('input[value="'+this.model.get_property_value_by_name('menu_alignment')+'"]').attr("checked", 'checked');

				this.settings._wrapped[4].fields._wrapped[1].$el.find('input').removeAttr("checked");
				this.settings._wrapped[4].fields._wrapped[1].$el.find('input[value="'+this.model.get_property_value_by_name('is_floating')+'"]').attr("checked", 'checked');

				this.settings._wrapped[1].fields._wrapped[1].$el.find('input').removeAttr("checked");
				this.settings._wrapped[1].fields._wrapped[1].$el.find('input[value="'+this.model.get_property_value_by_name('burger_over')+'"]').attr("checked", 'checked');

			}

			//force breakpoints lower in hierarchy to use burger menu if the level above is using it
			if(typeof(breakpoint) == 'undefined') {
				breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default();
			}

			if(current_set_value == 'yes') {
				var enabled_breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled();
				//re-order enabled_breakpoints according to the width, widest first



				enabled_breakpoints.sort(function (a, b) {
				    if (a.attributes.width < b.attributes.width) return 1;
				    if (b.attributes.width < a.attributes.width) return -1;
				    return 0;
				});


				var check = false;
				_.each(enabled_breakpoints, function(bpoint) {
					if(check) {
						if ( !_.isObject(model_breakpoint[bpoint.attributes.id]) ) model_breakpoint[bpoint.attributes.id] = {};
						breakpoint_data = model_breakpoint[bpoint.attributes.id];
						breakpoint_data.burger_menu = current_set_value;
						if(!breakpoint_data.burger_alignment)
							breakpoint_data.burger_alignment = current_set_alignment;

						if(!breakpoint_data.menu_style)
							breakpoint_data.menu_style = current_set_style;

						if(!breakpoint_data.menu_alignment)
							breakpoint_data.menu_alignment = current_set_menu_alignment;

						if(!breakpoint_data.is_floating)
							breakpoint_data.is_floating = current_set_is_floating;

						if(!breakpoint_data.burger_over)
							breakpoint_data.burger_over = current_set_over;
					}
					if(breakpoint.id == bpoint.attributes.id) check = true;
				});
			}
			this.model.set_property('breakpoint', model_breakpoint);

			return this.constructor.__super__.on_save.call(this);
		},
	});

	var NavigationSettings = ElementSettings.extend({
		panels: {
			General: Menu_Panel,
			Appearance: AppearancePanel
		},
		render: function() {
			this.constructor.__super__.render.call(this);
			var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
				item // this is used to cache stuff
			;
			if ( breakpoint && !breakpoint.default ){
				model_breakpoint = Upfront.Util.clone(this.model.get_property_value_by_name('breakpoint') || {});
				breakpoint_data = model_breakpoint[breakpoint.id];
				if(typeof(breakpoint_data) != 'undefined' && breakpoint_data.burger_menu == 'yes') {
					this.panels[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').attr("checked", 'checked');
				} else {
					this.panels[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').removeAttr("checked");
				}

				if (typeof(breakpoint_data) != 'undefined') {
					if (breakpoint_data.burger_alignment) {
						item = this.panels[0].settings._wrapped[1].fields._wrapped[0];
						if (item && item.$el && item.$el.length) {
							item.$el.find('input').removeAttr("checked");
							item.$el.find('input[value="'+breakpoint_data.burger_alignment+'"]').attr("checked", 'checked');
						}
					}

					if (breakpoint_data.menu_style) {
						item = this.panels[0].settings._wrapped[2].fields._wrapped[0];
						if (item && item.$el && item.$el.length) {
							item.$el.find('input').removeAttr("checked");
							item.$el.find('input[value="'+breakpoint_data.menu_style+'"]').attr("checked", 'checked');
						}
					}

					if(breakpoint_data.menu_alignment) {
						item = this.panels[0].settings._wrapped[3].fields._wrapped[0];
						if (item && item.$el && item.$el.length) {
							item.$el.find('input').removeAttr("checked");
							item.$el.find('input[value="'+breakpoint_data.menu_alignment+'"]').attr("checked", 'checked');
						}
					}

					if(breakpoint_data.is_floating) {
						item = this.panels._wrapped[0].settings._wrapped[4].fields._wrapped[1];
						if (item && item.$el && item.$el.length) {
							item.$el.find('input').removeAttr("checked");
							item.$el.find('input[value="'+breakpoint_data.is_floating+'"]').attr("checked", 'checked');
						}
					}

					if(breakpoint_data.burger_over) {
						item = this.panels[0].settings._wrapped[1].fields._wrapped[1];
						if (item && item.$el && item.$el.length) {
							item.$el.find('input').removeAttr("checked");
							item.$el.find('input[value="'+breakpoint_data.burger_over+'"]').attr("checked", 'checked');
						}
					}
				}
			}

			// if any of items higher in hierarchy has burger menu on, then hide the option to select/deselect burger menu
			if(typeof(breakpoint) == 'undefined') breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_default();

			var enabled_breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled();
			var check = false;

			//sort breakpoints (widest to narrowest)

			enabled_breakpoints.sort(function (a, b) {
			    if (a.attributes.width < b.attributes.width) return 1;
			    if (b.attributes.width < a.attributes.width) return -1;
			    return 0;
			});

			for(var i = enabled_breakpoints.length-1; i >= 0; i--) {
				if(check) {

					breakpoint_data = model_breakpoint[enabled_breakpoints[i].id];

					if((enabled_breakpoints[i].id == 'desktop' && this.model.get_property_value_by_name('burger_menu') == 'yes') || (breakpoint_data && breakpoint_data.burger_menu == 'yes')) {

						this.panels[0].settings._wrapped[0].fields._wrapped[1].$el.css('display', 'none');

						// extra care to ensure that the newly enabled items obey the hierarchy

						if ( !_.isObject(model_breakpoint[breakpoint.id]) )
							model_breakpoint[breakpoint.id] = {};

						breakpoint_data = model_breakpoint[breakpoint.id];

						if(!breakpoint_data.burger_menu || breakpoint_data.burger_menu != 'yes') {
							breakpoint_data.burger_menu = 'yes';
							this.panels[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').attr("checked", 'checked');
							this.model.set_property('breakpoint', model_breakpoint, true);
						}
					}
				}
				if(breakpoint.id == enabled_breakpoints[i].id)
					check = true;
			}

			// this is to turn on the display for revealed menu alignment settings in case the option is selected
			// if(this.panels[0].settings._wrapped[0].fields._wrapped[1].$el.find('input:checked').length > 0) {
				// this.panels[0].settings._wrapped[1].$el.css('display', 'block');
				// this.panels[0].settings._wrapped[2].$el.css('display', 'none');

				// if(this.panels[0].settings._wrapped[1].fields._wrapped[0].get_value() == "left" || this.panels[0].settings._wrapped[1].fields._wrapped[0].get_value() == "right" || this.panels[0].settings._wrapped[1].fields._wrapped[0].get_value() == "whole")
					// this.panels[0].settings._wrapped[1].fields._wrapped[1].$el.hide();
			// }
			// else {
				// this.panels[0].settings._wrapped[1].$el.css('display', 'none');
				// this.panels[0].settings._wrapped[2].$el.css('display', 'block');
			// }
		},
		onSaveSettings: function() {

			// Update slug because it's depending on id and has to be updated properly
			var themenu = _.findWhere(this.for_view.existingMenus, {term_id: this.model.get_property_value_by_name('menu_id')});
			if(themenu)
				this.model.set_property('menu_slug', themenu.slug, true);
		},
		/**
		 * Get the title (goes into settings title area)
		 * @return {string} Title
		 */
		title: l10n.settings
	});


	return NavigationSettings;
});
