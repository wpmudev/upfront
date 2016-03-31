(function ($) {
define([
	'text!elements/upfront-posts/tpl/views.html',
	'elements/upfront-posts/js/post-list-settings-parts',
	'scripts/upfront/element-settings/root-settings-panel'
], function(tpl, Parts, RootSettingsPanel) {

var l10n = Upfront.Settings.l10n.posts_element;
var $template = $(tpl);

Upfront.Util.post({
	"action": "upfront_posts-data"
}).success(function (initialData) {
	Panels._initial = initialData.data;
}); // End response wrap


var Panels = {
	_initial: {}
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
				model: this.model,
			}),
			autorefresh = function (value) {
				this.model.set_property(this.options.property, value);
				if ('list_type' === this.options.property) {
					query.dispatch_settings();
				}
				me.trigger("settings:dispatched");
			},
			display_type = new Upfront.Views.Editor.Field.Radios({
				model: this.model,
				property: 'display_type',
				label: l10n.display_type_label,
				layout: 'horizontal-inline',
				icon_class: 'upfront-posts-display_type',
				values: [
					{label: l10n.single_post, value: 'single', icon: 'upfront-posts-single'},
					{label: l10n.post_list, value: 'list', icon: 'upfront-posts-list'}
				]
			}),
			list_type = new Upfront.Views.Editor.Field.Radios({
				model: this.model,
				property: 'list_type',
				label: l10n.list_type_label,
				layout: 'horizontal',
				values: [
					{label: l10n.post_list_custom, value: 'custom'},
					{label: l10n.post_list_tax, value: 'taxonomy'},
					{label: l10n.post_list_generic, value: 'generic'}
				]
			})
		;
		display_type.on("changed", autorefresh);
		list_type.on("changed", autorefresh);
		query.on("post:added", function () {
			this.trigger("post:added");
		}, this);
		query.on("post:removed", function () {
			this.trigger("post:removed");
		}, this);
		this.settings = _([
			new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: l10n.query_settings,
				fields: [display_type, list_type]
			}),
			query
		]);
	},
	
	title: l10n.general_settings
});

var CustomSelectorField =  Upfront.Views.Editor.Field.Hidden.extend({
	events: function () {
		return _.extend({},
			Upfront.Views.Editor.Field.Hidden.prototype.events,
			{"click a[href=#add]": "select_posts"},
			{"click ol li a[href=#rmv]": "remove_post"}
		);
	},
	get_field_html: function () {
		var field = Upfront.Views.Editor.Field.Hidden.prototype.get_field_html.apply(this),
			values = this.get_decoded_values(this.options.property),
			is_single = 'single' === this.model.get_property_value_by_name('display_type'),
			string = values.length ? l10n.add_custom_post : l10n.select_custom_post
		;
		if (is_single) {
			string = l10n.select_custom_post;
			if (values) values = [_(values).first()];
		}
		field += '<i class="upfront-posts-custom-add_post"></i> <a href="#add">' + string + '</a>';
		if (_.isArray(values) && values.length > 0) {
			field += '<ol>';
			_.each(values, function (value) {
				if (!value) return false;
				field += '<li><span class="permalink">' + value.permalink + '</span><a href="#rmv" data-id="' + value.id + '"><i>&times;</i></a></li>';
			});
			field += '</ol>';
		}

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
					is_single = 'single' === me.model.get_property_value_by_name('display_type'),
					values = me.get_decoded_values(me.options.property)
				;
				if (is_single) {
					values = [{id: id, permalink: link}];
				} else {
					values.push({id: id, permalink: link});
					me.select_posts(e);
				}
				me.model.set_property(me.options.property, me.encode_values(values));
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
			property: 'posts_list',
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
		var taxs = [], types = [];
		var display_type = this.model.get_property_value_by_name("display_type");
		_(Panels._initial.taxonomies).each(function (label, type) {
			taxs.push({label: label, value: type});
		});
		_(Panels._initial.post_types).each(function (label, type) {
			types.push({label: label, value: type});
		});

		this.fields = _([]);

		if ("list" === display_type) {
			this.populate_pagination_items();
			this.fields.push(new Upfront.Views.Editor.Field.Number({
				model: this.model,
				label: l10n.offset,
				property: "offset",
				min: 1,
				max: 20
			}));
		}
		this.fields.push(new Upfront.Views.Editor.Field.Select({
			model: this.model,
			label: l10n.post_type,
			property: "post_type",
			values: types
		}));
		this.fields.push(new Upfront.Views.Editor.Field.Select({
			model: this.model,
			label: l10n.taxonomy,
			property: "taxonomy",
			values: taxs
		}));
		this.fields.push(new Upfront.Views.Editor.Field.Chosen_Select({
			model: this.model,
			label: l10n.term,
			compact: true,
			property: "term",
			values: [{label:l10n.select_tax, value:"", disabled: true}]
		}));
		this.populate_shared_tax_generic_items();
		this.once("rendered", this.update_terms, this);
		this.once("rendered", function () {
			this.toggle_offset_based_on_pagination_value(this.model.get_property_value_by_name("pagination"));
		}, this);
	},

	populate_pagination_items: function () {
		var display_type = this.model.get_property_value_by_name("display_type"),
			me = this
		;
		if ("list" === display_type) {
			this.fields.push(new Upfront.Views.Editor.Field.Radios({
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
		var display_type = this.model.get_property_value_by_name("display_type");
		if ("list" === display_type) {
			this.fields.push(new Upfront.Views.Editor.Field.Number({
				model: this.model,
				label: l10n.limit,
				property: "limit",
				min: 1,
				max: 20
			}));
			this.fields.push(new Upfront.Views.Editor.Field.Radios({
				model: this.model,
				property: "sticky",
				label: l10n.sticky_posts,
				values: [
					{label: l10n.sticky_ignore, value: ""},
					{label: l10n.sticky_prepend, value: "prepend"},
					{label: l10n.sticky_exclude, value: "exclude"},
				]
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
			]
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
			"action": "upfront_posts-terms",
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
			default_value: this.model.get_property_value_by_name('term')
		});
		this.fields._wrapped[4] = field;
		this.$el.empty();
		this.render();
	}

});






Panels.PostParts = RootSettingsPanel.extend({
	title: l10n.post_part_settings,
	
	initialize: function (opts) {
		this.options = opts;
		var me = this,
			parts = _.map(Upfront.data.upfront_posts.default_parts, function (part) {
				return {label: l10n['part_' + part], value: part}
			}),
			sorter = new SortSettings({
				model: this.model
			}),
			autorefresh = function (value) {
				this.model.set_property(this.options.property, this.get_value());
				this.model.set_property("post_parts", this.get_value(), false);
				me.trigger("settings:dispatched");
			},
			post_parts = new Upfront.Views.Editor.Field.Checkboxes({
				model: this.model,
				property: 'enabled_post_parts',
				layout: 'horizontal-inline',
				values: parts
			})
		;
		post_parts.on("changed", autorefresh, post_parts);
		this.settings = _([
			new PostPartsPickerSettings({
				model: this.model,
				title: l10n.post_parts_picker,
				fields: [post_parts]
			}),
			sorter
		]);
	},
});

var PostPartsPickerSettings = Upfront.Views.Editor.Settings.Item.extend({
	className: 'uposts-parts-picker-setting'
});

var SortSettings = Upfront.Views.Editor.Settings.Item.extend({
	group: false,
	initialize: function (opts) {
		this.options = opts;
		this.fields = _([
			new SortSettings_Sorter({
				model: this.model,
				property: "post_parts",
				label: l10n.post_parts_sorter
			})
		]);
	}
});

var SortSettings_Sorter = Upfront.Views.Editor.Field.Hidden.extend({
	render: function () {
		Upfront.Views.Editor.Field.Hidden.prototype.render.apply(this);
		this.$el.append('<ul class="post_parts"></ul>');
		var me = this,
			enabled_parts = this.model.get_property_value_by_name("enabled_post_parts"),
			saved_parts = this.model.get_property_value_by_name(this.options.property),
			parts = [],
			$sortable = this.$el.find("ul")
		;

		parts = saved_parts && saved_parts.length
			? saved_parts
			: enabled_parts
		;

		_.each(parts, function (part, idx) {
			if (enabled_parts.indexOf(part) < 0) return true; // This one is disabled, move on
			var pt = Parts.get_part(part, me.model);
			pt.render();
			$sortable.append(pt.$el);
		});
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
	},
	get_value: function () {
		return this.model.get_property_value_by_name(this.options.property);
	}
});

return Panels;

});
})(jQuery);
