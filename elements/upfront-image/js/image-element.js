define([
	'elements/upfront-image/js/model'
], function(ImageModel) {
	var l10n = Upfront.Settings.l10n.image_element;

	var ImageElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 20,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-image');
			this.$el.html(l10n.element_name);
		},
		add_element: function () {
			var object = new ImageModel(),
				module = new Upfront.Models.Module({
					'name': '',
					'properties': [
						{'name': 'element_id', 'value': Upfront.Util.get_unique_id('module')},
						{'name': 'class', 'value': 'c24 upfront-image_module'},
						{'name': 'has_settings', 'value': 0},
						{'name': 'row', 'value': Upfront.Util.height_to_row(255)}
					],
					'objects': [
						object
					]
				})
			;
			this.add_module(module);
		}
	});

	return ImageElement;
});
