define([
	'elements/upfront-text/js/model'
], function(UtextModel) {
	var l10n = Upfront.Settings.l10n.text_element;

	var TextElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 10,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-text');
			this.$el.html(l10n.element_name);
		},
		add_element: function () {
			var object = new UtextModel({
					"name": "",
					"properties": [
						{"name": "content", "value": l10n.default_content}
					]
				}),
				module = new Upfront.Models.Module({
					"name": "",
					"properties": [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c11"},
						{"name": "row", "value": Upfront.Util.height_to_row(75)},
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

	return TextElement;
});
