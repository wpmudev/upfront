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
		var active_panel = false,
			panels = _(this.panels)
		;
		panels.each(function (pl, idx) {
			if (pl.is_active()) active_panel = idx;
		});
		this.initialize(this.options);
		this.$el.empty();
		this.render();
		if (active_panel && this.toggle_panel) this.toggle_panel(panels.compact()[active_panel]);
//else console.log(this.toggle_panel, this)
	},
	
	title: l10n.posts_settings,

	get_title: function () {
		return l10n.settings;
	}
});

return PostsSettings;

});
})(jQuery);
