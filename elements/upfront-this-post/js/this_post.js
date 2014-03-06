(function ($) {
define(function() {
/**
 * Define the model - initialize properties to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var ThisPostModel = Upfront.Models.ObjectModel.extend({
	/**
	 * The init function is called after the contructor and Model intialize.
	 * Here the default values for the model properties are set.
	 */
	init: function () {
		var properties = _.clone(Upfront.data.thisPost.defaults);
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var ThisPostView = Upfront.Views.ObjectView.extend({
	changed: false,
	markup: false,
	loading: false,
	postId: false,
	editor: false,

	initialize: function(options){
		if(! (this.model instanceof ThisPostModel)){
			this.model = new ThisPostModel({properties: this.model.get('properties')});
		}
		this.constructor.__super__.initialize.call(this, [options]);

		this.postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;
	},

	/**
	 * Element contents markup.
	 * @return {string} Markup to be shown.
	 */
	get_content_markup: function () {
		if(this.changed || !this.markup){
			this.refreshMarkup();
			return 'Loading';
		}

		return this.markup;
	},
/*
	on_render: function(){
		var me = this;
		//Give time to append when dragging.
		setTimeout(function(){
			me.updateEditor($('#' + me.property('element_id')).find(".upfront-object-content"));
		}, 100);
	},
*/
	on_edit: function () {
		console.log('Start editing');
		this.updateEditor($('#' + this.property('element_id')).find(".upfront-object-content"));
		this.editor.editTitle();
	},

	refreshMarkup: function () {
		var me = this;

		if(this.postId === false)
			return new $.Deferred().resolve({data:{filtered: 'Error'}});


		var node = $('#' + me.property('element_id')).find(".upfront-object-content"),
			loading = !node.length ? false : new Upfront.Views.Editor.Loading({
				loading: "Refreshing post ...",
				done: "Here we are!",
				fixed: false
			})
		;

		if(loading){
			loading.render();
			node.append(loading.$el);
		}

		return Upfront.Util.post({
				action: "this_post-get_markup",
				data: JSON.stringify({
					post_id: this.postId,
					post_type: Upfront.Settings.LayoutEditor.newpostType,
					properties: {post_data: this.property("post_data")}
				})
			}).success(function(response){
				if(loading){
					loading.done();
					loading = false;
				}
				var node = node || $('#' + me.property('element_id')).find(".upfront-object-content");
				me.markup = response.data.filtered;
				node.html(me.get_content_markup());
				//me.updateEditor(node); // This is where the edit mode autorun happens, don't run this.

// Whatever is down here is a dead code now
				var post = Upfront.data.posts[me.postId];
				if(post && post.is_new){
					// Remove post title on new post so that the ueditor placeholder can kick in
					// @TODO not working :/
					_.each(Upfront.data.ueditor.selectors, function (s) {
						if ( s.type == 'title' )
							node.find(s.selector).html('');
					});
					me.updateEditor(node); // Only for the new posts.
					me.editor.editTitle();
					me.editor.post.is_new = false;
					me.editor.post.on('editor:publish', function () {
						me.redirectPostEdit(me.editor.post);
					});
					me.editor.post.on('editor:draft', function () {
						if ( Upfront.Settings.Application.MODE.ALLOW.indexOf(Upfront.Settings.Application.MODE.LAYOUT) == -1 || confirm("Do you want to re-load in layout mode?") )
							me.redirectPostEdit(me.editor.post);
					});
				}
			})
		;
	},

	redirectPostEdit: function (post) {
		//window.location = Upfront.Settings.Content.edit.post + post.id;
		var path = '/edit/' + post.get('post_type') + '/' + post.id;
		Upfront.Application.navigate(path, {trigger: true});
		if ( Upfront.Settings.Application.MODE.ALLOW.indexOf(Upfront.Settings.Application.MODE.LAYOUT) != -1 )
			Upfront.Application.set_current(Upfront.Settings.Application.MODE.LAYOUT);
	},

	updateEditor: function(node){
		var me = this;

		if(this.editor) {
			return this.editor.updateElement(node);
		}

		this.editor = new Upfront.Content.editor({
			editor_id: 'this_post_' + this.postId,
			post_id: this.postId,
			preload: true,
			node: node,
			content_mode: 'post_content',
			view: me,
			autostart: true,
			onUpdated: function(post){
				me.refreshMarkup(post);
			}
		});
	},

	on_element_edit_start: function (edit, post) {
		if ( edit == 'write' && this.parent_module_view){
			if ( post.id != this.postId )
				this.parent_module_view.disable();
			else
				this.parent_module_view.$el.find('.upfront-module').addClass('upfront-module-editing');
		}
	},

	on_element_edit_stop: function (edit, post) {
		if(this.parent_module_view){
			this.parent_module_view.$el.find('.upfront-module').removeClass('upfront-module-editing');
			this.parent_module_view.enable();
		}
	},

	/*
	Shorcut to set and get model's properties.
	*/
	property: function(name, value, silent) {
		if(typeof value != "undefined"){
			if(typeof silent == "undefined")
				silent = true;
			return this.model.set_property(name, value, silent);
		}
		return this.model.get_property_value_by_name(name);
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
			{label: "Comments count", value: "comments_count"},
			{label: "Featured image", value: "featured_image"}
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
	label: "This post",
	initialize: function () {
		this.settings = _([
			new Settings_PostPanel_PostData({model: this.model})
		]);
	},

	get_label: function () {
		return this.label;
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

Upfront.data.thisPost.PostDataPanel = Settings_PostPanel;


});
})(jQuery);
