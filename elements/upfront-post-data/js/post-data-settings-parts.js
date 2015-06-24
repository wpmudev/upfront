(function ($) {
define([
	'text!elements/upfront-post-data/tpl/views.html',
	'scripts/redactor/ueditor-inserts'/*,
	'elements/upfront-posts/js/post-list-meta-views'*/
], function(tpl, Inserts/*, Meta*/) {

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
			var enable = ( enable == 1 ),
				objects = this.model.get('objects'),
				wrappers = this.model.get('wrappers');
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

Parts.Part_Content = Parts.Part.extend({
	set_options: function () {
		this.field = new Content_Options({model: this.model});
	}
});

Parts.Part_Featured_image = Parts.Part.extend({
	set_options: function () {
		this.field = new Upfront.Views.Editor.Field.Checkboxes({
			model: this.model,
			property: "full_featured_image",
			multiple: false,
			values: [
				{label: 'Show Full-Size featured image', value: '1'}
			]
		});
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

var Content_Options = Parts.Options.extend({

	initialize: function () {
		this.fields = [
			new Upfront.Views.Editor.Field.Number({
				model: this.model,
				label: l10n.limit_words,
				label_style: 'inline',
				property: "content_length"
			}),
			new Upfront.Views.Editor.Field.Number({
				model: this.model,
				label: "Content part",
				default_value: 0,
				label_style: 'inline',
				property: "content_part"
			})
		];
	}
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
