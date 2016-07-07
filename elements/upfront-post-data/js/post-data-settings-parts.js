(function ($, undefined) {
define([
	'text!elements/upfront-post-data/tpl/views.html',
	'scripts/redactor/ueditor-inserts',

	/**
	 * @todo Refactor this to a different, shared location
	 */
	'elements/upfront-posts/js/post-list-meta-views'
], function(tpl, Inserts, Meta) {

var l10n = Upfront.Settings.l10n.post_data_element;
var $template = $(tpl);


var Parts = {
	Part: Backbone.View.extend({
		tagName: 'li',
		tpl: {
			top: _.template($template.filter("#part-options-part_visible").html()),
			label: _.template($template.filter("#part-options-part_label").html()),
			action: _.template($template.filter("#part-options-part_action").html()),
			wrapper: _.template($template.filter("#part-options-part_wrapper").html())
		},
		initialize: function (opts) {
			var me = this;
			this.options = opts;
			this.enable_field = new Upfront.Views.Editor.Field.Checkboxes({
				default_value: this.has_object(this.options.part) ? 1 : 0,
				multiple: false,
				values: [
					{label: l10n['part_' + this.options.part], value: '1'}
				],
				change: function () {
					me.update_object(this.get_value());
				}
			});
			this.set_options();
		},
		set_options: function () {},
		render: function () {
			this.$el
				.empty()
				.attr('data-part', this.options.part)
				.append(
					this.tpl.top({l10n: l10n})
				)
			;
			var $root = this.$el.find(".name_action_wrapper");
			this.enable_field.render();
			$root
				.append(
					$( this.tpl.label({part: {name: l10n['part_' + this.options.part]}, l10n: l10n}) )
						.prepend(this.enable_field.el)
				)
				.append(
					this.tpl.action({l10n: l10n})
				)
			;
			this.get_options();
		},
		get_options: function () {
			this.$el.append(
				this.tpl.wrapper({part: {part: this.options.part}, l10n: l10n})
			);
			var $root = this.$el.find('div.' + this.options.part + '-options'),
				$option = $root.find(".option"),
				$action = this.$el.find(".part_action a"),
				me = this
			;

			// Render field (if any)
			if (this.field) {
				this.field.render();
				this.field.on("changed", function (value) {
					me.model.set_property(me.field.options.property, value);
				}, this);
				$option.append(this.field.$el);
			}

			$action.off('click').on("click", function (e) {
				e.preventDefault();
				e.stopPropagation();
				if (!$root.is(":visible")) {
					$root.show();
					me.$el.addClass("active");
				} else {
					$root.hide();
					me.$el.removeClass("active");
				}
				return false;
			});

			$root.find(".edit_part a").on("click", function (e) {
				e.preventDefault();
				e.stopPropagation();
				me.spawn_editor();
				return false;
			});

			$root.hide();
		},
		spawn_editor: function () {
			var me = this,
				tpl_name = 'post-part-' + this.options.part,
				template = this.model.get_property_value_by_name(tpl_name),
				embed_object = ('meta' === this.options.part ? Meta.Embed : Inserts.inserts.embed),
				//editor = new Inserts.inserts.embed({data: {code: template}})
				editor = new embed_object({data: {code: template}, model: this.model})
			;
			editor
				.start()
				.done(function (view, code) {
					me.model.set_property(tpl_name, code);
				})
			;
		},

		_stored_object_index: false,
		_stored_object: false,
		_stored_wrapper: false,
		has_object: function (type) {
			return ( this.find_object(type) ? true : false );
		},
		find_object: function (type) {
			var objects = this.model.get('objects');
			if ( !objects )
				return false;
			return objects.find(function(object){
				var part_type = object.get_property_value_by_name('part_type');
				if ( type == part_type )
					return true;
				return false;
			});
		},
		find_wrapper: function (object) {
			var wrappers = this.model.get('wrappers'),
				wrapper_id = object.get_wrapper_id();
			return wrappers.get_by_wrapper_id(wrapper_id);
		},
		update_object: function (enable) {
			enable = 1 === enable;
			var objects = this.model.get('objects'),
				wrappers = this.model.get('wrappers')
			;
			if ( enable ) {
				if ( this._stored_object !== false && this._stored_wrapper !== false ) {
					wrappers.add(this._stored_wrapper, {silent: true});
					this._stored_object.add_to(objects, this._stored_object_index);
					this._stored_object = false;
					this._stored_object_index = false;
					this._stored_wrapper = false;
				}
				else {
					var wrapper_id = Upfront.Util.get_unique_id("wrapper"),
						wrapper = new Upfront.Models.Wrapper({
							properties: [
								{ name: 'wrapper_id', value: wrapper_id },
								{ name: 'class', value: 'c24' }
							]
						}),
						object = new Upfront.Models.PostDataPartModel({
							properties: [
								{ name: 'view_class', value: 'PostDataPartView' },
								{ name: 'part_type', value: this.options.part },
								{ name: 'has_settings', value: 0 },
								{ name: 'class', value: 'c24 upfront-post-data-part' },
								{ name: 'wrapper_id', value: wrapper_id }
							]
						});
					wrappers.add(wrapper, {silent: true});
					objects.add(object);
				}
			}
			else {
				this._stored_object = this.find_object(this.options.part);
				this._stored_object_index = objects.indexOf(this._stored_object);
				this._stored_wrapper = this.find_wrapper(this._stored_object);
				wrappers.remove(this._stored_wrapper, {silent: true});
				objects.remove(this._stored_object);
			}
		}
	}),

	Options: Backbone.View.extend({

		render: function () {
			this.$el.empty();
			var me = this;
			_.each(this.fields, function (field) {
				field.on("changed", function (value) {
					me.model.set_property(field.options.property, value);
				}, this);
				field.render();
				me.$el.append(field.$el);
			});
		}
	})
};

Parts.Part_Author = Parts.Part.extend({});
Parts.Part_Title = Parts.Part.extend({});
Parts.Part_Read_more = Parts.Part.extend({});

Parts.Part_Meta = Parts.Part.extend({});

Parts.Part_Date_posted = Parts.Part.extend({
	set_options: function () {
		this.field = new Upfront.Views.Editor.Field.Text({
			model: this.model,
			label: l10n.format,
			label_style: 'inline',
			property: "date_posted_format"
		});
	}
});

Parts.Part_Categories = Parts.Part.extend({
	set_options: function () {
		this.field = new Upfront.Views.Editor.Field.Number({
			model: this.model,
			label: l10n.max_categories,
			label_style: 'inline',
			property: "categories_limit"
		});
	}
});

Parts.Part_Tags = Parts.Part.extend({
	set_options: function () {
		this.field = new Upfront.Views.Editor.Field.Number({
			model: this.model,
			label: l10n.max_tags,
			label_style: 'inline',
			property: "tags_limit"
		});
	}
});

Parts.Part_Comment_count = Parts.Part.extend({
	set_options: function () {
		this.field = new Upfront.Views.Editor.Field.Checkboxes({
			model: this.model,
			property: "comment_count_hide",
			values: [
				{label: l10n.hide_comments, value: '1'}
			]
		});
	}
});

Parts.Part_Comments = Parts.Part.extend({
	set_options: function () {
		this.field = new Options.Comments({model: this.model});
	}
});

Parts.Part_Content = Parts.Part.extend({
	set_options: function () {
		Upfront.data.upfront_post_data.split_allowed = typeof Upfront.data.upfront_post_data.split_allowed === typeof undefined
			? false
			: Upfront.data.upfront_post_data.split_allowed
		;
		var allowed = this.model.get_property_value_by_name("allow_splitting");
		if (allowed) Upfront.data.upfront_post_data.split_allowed = true;

		this.field = new Options.Content({model: this.model});
	}
});

Parts.Part_Featured_image = Parts.Part.extend({
	set_options: function () {
		this.field = new Options.Featured({model: this.model});
	}
});

Parts.Part_Gravatar = Parts.Part.extend({
	set_options: function () {
		this.field = new Upfront.Views.Editor.Field.Number({
			model: this.model,
			label: l10n.size_px,
			label_style: 'inline',
			property: "gravatar_size"
		});
	}
});

var Options = {

	Content: Parts.Options.extend({
		initialize: function () {
			var global_split = Upfront.data.upfront_post_data.split_allowed
				? '1'
				: 0
			;

			this._allow_splitting_field = new Upfront.Views.Editor.Field.Checkboxes({
				model: this.model,
				property: "allow_splitting",
				default_value: global_split,
				values: [{ label: 'Allow content splitting', value: '1' }]
			});
			this._content_part_field = new Upfront.Views.Editor.Field.Number({
				model: this.model,
				label: "Content part",
				default_value: 0,
				label_style: 'inline',
				property: "content_part"
			});

			this.fields = [
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					label: l10n.limit_words,
					label_style: 'inline',
					property: "content_length"
				}),
				this._allow_splitting_field,
				this._content_part_field
			];

			this.listenTo(this._allow_splitting_field, "changed", this.update_fields);
		},
		render: function () {
			Parts.Options.prototype.render.call(this);
			this.update_fields();
		},
		update_fields: function () {
			var allow_splitting = this._allow_splitting_field.get_value();

			if (allow_splitting && allow_splitting.length) {
				Upfront.data.upfront_post_data.split_allowed = true; // yeah, so keep track of this
				this._content_part_field.$el.show();
			} else {
				this._content_part_field.$el.hide();
			}
		}
	}),

	Featured: Parts.Options.extend({
		initialize: function () {
			this.fields = [
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					property: "full_featured_image",
					multiple: false,
					values: [
						{label: 'Show Full-Size featured image', value: '1'}
					]
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					property: "fallback_option",
					multiple: false,
					values: [
						{label: 'Hide region', value: 'hide'},
						{label: 'Use this color', value: 'color'},
						{label: 'Use default image', value: 'image'}
					]
				}),
				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					property: "fallback_color",
					label: "Fallback Color"
				}),
				new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: "fallback_image",
					label: "Fallback Image"
				})
			];
		}
	}),

	Comments: Parts.Options.extend({
		initialize: function () {
			var post_specific = Upfront.data.upfront_post_data.post_data,
				comments = (post_specific || {comments: {}}).comments,
				disabled = (comments || {disable: []}).disable,
				fields = []
			;

			this.model.set_property("disable", disabled);

			this._fld_disable = new Upfront.Views.Editor.Field.Checkboxes({
				model: this.model,
				property: "disable",
				label: "For this post:",
				values: [
					{label: 'Disable comments', value: 'comments'},
					{label: 'Disable trackbacks', value: 'trackbacks'}
				]
			});

			fields.push(this._fld_disable);
			fields.push(
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					property: "disable_showing",
					label: "Do not show:",
					values: [
						{label: 'Comments', value: 'comments'},
						{label: 'Trackbacks', value: 'trackbacks'}
					]
				})
			);

			// Pagination fields
			var paginated = (Upfront.data || {upfront_post_data_comments: {paginated: 0}}).upfront_post_data_comments.paginated;
			if (paginated && parseInt(paginated, 10)) {
				fields.push(
					new Upfront.Views.Editor.Field.Number({
						model: this.model,
						property: "limit",
						label: 'Comments per page'
					})
				);
			}

			// Order/orderby fields
			fields.push(
				new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					property: "order",
					label: "Order by:",
					values: [
						{label: 'Date', value: 'comment_date_gmt'},
						{label: 'Karma', value: 'comment_karma'},
						{label: 'Parent', value: 'comment_parent'}
					]
				})
			);
			fields.push(
				new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					property: "direction",
					label: "Direction:",
					values: [
						{label: 'Oldest first', value: 'ASC'},
						{label: 'Newest first', value: 'DESC'}
					]
				})
			);

			// Append the discussion settings view also, depending on privs...

			this.fields = fields;

			this.listenTo(this._fld_disable, "changed", this.send_update_request);
		},
		send_update_request: _.debounce(function () {
			var disabled = this._fld_disable.get_value();
			Upfront.Util.post({
				action: 'upfront-post_data-comments-disable',
				post_id: _upfront_post_data.post_id,
				disable: disabled
			});
		}, 3000)
	})
};

// Let's go with loading up the post-specific settings right away
Upfront.data.upfront_post_data.post_data = {}; // Set up the defaults
Upfront.Util.post({
	action: 'upfront-post_data-post-specific',
	post_id: _upfront_post_data.post_id
}).done(function (response) {
	Upfront.data.upfront_post_data.post_data = "data" in response
		? response.data
		: {}
	;
});

return {
	get_part: function (pt, model) {
		pt = pt || 'Part';
		var part = false,
			class_name = 'Part_' + pt.substr(0,1).toUpperCase() + pt.substr(1),
			pt_view = Parts[class_name] ? Parts[class_name] : Parts.Part
		;
		part = new pt_view({model: model, part: pt});
		return part;
	}
};

});
})(jQuery);
