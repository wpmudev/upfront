(function ($) {


/**
 * Define the model - initialize properties to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var ThisPostModel = Upfront.Models.ObjectModel.extend({
	/**
	 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
	 * Used for setting up instance defaults, initialization and the like.
	 */
	init: function () {
		this.init_property("type", "ThisPostModel");
		this.init_property("view_class", "ThisPostView");

		this.init_property("element_id", Upfront.Util.get_unique_id("this_post-object"));
		this.init_property("class", "c22 upfront-this_post");
		this.init_property("has_settings", 1);
	}
});

/**
 * View instance - what the element looks like.
 * @type {Upfront.Views.ObjectView}
 */
var ThisPostView = Upfront.Views.ObjectView.extend({
	post: false,
	content: false,
	loading: false,
	titleSelector: Upfront.data.this_post && Upfront.data.this_post.title_selector ? Upfront.data.this_post.title_selector : 'h1.post_title',
	contentSelector: Upfront.data.this_post && Upfront.data.this_post.content_selector ? Upfront.data.this_post.content_selector : '.post_content',


	initialize: function(){
		var me = this,
			postType = Upfront.Settings.LayoutEditor.newpostType ? Upfront.Settings.LayoutEditor.newpostType : 'post',
			post = false
		;
		Upfront.Views.ObjectView.prototype.initialize.call(this);

		this.loading = this.get_post_content().done(function(response){
				me.content = response.data.filtered;
			})
			.fail(function(response){
				console.log(response);
			})
		;


		post = new Upfront.Models.Post({id: _upfront_post_data.post_id, post_type: postType});
		
		if(!Upfront.data.loading.post)
			Upfront.data.loading.post = {};

		Upfront.data.loading.post[_upfront_post_data.post_id] = post.fetch({post_type: postType}).done(function(response){
			me.post = post;
			/*
			$(document).data("upfront-post-" + me.post.id, me.post);
			$(document).data("upfront-post-current", me.post);
			*/

			Upfront.data.currentPost = post;
			if(!Upfront.data.posts)
				Upfront.data.posts = {};
			Upfront.data.posts[post.id] = post;

			Upfront.Events.trigger("data:current_post:change");
			_upfront_post_data.post_id = me.post.id;

			me.render();
			Upfront.Events.trigger("elements:this_post:loaded", me);
		});
	},

	/**
	 * Element contents markup.
	 * @return {string} Markup to be shown.
	 */
	get_content_markup: function () {
		var content = this.content;
		if(content && this.post){
			content = $('<div>').html(content)
				.find(this.titleSelector).html(this.post.get('post_title')).end()
				.find(this.contentSelector).html(this.post.get('post_content')).end()
			;
			return content.html();
		}
		return 'Hold on please';
	},

	on_render: function () {
		var me = this;

		if (!this.content)
			this.loading.done(function(response){
				me.render();
			});

		// Kill the module removal button
		this.parent_module_view.$el.find(".upfront-entity-delete_trigger").remove();

		this.trigger("rendered", this);
	},

	get_post_content: function () {
		var postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;

		if(postId === false)
			return new $.Deferred().resolve({data:{filtered: 'Error'}});

		return Upfront.Util.post({
			"action": "this_post-get_markup",
			"data": JSON.stringify({
				"post_id": postId,
				"post_type": Upfront.Settings.LayoutEditor.newpostType,
				"properties": {post_data:this.model.get_property_value_by_name("post_data")}
			})
		});
	},

	on_edit: function (e) {
		var me = this;

		console.log('Edit post');

		if(!this.post){
			this.post = new Upfront.Model.Post({id: _upfront_post_data.post_id});
			this.post.fetch().done(function(response){
				Upfront.data.currentPost = post;
				Upfront.Events.trigger("data:current_post:change");
				me.editPost(me.post, e);
			});
		}
		else
			this.editPost(this.post, e);
	},
	on_save: function () {
		var editor = Upfront.Content.editors.get(this.model.get_property_value_by_name("element_id"));
		editor.stop();
	},
	on_cancel: function () {
		var editor = Upfront.Content.editors.get(this.model.get_property_value_by_name("element_id"));
		editor.stop();
	},
	editPost: function (post, e) {
		var editor = Upfront.Content.editors.add({
			type: Upfront.Content.TYPES.POST,
			editor_id: this.model.get_property_value_by_name("element_id"),
			view: this,
			post: post,
			selectors: {
				title: this.titleSelector,
				body: this.contentSelector
			}
		});
		editor.start(e);
	},
	updatePost: function() {
		var editor = Upfront.Content.editors.get(this.model.get_property_value_by_name("element_id")),
			title = editor.get_title ? editor.get_title() : false,
			content = editor.get_content ? editor.get_content() : false
		;
		if (editor) {
			this.post.set({is_new: false}, {silent: true});
			if (title) this.post.set('post_title', title);
			if (content) this.post.set('post_content', Upfront.Media.Transformations.apply(content));
			editor.stop();
		}
	}
});


/**
 * Editor command class - this will be injected into commands
 * and allow adding the new entity instance to the work area.
 * @type {Upfront.Views.Editor.Command}
 */
var ThisPostElement = Upfront.Views.Editor.Sidebar.Element.extend({

	draggable: false,

	/**
	 * Set up command appearance.
	 */
	render: function () {
		this.$el.html('This Post');
	},

	/**
	 * What happens when user clicks the command?
	 * We're instantiating a module with search entity (object), and add it to the workspace.
	 */
	add_element: function () {
		var object = new ThisPostModel(), // Instantiate the model
			// Since search entity is an object,
			// we don't need a specific module instance -
			// we're wrapping the search entity in 
			// an anonymous general-purpose module
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-this_post_module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object // The anonymous module will contain our search object model
				]
			})
		;
		// We instantiated the module, add it to the workspace
		this.add_module(module);
	}
});

var Settings_PostPanel_PostData = Upfront.Views.Editor.Settings.Item.extend({
	initialize: function () {
		var data = [
			{label: "Post Author", value: "author"},
			{label: "Post Date", value: "date"},
			{label: "Categories", value: "categories"},
			{label: "Tags", value: "tags"},
			{label: "Comments count", value: "comments_count"}
		];
		this.fields = _([
			new Upfront.Views.Editor.Field.Checkboxes({
				model: this.model,
				label: "Show the following Post Data:",
				property: "post_data",
				values: data
			})
		]);
	},
	get_title: function () {
		return "Post Data";
	}
});

var Settings_PostPanel = Upfront.Views.Editor.Settings.Panel.extend({

	initialize: function () {
		this.settings = _([
			new Settings_PostPanel_PostData({model: this.model})
		]);
	},

	get_label: function () {
		return "This post";
	},

	get_title: function () {
		return "Post settings";
	}
});

var Settings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function () {
			this.panels = _([
				new Settings_PostPanel({model: this.model})
			]);
		},
		
		get_title: function () {
			return "Post settings";
		}
	});

// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.
Upfront.Application.LayoutEditor.add_object("ThisPost", {
	Model: ThisPostModel,
	View: ThisPostView,
	Element: ThisPostElement,
	Settings: Settings
});
Upfront.Models.ThisPostModel = ThisPostModel;
Upfront.Views.ThisPostView = ThisPostView;
	
})(jQuery);