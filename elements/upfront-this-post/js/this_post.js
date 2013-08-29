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
			if (me.post.get("is_new")) {
				var type = me.post.get("post_type") || 'post';
				_upfront_post_data.layout = {
					specificity: "single-" + type + "-" + me.post.id,
					item: "single-" + type,
					type: "single"
				};
			}

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


		// Allow select-edit tiggering
		/*
		me.$el.find(".post_content")
			.off("mouseover.upfront-select_to_edit").on("mouseover.upfront-select_to_edit", function () {
				me.$el.closest(".upfront-editable_entity").draggable('disable');
			})
			.off("mouseout.upfront-select_to_edit").on("mouseout.upfront-select_to_edit", function () {
				me.$el.closest(".upfront-editable_entity").draggable('enable');
				flag = false;
			})
			.on("mousedown.upfront-select_to_edit", function () {
				flag = false;
				$(this).on("mousemove", function () {
					flag = true;
					return false;
				})
				.on("mouseup.upfront-select_to_edit", function (e) {
					if (flag) me.on_edit();
					return false;
				});
			})
		;
		*/

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

		// Break select-editing trigger
		/*
		this.$el
			.off("mouseover.upfront-select_to_edit")
			.off("mouseout.upfront-select_to_edit")
			.off("mousedown.upfront-select_to_edit")
		;
		*/

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
/*
		if (window.getSelection) {
			var rng = window.getSelection().getRangeAt(0),
				str_content = $body.text(),
				selection = rng.extractContents().textContent,
				cnt = 0,
				limit = str_content.indexOf(selection),
				begin = []
			;
			$.each(str_content.split(' '), function (idx, str) {
				cnt += str.length;
				if (cnt > limit) return false;
				begin.push(str);
			});
			this.dom_range = {
				start: begin.length,
				end: selection.split(' ').length + begin.length
			};
		}
*/
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
		$title.html((post.get("is_new")
			? '<input type="text" id="upfront-title" style="width:100%" value="" placeholder="' + $title.text() + '"/>'
			: '<input type="text" id="upfront-title" style="width:100%" value="' + $title.text() + '"/>'
		));
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


		var editor = CKEDITOR.inline('upfront-body', {
			floatSpaceDockedOffsetY: 62 + $title.height()
		});
		if (post.get("is_new")) {
			editor.on("contentDom", function (e) {
				var editable = e.editor.element,
					range = e.editor.createRange()
				;
				range.selectNodeContents(editable);
				range.select();
			});
		}
		// Apply buffered selection
		/*
		if (this.dom_range) {
console.log(this.dom_range)
			CKEDITOR.instances['upfront-body'].on('instanceReady', function (e) {
				//var ck_range = new CKEDITOR.dom.range(e.editor.document);
				var sel = e.editor.getSelection(),
					rng = sel.getRanges(),
					ck_range = rng[0]
				;
				ck_range.setStart(e.editor.document.getActive().getFirst(), me.dom_range.start);
				ck_range.setEnd(e.editor.document.getActive().getFirst(), me.dom_range.end);
				e.editor.getSelection().selectRanges([ck_range]);
			});
		}
		*/

		$body.find('#upfront-body').closest(".upfront-editable_entity").off('focus')
			.on('focus', function (e) {
				$('#cke_upfront-body').show();
			})
			.off('blur')
			.on('blur', function (e) {
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
		var $title = this.$(this.titleSelector).find(":text"),
			$content =  this.$(this.contentSelector).find("#upfront-body")
		;
		this.post.set({is_new: false}, {silent: true});
		if($title.length)
			this.post.set('post_title', $title.val());
		if($content.length)
			this.post.set('post_content', Upfront.Media.Transformations.apply($content.html()));
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