define([
	'elements/upfront-posts/js/post-list-modules-abstraction',
	'text!elements/upfront-posts/tpl/preset-style.html'
], function (Panel, template) {
	var l10n = Upfront.Settings.l10n.posts_element;

	var Modules = {};
	Modules.template = template;
	
	Modules.element_wrapper = Panel.Toggleable.extend({
		title: l10n.modules.element_wrapper,
		data_part: 'element_wrapper',
		slug: 'element-wrapper',
		get_modules: function () {
			var modules = [],
				me = this,
				name = function (name) { return 'element-wrapper-' + name; }
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
		slug: 'post-wrapper',
		get_modules: function () {
			var modules = [],
				me = this,
				name = function (name) { return 'post-wrapper-' + name; }
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
		slug: 'author',
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
						'gravatar-size', // Part property
						'gravatar-border-width',
						'gravatar-border-type',
						'gravatar-border-color',
						'gravatar-radius',
						'gravatar-radius-number'
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
					property: 'author-display-name',
					name: 'author-display-name',
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
					property: 'author-link',
					name: 'author-link',
					values: [
						{label: l10n.modules.website, value: 'website'},
						{label: l10n.modules.author_page, value: 'author'}
					]
				},
				{
					type: 'Checkboxes',
					property: 'author-target',
					name: 'author-target',
					values: [
						{label: l10n.modules.new_tab, value: '_blank'}
					]
				},
				{
					type: "Number",
					className: 'gravatar-size',
					label: l10n.modules.gravatar_size,
					label_style: 'inline',
					name: "gravatar-size",
					property: "gravatar-size"
				},
				{
					type: "Number",
					className: 'borderWidth gravatar-border-width uf-module-label-title',
					label: l10n.modules.border,
					default_value: 1,
					suffix: l10n.px,
					name: "gravatar-border-width",
					property: "gravatar-border-width",
				},
				{
					type: "Select",
					className: 'gravatar-border-type borderType',
					multiple: false,
					name: "gravatar-border-type",
					property: "gravatar-border-type",
					default_value: "solid",
					values: [
						{ label: l10n.modules.solid, value: 'solid' },
						{ label: l10n.modules.dashed, value: 'dashed' },
						{ label: l10n.modules.dotted, value: 'dotted' }
					],
				},
				{
					type: "Color",
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf borderColor gravatar-border-color',
					multiple: false,
					name: "gravatar-border-color",
					property: "gravatar-border-color",
					blank_alpha : 0,
					label_style: 'inline',
					label: '',
					default_value: '#000',
				},
				{
					type: "Slider",
					className: 'gravatar-radius upfront-field-wrap upfront-field-wrap-slider radius-slider uf-module-label-title',
					label: l10n.modules.round_corners,
					suffix: l10n.px,
					min: 0,
					name: "gravatar-radius",
					property: "gravatar-radius",
					max: 1000,
					step: 10,
					show: function() {

					}
				},
				{
					type: "Number",
					className: 'gravatar-radius-number border_radius_number',
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
					name: "gravatar-radius-number",
					property: "gravatar-radius-number"
				},
			];
		}
	});
	
	Modules.part_featured_image = Panel.Toggleable.extend({
		title: l10n.modules.featured_image_title,
		data_part: 'featured_image',
		slug: 'featured_image',
		get_fields: function () {
			return [
				{
					type: 'Select',
					label: l10n.modules.image_size,
					label_style: 'inline',
					property: 'featured-image-size',
					values: [
						{label: l10n.thumbnail_size_thumbnail, value: 'thumbnail'},
						{label: l10n.thumbnail_size_medium, value: 'medium'},
						{label: l10n.thumbnail_size_large, value: 'large'},
						{label: l10n.thumbnail_size_post_feature, value: 'uf_post_featured_image'},
						{label: l10n.modules.custom_size, value: 'custom_size'},
					],
					show: function(value, $el){
						if(value === "custom_size") {
							$el.siblings('.uf-posts-image-custom-width').show();
							$el.siblings('.uf-posts-image-custom-height').show();
						} else {
							$el.siblings('.uf-posts-image-custom-width').hide();
							$el.siblings('.uf-posts-image-custom-height').hide();
						}
					},
				},
				{
					type: "Text",
					label: l10n.modules.custom_width,
					className: 'uf-posts-image-custom-width',
					label_style: 'inline',
					property: "featured-custom-width",
					suffix: l10n.px,
				},
				{
					type: "Text",
					label: l10n.modules.custom_height,
					className: 'uf-posts-image-custom-height',
					label_style: 'inline',
					property: "featured-custom-height",
					suffix: l10n.px,
				},
				{
					type: "Checkboxes",
					property: "feature-resize",
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
		slug: 'comment_count',
		get_fields: function () {
			return [
				{
					type: 'Checkboxes',
					property: 'comments-hide-if-empty',
					values: [{ label: l10n.modules.hide_if_no_comments, value: '1' }]
				}
			];
		}
	});
	
	Modules.part_content = Panel.Toggleable.extend({
		title: l10n.modules.content_title,
		data_part: 'content',
		slug: 'content',
		get_fields: function () {
			return [
				{
					type: 'Title',
					label: l10n.content_type
				},
				{
					type: 'Radios',
					property: 'content-type',
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
					property: 'content-length',
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
		slug: 'tags',
		get_fields: function () {
			return [
				{
					type: 'Title',
					label: l10n.modules.display_settings
				},
				{
					type: 'Radios',
					property: 'tags-display-type',
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
					property: 'tags-show-max',
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
					property: "tags-separator"
				},
				{
					type: "Number",
					className: 'tags-padding-top-bottom',
					label: l10n.modules.padding,
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "tags-padding-top-bottom",
					property: "tags-padding-top-bottom"
				},
				{
					type: "Number",
					className: 'tags-padding-left-right',
					label: '',
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "tags-padding-left-right",
					property: "tags-padding-left-right"
				},
				{
					type: "Number",
					className: 'tags-margin-top-bottom',
					label: l10n.modules.margin,
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "tags-margin-top-bottom",
					property: "tags-margin-top-bottom"
				},
				{
					type: "Number",
					className: 'tags-margin-left-right',
					label: '',
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "tags-margin-left-right",
					property: "tags-margin-left-right"
				},
				{
					type: "Color",
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf tags-background',
					multiple: false,
					name: "tags-background",
					property: "tags-background",
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
					label: l10n.modules.single_tag,
					property: 'tags-single-use',
					name: 'tags-single-use',
					default_value: 1,
					as_field: false,
					classStyle: 'tags-single-use',
					fields: [
						'tags-padding-top-bottom',
						'tags-padding-left-right',
						'tags-margin-top-bottom',
						'tags-margin-left-right',
						'tags-background'
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
		slug: 'date_posted',
		get_fields: function () {
			return [
				{
					type: "Select",
					label: l10n.modules.date_format,
					multiple: false,
					property: "predefined-date-format",
					values: [
						{ label: l10n.modules.wp_date, value: "wp_date" },
						{ label: l10n.modules.dMY, value: "d M Y" },
						{ label: l10n.modules.MdY, value: "M d Y" },
						{ label: l10n.modules.dmY, value: "d m Y" },
						{ label: l10n.modules.mdY, value: "m d Y" },
						{ label: l10n.modules.custom_format, value: "0" }
					],
					default_value: "wp_date",
					show: function(value, $el) {
						var $wrapper = $el.closest('.upfront-settings-post-wrapper');
						if(value === "0" || value === "") {
							$wrapper.find('.php-date-format').show();
							$wrapper.find('.php-date-reference').show();
						} else {
							$wrapper.find('.php-date-format').hide();
							$wrapper.find('.php-date-reference').hide();
						}
					},
				},
				{
					type: "Text",
					label: l10n.modules.php_format,
					className: 'php-date-format',
					label_style: 'inline',
					property: "php-date-format"
				},
				{
					type: "Button",
					label: l10n.modules.reference,
					className: 'php-date-reference',
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
		slug: 'title'
	});
	
	Modules.part_categories = Panel.Toggleable.extend({
		title: l10n.modules.categories_title,
		data_part: 'categories',
		slug: 'category',
		get_fields: function () {
			return [
				{
					type: 'Title',
					label: l10n.modules.display_settings
				},
				{
					type: 'Radios',
					property: 'category-display-type',
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
					property: 'category-show-max',
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
					property: "category-separator"
				},
				{
					type: "Number",
					className: 'category-padding-top-bottom',
					label: l10n.modules.padding,
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "category-padding-top-bottom",
					property: "category-padding-top-bottom"
				},
				{
					type: "Number",
					className: 'category-padding-left-right',
					label: '',
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "category-padding-left-right",
					property: "category-padding-left-right"
				},
				{
					type: "Number",
					className: 'category-margin-top-bottom',
					label: l10n.modules.margin,
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "category-margin-top-bottom",
					property: "category-margin-top-bottom"
				},
				{
					type: "Number",
					className: 'category-margin-left-right',
					label: '',
					suffix: l10n.px,
					min: 0,
					max: 1000,
					default_value: 0,
					label_style: 'inline',
					name: "category-margin-left-right",
					property: "category-margin-left-right"
				},
				{
					type: "Color",
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf category-background',
					multiple: false,
					name: "category-background",
					property: "category-background",
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
					name: 'category-single-use',
					default_value: 1,
					as_field: false,
					classStyle: 'category-single-use',
					fields: [
						'category-padding-top-bottom',
						'category-padding-left-right',
						'category-margin-top-bottom',
						'category-margin-left-right',
						'category-background'
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
		data_part: 'read_more',
		slug: 'read_more'
	});

	return Modules;
});
