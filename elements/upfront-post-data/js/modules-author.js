define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/author.html',
], function (Panel, template) {

	var Modules = {};
	Modules.template = template;

	Modules.part_author = Panel.Toggleable.extend({ title: "Author", data_part: 'author' });
	Modules.part_author_email = Panel.Toggleable.extend({ title: "Email", data_part: 'author_email' });
	Modules.part_author_url = Panel.Toggleable.extend({ title: "URL", data_part: 'author_url' });
	Modules.part_author_bio = Panel.Toggleable.extend({ title: "Biography", data_part: 'author_bio' });
	Modules.part_gravatar = Panel.Toggleable.extend({
		title: "Gravatar",
		data_part: 'gravatar',
		get_fields: function () {
			return [{
				type: "Number",
				label: "Size in px",
				label_style: 'inline',
				property: "gravatar_size"
			}]
		},
		get_modules: function () {
			var modules = [], // gravatar doesn't have typography
				me = this,
				name = function (name) { return 'static-' + me.data_part + '-' + name; }
			;

			modules.push({
				moduleType: 'Border',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-border'),
						width: name('border-width'),
						type: name('border-type'),
						color: name('border-color')
					}
				}
			});

			modules.push({
				moduleType: 'Radius',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-radius'),
						lock: name('lock'),
						radius: name('radius'),
						radius_number: name('radius_number'),
						radius1: name('radius1'),
						radius2: name('radius2'),
						radius3: name('radius3'),
						radius4: name('radius4')
					}
				}
			});
			
			return modules;
		}
	});

	return Modules;
});