define([
	'elements/upfront-button/js/model'
], function(ButtonModel) {
	var l10n = Upfront.Settings.l10n.button_element;
	
	var ButtonElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 150,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-button');
			this.$el.html(l10n.element_name);
		},
		add_element: function () {
			var object = new ButtonModel(),
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "content", "value": l10n.dbl_click},
						{"name": "href", "value": ""},
						{"name": "align", "value": "center"},
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c4 button-style"},
						{"name": "row", "value": Upfront.Util.height_to_row(55)},
						{"name": "has_settings", "value": 0}
					],
					"objects": [
						object
					]
				})
			;
			this.add_module(module);
		}
	});

	return ButtonElement;
});
