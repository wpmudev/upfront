define([
	'elements/upfront-accordion/js/model'
], function(UaccordionModel) {
	var l10n = Upfront.Settings.l10n.accordion_element;

	var AccordionElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 140,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-accordion');
			this.$el.html(l10n.element_name);
		},
		add_element: function () {
			var object = new UaccordionModel(),
			module = new Upfront.Models.Module({
				'name': '',
				'properties': [
					{'name': 'element_id', 'value': Upfront.Util.get_unique_id('module')},
					{'name': 'class', 'value': 'c9 upfront-accordion_module'},
					{'name': 'has_settings', 'value': 0},
					{'name': 'row', 'value': Upfront.Util.height_to_row(225)}
				],
				'objects': [
					object
				]
			})
			;
			this.add_module(module);
		}
	});

	return AccordionElement;
});
