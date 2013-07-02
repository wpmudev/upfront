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
		this.init_property("class", "c22");
		this.init_property("has_settings", 0);
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
	titleSelector: 'h1.post_title',
	contentSelector: '.post_content',


	initialize: function(){
		var me = this,
			postType = Upfront.Settings.LayoutEditor.newpostType ? Upfront.Settings.LayoutEditor.newpostType : 'post',
			post = false
		;
		Upfront.Views.ObjectView.prototype.initialize.call(this);

		this.loading = this.get_post_content().done(function(response){
			me.content = response.data.filtered;
		});


		post = new Upfront.Models.Post({id: _upfront_post_data.post_id, post_type: postType});
		
		if(!Upfront.data.loading.post)
			Upfront.data.loading.post = {};

		Upfront.data.loading.post[_upfront_post_data.post_id] = post.fetch().done(function(response){
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
		console.log('this_post');
		if(content && this.post){
			content = $(content)
				.find(this.titleSelector).html(this.post.get('post_title')).end()
				.find(this.contentSelector).html(this.post.get('post_content')).end()
			;
			return content.clone().wrap('<p/>').parent().html();
		}
		return 'Hold on please';
	},

	on_render: function () {
		var me = this;

		if (!this.content)
			this.loading.done(function(response){
				me.render();
			});

		//Upfront.Application.ContentEditor.stop();
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
				"post_type": Upfront.Settings.LayoutEditor.newpostType
			})
		});
	},

	on_edit: function (e) {
		var me = this;

		// Hacky way of closing other instances
		if ($("#upfront-post-cancel_edit").length) {
			$("#upfront-post-cancel_edit").trigger("click");
		}

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
	stop_editor: function () {
		this.updatePost();

		Upfront.Events.off("entity:deactivated", this.stop_editor, this);

		this.on_cancel();
		Upfront.Application.ContentEditor.stop();
	},
	on_save: function () {
		this.undelegateEvents();
		// Re-enable the draggable on edit stop
		this.parent_module_view.$el.find('.upfront-editable_entity:first').draggable('enable');
		this.delegateEvents();
		this.render();
	},
	on_cancel: function () {
		var $parent = this.parent_module_view.$el.find('.upfront-editable_entity:first');
		this.undelegateEvents();
		this.deactivate();
		if (CKEDITOR.instances['upfront-body']) CKEDITOR.instances['upfront-body'].destroy(); // Clean up the editor.
		// Re-enable the draggable on edit stop
		if ($parent.is(".ui-draggable")) $parent.draggable('enable');
		this.delegateEvents();
		this.render();
	},
	editPost: function (post, e) {
		var me = this,
			content = this.content,
			$title = this.$el.find(this.titleSelector),
			$body = this.$el.find(this.contentSelector),
			$parent = me.parent_module_view.$el.find('.upfront-editable_entity:first')
		;

		if(Upfront.data.currentPost != post){
			Upfront.data.currentPost = post;
			Upfront.Events.trigger("data:current_post:change");			
		}

		//Wait to the post to be fetched
		if(!this.content)
			return this.loading.done(function(){
				me.editPost(post,e);
			})
		;

		$title.html('<input type="text" id="upfront-title" style="width:100%" value="' + $title.text() + '"/>');
		$body.html(
			'<input type="hidden" name="post_id" id="upfront-post_id" value="' + post.id + '" />' +
			'<div contenteditable="true" id="upfront-body" rows="8" style="width:100%">' + post.get('post_content') + '</div>' +
			'<button type="button" id="upfront-post-cancel_edit">Cancel</button>'
		);
		this.applyStyles($title);
		// Prevent default events, we're in editor mode.
		me.undelegateEvents();
		// Kill the draggable, so we can work with regular inline editor.
		if ($parent.is(".ui-draggable")) $parent.draggable('disable');


		CKEDITOR.inline('upfront-body');

		$body.find('#upfront-body').off('focus')
			.on('focus', function(){
				$('#cke_upfront-body').show();
			})
			.off('blur')
			.on('blur', function(){
				$('#cke_upfront-body').hide();
			})
		;

		$body
			.find("#upfront-body").focus().end()
			.find("#upfront-post-cancel_edit").on("click", function () {
				me.stop_editor();
			})
		;
		Upfront.Application.ContentEditor.run();

		Upfront.Events.on("entity:deactivated", this.stop_editor, this);
	},
	applyStyles: function ($element) {
		var styles = window.getComputedStyle ? window.getComputedStyle($element[0]) : $element[0].currentStyle,
			transform = !window.getComputedStyle
		;
		if(styles){
			$element.children().css({
				background: 'transparent',
				border: 0,
				'font-weight': styles[this.toCamelCase('font-weight', transform)],
				'font-size': styles[this.toCamelCase('font-size', transform)],
				'font-family': styles[this.toCamelCase('font-family', transform)],
				'color': styles.color,
				'outline': 0,
				margin:0,
				padding: 0
			});
		}
	},
	toCamelCase: function(str, transform) {
		if(!transform)
			return str;
		return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase() });
	},
	updatePost: function() {
		var $title = this.$('#upfront-title'),
			$content =  this.$('#upfront-body')
		;
		if($title.length)
			this.post.set('post_title', $title.val());
		if($content.length)
			this.post.set('post_content', $content.html());
	}
});


/**
 * Editor command class - this will be injected into commands
 * and allow adding the new entity instance to the work area.
 * @type {Upfront.Views.Editor.Command}
 */
var ThisPostElement = Upfront.Views.Editor.Sidebar.Element.extend({
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

// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.
Upfront.Application.LayoutEditor.add_object("ThisPost", {
	"Model": ThisPostModel,
	"View": ThisPostView,
	"Element": ThisPostElement
});
Upfront.Models.ThisPostModel = ThisPostModel;
Upfront.Views.ThisPostView = ThisPostView;
	
})(jQuery);