define([
	'elements/upfront-posts/js/post-list-modules-abstraction',
	'text!elements/upfront-posts/tpl/views.html'
], function (Panel, template) {
	var l10n = Upfront.Settings.l10n.posts_element;

	var Modules = {};
	Modules.template = template;
	
	Modules.element_wrapper = Panel.Toggleable.extend({
		title: l10n.modules.element_wrapper,
		data_part: 'element_wrapper',
		get_modules: function () {
			var modules = [], // gravatar doesn't have typography
				me = this,
				name = function (name) { return 'element_wrapper-' + name; }
			;

			modules.push({
				moduleType: 'Border',
				options: {
					toggle: true,
					state: 'static',
					showLabel: false,
					fields: {
						use: name('use-border'),
						width: name('border-width'),
						type: name('border-type'),
						color: name('border-color')
					}
				}
			});	

			modules.push({
				moduleType: 'Colors',
				options: {
					toggle: true,
					state: 'static',
					multiple: false,
					single: true,
					toggle: false,
					abccolors: [
						{
							name: name('background-color'),
							label: l10n.modules.bg_label
						}
					]
				}
			});

			return modules;
		}
	});
	
	Modules.post_wrapper = Panel.Toggleable.extend({
		title: l10n.modules.post_wrapper,
		data_part: 'post_wrapper',
		get_modules: function () {
			var modules = [], // gravatar doesn't have typography
				me = this,
				name = function (name) { return 'post_wrapper-' + name; }
			;
			
			modules.push({
				moduleType: 'Margin',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-margin'),
						lock: name('lock-margin'),
						slider: name('slider-margin'),
						margin_number: name('number-margin'),
						left_num: name('left-margin'),
						top_num: name('top-margin'),
						right_num: name('right-margin'),
						bottom_num: name('bottom-margin')
					}
				}
			});	
			
			modules.push({
				moduleType: 'Border',
				options: {
					toggle: true,
					state: 'static',
					showLabel: false,
					fields: {
						use: name('use-border'),
						width: name('border-width'),
						type: name('border-type'),
						color: name('border-color')
					}
				}
			});	

			modules.push({
				moduleType: 'Colors',
				options: {
					toggle: true,
					state: 'static',
					multiple: false,
					single: true,
					toggle: false,
					abccolors: [
						{
							name: name('background-color'),
							label: l10n.modules.bg_label
						}
					]
				}
			});

			return modules;
		}
	});
	
	Modules.part_author = Panel.Toggleable.extend({
		title: l10n.modules.author_title,
		data_part: 'author',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.numeric,
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: l10n.numeric, value: 'display_name'},
					]
				}
			];
		}
	});
	
	Modules.part_featured_image = Panel.Toggleable.extend({
		title: l10n.modules.featured_image_title,
		data_part: 'featured_image',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.numeric,
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: l10n.numeric, value: 'display_name'},
					]
				}
			];
		}
	});
	
	Modules.part_comment_count = Panel.Toggleable.extend({
		title: l10n.modules.comment_count_title,
		data_part: 'comment_count',
		get_fields: function () {
			return [
				{
					type: 'Checkboxes',
					property: 'hide_if_no_comments',
					values: [{ label: l10n.modules.hide_if_no_comments, value: '1' }]
				}
			];
		}
	});
	
	Modules.part_content = Panel.Toggleable.extend({
		title: l10n.modules.content_title,
		data_part: 'content',
		get_fields: function () {
			return [
				{
					type: 'Radios',
					property: 'content_type',
					layout: "horizontal",
					values: [
						{
							label: l10n.modules.excerpt,
							value: 'excerpt'
						},
						{
							label: l10n.modules.full_post,
							value: 'full'
						}
					]
				}
			];
		}
	});
	
	Modules.part_tags = Panel.Toggleable.extend({
		title: l10n.modules.tags_title,
		data_part: 'tags',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.numeric,
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: l10n.numeric, value: 'display_name'},
					]
				}
			];
		}
	});
	
	Modules.part_gravatar = Panel.Toggleable.extend({
		title: l10n.modules.gravatar_title,
		data_part: 'gravatar',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.numeric,
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: l10n.numeric, value: 'display_name'},
					]
				}
			];
		}
	});
	
	Modules.part_date_posted = Panel.Toggleable.extend({
		title: l10n.modules.date_posted_title,
		data_part: 'date_posted',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.numeric,
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: l10n.numeric, value: 'display_name'},
					]
				}
			];
		}
	});
	
	Modules.part_title = Panel.Toggleable.extend({
		title: l10n.modules.title_title,
		data_part: 'title',
	});
	
	Modules.part_categories = Panel.Toggleable.extend({
		title: l10n.modules.categories_title,
		data_part: 'categories',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.numeric,
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: l10n.numeric, value: 'display_name'},
					]
				}
			];
		}
	});
	
	Modules.part_read_more = Panel.Toggleable.extend({
		title: l10n.modules.read_more_title,
		data_part: 'read_more'
	});
	
	/*
	Modules.part_author = Panel.Toggleable.extend({
		title: l10n.author_part_title,
		data_part: 'author',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.display,
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
			];
		}
	});
	*/

	return Modules;
});
