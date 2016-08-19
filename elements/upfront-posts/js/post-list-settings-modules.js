define([
	'elements/upfront-posts/js/post-list-modules-abstraction',
	'text!elements/upfront-posts/tpl/views.html'
], function (Panel, template) {
	var l10n = Upfront.Settings.l10n.post_data_element;

	var Modules = {};
	Modules.template = template;

	Modules.part_author = Panel.Toggleable.extend({
		title: l10n.author.author_part_title,
		data_part: 'author',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.author.display,
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: l10n.author.display_name, value: 'display_name'},
						{label: l10n.author.first_last, value: 'first_last'},
						{label: l10n.author.last_first, value: 'last_first'},
						{label: l10n.author.nickname, value: 'nickname'},
						{label: l10n.author.username, value: 'username'}
					]
				},
				{
					type: 'Select',
					label: l10n.author.link_to,
					label_style: 'inline',
					property: 'link',
					values: [
						{label: l10n.author.website, value: 'website'},
						{label: l10n.author.author_page, value: 'author'}
					]
				},
				{
					type: 'Checkboxes',
					property: 'target',
					values: [
						{label: l10n.new_tab, value: '_blank'}
					]
				}
			];
		}
	});

	Modules.part_author_email = Panel.Toggleable.extend({
		title: l10n.author.email_part_title,
		data_part: 'author_email',
		get_fields: function () {
			return [
				{
					type: 'Text',
					label: l10n.author.email_text_label,
					label_style: 'inline',
					default_value: 'Email',
					property: 'email_link_text'
				}
			];
		}
	});

	Modules.part_author_url = Panel.Toggleable.extend({
		title: l10n.author.url_part_title,
		data_part: 'author_url',
		get_fields: function () {
			return [
				{
					type: 'Text',
					label: l10n.author.link_text,
					label_style: 'inline',
					default_value: l10n.author.website,
					property: 'link_text'
				},
				{
					type: 'Checkboxes',
					property: 'target',
					values: [
						{label: l10n.new_tab, value: '_blank'}
					]
				}
			];
		}
	});


	Modules.part_author_bio = Panel.Toggleable.extend({ title: l10n.author.bio_part_title, data_part: 'author_bio' });
	Modules.part_gravatar = Panel.Toggleable.extend({
		title: l10n.author.gravatar_part_title,
		data_part: 'gravatar',
		get_fields: function () {
			return [{
				type: "Number",
				label: l10n.author.gravatar_size,
				label_style: 'inline',
				property: "gravatar_size"
			}];
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
