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

	init: function () {
		this.listenTo(Upfront.Events, 'csseditor:open', this.on_csseditor_open);
		this.listenTo(Upfront.Events, 'csseditor:closed', this.on_csseditor_closed);
	},

	on_render: function () {
		var pluginLayout = Upfront.Application.is_plugin_layout();
		if (pluginLayout) {
			this.$el.find(".upfront-object-content").empty().append('<div>This content is handled by ' + pluginLayout.pluginName + '.</div>');
			return;
		}

		var type = this.model.get_property_value_by_name("display_type");
		this.render_type_view(type);
		// Let's not render min-height (remove it)
		if ( type && Views.DEFAULT != type ) {
			this.$el.find('> .upfront-object').css('min-height', '');
			this.parent_module_view.$el.find('> .upfront-module').css('min-height', '');
			this.add_region_class('upfront-region-container-has-posts', true);
		}
	},

	render_type_view: function (type) {
		type = type || Views.DEFAULT;
		var me = this,
			view = Views[type]
			? new Views[type]({model: this.model})
			: new Views[Views.DEFAULT]({model: this.model})
		;
		view.element = this;
		view.render();
		this.$el.find(".upfront-object-content").empty().append(view.$el);
		if ( view._posts_load ){
			view._posts_load.success(function(){
				me.adjust_featured_images();
				Upfront.Events.trigger('entity:object:refresh', me);
			});
		}
	},

	on_csseditor_open: function (id) {
		if ( id != this.model.get_element_id() ) return;
		this.listenTo(Upfront.Application.cssEditor, 'updateStyles', this.adjust_featured_images);
	},

	on_csseditor_closed: function (id) {
		if ( id != this.model.get_element_id() ) return;
		this.stopListening(Upfront.Application.cssEditor, 'updateStyles');
	},

	adjust_featured_images: function () {
		this.$el.find('.thumbnail').each(function(){
			var height = $(this).height(),
				width = $(this).width(),
				$img = $(this).find('img'),
				img_h, img_w;
			if ( $(this).attr('data-resize') == "1" ) {
				$img.css({ height: "", width: "" });
				img_h = $img.height();
				img_w = $img.width();
				if ( height/width > img_h/img_w )
					$img.css({ height: '100%', width: 'auto', marginLeft: (width-Math.round(height/img_h*img_w))/2, marginTop: "" });
				else
					$img.css({ height: 'auto', width: '100%', marginLeft: "", marginTop: (height-Math.round(width/img_w*img_h))/2 });
			}
			else {
				img_h = $img.height();
				if ( height != img_h )
					$img.css('margin-top', (height-img_h)/2);
			}
		});
	},

	cleanup: function () {
		this.remove_region_class('upfront-region-container-has-posts', true);
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
	"Settings": PostsSettings,
	cssSelectors: {
		'.uposts-object ul': {label: l10n.css.container_label, info: l10n.css.container_info},
		'.uposts-object li': {label: l10n.css.post_label, info: l10n.css.post_info},
		'.uposts-object li .date_posted': {label: l10n.css.date_label, info: l10n.css.date_info},
		'.uposts-object li .author': {label: l10n.css.author_label, info: l10n.css.author_info},
		'.uposts-object li .post_categories': {label: l10n.css.categories_label, info: l10n.css.categories_info},
		'.uposts-object li .comment_count': {label: l10n.css.comment_count_label, info: l10n.css.comment_count_info},
		'.uposts-object li .content': {label: l10n.css.content_label, info: l10n.css.content_info},
		'.uposts-object li .gravatar': {label: l10n.css.gravatar_label, info: l10n.css.gravatar_info},
		'.uposts-object li .read_more': {label: l10n.css.read_more_label, info: l10n.css.read_more_info},
		'.uposts-object li .post_tags': {label: l10n.css.post_tags_label, info: l10n.css.post_tags_info},
		'.uposts-object li .thumbnail': {label: l10n.css.thumbnail_label, info: l10n.css.thumbnail_info},
		'.uposts-object li .title': {label: l10n.css.title_label, info: l10n.css.title_info}
	},
	cssSelectorsId: Upfront.data.upfront_posts.type
});
Upfront.Models.PostsModel = PostsModel;
Upfront.Views.PostsView = PostsView;


});
}(jQuery));
