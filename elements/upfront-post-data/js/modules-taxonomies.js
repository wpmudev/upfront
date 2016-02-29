define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/taxonomy.html',
], function (Panel, template) {

	var Modules = {};
	Modules.template = template;
	
	Modules.part_categories = Panel.Toggleable.extend({
		title: "Categories", 
		data_part: 'categories',
		get_fields: function () {
			return [
				{
					type: "Number",
					property: "categories_limit",
					label: "Show max:",
					label_style: 'inline',
					default_value: 3
				},
				{
					type: "Text",
					property: "categories_separator",
					label: "Separate with",
					default_value: ' | '
				}
			];
		}
	});

	Modules.part_tags = Panel.Toggleable.extend({
		title: "Tags",
		data_part: 'tags',
		get_fields: function () {
			return [
				{
					type: "Number",
					property: "tags_limit",
					label: "Show max:",
					label_style: 'inline',
					default_value: 3
				},
				{
					type: "Text",
					property: "tags_separator",
					label: "Separate with",
					default_value: ', '
				}
			];
		}
	});

	return Modules;
});