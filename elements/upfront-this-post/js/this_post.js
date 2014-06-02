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
		console.log('This post');
		if(! (this.model instanceof ThisPostModel)){
			this.model = new ThisPostModel({properties: this.model.get('properties')});
		}
		this.constructor.__super__.initialize.call(this, [options]);

		_.extend(this.events, {
			'click .upfront-post-layout-trigger': 'editPostLayout'
		});
		this.delegateEvents();

		this.postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;

		this.prepareEditor();

		Upfront.Events.trigger('post:initialized', this);
	},

	/**
	 * Element contents markup.
	 * @return {string} Markup to be shown.
	 */
	get_content_markup: function () {
		return 'loading';
	},

	prepareEditor: function(){
		if(!this.editor){
			this.editor = new Upfront.Content.PostEditor({
				editor_id: 'this_post_' + this.postId,
				post_id: this.postId,
				preload: true,
				node: this.$('.upfront-object-content'),
				content_mode: 'post_content',
				view: this,
				layout: this.property('layout')
			});
			this.editor.render();
		}
	},

	on_render: function(){
		this.editor.setElement(this.$('.upfront-object-content'));
		this.editor.render();
	},

	get_buttons: function(){
		return '<a href="#" class="upfront-icon-button upfront-icon-button-nav upfront-post-layout-trigger"></a>';
	},

	on_edit: function (e) {
		if(!this.editor){
			this.createEditor($('#' + this.property('element_id')).find(".upfront-object-content"));
		}
	},

	editPostLayout: function(){
		Upfront.Events.trigger('post:layout:edit', this, 'single');
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
				if(!me.editor)
					me.createEditor(node);
				else
					me.editor.initEditAreas();

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

	createEditor: function(node){
		var me = this;

		if(this.editor)
			return;

		this.editor = new Upfront.Content.editor({
			editor_id: 'this_post_' + this.postId,
			post_id: this.postId,
			preload: true,
			node: node,
			content_mode: 'post_content',
			view: me,
			autostart: this.autostart,
			onUpdated: function(post){
				me.autostart = false;
				me.editor.autostart = false;
				me.refreshMarkup(post);
				me.trigger('post:updated', post);
			}
		});

		this.listenTo(this.editor, 'editor:cancel', function(){
			me.editor.autostart = false;
			me.editor.initEditAreas();
		});
	},

	on_element_edit_start: function (edit, post) {
		if ( edit == 'write' && this.parent_module_view){
			if ( post.id != this.postId )
				this.parent_module_view.disable_interaction(false);
			else
				this.parent_module_view.$el.find('.upfront-module').addClass('upfront-module-editing');
		}
	},

	on_element_edit_stop: function (edit, post) {
		if(this.parent_module_view){
			this.parent_module_view.$el.find('.upfront-module').removeClass('upfront-module-editing');
			this.parent_module_view.enable_interaction(false);
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
	},

	cleanup: function(){
		if(this.editor){
			this.editor.remove();
			this.editor = false;
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
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": 20}
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
	initialize: function (opts) {
		this.options = opts;
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
	initialize: function (opts) {
		this.options = opts;
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
	initialize: function (opts) {
		this.options = opts;
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
