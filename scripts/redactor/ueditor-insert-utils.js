;(function($){

define([
	'text!scripts/redactor/ueditor-templates.html'
], function (tpls) {

var l10n = Upfront.mainData.l10n.global.ueditor;

var BasicImageVariants =  _([
	{ vid: "center", label: "Center"  },
	{ vid: "left", label: "Left"  },
	{ vid: "right", label: "Right"  }
]);

var ImageStylesView = Backbone.View.extend({

	tpl: _.template($(tpls).find('#image-style-tpl').html()),

	events: {
		'change input[type=radio]': 'update_data',
		'click input[type=radio]': 'on_click'
	},

	initialize: function (options) {
		this.data = new Backbone.Model();
		this.listenTo(this.data, 'change', this.render);
		this.data.set("variants", BasicImageVariants.toArray() );
		this.data.set( "selected", options.get('variant_id') ? options.get('variant_id') : "center" );

	},

	render: function () {
		this.$el.html(
			this.tpl({
				data: this.data.toJSON()
			})
		);
		return this;
	},

	on_click: function (e) {
		e.stopPropagation();
	},

	update_data: function (e) {
		e.stopPropagation();
		this.variant_id = $(e.target).val();
		this._style = BasicImageVariants.findWhere({vid : this.variant_id});
	}
});

var LinkView = Backbone.View.extend({

	tpl: _.template($(tpls).find('#image-link-tpl').html()),

	events: {
		'change input[type=radio]': 'update_data'
	},

	initialize: function (opts) {
		if (opts.data) {
			this.model = new Backbone.Model(opts.data);
			this.listenTo(this.model, 'change', this.render);
		}
	},

	render: function () {
		this.$el.width('200px');

		var data = this.model.toJSON();
		data.checked = 'checked="checked"';
		this.$el.html(this.tpl(data));
	},

	update_data: function (e) {
		var me = this,
			type = this.$('input:checked').val(),
			url = this.$('#uinsert-image-link-url').val()
		;

		if (type == 'post') {
			var selectorOptions = {postTypes: this.post_types()};
			Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function (post){
				me.model.set({linkType: 'post', linkUrl: post.get('permalink')});
				// Also trigger an event to propagate our selection.
				// This is so the inline link dialog doesn't have to be
				// re-opened in order for user to *click* OK to apply
				me.trigger("post:selected");
			});
		} else {
			this.model.set({linkType: type, linkUrl: url});
		}
	},

	post_types: function () {
		var types = [];
		_.each(Upfront.data.ugallery.postTypes, function(type){
			if (type.name != 'attachment') {
				types.push({name: type.name, label: type.label});
			}
		});
		return types;
	}
});

var PostImageStylesView = Backbone.View.extend({

	events: {
		//'change input[type=radio]': 'update_data',
		//'click input[type=radio]': 'on_click'
	},

	initialize: function (options) {
		this.data = new Backbone.Model();
		this.data.set( "variants", Upfront.Content.ImageVariants.toJSON());
		this.data.set( "selected", options.get('variant_id') );
	},

	prepare_values: function () {
		var self = this,
			values = []
		;
		_.each(this.data.get("variants"), function(val, index){
			values.push({ value: val.vid, label: val.label });
		});
		return values;
	},

	get_default_value: function () {
		return this.data.get("selected");
	},

	render: function () {
		var self = this,
			select = new  Upfront.Views.Editor.Field.Select({
				className: 'upfront-field-wrap upfront-field-wrap-image-style-variant',
				label: l10n.choose_image_insert,
				name: "uf_image_style_variants",
				default_value: this.get_default_value(),
				multiple: false,
				values: this.prepare_values(),
				change: function(variant_id){
					self._style = Upfront.Content.ImageVariants.findWhere({vid : variant_id});
					self.data.set("selected", variant_id);
				}
			})
		;

		select.render();
		this.$el.html(select.$el);

		return this;
	},

	on_click: function (e) {
		e.stopPropagation();
	}
});

var WP_PostImageStylesView = Backbone.View.extend({

	className: "upfront-wp-image-style-variants",

	tpl: _.template(
		$(tpls).find('#wp-image-style-tpl').html()
	),

	events: {
		'click .upfront-icon-wp-image-style': 'update_data'
	},

	get_alignments: function () {
	  return [
		  { id: "alignleft",  label: l10n.align_left, icon: 'upfront-icon-wp-image-style-alignleft' },
		  { id: "aligncenter",  label: l10n.align_center, icon: 'upfront-icon-wp-image-style-aligncenter' },
		  { id: "alignright",  label: l10n.align_right, icon: 'upfront-icon-wp-image-style-alignright' },
		  { id: "alignnone",  label: l10n.align_none, icon: 'upfront-icon-wp-image-style-alignnone' }
	  ];
	},

	initialize: function (model) {
		this.data = new Backbone.Model();
		this.data.set("variants", this.get_alignments());
		this.listenTo(this.data, 'change', this.render);
		this.data.set(
			"selected", 
			(this.model.get('variant_id') || this.model.get('style').wrapper.alignment)
		);
	},

	get_default_value: function () {
		return this.data.get("selected");
	},

	render: function () {
		this.$el.html(
			this.tpl({
				data: this.data.toJSON()
			})
		);
		return this;
	},

	on_click: function (e) {
		e.stopPropagation();
	},

	update_data: function (e) {
		e.preventDefault();
		var $selected = $(e.target),
			selected = $selected.data("id")
		;

		this.data.set("selected", selected);
		this.model.set("variant_id", selected);
	}
});

return {
	LinkView: LinkView,
	ImageStylesView: ImageStylesView,
	PostImageStylesView: PostImageStylesView,
	WP_PostImageStylesView: WP_PostImageStylesView,
	BasicImageVariants: BasicImageVariants
};

//End Define
});
})(jQuery);
