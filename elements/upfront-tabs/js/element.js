define([
	'elements/upfront-tabs/js/model'
], function(Model) {
	var Element = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 100,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-tabs');
			this.$el.html('Tabs');
		},
		add_element: function () {
			var object = new Model(),
			module = new Upfront.Models.Module({
				'name': '',
				'properties': [
					{'name': 'element_id', 'value': Upfront.Util.get_unique_id('module')},
					{'name': 'class', 'value': 'c9 upfront-tabs_module'},
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

	return Element;
});
