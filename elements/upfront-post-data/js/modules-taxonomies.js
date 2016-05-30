define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/taxonomy.html',
], function (Panel, template) {
	var l10n = Upfront.Settings.l10n.post_data_element;

	var Modules = {};
	Modules.template = template;
	
	Modules.part_categories = Panel.Toggleable.extend({
		title: l10n.tax.cats_part_title, 
		data_part: 'categories',
		get_fields: function () {
			return [
				{
					type: "Number",
					property: "categories_limit",
					label: l10n.tax.max_limit,
					label_style: 'inline',
					default_value: 3
				},
				{
					type: "Text",
					property: "categories_separator",
					label: l10n.tax.separator,
					default_value: ' | '
				}
			];
		}
	});

	Modules.part_tags = Panel.Toggleable.extend({
		title: l10n.tax.tags_part_title,
		data_part: 'tags',
		get_fields: function () {
			return [
				{
					type: "Number",
					property: "tags_limit",
					label: l10n.tax.max_limit,
					label_style: 'inline',
					default_value: 3
				},
				{
					type: "Text",
					property: "tags_separator",
					label: l10n.tax.separator,
					default_value: ', '
				}
			];
		}
	});

	return Modules;
});