(function ($) {
define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/element-settings/advanced-settings',
	'scripts/perfect-scrollbar/perfect-scrollbar',
	'scripts/upfront/upfront-views-editor/commands',
], function (PresetManager, AdvancedSettings, perfectScrollbar, Commands) {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var ElementSettings = Backbone.View.extend({
		id: 'settings',
		events: {
			'click .upfront-save_settings' : 'saveSettings',
			'click .upfront-cancel_settings' : 'cancelSettings'
		},

		initialize: function(opts) {
			this.options = opts;
			var me = this,
				panels = {},
				currentBreakpoint,
				breakpointsData,
				breakpointData,
				skip_appearance = !Upfront.Application.user_can("SWITCH_PRESET") && !Upfront.Application.user_can("MODIFY_PRESET") && !Upfront.Application.user_can("DELETE_PRESET")
			;

			// Setup model so that it uses breakpoint values
			if (this.hasBreakpointSettings === true) {
				currentBreakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active();
				breakpointsData = this.model.get_property_value_by_name('breakpoint') || {};
				breakpointData = breakpointsData[currentBreakpoint.id] || {};
				// Breakpoint specific settings
				_.each(this.breakpointSpecificSettings, function(settingOptions) {
					if (!_.isUndefined(breakpointData[settingOptions.name])) {
						this.model.set_property(settingOptions.name, breakpointData[settingOptions.name], true);
					}
				}, this);
			}

			// Instantiate panels
			_.each(this.panels, function(panel, index) {
				if (index === 'Appearance' && !skip_appearance) {
					this.appearancePanel = new PresetManager(
					_.extend(
							{
								hasBreakpointSettings: this.hasBreakpointSettings,
								breakpointSpecificPresetSettings: this.breakpointSpecificPresetSettings,
								model: this.model
							},
							panel
						)
					);

					this.listenTo(this.appearancePanel, 'upfront:presets:state_show', this.stateShow);

					panels.Appearance = this.appearancePanel;
					return;
				}
				if(_.isFunction(panel)) {
					panels[index] = new panel({ model: this.model });
				}
			}, this);

			// Hard wiring here instead having every element define advanced panel
			// because all elements have identical advanced settings panel
			if (Upfront.Application.user_can("MODIFY_PRESET")) panels.Advanced = new AdvancedSettings({model: this.model});

			// Have to do this because overwriting own property
			this.panels = panels;

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});

			this.listenTo(Upfront.Events, 'element:settings:render', this.setScrollMaxHeight);
		},

		saveSettings: function() {
			var currentBreakpoint,
				breakpointsData;

			// Setup model so that it saves breakpoint values to breakpoint property
			if (this.hasBreakpointSettings === true && this.breakpointSpecificSettings) {
				currentBreakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active();
				breakpointsData = this.model.get_property_value_by_name('breakpoint') || {};
				breakpointsData[currentBreakpoint.id] = breakpointsData[currentBreakpoint.id] || {};
				_.each(this.breakpointSpecificSettings, function(settingOptions) {
					breakpointsData[currentBreakpoint.id][settingOptions.name] = this.model.get_property_value_by_name(settingOptions.name);
					// Always save width to breakpoint, comes handy in public scripts
					breakpointsData[currentBreakpoint.id].width = currentBreakpoint.get('width');
				}, this);
				// Finally update breakpoints in model
				this.model.set_property('breakpoint', breakpointsData, true);
			}
			_.each(this.panels, function(panel){
				panel.save_settings();
			});

			this.model.get("properties").trigger('change');
			Upfront.Events.trigger("element:settings:saved");
			Upfront.Events.trigger("element:settings:deactivate");

			if (this.onSaveSettings) this.onSaveSettings();

			this.removePreviewClasses();
		},

		cancelSettings: function() {
			this.removePreviewClasses();
			Upfront.Events.trigger("element:settings:canceled");
		},

		stateShow: function(state) {
			var elementContainer = this.for_view.$el.find('.upfront-object');
			if(state !== "static") {
				this.removePreviewClasses();
				elementContainer.addClass('live-preview-' + state);
			} else {
				this.removePreviewClasses();
			}
		},

		removePreviewClasses: function() {
			var elementContainer = this.for_view.$el.find('.upfront-object');
			elementContainer.removeClass('live-preview-hover live-preview-focus live-preview-active');
		},

		get_element_class: function(type) {
			var elementTypes = {
					UaccordionModel: {label: l10n.accordion, id: 'accordion'},
					UcommentModel: {label: l10n.comments, id: 'comment'},
					UcontactModel: {label: l10n.contact_form, id: 'contact'},
					UgalleryModel: {label: l10n.gallery, id: 'gallery'},
					UimageModel: {label: l10n.image, id: 'image'},
					LoginModel: {label: l10n.login, id: 'login'},
					LikeBox: {label: l10n.like_box, id: 'likebox'},
					MapModel: {label: l10n.map, id: 'maps'},
					UnewnavigationModel: {label: l10n.navigation, id: 'nav'},
					ButtonModel: {label: l10n.button, id: 'button'},
					PostsModel: {label: l10n.posts, id: 'posts'},
					PostsListsModel: {label: l10n.posts, id: 'posts'},
					UsearchModel: {label: l10n.search, id: 'search'},
					USliderModel: {label: l10n.slider, id: 'slider'},
					SocialMediaModel: {label: l10n.social, id: 'SocialMedia'},
					UtabsModel: {label: l10n.tabs, id: 'tabs'},
					ThisPageModel: {label: l10n.page, id: 'this_page'},
					ThisPostModel: {label: l10n.post, id: 'this_post'},
					UwidgetModel: {label: l10n.widget, id: 'widget'},
					UyoutubeModel: {label: l10n.youtube, id: 'youtube'},
					PlainTxtModel: {label: l10n.text, id:'text'}
				},
				element_id = elementTypes[type] || 'default'
			;

			return 'upfront-icon-element upfront-icon-element-' + element_id.id;
		},

		render: function () {
			var me = this,
				menu = new Commands.Command_Menu({"model": this.model}),
				element_type = this.model.get_property_value_by_name('type')
			;

			this.$el
				.html(
					'<div class="upfront-settings-title ' + this.get_element_class(element_type) + '">' + this.title + ' <ul class="sidebar-commands sidebar-commands-header"></ul></div><div id="sidebar-scroll-wrapper" />'
				)
			;
			
			// Render menu
			menu.render();
			
			// Append command menu
			this.$el.find('.upfront-settings-title ul').append(menu.$el);

			/*
			 * This event is broadcast so that other plugins can register their
			 * own Upfront element for the CSS Editor before the settings panel
			 * is displayed.
			 *
			 * Example:
			 * Upfront.Events.on( 'settings:prepare', function() {
			 *   args = {label: 'My Element', id: 'my_element'};
			 *   Upfront.Application.cssEditor.elementTypes['ElementModel'] = args;
			 * });
			 */
			Upfront.Events.trigger("settings:prepare");

			_.each(this.panels, function (panel) {
				panel.render();
				panel.parent_view = me;
				me.$el.find('#sidebar-scroll-wrapper').append(panel.el);

				// Add JS Scrollbar.
				perfectScrollbar.withDebounceUpdate(
					// Element.
					me.$el.find('#sidebar-scroll-wrapper')[0],
					// Run First.
					false,
					// Event.
					"menu_element:settings:rendered",
					// Initialize.
					true
				);
			});

			this.$el.addClass('upfront-ui');
			this.$el.append(
				"<div class='upfront-settings-button_panel'>" +
					"<button type='button' class='upfront-cancel_settings sidebar-commands-button light'>" + l10n.cancel + "</button>" +
					"<button type='button' class='upfront-save_settings sidebar-commands-button blue'><i class='icon-ok'></i> " + l10n.save_element + "</button>" +
				'</div>'
			);
		},

		setScrollMaxHeight: function(){
			var height = this.$el.height(),
				titleHeight = this.$el.find('>.upfront-settings-title').outerHeight(true),
				buttonHeight = this.$el.find('>.upfront-settings-button_panel').outerHeight(true)
			;
			this.$el.find('#sidebar-scroll-wrapper').css('max-height', (height-titleHeight-buttonHeight) + 'px');
		},

		cleanUp: function(){
			if (this.panels) {
				_.each(this.panels, function(panel){
					if (panel.cleanUp) panel.cleanUp();
				});
			}
			this.remove();
		}
	});

	return ElementSettings;
});
})(jQuery);
