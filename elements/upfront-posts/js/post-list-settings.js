(function ($) {
define([
	'elements/upfront-posts/js/post-list-settings-panels',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/advanced-settings',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-widget/tpl/preset-style.html'
], function(Panels, ElementSettings, AdvancedSettings, Util, styleTpl) {

var l10n = Upfront.Settings.l10n.posts_element;

var PostsSettings = ElementSettings.extend({
	panels: {
		Appearance: {
			mainDataCollection: 'postsPresets',
			styleElementPrefix: 'posts-preset',
			ajaxActionSlug: 'posts',
			panelTitle: l10n.settings,
			presetDefaults: Upfront.mainData.presetDefaults.posts,
			styleTpl: styleTpl,
			
			migrateDefaultStyle: function(styles) {
					//replace image wrapper class
					styles = styles.replace(/(div)?\.uposts-object\s/g, '');
					styles = styles.replace(/(div)?\.upfront-object\s/g, '');

					return styles;
			},
			
			migrateElementStyle: function(styles, selector) {
				//replace posts container which is one line with preset
				styles = styles.replace(/\.uposts-object/g, '');
				
				return styles;
			},
		},
	},

	initialize: function (opts) {
		// Call the super constructor here, so that the appearance panel is instantiated
		this.constructor.__super__.initialize.call(this, opts);
		
		this.options = opts;
		var me = this,
			general = new Panels.General({model: this.model}),
			post_parts = new Panels.PostParts({model: this.model})
		;
		general.on("settings:dispatched", this.rerender, this);
		general.on("post:removed", this.rerender, this);
		general.on("post:added", this.rerender, this);
		post_parts.on("settings:dispatched", this.rerender, this);

		this.panels = _.extend({ General: general, PostParts: post_parts }, this.panels);
	},

	rerender: function () {
		var active_panel = -1,
			panels = _(this.panels);
			me = this,
			general = new Panels.General({model: this.model}),
			post_parts = new Panels.PostParts({model: this.model})
		;
		
		panels.each(function (pl, idx) {
			if (pl && pl.is_active && pl.is_active()) active_panel = idx;
		});

		this.$el.empty();
		
		this.initialize(this.options);

		this.render();

		if (active_panel.length >= 0 && this.toggle_panel) this.toggle_panel(active_panel);		
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

// Generate presets styles to page
Util.generatePresetsToPage('posts', styleTpl);

return PostsSettings;

});
})(jQuery);
