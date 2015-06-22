(function ($) {
define([], function () {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var ElementSettings = Backbone.View.extend({
		initialize: function(opts) {
			this.options = opts;
			this.panels = _([]);
		},

		get_title: function () {
			return l10n.settings;
		},

		render: function () {
			var me = this;

			me.$el
				.empty()
				.show()
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

			me.panels.each(function (panel) {
				panel.render();

				me.listenTo(panel, "upfront:settings:panel:toggle", me.toggle_panel);
				me.listenTo(panel, "upfront:settings:panel:close", me.close_panel);
				me.listenTo(panel, "upfront:settings:panel:refresh", me.refresh_panel);

				panel.parent_view = me;
				me.$el.append(panel.el);
			});

			this.toggle_panel(this.panels.first());

			var label_width = this.panels.first().$el.find('.upfront-settings_label').outerWidth(),
				panel_width = this.panels.first().$el.find('.upfront-settings_panel').outerWidth();

			this.$el.addClass('upfront-ui');
			this.$el.addClass('settings-no-tabs');

			this.trigger('open');
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
			var min_height = 0;
			this.panels.each(function(p){
				min_height += p.$el.find(".upfront-settings_label").outerHeight();
			});
			var panel_height = panel.$el.find(".upfront-settings_panel").outerHeight() - 1;
			if ( panel_height >= min_height ) {
				this.$el.css('height', panel_height);
			}
			else {
				panel.$el.find(".upfront-settings_panel").css('height', min_height);
				this.$el.css('height', min_height);
			}
		},

		refresh_panel: function (panel) {
			if (panel.is_active()) this.toggle_panel(panel);
		},

		close_panel: function (panel) {
			this.panels.invoke("conceal");
			this.panels.invoke("show");
			this.set_title(this.get_title());
		},
		remove: function(){
			if(this.panels)
				this.panels.each(function(panel){
					panel.remove();
				});
			Backbone.View.prototype.remove.call(this);
		}
	});

	return ElementSettings;
});
})(jQuery);
