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
			var modules = [],
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
			var modules = [],
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
		get_modules: function () {
			var modules = [],
				me = this,
				name = function (name) { return 'author-' + name; }
			;
			
			modules.push({
				moduleType: 'Toggle',
				options: {
					label: l10n.modules.gravatar_title,
					name: 'gravatar-use',
					default_value: 1,
					as_field: false,
					classStyle: 'gravatar-use',
					fields: [
						'gravatar_size',
						'gravatar_border_width',
						'gravatar_border_type',
						'gravatar_border_color',
						'gravatar_radius',
						'gravatar_radius_number'
					]
				}
			});
			
			modules.push({
				moduleType: 'Typography',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-typography'),
						typeface: name('font-family'),
						weight: name('weight'),
						fontstyle: name('fontstyle'),
						style: name('style'),
						size: name('font-size'),
						line_height: name('line-height'),
						color: name('font-color')
					}
				}
			});
			
			return modules;
		},
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.modules.display,
					label_style: 'inline',
					property: 'display_name',
					values: [
						{label: l10n.modules.display_name, value: 'display_name'},
						{label: l10n.modules.first_last, value: 'first_last'},
						{label: l10n.modules.last_first, value: 'last_first'},
						{label: l10n.modules.nickname, value: 'nickname'},
						{label: l10n.modules.username, value: 'username'}
					]
				},
				{
					type: 'Select',
					label: l10n.modules.link_to,
					label_style: 'inline',
					property: 'link',
					values: [
						{label: l10n.modules.website, value: 'website'},
						{label: l10n.modules.author_page, value: 'author'}
					]
				},
				{
					type: 'Checkboxes',
					property: 'target',
					values: [
						{label: l10n.modules.new_tab, value: '_blank'}
					]
				},
				{
					type: "Number",
					className: 'gravatar_size',
					label: l10n.modules.gravatar_size,
					label_style: 'inline',
					name: "gravatar_size",
					property: "gravatar_size"
				},
				{
					type: "Number",
					className: 'borderWidth gravatar_border_width uf-module-label-title',
					label: l10n.modules.border,
					default_value: 1,
					suffix: l10n.px,
					name: "gravatar_border_width",
					property: "gravatar_border_width",
				},
				{
					type: "Select",
					className: 'gravatar_border_type borderType',
					multiple: false,
					name: "gravatar_border_type",
					property: "gravatar_border_type",
					default_value: "solid",
					values: [
						{ label: l10n.modules.solid, value: 'solid' },
						{ label: l10n.modules.dashed, value: 'dashed' },
						{ label: l10n.modules.dotted, value: 'dotted' }
					],
				},
				{
					type: "Color",
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf borderColor gravatar_border_color',
					multiple: false,
					name: "gravatar_border_color",
					property: "gravatar_border_color",
					blank_alpha : 0,
					label_style: 'inline',
					label: '',
					default_value: '#000',
				},
				{
					type: "Slider",
					className: 'gravatar_radius upfront-field-wrap upfront-field-wrap-slider radius-slider uf-module-label-title',
					label: l10n.modules.round_corners,
					suffix: l10n.px,
					min: 0,
					name: "gravatar_radius",
					property: "gravatar_radius",
					max: 1000,
					step: 10,
					show: function() {

					}
				},
				{
					type: "Number",
					className: 'gravatar_radius_number border_radius_number',
					label: '',
					min: 0,
					max: 1000,
					default_value: 0,
					values: [
						{ label: "", value: '0' }
					],
					change: function() {
						
					},
					label_style: 'inline',
					name: "gravatar_radius_number",
					property: "gravatar_radius_number"
				},
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
					label: l10n.modules.image_size,
					label_style: 'inline',
					property: 'image_size',
					values: [
						{label: l10n.modules.custom_size, value: 'custom_size'},
					]
				},
				{
					type: "Text",
					label: l10n.modules.custom_width,
					className: 'image-custom-width',
					label_style: 'inline',
					property: "custom_width",
					suffix: l10n.px,
				},
				{
					type: "Text",
					label: l10n.modules.custom_height,
					className: 'image-custom-height',
					label_style: 'inline',
					property: "custom_height",
					suffix: l10n.px,
				},
				{
					type: "Checkboxes",
					property: "resize_featured",
					multiple: false,
					default_value: 0,
					values: [{ label: l10n.modules.resize_to_fit, value: '1' }]
				},
			];
		},
		get_modules: function () {
			var modules = [];
			
			return modules;
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
					type: 'Title',
					label: l10n.content_type
				},
				{
					type: 'Radios',
					property: 'content_type',
					layout: "horizontal-inline",
					values: [
						{
							label: l10n.modules.excerpt,
							value: 'excerpt'
						},
						{
							label: l10n.modules.full_post,
							value: 'full'
						}
					],
					show: function(value, $el){
						if(value === "excerpt") {
							$el.siblings('.uf-posts-content-length').show();
						} else {
							$el.siblings('.uf-posts-content-length').hide();
						}
					},
				},
				{
					type: 'Number',
					property: 'content_length',
					className: 'uf-posts-content-length',
					label: l10n.limit,
					suffix: l10n.words,
					label_style: 'inline',
				},
			];
		}
	});
	
	Modules.part_tags = Panel.Toggleable.extend({
		title: l10n.modules.tags_title,
		data_part: 'tags',
		gget_fields: function () {
			return [
				{
					type: 'Title',
					label: l10n.modules.display_settings
				},
				{
					type: 'Radios',
					property: 'tags_display_type',
					layout: "horizontal-inline",
					values: [
						{
							label: l10n.modules.inline,
							value: 'inline'
						},
						{
							label: l10n.modules.block,
							value: 'block'
						}
					],
					show: function(value, $el) {
						var $wrapper = $el.closest('.upfront-settings-post-wrapper');
						if(value === "block") {
							$wrapper.find('.toggle_settings_item').show();
						} else {
							$wrapper.find('.toggle_settings_item').hide();
						}
					},
				},
				{
					type: 'Number',
					property: 'tags_show_max',
					label: l10n.modules.show_max,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
				},
				{
					type: "Text",
					label: l10n.modules.separate_with,
					label_style: 'inline',
					property: "tags_separator"
				},
				{
					type: "Number",
					className: 'tags_padding_top_bottom',
					label: l10n.modules.padding,
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "tags_padding_top_bottom",
					property: "tags_padding_top_bottom"
				},
				{
					type: "Number",
					className: 'tags_padding_left_right',
					label: '',
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "tags_padding_left_right",
					property: "tags_padding_left_right"
				},
				{
					type: "Number",
					className: 'tags_margin_top_bottom',
					label: l10n.modules.margin,
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "tags_margin_top_bottom",
					property: "tags_margin_top_bottom"
				},
				{
					type: "Number",
					className: 'tags_margin_left_right',
					label: '',
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "tags_margin_left_right",
					property: "tags_margin_left_right"
				},
				{
					type: "Color",
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf tags_background',
					multiple: false,
					name: "tags_background",
					property: "tags_background",
					blank_alpha : 0,
					label_style: 'inline',
					label: l10n.modules.background,
					default_value: '#000',
				},
			];
		},
		get_modules: function () {
			var modules = [],
				me = this,
				name = function (name) { return 'tags-' + name; }
			;
			
			modules.push({
				moduleType: 'Toggle',
				options: {
					label: l10n.modules.single_category,
					property: 'tags-single-use',
					default_value: 1,
					as_field: false,
					classStyle: 'tags-single-use',
					fields: [
						'tags_padding_top_bottom',
						'tags_padding_left_right',
						'tags_margin_top_bottom',
						'tags_margin_left_right',
						'tags_background'
					]
				}
			});
			
			modules.push({
				moduleType: 'Typography',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-typography'),
						typeface: name('font-family'),
						weight: name('weight'),
						fontstyle: name('fontstyle'),
						style: name('style'),
						size: name('font-size'),
						line_height: name('line-height'),
						color: name('font-color')
					}
				}
			});
			
			return modules;
		},
	});

	Modules.part_date_posted = Panel.Toggleable.extend({
		title: l10n.modules.date_posted_title,
		data_part: 'date_posted',
		get_fields: function () {
			return [
				{
					type: "Select",
					label: l10n.modules.date_format,
					multiple: false,
					property: "predefined_date_format",
					values: [
						{ label: l10n.modules.wp_date, value: "wp_date" },
						{ label: l10n.modules.dMY, value: "d M Y" },
						{ label: l10n.modules.MdY, value: "M d Y" },
						{ label: l10n.modules.dmY, value: "d m Y" },
						{ label: l10n.modules.mdY, value: "m d Y" },
						{ label: l10n.modules.custom_format, value: "0" }
					],
					default_value: "wp_date"
				},
				{
					type: "Text",
					label: l10n.modules.php_format,
					className: 'php_date_format',
					label_style: 'inline',
					property: "date_posted_format"
				},
				{
					type: "Button",
					label: l10n.modules.reference,
					className: 'php_date_reference',
					compact: true,
					on_click: function (e) {
						if (e && e.preventDefault) e.preventDefault();
						if (e && e.stopPropagation) e.stopPropagation();

						var win = window.open('https://codex.wordpress.org/Formatting_Date_and_Time', '_blank');
						win.focus();

						return false;
					}
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
					type: 'Title',
					label: l10n.modules.display_settings
				},
				{
					type: 'Radios',
					property: 'category_display_type',
					layout: "horizontal-inline",
					values: [
						{
							label: l10n.modules.inline,
							value: 'inline'
						},
						{
							label: l10n.modules.block,
							value: 'block'
						}
					],
					show: function(value, $el) {
						var $wrapper = $el.closest('.upfront-settings-post-wrapper');
						if(value === "block") {
							$wrapper.find('.toggle_settings_item').show();
						} else {
							$wrapper.find('.toggle_settings_item').hide();
						}
					},
				},
				{
					type: 'Number',
					property: 'category_show_max',
					label: l10n.modules.show_max,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
				},
				{
					type: "Text",
					label: l10n.modules.separate_with,
					label_style: 'inline',
					property: "category_separator"
				},
				{
					type: "Number",
					className: 'category_padding_top_bottom',
					label: l10n.modules.padding,
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "category_padding_top_bottom",
					property: "category_padding_top_bottom"
				},
				{
					type: "Number",
					className: 'category_padding_left_right',
					label: '',
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "category_padding_left_right",
					property: "category_padding_left_right"
				},
				{
					type: "Number",
					className: 'category_margin_top_bottom',
					label: l10n.modules.margin,
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "category_margin_top_bottom",
					property: "category_margin_top_bottom"
				},
				{
					type: "Number",
					className: 'category_margin_left_right',
					label: '',
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "category_margin_left_right",
					property: "category_margin_left_right"
				},
				{
					type: "Color",
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf category_background',
					multiple: false,
					name: "category_background",
					property: "category_background",
					blank_alpha : 0,
					label_style: 'inline',
					label: l10n.modules.background,
					default_value: '#000',
				},
			];
		},
		get_modules: function () {
			var modules = [],
				me = this,
				name = function (name) { return 'category-' + name; }
			;
			
			modules.push({
				moduleType: 'Toggle',
				options: {
					label: l10n.modules.single_category,
					property: 'category-single-use',
					default_value: 1,
					as_field: false,
					classStyle: 'category-single-use',
					fields: [
						'category_padding_top_bottom',
						'category_padding_left_right',
						'category_margin_top_bottom',
						'category_margin_left_right',
						'category_background'
					]
				}
			});
			
			modules.push({
				moduleType: 'Typography',
				options: {
					toggle: true,
					state: 'static',
					fields: {
						use: name('use-typography'),
						typeface: name('font-family'),
						weight: name('weight'),
						fontstyle: name('fontstyle'),
						style: name('style'),
						size: name('font-size'),
						line_height: name('line-height'),
						color: name('font-color')
					}
				}
			});
			
			return modules;
		},
	});
	
	Modules.part_read_more = Panel.Toggleable.extend({
		title: l10n.modules.read_more_title,
		data_part: 'read_more'
	});

	return Modules;
});
