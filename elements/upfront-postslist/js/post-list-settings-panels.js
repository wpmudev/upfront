(function ($) {
define([
	'text!elements/upfront-postslist/tpl/views.html',
	'elements/upfront-postslist/js/post-list-settings-parts',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/preset-settings/preset-manager',
	'scripts/upfront/preset-settings/util',
	'elements/upfront-postslist/js/post-list-settings-modules',
], function(tpl, Parts, RootSettingsPanel, PresetManager, Util, PostsLists_Modules) {

var l10n = Upfront.Settings.l10n.postslist_element;
var $template = $(tpl);

Upfront.Util.post({
	"action": "upfront_postslist-data"
}).success(function (initialData) {
	Panels._initial = initialData.data;
}); // End response wrap

var Modules = _.extend(
	{},
	_.omit(PostsLists_Modules, 'template')
);

var Panels = {
	_initial: {},
};

RootSettingsPanel = RootSettingsPanel.extend({
	is_active: function () {
		return this.$el.find(".uf-settings-panel__body").is(":visible");
	}
});

Panels.General = RootSettingsPanel.extend({
	initialize: function (opts) {
		this.options = opts;
		var me = this,
			query = new QuerySettings({
				className: 'upfront-post-settings',
				model: this.model
			}),
			/*
			We are moving Thumbanil settings into presets
			thumbnail = new ThumbnailSettings({
				model: this.model,
				title: l10n.thumbnail_size
			}),
			*/
			autorefresh = function (value) {
				this.model.set_property(this.options.property, value);
				if ('list_type' === this.options.property) {
					query.dispatch_settings();
				}
				
				Upfront.Events.trigger('posts:settings:dispatched', this);
			},
			display_type = new Upfront.Views.Editor.Field.Radios({
				model: this.model,
				className: 'upfront-posts-display-type',
				property: 'display_type',
				label: '',
				layout: 'horizontal-inline',
				icon_class: 'upfront-posts-display_type',
				values: [
					{label: l10n.single_post, value: 'single'},
					{label: l10n.post_list, value: 'list'}
				]
			}),
			list_type = new Upfront.Views.Editor.Field.Select({
				model: this.model,
				property: 'list_type',
				label: '',
				default_value: 'custom',
				layout: 'horizontal',
				default_value: 'custom',
				values: [
					{label: l10n.post_list_custom, value: 'custom'},
					{label: l10n.post_list_tax, value: 'taxonomy'},
					{label: l10n.post_list_generic, value: 'generic'}
				]
			}),
			display_type_section = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				className: 'upfront-display-type-section',
				title: l10n.query_settings,
				fields: [display_type]
			}),
			list_type_section = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				className: 'upfront-list-type-section',
				title: l10n.list_type_label,
				fields: [list_type]
			})
		;
		
		display_type.on("changed", autorefresh);
		
		list_type.on("changed", autorefresh);
		query.on("setting:changed", autorefresh);
		/* We are moving Thumbnail settings to presets */
		//thumbnail.on("setting:changed", autorefresh);
		query.on("post:added", function () {
			Upfront.Events.trigger('posts:post:added', this);
		}, this);
		
		query.on("post:removed", function () {
			Upfront.Events.trigger('posts:post:removed', this);
		}, this);
		
		this.settings = _([
			display_type_section,
			list_type_section,
			query,
			// thumbnail
		]);
	},

	title: l10n.general_settings
});

var CustomSelectorField =  Upfront.Views.Editor.Field.Hidden.extend({
	events: function () {
		return _.extend({},
			Upfront.Views.Editor.Field.Hidden.prototype.events,
			{'click a[href="#add"]': "select_posts"},
			{'click ul li a[href="#rmv"]': "remove_post"}
		);
	},
	get_field_html: function () {
		var field = Upfront.Views.Editor.Field.Hidden.prototype.get_field_html.apply(this),
			values = this.get_decoded_values(this.options.property),
			is_single = 'single' === this.model.get_property_value_by_name('display_type'),
			string = values.length ? l10n.add_custom_post : l10n.select_custom_post,
			postCount = 1;
		;
		if (is_single) {
			string = l10n.select_custom_post;
			if (values) values = [_(values).first()];
		}
		if (_.isArray(values) && values.length > 0) {
			field += '<ul class="upfront-posts-list">';
			_.each(values, function (value) {
				if (!value) return false;

				var title = value.permalink;

				if (typeof value.post_title !== "undefined") {
					title = value.post_title;
				}

				if (!is_single) {
					field += '<li><span class="post-count">' + postCount + '</span><span class="permalink">' + title + '</span><a href="#rmv" data-id="' + value.id + '"><i>&times;</i></a></li>';
				} else {
					field += '<li><span class="permalink">' + title + '</span><a href="#rmv" data-id="' + value.id + '"><i>&times;</i></a></li>';
				}

				postCount++;
			});
			field += '</ul>';
		}

		field += '<i class="upfront-posts-custom-add_post"></i> <a href="#add" class="upfront-add-posts">' + string + '</a>';

		return '<div class="custom_posts">' + field + '</div>';
	},
	select_posts: function (e) {
		e.preventDefault();
		e.stopPropagation();
		var me = this;
		Upfront.Views.Editor.PostSelector
			.open()
			.done(function (post) {
				if (!post) return false;
				var id = post.get("ID"),
					link = post.get("permalink"),
					post_title = post.get("post_title"),
					is_single = 'single' === me.model.get_property_value_by_name('display_type'),
					values = me.get_decoded_values(me.options.property)
				;
				if (is_single) {
					values = [{id: id, permalink: link, post_title: post_title}];
				} else {
					values.push({id: id, permalink: link, post_title: post_title});
					me.select_posts(e);
				}
				me.model.set_property(me.options.property, me.encode_values(values));
				Upfront.Events.trigger('posts:settings:dispatched', this);
				me.trigger("post:added");
			})
		;
	},
	remove_post: function (e) {
		e.preventDefault();
		e.stopPropagation();
		var id = $(e.target).closest("a").attr("data-id"),
			values = this.get_decoded_values(this.options.property)
		;
		values = _(values).reject(function (value) {
			return value.id == id;
		});
		this.model.set_property(this.options.property, this.encode_values(values));
		this.trigger("post:removed");
	},
	get_decoded_values: function (property) {
		if (!property) return [];
		var val = this.model.get_property_value_by_name(property);
		return this.decode_values(val);
	},
	decode_values: function (raw) {
		if (!raw) return [];
		var values = raw && raw.length ? JSON.parse(decodeURIComponent(raw)) : [];
		return values;
	},
	encode_values: function (values) {
		return encodeURIComponent(JSON.stringify(values));
	}
});

var QuerySettings = Upfront.Views.Editor.Settings.Item.extend({
	group: false,
	_terms_cache: {},

	events: function () {
		return _.extend({},
			Upfront.Views.Editor.Settings.Item.prototype.events,
			{"click [id*=taxonomy] .upfront-field-select-option": "update_terms"}
		);
	},

	initialize: function (opts) {
		this.options = opts;
		this.dispatch_settings();
	},

	render: function () {
		Upfront.Views.Editor.Settings.Item.prototype.render.call(this);
		$('.upfront-chosen-select', this.$el).chosen({
			width: '230px'
		});

		var display_type = this.model.get_property_value_by_name("display_type");
		this.$el.addClass('upfront-display-type-' + display_type);
	},

	dispatch_settings: function () {
		var type = this.model.get_property_value_by_name('list_type');
		this.fields = _([]); // Pre-initialize the fields

		if ('custom' === type) this.populate_custom_items();
		else if ('taxonomy' === type) this.populate_tax_items();
		else this.populate_generic_items();
	},

	populate_custom_items: function () {
		var fld = new CustomSelectorField({
			model: this.model,
			property: 'posts_list'
		});
		fld.on("post:added", function () {
			this.trigger("post:added");
		}, this);
		fld.on("post:removed", function () {
			this.trigger("post:removed");
		}, this);
		this.fields = _([fld]);
	},

	populate_generic_items: function () {
		this.populate_shared_tax_generic_items();
		this.populate_pagination_items();
	},

	populate_tax_items: function () {
		var taxs = [], types = [], me = this;
		var display_type = this.model.get_property_value_by_name("display_type");
		_(Panels._initial.taxonomies).each(function (label, type) {
			taxs.push({label: label, value: type});
		});
		_(Panels._initial.post_types).each(function (label, type) {
			types.push({label: label, value: type});
		});

		this.fields = _([]);

		if ("list" === display_type) {
			this.populate_limit_items();
		}

		this.fields.push(new Upfront.Views.Editor.Field.Select({
			model: this.model,
			className: 'upfront-post-type',
			label: l10n.post_type,
			property: "post_type",
			values: types,
			change: function(value) {
				me.model.set_property("post_type", value);
				me.trigger('setting:changed');
			}
		}));

		// Even individual posts allow for offset
		this.fields.push(new Upfront.Views.Editor.Field.Number({
			model: this.model,
			className: 'upfront-offset-number',
			label: l10n.offset,
			property: "offset",
			min: 1,
			max: 20,
			change: function(value) {
				me.model.set_property("offset", value);
				me.trigger('setting:changed');
			}
		}));

		this.fields.push(new Upfront.Views.Editor.Field.Select({
			model: this.model,
			className: 'upfront-post-taxonomy',
			label: l10n.taxonomy,
			property: "taxonomy",
			values: taxs,
			change: function(value) {
				me.model.set_property("taxonomy", value);
				me.trigger('setting:changed');
			}
		}));
		this.fields.push(new Upfront.Views.Editor.Field.Chosen_Select({
			model: this.model,
			className: 'upfront-post-term',
			label: l10n.term,
			compact: true,
			property: "term",
			values: [{label:l10n.select_tax, value:"", disabled: true}],
			change: this._set_term_value
		}));
		this.populate_shared_tax_generic_items();
		if ("list" === display_type) {
			this.populate_pagination_items();
		}
		this.once("rendered", this.update_terms, this);
		this.once("rendered", function () {
			this.toggle_offset_based_on_pagination_value(this.model.get_property_value_by_name("pagination"));
		}, this);
	},

	populate_limit_items: function () {
		var me = this,
			display_type = this.model.get_property_value_by_name("display_type");
		
		if ("list" === display_type) {
			this.fields.push(new Upfront.Views.Editor.Field.Number({
				className: 'upfront-post-limit',
				model: this.model,
				label: l10n.limit,
				property: "limit",
				min: 1,
				max: 20,
				change: function(value) {
					me.model.set_property("limit", value);
					me.trigger('setting:changed');
				}
			}));
		}
	},

	populate_pagination_items: function () {
		var display_type = this.model.get_property_value_by_name("display_type"),
			me = this
		;
		if ("list" === display_type) {
			this.fields.push(new Upfront.Views.Editor.Field.Select({
				model: this.model,
				label: l10n.pagination,
				property: "pagination",
				layout: "horizontal-inline",
				values: [
					{label:l10n.none, value:""},
					{label:l10n.numeric, value:"numeric"},
					{label:l10n.prev_next, value:"arrows"}
				],
				change: function (value) {
					me.toggle_offset_based_on_pagination_value(value);
					me.model.set_property("pagination", value);
					me.trigger('setting:changed');
				}
			}));
		}
	},

	toggle_offset_based_on_pagination_value: function (pagination) {
		if ("taxonomy" !== this.model.get_property_value_by_name("list_type")) return false;
		if ("numeric" === pagination || "arrows" === pagination) {
			this.model.set_property("offset", 1, true); // This is always 1 if we're paginating
			this.hide_offset_field();
		} else {
			this.show_offset_field();
		}
	},

	show_offset_field: function () {
		var $field = this.$el.find('input[name="offset"]').closest(".upfront-field-wrap-number");
		$field.show();
	},

	hide_offset_field: function () {
		var $field = this.$el.find('input[name="offset"]').closest(".upfront-field-wrap-number");
		$field.hide();
	},

	populate_shared_tax_generic_items: function () {
		var display_type = this.model.get_property_value_by_name("display_type"),
			me = this;
			
		if ("list" === display_type) {
			this.populate_limit_items();
		}

		if ("list" === display_type) {
			this.fields.push(new Upfront.Views.Editor.Field.Select({
				model: this.model,
				property: "sticky",
				label: l10n.sticky_posts,
				values: [
					{label: l10n.sticky_ignore, value: ""},
					{label: l10n.sticky_prepend, value: "prepend"},
					{label: l10n.sticky_exclude, value: "exclude"}
				],
				change: function(value) {
					me.model.set_property("sticky", value);
					me.trigger('setting:changed');
				}
			}));
		}
		this.fields.push(new Upfront.Views.Editor.Field.Radios({
			model: this.model,
			label: l10n.result_length,
			property: "content",
			layout: "horizontal-inline",
			values: [
				{label:l10n.excerpt, value:"excerpt"},
				{label:l10n.full_post, value:"content"}
			],
			change: function(value) {
				me.model.set_property("content", value);
				me.trigger('setting:changed');
			}
		}));
	},

	update_terms: function () {
		var me = this, taxonomy;

		this.fields.each(function (field) {
			if ("term" === field.property_name) return true;
			field.property.set({'value': field.get_value()}, {'silent': false});
		});

		taxonomy = this.model.get_property_value_by_name("taxonomy");
		if (!taxonomy) return false;

		if (this._terms_cache[taxonomy]) {
			var terms = this._terms_cache[taxonomy];
			return this._spawn_terms_element(terms);
		}

		Upfront.Util.post({
			"action": "upfront_postslists-terms",
			"taxonomy": taxonomy}
		).success(function (terms) {
			var term_values = [];
			_(terms.data).each(function (label, id) {
				term_values.push({label: label, value: id});
			});
			me._terms_cache[taxonomy] = term_values;
			me._spawn_terms_element(term_values);
		});
	},

	_spawn_terms_element: function (terms) {
		var field = new Upfront.Views.Editor.Field.Chosen_Select({
			model: this.model,
			label: l10n.term,
			compact: true,
			property: "term",
			values: terms,
			default_value: this.model.get_property_value_by_name('term'),
			change: this._set_term_value
		});

		var display_type = this.model.get_property_value_by_name("display_type"),
			index = "list" === display_type ? 4 : 3 // "single" has one field less (limit)
		;

		this.fields._wrapped[index] = field;
		this.$el.empty();
		this.render();
	},

	/**
	 * Internal value setter
	 *
	 * Used as taxonomy term chosen picker.
	 */
	_set_term_value: function () {
		var term = this.get_value();
		this.model.set_property("term", term);
		this.trigger('setting:changed');
	}

});

var ThumbnailSettings = Upfront.Views.Editor.Settings.Item.extend({
	className: 'upfront-settings-item upfront-thumbnail-size',

	events: function () {
		return _.extend({},
			Upfront.Views.Editor.Settings.Item.prototype.events
		);
	},

	initialize: function (opts) {
		this.options = opts;
		this.was_changed = false;
		this.populate_thumbnail_size_options();
		Upfront.Events.once('element:settings:saved', this.save_custom_thumbnail_sizes, this);
	},

	render: function () {
		Upfront.Views.Editor.Settings.Item.prototype.render.call(this);

	},

	populate_thumbnail_size_options: function () {
		var size = this.model.get_property_value_by_name('thumbnail_size'),
			me = this
		;

		this.fields = _([]);

		this.fields.push(new Upfront.Views.Editor.Field.Select({
			model: this.model,
			className: 'upfront-field-wrap upfront-field-wrap-radios upfront-thumbnail-size-choices',
			property: 'thumbnail_size',
			label: '',
			layout: 'horizontal',
			values: [
				{label: l10n.thumbnail_size_thumbnail, value: 'thumbnail'},
				{label: l10n.thumbnail_size_medium, value: 'medium'},
				{label: l10n.thumbnail_size_large, value: 'large'},
				{label: l10n.thumbnail_size_post_feature, value: 'uf_post_featured_image'},
				{label: l10n.thumbnail_size_custom, value: 'uf_custom_thumbnail_size'}
			],
			change: function (value) {
				me.was_changed = true;
				me.model.set_property('thumbnail_size', value);
				me.trigger('setting:changed');
				me.populate_thumbnail_size_options();
			}
		}));

		if ( 'uf_custom_thumbnail_size' === size ) this.populate_thumbnail_custom_sizes();

		if ( me.was_changed ) {
			this.$el.empty();
			this.render();
		}


	},

	populate_thumbnail_custom_sizes: function () {
		var me = this;

		this.fields.push(new Upfront.Views.Editor.Field.Number({
			model: this.model,
			className: 'upfront-field-wrap upfront-field-wrap-number upfront-thumbnail-custom-width',
			property: 'custom_thumbnail_width',
			label: l10n.thumbnail_size_custom_width,
			min: 1,
			change: function (value) {
				me.model.set_property('custom_thumbnail_width', value);
				me.trigger('setting:changed');
			}
		}));

		this.fields.push(new Upfront.Views.Editor.Field.Number({
			model: this.model,
			className: 'upfront-field-wrap upfront-field-wrap-number upfront-thumbnail-custom-height',
			property: 'custom_thumbnail_height',
			label: l10n.thumbnail_size_custom_height,
			min: 1,
			change: function (value) {
				me.model.set_property('custom_thumbnail_height', value);
				me.trigger('setting:changed');
			}
		}));
	},

	save_custom_thumbnail_sizes: function () {
		var me = this,
			size = this.model.get_property_value_by_name('thumbnail_size'),
			width = this.model.get_property_value_by_name('custom_thumbnail_width'),
			height = this.model.get_property_value_by_name('custom_thumbnail_height')
		;

		if ( 'uf_custom_thumbnail_size' === size ) {
			var saveData = {
				action: 'upfront_add_custom_thumbnail_size',
				thumbnail_size: JSON.stringify({
					name: size,
					thumbnail_width: width,
					thumbnail_height: height
				})
			};
			Upfront.Util.post(saveData);
		}
	}

});


Panels.PostParts = PresetManager.extend({
	initialize: function () {
		var data_type_idx = 'upfront_post_data_posts',
			data_type_defaults = {},
			elementDefaults
		;
		// Include default settings from Upfront.mainData
		if(typeof Upfront.mainData.presetDefaults['postslist_element'] !== "undefined") {
			elementDefaults = _.extend(data_type_defaults, Upfront.mainData.presetDefaults['postslist_element']);
		}

		_.extend(this, {
			mainDataCollection: 'postslistsPresets',
			styleElementPrefix: 'postslists-preset',
			ajaxActionSlug: 'postslists',
			styleTpl: PostsLists_Modules.template,
			presetDefaults: Upfront.mainData.presetDefaults.postslists,
			renderRequiredFields: [
				'gravatar-use',
				'author-display-name',
				'author-link',
				'author-target',
				'gravatar-size',
				'featured-image-size',
				'featured-custom-width',
				'featured-custom-height',
				'feature-resize',
				'comments-hide-if-empty',
				'content-type',
				'content-length',
				'tags-display-type',
				'tags-show-max',
				'tags-separate',
				'category-display-type',
				'category-show-max',
				'category-separate',
				'predefined-date-format',
				'php-date-format'
			]
		});

		PresetManager.prototype.initialize.apply(this, arguments);

		// Re-render required
		this.listenTo(this.model, 'preset:updated:rerender', function () {
			this.model.get("objects").trigger("change");
		}, this);

		this.listenTo(this.model, 'preset:updated', function () {
			Upfront.Events.trigger('posts:element:preset:updated');
		}, this);

		// HACK!!! Force element type so the css editor works
		Upfront.Application.cssEditor.elementTypes.PostDataModel = Upfront.Application.cssEditor.elementTypes.PostDataModel || {id: 'posts', label: 'Posts'};
	},
	setupItems: function () {
		var me = this;
		var preset = this.clear_preset_name(this.model.decode_preset() || 'default');
		this.preset_model = this.presets.findWhere({id: preset});

		// So what do we do when we don't have the appropriate preset model?
		if (!this.preset_model) {
			// Why, spawn the default, of course!
			preset = 'default';
			this.property('preset', preset);
			this.preset_model = this.presets.findWhere({id: preset});
		}

		PresetManager.prototype.setupItems.apply(this, arguments);
		
		// Make sure we update hidden objects on preset change
		if (this.selectPresetModule) this.listenTo(this.selectPresetModule, 'upfront:presets:change', function () {
			this.update_parts();
		}, this);
		
		// Add wrappers
		var element_wrapper = new Modules['element_wrapper']({ model: this.preset_model, className: 'upfront-posts-part part-module-panel upfront-posts-wrapper', removable: false, panel: 'wrapper'}),
			post_wrapper = new Modules['post_wrapper']({ model: this.preset_model, className: 'upfront-posts-part part-module-panel upfront-posts-wrapper', removable: false, panel: 'wrapper'});
		
		this.settings.push(element_wrapper);
		this.settings.push(post_wrapper);
		
		var post_parts = this.preset_model.get('enabled_post_parts') || [];

		_.each(post_parts, function (panel, idx) {
			var pnl = new Modules['part_' + panel]({
				model: this.preset_model,
				className: 'upfront-posts-part part-module-panel upfront-posts-module',
				panel: panel
			});

			var me = this;
			this.listenTo(pnl, "update:preset", function (part_type, enable) {
				this.update_parts();
				this.updatePreset(this.preset_model.toJSON()); // Update: actually *still* needed, because presets aren't necessarily being saved on preset save...
				this.render();
			}, this);

			this.settings.push(pnl);
		}, this);
		
		setTimeout( function() {
			me.wrap_modules();
			me.add_module();
		}, 150);
	},
	
	wrap_modules: function() {
		//Move Edit Preset to bottom
		this.$el.find('.upfront-settings-css').parent().append(this.$el.find('.upfront-settings-css'));

		// Wrap wrappers
		this.$el.find( ".upfront-posts-wrapper" ).wrapAll( "<div class='upfront-post-wrappers' />");
		this.$el.find( ".upfront-post-wrappers" ).prepend("<span class='upfront-post-wrapper-title'>" + l10n.modules.wrappers_label + "</span>");
		
		// Make sure we always have upfront-posts-module
		if(this.$el.find( ".upfront-posts-module").length === 0) {
			this.$el.find('.upfront-post-wrappers').after("<div class='upfront-posts-module'></div>");
		}
		
		// Wrap modules
		this.$el.find( ".upfront-posts-module" ).wrapAll( "<div class='upfront-post-modules' />");
		this.$el.find( ".upfront-post-modules" ).prepend("<span class='upfront-post-wrapper-title'>" + l10n.modules.modules_label + "</span>");
	},
	
	add_module: function() {
		var me = this;
		var add_button = new Upfront.Views.Editor.Field.Select({
			model: this.model,
			className: 'upfront-add-post-module',
			property: "post_parts",
			multiple: false,
			values: this.get_unused_modules(me.preset_model),
			show: function() {
				
			},
			change: function(value) {
				me.add_post_part(value);
				me.render();
			}
		});

		add_button.render();
		this.$el.find( ".upfront-post-wrappers" ).prepend(add_button.$el);
	},

	add_post_part: function (part) {
		var enabled_post_parts = this.preset_model.get('enabled_post_parts') || [];
		enabled_post_parts.push(part);
		this.preset_model.set('enabled_post_parts', enabled_post_parts);
		this.updatePreset(this.preset_model.toJSON());
		this.update_parts();
	},
	
	get_unused_modules: function(preset) {
		var post_parts = this.model.get_property_value_by_name('post_parts'),
			enabled_post_parts = preset.get('enabled_post_parts') || [],
			unused_parts = [];

		_.each(post_parts, function (part) {
			if(enabled_post_parts.indexOf(part) === -1) {
				unused_parts.push({ value: part, label: l10n['modules'][part + '_title'] });
			}
		});
		
		if(typeof $sortable !== "undefined") {
			$sortable.sortable({
				start: function (e, ui) {
					$sortable.disableSelection();
				},
				stop: function (e, ui) {
					var parts = $sortable.sortable('toArray', {attribute: 'data-part'});
					me.model.set_property(me.options.property, parts, false);
					$sortable.enableSelection();
				}
			});
		}
		
		return unused_parts;
	},
	
	getTitle: function() {
		return 'Presets';
	},

	update_parts: function () {
		var me = this,
			preset_model = this.preset_model,
			enabled_parts = preset_model.get("enabled_post_parts") || [],
			parts = this.model.get_property_value_by_name("post_parts") || [],
			breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled(),
			active_breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON()
		;
		_.each(parts, function (part) {
			me.update_object(part, enabled_parts.indexOf(part) >= 0);
		});
		
		if  ( active_breakpoint['default'] ) {
			// Also update the responsive part
			_.each(breakpoints, function (breakpoint) {
				breakpoint = breakpoint.toJSON();
				var breakpoint_presets = me.property("breakpoint_presets");
				if ( breakpoint['default'] ) return;
				if ( !breakpoint_presets ) return;
				if ( !(breakpoint.id in breakpoint_presets) || !('preset' in breakpoint_presets[breakpoint.id]) ) return;
				var preset = breakpoint_presets[breakpoint.id].preset,
					preset_model = me.presets.findWhere({id: preset}),
					enabled_parts = preset_model.get("enabled_parts") || []
				;
				_.each(parts, function (part) {
					me.update_object(part, enabled_parts.indexOf(part) >= 0, breakpoint);
				});
			});
		}
		this.model.get("objects").trigger("change");
	},

	has_object: function (type) {
		return ( this.find_object(type) ? true : false );
	},

	find_object: function (type) {
		var objects = this.model.get('objects');
		if ( !objects ) return false;
		return objects.find(function(object){
			var part_type = object.get_property_value_by_name('part_type');
			if ( type == part_type ) return true;
			return false;
		});
	},

	find_wrapper: function (object) {
		var wrappers = this.model.get('wrappers'),
			wrapper_id = object.get_wrapper_id()
		;
		return wrappers.get_by_wrapper_id(wrapper_id);
	},

	update_object: function (type, enable, breakpoint) {
		enable = !!enable;
		breakpoint = breakpoint ? breakpoint : Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON();
		var objects = this.model.get('objects'),
			wrappers = this.model.get('wrappers'),
			object = this.find_object(type)
		;
		if ( breakpoint['default'] ) {
			// Default breakpoint, actually add/remove objects
			if ( !object && enable ) {
				var wrapper_id = Upfront.Util.get_unique_id("wrapper"),
					wrapper = new Upfront.Models.Wrapper({
						properties: [
							{ name: 'wrapper_id', value: wrapper_id },
							{ name: 'class', value: 'c24 upostslist-object clr' }
						]
					})
				;
				object = new Upfront.Models.PostsListsPartModel({
					properties: [
						{ name: 'view_class', value: 'PostsListsPartView' },
						{ name: 'part_type', value: type },
						{ name: 'has_settings', value: 0 },
						{ name: 'class', value: 'c24 upfront-posts-part' },
						{ name: 'wrapper_id', value: wrapper_id }
					]
				});
				wrappers.add(wrapper, {silent: true});
				objects.add(object);
			}
			else if ( object && !enable ) {
				var object_view = Upfront.data.object_views[object.cid];
				object_view.parent_view.on_entity_remove(null, object_view);
			}
		}
		else {
			// On responsive, just hide/show available object
			if ( object ) {
				object.set_breakpoint_property('hide', (enable ? 0 : 1), false, breakpoint);
			}
		}
	}
});

Util.generatePresetsToPage('postslists', PostsLists_Modules.template);

return Panels;

});
})(jQuery);
