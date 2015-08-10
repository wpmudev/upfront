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
			'click .upfront-save_settings' : 'saveSettings'
		},

		initialize: function(opts) {
			this.options = opts;
			var me = this,
				panels = {};

			// Instantiate panels
			_.each(this.panels, function(panel, index) {
				if (index === 'Appearance') {
					panels.Appearance = new PresetManager(_.extend({}, panel, { model: this.model }));
					return;
				}
				panels[index] = new panel({ model: this.model });
			}, this);

			// Hard wiring here instead having every element define advanced panel
			// because all elements have identical advanced settings panel
			panels.Advanced = new AdvancedSettings({model: this.model});

			// Have to do this because overwriting own property
			this.panels = panels;

			this.on('open', function(){
				me.model.trigger('settings:open', me);
			});
		},

		saveSettings: function() {
			_.each(this.panels, function(panel){
				panel.save_settings();
			});

			this.model.get("properties").trigger('change');
			Upfront.Events.trigger("element:settings:saved");
			Upfront.Events.trigger("element:settings:deactivate");
			if ( _upfront_post_data.layout.specificity && _upfront_post_data.layout.item && !_upfront_post_data.layout.item.match(/-page/) )
				Upfront.Events.trigger("command:layout:save_as");
			else
				Upfront.Events.trigger("command:layout:save");
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
					"<button type='button' class='upfront-save_settings'><i class='icon-ok'></i> " + l10n.save + "</button>" +
				'</div>'
			);
		},

		cleanUp: function(){
			if (this.panels) {
				_.each(this.panels, function(panel){
					panel.cleanUp();
				});
			}
			this.remove();
		}
	});

	return ElementSettings;
});
})(jQuery);
