define([
	'elements/upfront-widget/js/model'
], function (UwidgetModel) {
	var l10n = Upfront.Settings.l10n.widget_element;
	
	var Element = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 80,

		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-widget');
			this.$el.html(l10n.element_name);
		},

		add_element: function () {
			var object = new UwidgetModel(),
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c6 upfront-widget_module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(150)}
					],
					"objects": [
						object
					]
				})
			;
			this.add_module(module);
		}
	});
	return Element;
});