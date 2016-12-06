define([
	'elements/upfront-code/js/model'
], function (CodeModel) {
	var l10n = Upfront.Settings.l10n.code_element;
	var Element = Upfront.Views.Editor.Sidebar.Element.extend({
		priority: 120,
		draggable: !!Upfront.Settings.Application.PERMS.EMBED,
		render: function () {
			this.$el.addClass('upfront-icon-element upfront-icon-element-code');
			this.$el.html(l10n.element_name);
		},

		add_element: function () {

			var object = new CodeModel(),
				module = new Upfront.Models.Module({
					name: "",
					properties: [
						{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
						{"name": "class", "value": "c24 upfront-code_element-module"},
						{"name": "has_settings", "value": 0},
						{"name": "row", "value": Upfront.Util.height_to_row(210)}
					],
					objects: [object]
				})
			;
			this.add_module(module);
		}
	});

	return Element;
});
