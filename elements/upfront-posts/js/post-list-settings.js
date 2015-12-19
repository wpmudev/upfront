(function ($) {
define([
	'elements/upfront-posts/js/post-list-settings-panels',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/advanced-settings'
], function(Panels, ElementSettings, AdvancedSettings) {

var l10n = Upfront.Settings.l10n.posts_element;


var PostsSettings = ElementSettings.extend({

	initialize: function (opts) {
		this.options = opts;
		var me = this,
			general = new Panels.General({model: this.model}),
			post_parts = new Panels.PostParts({model: this.model})
		;
		general.on("settings:dispatched", this.rerender, this);
		general.on("post:removed", this.rerender, this);
		general.on("post:added", this.rerender, this);
		post_parts.on("settings:dispatched", this.rerender, this);
		this.panels = [
			general,
			post_parts,
			new AdvancedSettings({model: this.model})
		];
	},

	rerender: function () {
		var active_panel = -1,
			panels = _(this.panels)
		;
		panels.each(function (pl, idx) {
			if (pl && pl.is_active && pl.is_active()) active_panel = idx;
		});
		this.initialize(this.options);
		this.$el.empty();
		this.render();
		if (active_panel >= 0 && this.toggle_panel) this.toggle_panel(active_panel);
	},

	/**
	 * Toggles the active panel on
	 *
	 * @param {Int} panel_idx Panel index to toggle on
	 */
	toggle_panel: function (panel_idx) {
		if (panel_idx < 0) return false;
		_.each(this.panels, function (panel, idx) {
			if (panel_idx === idx && (panel || {}).showBody) panel.showBody();
			else if ((panel || {}).hideBody) panel.hideBody();
		});
	},
	
	title: l10n.posts_settings,

	get_title: function () {
		return l10n.settings;
	}
});

return PostsSettings;

});
})(jQuery);
