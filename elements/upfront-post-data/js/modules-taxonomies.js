define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/author.html',
], function (Panel, template) {

	var Modules = {};
	Modules.template = template;
	
	Modules.part_categories = Panel.Toggleable.extend({ title: "Categories", data_part: 'categories' });
	Modules.part_tags = Panel.Toggleable.extend({ title: "Tags", data_part: 'tags' });

	return Modules;
});