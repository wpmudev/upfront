/*
(function ($) {
define([
	'elements/upfront-post-data/js/post-data-settings-panels'
], function(Panels) {

var l10n = Upfront.Settings.l10n.post_data_element;


var PostDataSettings = Upfront.Views.Editor.Settings.Settings.extend({

	initialize: function (opts) {
		this.options = opts;
		var me = this,
			post_parts = new Panels.PostParts({model: this.model})
		;
		post_parts.on("settings:dispatched", this.rerender, this);
		this.panels = _([
			post_parts
		]);
	},

	rerender: function () {
		var active_panel = false;
		this.panels.each(function (pl, idx) {
			if (pl.is_active()) active_panel = idx;
		});
		this.initialize(this.options);
		this.$el.empty();
		this.render();
		if (active_panel) this.toggle_panel(this.panels.compact()[active_panel]);
	},

	get_title: function () {
		return l10n.settings;
	}
});

return PostDataSettings;

});
})(jQuery);
*/
define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/preset-settings/util',
	'elements/upfront-post-data/js/post-data-settings-panels'
], function(ElementSettings, Util, Panels) {

	var PostDataSettings = ElementSettings.extend({
		initialize: function () {
			var me = this,
				data_type = this.model.get_property_value_by_name('data_type'),
				panels = {}
			;

			this.panels = Panels.get_panel(data_type);
			//this.title = "Data Components";
			this.title = data_type;
			ElementSettings.prototype.initialize.apply(this, arguments);
		}
	});

	(function ($) {
		$(document).on('click', '.upfront-post_data-part.part-module-panel .upfront-settings-item-title .toggle', function (e) {
			if (e.preventDefault) e.preventDefault();
			if (e.stopPropagation) e.stopPropagation();

			var $me = $(this),
				$content = $me.closest('.part-module-panel').find('.upfront-settings-item-content:first, .state_modules')
			;
			if ($content.is(":visible")) $content.hide();
			else $content.show();

			return false;
		});
	})(jQuery);

	return PostDataSettings;
});