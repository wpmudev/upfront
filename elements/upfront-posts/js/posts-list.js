(function ($) {
define([
	'text!elements/upfront-posts/tpl/views.html',
	'elements/upfront-posts/js/post-list-views',
	'elements/upfront-posts/js/post-list-settings'
], function(tpl, Views, PostsSettings) {

var l10n = Upfront.Settings.l10n.posts_element;
var $template = $(tpl);


var PostsModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = Upfront.data.upfront_posts
			? _.clone(Upfront.data.upfront_posts)
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});


var PostsView = Upfront.Views.ObjectView.extend({

	on_render: function () {
		var type = this.model.get_property_value_by_name("display_type");
		this.render_type_view(type);
	},

	render_type_view: function (type) {
		type = type || Views.DEFAULT;
		var view = Views[type] 
			? new Views[type]({model: this.model}) 
			: new Views[Views.DEFAULT]({model: this.model})
		;
		view.element = this;
		view.render();
		this.$el.find(".upfront-object-content").empty().append(view.$el);
	}
});


var PostsElement = Upfront.Views.Editor.Sidebar.Element.extend({

	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-posts');
		this.$el.html(l10n.element_name);
	},

	add_element: function () {

		var object = new PostsModel(),
			module = new Upfront.Models.Module({
				name: "",
				properties: [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c24 upfront-posts_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": Upfront.Util.height_to_row(210)}
				],
				objects: [object]
			})
		;
		this.add_module(module);
	}
});


Upfront.Application.LayoutEditor.add_object("Uposts", {
	"Model": PostsModel,
	"View": PostsView,
	"Element": PostsElement,
	"Settings": PostsSettings
});
Upfront.Models.PostsModel = PostsModel;
Upfront.Views.PostsView = PostsView;


});
}(jQuery));