(function ($) {
define([
	'text!elements/upfront-posts/tpl/views.html',
	'scripts/redactor/ueditor-inserts',
	'elements/upfront-posts/js/post-list-meta-views'
], function(tpl, Inserts, Meta) {

var l10n = Upfront.Settings.l10n.posts_element;
var $template = $(tpl);


var Parts = {
	Part: Backbone.View.extend({
		tagName: 'li',
		tpl: {
			top: _.template($template.filter("#part-options-part_visible").html()),
			name: _.template($template.filter("#part-options-part_name").html()),
			action: _.template($template.filter("#part-options-part_action").html()),
			wrapper: _.template($template.filter("#part-options-part_wrapper").html())
		},
		initialize: function (opts) {
			this.options = opts;
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
			$root
				.append(
					this.tpl.name({part: {name: l10n['part_' + this.options.part]}, l10n: l10n})
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
				editor = new embed_object({data: {code: template}, model: this.model})
			;
			editor
				.start()
				.done(function (view, code) {
					me.model.set_property(tpl_name, code);
				})
			;

			// Zero timeout, just shift off the queue
			setTimeout(function () {
				var manager = editor.get_manager ? editor.get_manager() : {};
				if (!manager.done) return false;
				// Listen to event
				return me.listenTo(Upfront.Events, 'element:settings:saved', function () {
					return manager.done();
				});
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
		this.field = new Upfront.Views.Editor.Field.Number({
			model: this.model,
			label: l10n.limit_words,
			label_style: 'inline',
			property: "content_length"
		});
	}
});

Parts.Part_Featured_image = Parts.Part.extend({
	set_options: function () {
		this.field = new Upfront.Views.Editor.Field.Checkboxes({
			model: this.model,
			property: "resize_featured",
			values: [
				{label: l10n.resize_to_fit, value: '1'}
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
