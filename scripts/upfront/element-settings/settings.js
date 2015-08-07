(function ($) {
define([
	'scripts/upfront/element-settings/advanced-settings',
], function (AdvancedSettings) {
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
			this.panels = _([]);
		},

		saveSettings: function() {
			this.panels.each(function(panel){
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

		get_title: function () {
			return l10n.settings;
		},

		render: function () {
			var me = this;

			me.$el
				.html(
					'<div class="upfront-settings_title">' + this.get_title() + '</div>'
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
			
			//Add Advanced Settings as separate panel
			me.panels.push(
				new AdvancedSettings({model: this.model})
			);
			
			me.panels.each(function (panel) {
				panel.render();

				me.listenTo(panel, "upfront:settings:panel:toggle", me.toggle_panel);
				me.listenTo(panel, "upfront:settings:panel:close", me.close_panel);
				me.listenTo(panel, "upfront:settings:panel:refresh", me.refresh_panel);

				panel.parent_view = me;
				me.$el.append(panel.el);
			});

			this.$el.addClass('upfront-ui');
			this.$el.append(
				"<div class='upfront-settings-button_panel'>" +
					"<button type='button' class='upfront-save_settings'><i class='icon-ok'></i> " + l10n.save + "</button>" +
				'</div>'
			);
		},

		set_title: function (title) {
			if (!title || !title.length) return false;
			this.$el.find(".upfront-settings_title").html(title);
		},

		toggle_panel: function (panel) {
			this.panels.invoke("conceal");
			panel.$el.find(".upfront-settings_panel").css('height', '');
			panel.show();
			panel.reveal();
			this.set_title(panel.get_title());
		},

		refresh_panel: function (panel) {
			if (panel.is_active()) this.toggle_panel(panel);
		},

		close_panel: function (panel) {
			this.panels.invoke("conceal");
			this.panels.invoke("show");
			this.set_title(this.get_title());
		},
		cleanUp: function(){
			if (this.panels) {
				this.panels.each(function(panel){
					panel.cleanUp();
				});
			}
			this.remove();
		}
	});

	return ElementSettings;
});
})(jQuery);
