(function ($) {
define([
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/element-settings/advanced-settings'
], function (PresetManager, AdvancedSettings) {
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

			var pluginsCallResult = Upfront.plugins.call('save-settings');

			if (!pluginsCallResult.status || pluginsCallResult.status !== 'called') {
				if ( _upfront_post_data.layout.specificity && _upfront_post_data.layout.item && !_upfront_post_data.layout.item.match(/-page/) )
					Upfront.Events.trigger("command:layout:save_as");
				else
					Upfront.Events.trigger("command:layout:save");
			}

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

		render: function () {
			var me = this;

			this.$el
				.html(
					'<div class="upfront-settings-title">' + this.title + '</div><div id="sidebar-scroll-wrapper" />'
				)
			;

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
			});

			this.$el.addClass('upfront-ui');
			this.$el.append(
				"<div class='upfront-settings-button_panel'>" +
					"<button type='button' class='upfront-cancel_settings'>" + l10n.cancel + "</button>" +
					"<button type='button' class='upfront-save_settings'><i class='icon-ok'></i> " + l10n.save_element + "</button>" +
				'</div>'
			);
		},

		setScrollMaxHeight: function(){
			var height = this.$el.height(),
				titleHeight = this.$el.find('>.upfront-settings-title').outerHeight(true),
				buttonHeight = this.$el.find('>.upfront-settings-button_panel').outerHeight(true)
			;
			this.$el.find('#sidebar-scroll-wrapper').css('max-height', (height-titleHeight-buttonHeight) + 'px')
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
