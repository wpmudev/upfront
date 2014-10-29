define([
	'elements/upfront-gallery/js/model'
], function(UgalleryModel) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var UgalleryElement = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 30,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-gallery');
			this.$el.html(l10n.element_name);
		},
		add_element: function () {
			var object = new UgalleryModel(),
				module = new Upfront.Models.Module({
					'name': '',
					'properties': [
						{'name': 'element_id', 'value': Upfront.Util.get_unique_id('module')},
						{'name': 'class', 'value': 'c24 upfront-ugallery_module'},
						{'name': 'has_settings', 'value': 0},
						{'name': 'row', 'value': Upfront.Util.height_to_row(240)}
					],
					'objects': [
						object
					]
				})
			;
			this.add_module(module);
		}
	});

	return UgalleryElement;
});
