(function ($) {
define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-this-post/tpl/preset-style.html'
], function(ElementSettings, RootSettingsPanel, Util, styleTpl) {

var l10n = Upfront.Settings.l10n.this_post_element;

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
	plugin: false,
	initialize: function(options){
		var me = this;
		if(! (this.model instanceof ThisPostModel)){
			this.model = new ThisPostModel({properties: this.model.get('properties')});
		}
		this.listenTo(this.model.get('properties'), 'change', this.reset_markup);
		this.constructor.__super__.initialize.call(this, [options]);

		if (Upfront.Application.mode.current === Upfront.Application.MODE.THEME) {
			// Only extend events with post layout editing in theme editing mode
			_.extend(this.events, {
				'click .upfront-post-layout-trigger': 'editPostLayout'
			});
		}
		this.delegateEvents();

		this.postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;
		
		if(Upfront.Application.current_subapplication.get_layout_data().layout.plugin) {
			this.plugin=true; //to enable loading of non-editable content for plugins when ID is not available
		}

		if(this.plugin || this.postId){
			this.refreshMarkup().then(function(){
				if(me.postId)
					me.prepareEditor();
			});
			//let's also start the editor before getting the markup
			//so its load will be faster
			if(!this.plugin)
				me.prepareEditor();
		} else if ("themeExporter" in Upfront && Upfront.Application.mode.current === Upfront.Application.MODE.THEME) {
			// We're dealing with a theme exporter request
			// Okay, so let's fake a post
			this.postId = "fake_post";
			this.refreshMarkup();
			me.prepareEditor();
		}else if("themeExporter" in Upfront && Upfront.Application.mode.current === Upfront.Application.MODE.CONTENT_STYLE ){
            this.postId = "fake_styled_post";
            this.refreshMarkup();
            me.prepareEditor();
        }

		this.listenToOnce(this, 'rendered', function(){
			if( window.location.pathname.indexOf('/edit/') !== -1 )
			me.editor.loadingLayout.done(function() {
				setTimeout(function() {
					//Upfront.Events.trigger('post:layout:edit', me, 'archive');
					me.editor.editContents();
				}, 200);

			});


            if( Upfront.Application.is_builder() ){
                me.editor.loadingLayout.done(function() {
                    setTimeout(function() {
                        Upfront.Events.trigger('post:layout:edit', me, 'single');
                    }, 200);

                });
            }

		});

		Upfront.Events.trigger('post:initialized', this);
	},

	/**
	 * Element contents markup.
	 * @return {string} Markup to be shown.
	 */
	get_content_markup: function () {
		if(!this.markup){
			this.refreshMarkup();
			return 'loading';
		}
		return this.markup;
	},

	reset_markup: function () {
		var me = this,
			props = ['hide_featured_image', 'full_featured_image'];
		if ( ! this.markup )
			return;
		_.find(props, function(prop){
			var value = me.property(prop),
				prev_value = me._properties[prop];
			if ( !value && !prev_value ) // nothing change
				return false;
			if ( prev_value != value ){
				me.markup = false;
				return true;
			}
			return false;
		});
		if ( this.markup === false && this.editor ){ // Markup refreshed, let's also fetchPostLayout
			this.editor.fetchPostLayout();
		}
	},

	prepareEditor: function(){

		var node = this.$('.upfront-object-content').children();

		//If we don't have the node rendered yet,
		//start the editor in a separated div
		if(!node.length)
			node = [$('<div>')];

		if(!this.editor){
			this.editor = new Upfront.Content.PostEditor({
				editor_id: 'this_post_' + this.postId,
				post_id: this.postId,
				preload: true,
				node: node[0],
				content_mode: 'post_content',
				view: this,
				layout: this.property('layout')
			});
			this.editor.render();
		}
		else
			this.editor.setElement(node[0]);
	},

	on_render: function(){
		if(!this.editor)
			return;

		var me = this,
			contents = this.$('.upfront-object-content').children()
		;

		// Make sure we have an element to swap with, first up
		if(contents[0] && contents[0] != this.editor.el){
			this.editor.setElement( contents[0] );
			this.editor.render(); // ... and don't forget to re-render when swapping els
		}

		// Let's not render min-height (remove it)
		this.$el.find('> .upfront-object').css('min-height', '');
		this.parent_module_view.$el.find('> .upfront-module').css('min-height', '');
		this.add_region_class('upfront-region-container-has-this_post', true);

		//this.editor.render();
		this.trigger('rendered');
	},

	//get_buttons: function(){
	//	return '<a href="#" class="upfront-icon-button upfront-icon-button-nav upfront-post-layout-trigger"></a>';
	//},
    get_extra_buttons: function(){
        return Upfront.Application.mode.current === Upfront.Application.MODE.THEME
        	? '<a href="#" title="Edit post layout" class="upfront-icon-button upfront-icon-button-nav upfront-post-layout-trigger"></a>'
        	: ''
        ;
    },
	on_edit: function (e) {
		if(!this.editor){
			this.prepareEditor();
		}
	},

	editPostLayout: function(){
		this.markup = false;
		Upfront.Events.trigger('post:layout:edit', this, 'single');
	},

    editPostContent: function(){
        this.editor.editContents();
        Upfront.Events.trigger('upfront:element:edit:start', 'write', this);
    },

	refreshMarkup: function () {
		
		var me = this;

		if(this.loadingMarkup)
			return this.loadingMarkup;

		if(this.postId === false && !this.plugin)
			return new $.Deferred().resolve({data:{filtered: 'Error'}});

		var node = $('#' + me.property('element_id')).find(".upfront-object-content"),
			loading = !node.length ? false : new Upfront.Views.Editor.Loading({
				loading: l10n.refreshing,
				done: l10n.here_we_are,
				fixed: false
			})
		;

		if(loading){
			loading.render();
			node.append(loading.$el);
		}

		this._properties = {
			post_data: this.property("post_data"),
			element_id: this.property('element_id'),
			hide_featured_image: this.property('hide_featured_image'),
			full_featured_image: this.property('full_featured_image')
		};
		
		this.loadingMarkup = Upfront.Util.post({
				action: "this_post-get_markup",
				data: JSON.stringify({
					post_id: this.postId,
					post_type: Upfront.Settings.LayoutEditor.newpostType,
					properties: this._properties
				})
			}).success(function(response){
				if(loading){
					loading.done();
					loading = false;
				}

				var node = node || $('#' + me.property('element_id')).find(".upfront-object-content");
				me.markup = response.data.filtered;
				node.html(me.get_content_markup());

				me.on_render();

				me.loadingMarkup = false;
			})
		;

		return this.loadingMarkup;
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

	on_element_edit_stop: function (edit, post, saving_draft) {
		if(this.parent_module_view && saving_draft !== true){
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
		this.remove_region_class('upfront-region-container-has-this_post', true);
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
		this.$el.html(l10n.element_name);
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
			{label: l10n.post_author, value: "author"},
			{label: l10n.post_date, value: "date"},
			{label: l10n.categories, value: "categories"},
			{label: l10n.tags, value: "tags"},
			{label: l10n.comments_count, value: "comments_count"},
			{label: l10n.featured_image, value: "featured_image"}
		];
		this.fields = _([
			new Upfront.Views.Editor.Field.Checkboxes({
				model: this.model,
				label: l10n.show_post_data,
				property: "post_data",
				values: data
			})
		]);
	},
	get_title: function () {
		return l10n.post_data;
	}
});

var Settings_PostPanel = RootSettingsPanel.extend({
	label: l10n.element_name,
	settings: [
		{
			type: 'SettingsItem',
			title: l10n.featured_image_option,
			fields: [
				{
					type: 'Checkboxes',
					property: "hide_featured_image",
					multiple: false,
					values: [{ label: l10n.hide_featured_image, value: '1' }],
					change: function (value, me) {
						if (value === '1')
							me.model.set_property('hide_featured_image', 1);
						else
							me.model.set_property('hide_featured_image', false);
					}
				},
				{
					type: 'Checkboxes',
					property: "full_featured_image",
					multiple: false,
					values: [{ label: l10n.full_featured_image, value: '1' }],
					change: function (value, me) {
						if (value === '1')
							me.model.set_property('full_featured_image', 1);
						else
							me.model.set_property('full_featured_image', false);
					}
				}
			]
		}
	],
	title: l10n.post_settings
});

var Settings = ElementSettings.extend({
	panels: {
		General: Settings_PostPanel,
		Appearance: {
			mainDataCollection: 'thispostPresets',
			styleElementPrefix: 'thispost-preset',
			ajaxActionSlug: 'thispost',
			panelTitle: l10n.settings,
			presetDefaults: Upfront.mainData.presetDefaults.thispost,
			styleTpl: styleTpl,
		},
	},
	
	initialize: function (opts) {
		//If editor show only general preset
		if (location.pathname.indexOf('create_new') === -1) {// you are in exporter
			this.panels = { General: Settings_PostPanel };
		}
		
		// Call the super constructor here, so that the appearance panel is instantiated
		this.constructor.__super__.initialize.call(this, opts);
	},

	title: l10n.post_settings
});

// Generate presets styles to page
Util.generatePresetsToPage('thispost', styleTpl);

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
