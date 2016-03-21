define([
	'scripts/upfront/element-settings/settings',
	'elements/upfront-post-data/js/post-data-settings-panels'
], function(ElementSettings, Panels) {

	var PostDataSettings = ElementSettings.extend({
		initialize: function () {
			var me = this,
				data_type = this.model.get_property_value_by_name('data_type'),
				panels = {},
				title = Upfront.Settings.l10n.post_data_element.elements[data_type] || data_type
			;

			this.panels = Panels.get_panel(data_type);
			this.title = title;
			ElementSettings.prototype.initialize.apply(this, arguments);
		}
	});

	return PostDataSettings;
});