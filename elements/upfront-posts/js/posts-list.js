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

	cssSelectors: {
		'.uposts-object ul': {label: l10n.css.container_label, info: l10n.css.container_info},
		'.uposts-object li.uf-post': {label: l10n.css.post_label, info: l10n.css.post_info},
		'.uposts-object li.uf-post .date_posted': {label: l10n.css.date_label, info: l10n.css.date_info},
		'.uposts-object li.uf-post .author': {label: l10n.css.author_label, info: l10n.css.author_info},
		'.uposts-object li.uf-post .post_categories': {label: l10n.css.categories_label, info: l10n.css.categories_info},
		'.uposts-object li.uf-post .comment_count': {label: l10n.css.comment_count_label, info: l10n.css.comment_count_info},
		'.uposts-object li.uf-post .content': {label: l10n.css.content_label, info: l10n.css.content_info},
		'.uposts-object li.uf-post .gravatar': {label: l10n.css.gravatar_label, info: l10n.css.gravatar_info},
		'.uposts-object li.uf-post .read_more': {label: l10n.css.read_more_label, info: l10n.css.read_more_info},
		'.uposts-object li.uf-post .post_tags': {label: l10n.css.post_tags_label, info: l10n.css.post_tags_info},
		'.uposts-object li.uf-post .thumbnail': {label: l10n.css.thumbnail_label, info: l10n.css.thumbnail_info},
		'.uposts-object li.uf-post .title': {label: l10n.css.title_label, info: l10n.css.title_info},
	},

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