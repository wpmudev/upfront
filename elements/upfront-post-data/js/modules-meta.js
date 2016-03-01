define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/meta.html'
], function (Panel, template) {

	var Modules = {};
	Modules.template = template;

	Modules.part_meta = Panel.Toggleable.extend({
		title: "Meta",
		data_part: 'meta',
		get_modules: function () { return []; } // No extra modules for meta
	});

	return Modules;
});