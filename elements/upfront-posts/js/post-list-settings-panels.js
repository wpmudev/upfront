(function ($) {
define([
	'text!elements/upfront-posts/tpl/views.html'
], function(tpl) {

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

Panels.General = Upfront.Views.Editor.Settings.Panel.extend({

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
				values: [
					{label: l10n.single_post, value: 'single'},
					{label: l10n.post_list, value: 'list'}
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

	get_label: function () {
		return l10n.general;
	},

	get_title: function () {
		return l10n.general;
	}
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
		field += '<a href="#add">' + string + '</a>';
		if (values) {
			field += '<ol>';
			_.each(values, function (value) {
				if (!value) return false;
				field += '<li>' + value.permalink + '<a href="#rmv" data-id="' + value.id + '"><i>&times;</i></a></li>';
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
				if (is_single) values = [{id: id, permalink: link}];
				else values.push({id: id, permalink: link});
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

	dispatch_settings: function () {
		var type = this.model.get_property_value_by_name('list_type');
		if ('custom' === type) this.populate_custom_items();
		else if ('taxonomy' === type) this.populate_tax_items();
		else this.fields = _([]);
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

	populate_tax_items: function () {
		var taxs = [];
		var display_type = this.model.get_property_value_by_name("display_type");
		_(Panels._initial.taxonomies).each(function (label, type) {
			taxs.push({label: label, value: type});
		});

		this.fields = _([]);

		if ("list" === display_type) {
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
			label: l10n.taxonomy,
			property: "taxonomy",
			values: taxs
		}));
		this.fields.push(new Upfront.Views.Editor.Field.Select({
			model: this.model,
			label: l10n.term,
			property: "term",
			values: [{label:l10n.select_tax, value:"", disabled: true}]
		}));
		if ("list" === display_type) {
			this.fields.push(new Upfront.Views.Editor.Field.Number({
				model: this.model,
				label: l10n.limit,
				property: "limit",
				min: 1,
				max: 20
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
				]
			}));
		}
	},

	update_terms: function () {
		var me = this, taxonomy;

		this.fields.each(function (field) {
			field.property.set({'value': field.get_value()}, {'silent': false});
		});

		taxonomy = this.model.get_property_value_by_name("taxonomy");
		if (!taxonomy) return false;
		Upfront.Util.post({
			"action": "upfront_posts-terms",
			"taxonomy": taxonomy}
		).success(function (terms) {
			var term_values = [];
			_(terms.data).each(function (label, id) {
				term_values.push({label: label, value: id});
			});
			me.fields._wrapped[1] = new Upfront.Views.Editor.Field.Select({
				model: me.model,
				label: l10n.term,
				property: "term",
				values: term_values
			});
			me.$el.empty();
			me.render();
		});
	},

});






Panels.PostParts = Upfront.Views.Editor.Settings.Panel.extend({

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
				me.trigger("settings:dispatched");
			},
			post_parts = new Upfront.Views.Editor.Field.Checkboxes({
				model: this.model,
				property: 'enabled_post_parts',
				layout: 'horizontal-inline',
				title: l10n.post_parts_picker,
				values: parts
			})
		;
		post_parts.on("changed", autorefresh, post_parts);
		this.settings = _([
			new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				fields: [post_parts]
			}),
			sorter
		]);
	},

	get_label: function () {
		return l10n.post_parts;
	},

	get_title: function () {
		return l10n.post_parts;
	}
});

var SortSettings = Upfront.Views.Editor.Settings.Item.extend({
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
	get_field_html: function () {
		var label = this.get_label_html(),
			field = '',
			parts = this.model.get_property_value_by_name("enabled_post_parts")
		;
		_.each(parts, function (part, idx) {
			field += '<li data-part="' + part + '"><span>' + l10n['part_' + part] + '</span></li>'
		});
		return '<ul class="post_parts">' + field + '</ul>';
	},
	render: function () {
		Upfront.Views.Editor.Field.Hidden.prototype.render.apply(this);
		var me = this,
			$sortable = this.$el.find("ul")
		;
		$sortable.sortable({
			stop: function (e, ui) {
				var parts = $sortable.sortable('toArray', {attribute: 'data-part'});
				me.model.set_property(me.options.property, parts);
			}
		});
		$sortable.disableSelection();
	}
});

return Panels;

});
})(jQuery);