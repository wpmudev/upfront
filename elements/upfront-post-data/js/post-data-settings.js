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

	return PostDataSettings;
});