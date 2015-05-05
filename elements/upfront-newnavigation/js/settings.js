define([], function() {
	var l10n = Upfront.Settings.l10n.newnavigation_element;

	var Menu_Panel = Upfront.Views.Editor.Settings.Panel.extend({
		className: 'upfront-settings_panel_wrap menu-settings',
		save_settings: function(){
			Menu_Panel.__super__.save_settings.apply(this, arguments);
			this.model.set_property('menu_items', false, true);
		},
		on_save: function() {
			var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint;
			var current_set_value = this.settings._wrapped[0].fields._wrapped[1].$el.find('input:checked').val();
			var current_set_alignment = this.settings._wrapped[1].fields._wrapped[0].$el.find('input:checked').val();
			var current_set_over = this.settings._wrapped[1].fields._wrapped[1].$el.find('input:checked').val();
			var current_set_style = this.settings._wrapped[2].fields._wrapped[0].$el.find('input:checked').val();
			var current_set_menu_alignment = this.settings._wrapped[3].fields._wrapped[0].$el.find('input:checked').val();

			model_breakpoint = Upfront.Util.clone(this.model.get_property_value_by_name('breakpoint') || {});

			if ( breakpoint && !breakpoint.default ){
				if ( !_.isObject(model_breakpoint[breakpoint.id]) ) model_breakpoint[breakpoint.id] = {};
				breakpoint_data = model_breakpoint[breakpoint.id];
				breakpoint_data.burger_menu = current_set_value || '';
				breakpoint_data.burger_alignment = current_set_alignment;
				breakpoint_data.burger_over = current_set_over;
				breakpoint_data.menu_style = current_set_style;
				breakpoint_data.menu_alignment = current_set_menu_alignment;

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


	var NavigationSettings = Upfront.Views.Editor.Settings.Settings.extend({
		/**
		 * Bootstrap the object - populate the internal
		 * panels array with the panel instances we'll be showing.
		 */
		render: function() {
			this.constructor.__super__.render.call(this);
			var breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
				item // this is used to cache stuff
			;
			if ( breakpoint && !breakpoint.default ){
				model_breakpoint = Upfront.Util.clone(this.model.get_property_value_by_name('breakpoint') || {});
				breakpoint_data = model_breakpoint[breakpoint.id];
				if(typeof(breakpoint_data) != 'undefined' && breakpoint_data.burger_menu == 'yes') {
					this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').attr("checked", 'checked');
				} else {
					this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').removeAttr("checked");
				}

				if (typeof(breakpoint_data) != 'undefined') {
					if (breakpoint_data.burger_alignment) {
						item = this.panels._wrapped[0].settings._wrapped[1].fields._wrapped[0];
						if (item && item.$el && item.$el.length) {
							item.$el.find('input').removeAttr("checked");
							item.$el.find('input[value="'+breakpoint_data.burger_alignment+'"]').attr("checked", 'checked');
						}
					}

					if (breakpoint_data.menu_style) {
						item = this.panels._wrapped[0].settings._wrapped[2].fields._wrapped[0];
						if (item && item.$el && item.$el.length) {
							item.$el.find('input').removeAttr("checked");
							item.$el.find('input[value="'+breakpoint_data.menu_style+'"]').attr("checked", 'checked');
						}
					}

					if(breakpoint_data.menu_alignment) {
						item = this.panels._wrapped[0].settings._wrapped[3].fields._wrapped[0];
						if (item && item.$el && item.$el.length) {
							item.$el.find('input').removeAttr("checked");
							item.$el.find('input[value="'+breakpoint_data.menu_alignment+'"]').attr("checked", 'checked');
						}
					}

					if(breakpoint_data.burger_over) {
						item = this.panels._wrapped[0].settings._wrapped[2].fields._wrapped[1];
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

						this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.css('display', 'none');

						// extra care to ensure that the newly enabled items obey the hierarchy

						if ( !_.isObject(model_breakpoint[breakpoint.id]) )
							model_breakpoint[breakpoint.id] = {};

						breakpoint_data = model_breakpoint[breakpoint.id];

						if(!breakpoint_data.burger_menu || breakpoint_data.burger_menu != 'yes') {
							breakpoint_data.burger_menu = 'yes';
							this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.find('input').attr("checked", 'checked');
							this.model.set_property('breakpoint', model_breakpoint, true);
						}
					}
				}
				if(breakpoint.id == enabled_breakpoints[i].id)
					check = true;
			}

			// this is to turn on the display for revealed menu alignment settings in case the option is selected
			if(this.panels._wrapped[0].settings._wrapped[0].fields._wrapped[1].$el.find('input:checked').length > 0) {
				this.panels._wrapped[0].settings._wrapped[1].$el.css('display', 'block');
				this.panels._wrapped[0].settings._wrapped[2].$el.css('display', 'none');
			}
			else {
				this.panels._wrapped[0].settings._wrapped[1].$el.css('display', 'none');
				this.panels._wrapped[0].settings._wrapped[2].$el.css('display', 'block');
			}
		},
		initialize: function (opts) {
			var me = this,
				menuList = Upfront.data.unewnavigation.currentMenuItemData.get('menuList')
			;
			this.has_tabs = false;
			this.options= opts;
			menuList.push({label: l10n.create_new, value: -1});
			this.panels = _([
				// Menu
				new Menu_Panel({
					model: this.model,
					label: l10n.mnu.label,
					title: l10n.mnu.title,
					settings: [
						new Upfront.Views.Editor.Settings.Item({
							model: this.model,
							title: l10n.mnu.load,
							fields: [
								new Upfront.Views.Editor.Field.Select({
									model: this.model,
									property: 'menu_id',
									label: "",
									values: menuList,
									change: function(value) {
										if(value == -1) {
											delete menuList[menuList.length-1];
											Upfront.data.unewnavigation.currentMenuItemData.set({menu_id: false, menu_slug: false});
											me.model.set_property('menu_slug', false);
											me.model.set_property('menu_id', false);
											me.for_view.property('menu_slug', false, true);
											me.for_view.property('menu_id', false);
											me.close_panel();
										}
									}
								}),
								new Upfront.Views.Editor.Field.Checkboxes({
									model: this.model,
									property: 'burger_menu',
									label: "",
									values: [
										{ label: l10n.mnu.use + " <i class='upfront-field-icon upfront-field-icon-burger-trigger'></i> " + l10n.mnu.btn, value: 'yes' }
									],
									change: function() {
										var value = this.get_value();
										if(value[0] == 'yes') {
											me.panels._wrapped[0].settings._wrapped[1].$el.css('display', 'block');
											me.panels._wrapped[0].settings._wrapped[2].$el.css('display', 'none');
										}
										else {
											me.panels._wrapped[0].settings._wrapped[1].$el.css('display', 'none');
											me.panels._wrapped[0].settings._wrapped[2].$el.css('display', 'block');
										}
									}
								})
							]
						}),
						new Upfront.Views.Editor.Settings.Item({
							model: this.model,
							title: l10n.mnu.appearance,
							fields: [
								new Upfront.Views.Editor.Field.Radios({
									model: this.model,
									property: 'burger_alignment',
									default_value: 'left',
									label: "",
									layout: "vertical",
									values: [
										{ label: l10n.mnu.left, value: 'left', icon: 'burger-left'},
										{ label: l10n.mnu.right, value: 'right', icon: 'burger-right'},
										{ label: l10n.mnu.top, value: 'top', icon: 'burger-top'},
										{ label: l10n.mnu.whole, value: 'whole', icon: 'burger-whole'}
									]
								}),
								new Upfront.Views.Editor.Field.Radios({
									model: this.model,
									property: 'burger_over',
									default_value: 'over',
									label: "",
									layout: "vertical",
									values: [
										{ label: l10n.mnu.over, value: 'over' },
										{ label: l10n.mnu.push, value: 'pushes' }
									]
								})
							]
						}),
						new Upfront.Views.Editor.Settings.Item({
							model: this.model,
							title: l10n.mnu.style,
							fields: [
								new Upfront.Views.Editor.Field.Radios({
									model: this.model,
									className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios menu_style',
									property: 'menu_style',
									default_value: 'horizontal',
									label: "",
									values: [
										{ label: l10n.mnu.horiz, value: 'horizontal' },
										{ label: l10n.mnu.vert, value: 'vertical' }
									]
								})
							]
						}),
						new Upfront.Views.Editor.Settings.Item({
							model: this.model,
							title: l10n.mnu.aligh,
							fields: [
								new Upfront.Views.Editor.Field.Radios({
									model: this.model,
									property: 'menu_alignment',
									default_value: 'left',
									label: "",
									layout: "vertical",
									values: [
										{ label: l10n.mnu.left, value: 'left', icon: 'navigation-left' },
										{ label: l10n.mnu.center, value: 'center', icon: 'navigation-center' },
										{ label: l10n.mnu.right, value: 'right', icon: 'navigation-right' }
									]
								})
							]
						}),
						new Upfront.Views.Editor.Settings.Item({
							model: this.model,
							title: l10n.mnu.behavior,
							fields: [
								new Upfront.Views.Editor.Field.Checkboxes({
										model: this.model,
										property: 'allow_new_pages',
										label: "",
										values: [
												{ label: l10n.mnu.auto_add, value: 'yes' }
										]
								}),
								new Upfront.Views.Editor.Field.Checkboxes({
										model: this.model,
										property: 'is_floating',
										label: "",
										values: [
												{ label: l10n.mnu.float, value: 'yes' }
										]
								})
							]
						})
					]
				}).on('upfront:settings:panel:saved', this.onSaveSettings, this)
			]);
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
		get_title: function () {
				return l10n.settings;
		}
	});


	return NavigationSettings;
});