(function($) {
	
var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	'scripts/upfront/bg-settings/mixins'
], function(Mixins) {
	
	var ColorItem = Upfront.Views.Editor.Settings.Item.extend(_.extend({}, Mixins, {
		group: false,
		initialize: function (options) {
			var me = this;
			var colorFieldOptions = {
				model: this.model,
				property: 'background_color',
				use_breakpoint_property: true,
				default_value: 'transparent', // default to transparent color
				blank_alpha: 0,
				spectrum: {
					move: function (color) {
						me.preview_color(color);
					},
					change: function (color) {
						me.update_color(color);
					},
					hide: function (color) {
						me.reset_color();
					}
				},
				rendered: function (){
					this.$el.addClass('uf-bgsettings-color-pick');
				}
			}
			if (options.hideLabel !== true) {
				colorFieldOptions.label = l10n.region_bg_short;
			}

			options.fields = [
				new Upfront.Views.Editor.Field.Color(colorFieldOptions)
			];
			this.$el.addClass('uf-bgsettings-item uf-bgsettings-coloritem');
			
			this.bind_toggles();
			this.constructor.__super__.initialize.call(this, options);
		}
	}));

	return ColorItem;
});
})(jQuery);
