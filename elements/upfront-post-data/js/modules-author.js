define([
	'elements/upfront-post-data/js/panel-abstractions',
	'text!elements/upfront-post-data/tpl/preset-styles/author.html',
], function (Panel, template) {

	var Modules = {};
	Modules.template = template;

	Modules.part_author = Panel.Toggleable.extend({
		title: "Author",
		data_part: 'author',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: 'Display',
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: 'Display Name', value: 'display_name'},
						{label: 'First &amp; Last Name', value: 'first_last'},
						{label: 'Last &amp; First Name', value: 'last_first'},
						{label: 'Nickname', value: 'nickname'},
						{label: 'Username', value: 'username'},
					]
				},
				{
					type: 'Select',
					label: 'Link To',
					label_style: 'inline',
					property: 'link',
					values: [
						{label: 'Website', value: 'website'},
						{label: 'Author page', value: 'author'}
					]
				},
				{
					type: 'Checkboxes',
					property: 'target',
					values: [
						{label: 'New Tab', value: '_blank'}
					]
				}
			];
		}
	});

	Modules.part_author_email = Panel.Toggleable.extend({
		title: "Email",
		data_part: 'author_email',
		get_fields: function () {
			return [
				{
					type: 'Text',
					label: 'Email Text Label',
					label_style: 'inline',
					default_value: 'Email',
					property: 'email_link_text'
				}
			];
		}
	});
	
	Modules.part_author_url = Panel.Toggleable.extend({
		title: "URL", 
		data_part: 'author_url',
		get_fields: function () {
			return [
				{
					type: 'Text',
					label: 'Link Text',
					label_style: 'inline',
					default_value: 'Website',
					property: 'link_text'
				},
				{
					type: 'Checkboxes',
					property: 'target',
					values: [
						{label: 'New Tab', value: '_blank'}
					]
				}
			];
		}
	});


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