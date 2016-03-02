(function ($) {
define([
	'text!elements/upfront-post-data/tpl/views.html',
	'elements/upfront-post-data/js/post-data-views',
	'elements/upfront-post-data/js/post-data-settings'
], function(tpl, Views, PostDataSettings) {

var l10n = Upfront.Settings.l10n.post_data_element;
var $template = $(tpl);

var data = {};

var PostDataPartModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = Upfront.data.upfront_post_data_part
			? _.clone(Upfront.data.upfront_post_data_part)
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var PostDataModel = Upfront.Models.ObjectGroup.extend({
	init: function () {
		var data_type = this.get_property_value_by_name('data_type'),
			data_key = data_type ? 'upfront_post_data_' + data_type : 'upfront_post_data',
			properties = Upfront.data[data_key]
			? _.clone(Upfront.data[data_key])
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});


var PostDataEditor = null; // Store editor instance

var PostDataPartView = Upfront.Views.ObjectView.extend({
	init: function () {
	},
	
	on_render: function () {
		//console.log(this.el, this)
	},

	update: function (prop, options) {
		// Ignore preset changes since post part will have no preset
		if ( prop && prop.id == 'preset' ) return;
		this.constructor.__super__.update.call(this, prop, options);
	},
	
	render_view: function (markup) {
		this.$el.find('.upfront-object-content').empty().append(markup);
		this.prepare_editor();
	},
	
	prepare_editor: function () {
		var me = this,
			type = this.model.get_property_value_by_name('part_type'),
			node = this.$el.find('.upfront-object-content');
		if ( this._editor_prepared && this.editor_view ){
			this.editor_view.setElement(node);
			this.trigger_edit();
		}
		else if ( !this._editor_prepared && PostDataEditor ) {
			PostDataEditor.addPartView(type, node.get(0), this.model, this.object_group_view.model).done(function(view){
				me.editor_view = view;
				me.trigger_edit();
			});
			this._editor_prepared = true;
		}
	},

	/**
	 * Part objects do *NOT* get individual control items - parent group does
	 */
	getControlItems: function () {
		return _([]);
	},
	
	/**
	 * Trigger edit if it's in the middle of editing (re-rendering whie editing)
	 */
	trigger_edit: function () {
		if ( !PostDataEditor.contentEditor || !PostDataEditor.contentEditor._editing ) return;
		this.editor_view.editContent();
	},

	on_element_edit_start: function () {
		return;
	},

	on_element_edit_stop: function () {
		return;
	}
});

var PostDataView = Upfront.Views.ObjectGroup.extend({
	init: function () {
		this.listenTo(this.model.get('objects'), 'change', this.on_render);
		this.listenTo(this.model.get('objects'), 'add', this.on_render);
		this.listenTo(this.model.get('objects'), 'remove', this.on_render);
		
		/*_.extend(this.events, {
			'click .upfront-post-part-trigger': 'on_edit_click'
		});*/
		this.delegateEvents();

		this.prepare_editor();
	},
	
	get_extra_buttons: function(){
		//return '<a href="#" title="' + l10n.edit_post_parts + '" class="upfront-icon-button upfront-icon-button-nav upfront-post-part-trigger"></a>';
		return '';
	},

	getControlItems: function(){
		return _([
			this.createPaddingControl(),
			this.createControl('reorder', l10n.settings, 'on_edit_click'),
			this.createControl('settings', l10n.settings, 'on_settings_click')
		]);
	},
	
	on_edit_click: function (e) {
		if( typeof e !== "undefined" ){
			e.preventDefault();
		}
		this.enable_object_edit();
	},

	on_render: function () {
		var type = this.model.get_property_value_by_name("data_type");
		this.render_view(type);

		if ( this.parent_module_view ) {
			this.$control_el = this.$el;
			this.updateControls();
			var me = this;
			setTimeout(function() {
				if(me.paddingControl && typeof me.paddingControl.isOpen !== 'undefined' && !me.paddingControl.isOpen)	me.paddingControl.refresh();
			}, 300);
		}
	},

	render_view: function (type) {
		var preset = this.model.get_property_value_by_name('preset'),
			classes = this.$el.attr('class'),
			existing_preset_class = classes.match(/preset-[^ ]+/g),
			me = this
		;
		if (preset) {
			if (existing_preset_class && existing_preset_class.length) {
				_.each(existing_preset_class, function (cls) {
					me.$el.removeClass($.trim(cls));
				});
			}
			this.$el.addClass('preset-' + preset);
		}
		
		if ( this.child_view ) {
			this.child_view.render();
			return;
		}
		type = type || Views.DEFAULT;
		var me = this,
			view = Views[type]
			? new Views[type]({model: this.model})
			: new Views[Views.DEFAULT]({model: this.model})
		;
		view.element = this;
		view.render();
		
		this.child_view = view;

		this.$el.find(".upfront-object-group-default").append(view.$el);

	},
	
	prepare_editor: function () {
		this.postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;
		if ( !this.postId && "themeExporter" in Upfront && Upfront.Application.mode.current === Upfront.Application.MODE.THEME ) {
			// We're dealing with a theme exporter request
			// Okay, so let's fake a post
			this.postId = "fake_post";
		}
		else if ( !this.postId && "themeExporter" in Upfront && Upfront.Application.mode.current === Upfront.Application.MODE.CONTENT_STYLE ){
			this.postId = "fake_styled_post";
		}
		if ( !PostDataEditor || PostDataEditor.postId != this.postId ){
			PostDataEditor = new Upfront.Content.PostEditor({
				editor_id: 'this_post_' + this.postId,
				post_id: this.postId,
				content_mode: 'post_content'
			});
		}
		this.listenTo(PostDataEditor, 'post:saved post:trash', this.on_render);
		this.listenTo(PostDataEditor, 'post:cancel', this.on_cancel);
		this.listenTo(PostDataEditor, 'editor:edit:start', this.on_edit_start);
		this.listenTo(PostDataEditor, 'editor:edit:stop', this.on_edit_stop);
		// Listen to change event too
		this.listenTo(PostDataEditor, 'editor:change:title', this.on_title_change);
		this.listenTo(PostDataEditor, 'editor:change:content', this.on_content_change);
		this.listenTo(PostDataEditor, 'editor:change:author', this.on_author_change);
		this.listenTo(PostDataEditor, 'editor:change:date', this.on_date_change);
	},
	
	/**
	 * On cancel handler, do rerender with cached data
	 */
	on_cancel: function () {
		if ( ! this.child_view ) return;
		this.child_view.rerender();
	},
	
	/**
	 * On edit start handler, don't cache data on requested rendering
	 */
	on_edit_start: function () {
		if ( ! this.child_view ) return;
		this.child_view._do_cache = false;
	},
	
	/**
	 * On edit stop handler, do enable caching back
	 */
	on_edit_stop: function () {
		if ( ! this.child_view ) return;
		this.child_view._do_cache = true;
	},
	
	/**
	 * On title change handler, do nothing for now, just for handy reference in case we need it
	 * @param {String} title
	 */
	on_title_change: function (title) {
		
	},
	
	/**
	 * On content change handler, do nothing for now, just for handy reference in case we need it
	 * @param {String} content
	 * @param {Bool} isExcerpt
	 */
	on_content_change: function (content, isExcerpt) {
		
	},
	
	/**
	 * On author change handler, rerender if this is author element
	 * @param {Object} authorId
	 */
	on_author_change: function (authorId) {
		if ( ! this.child_view ) return;
		var type = this.model.get_property_value_by_name("data_type");
		this.authorId = authorId;
		// Render again if it's author element
		if ( 'author' == type ) {
			this.child_view.render();
		}
	},
	
	/**
	 * On date change handler, rerender if this is post data element
	 * @param {Object} date
	 */
	on_date_change: function (date) {
		if ( ! this.child_view ) return;
		var type = this.model.get_property_value_by_name("data_type");
		this.postDate = Upfront.Util.format_date(date, true, true).replace(/\//g, '-');
		// Render again if it's post data element
		if ( 'post_data' == type ) {
			this.child_view.render(['date_posted']); // Only render the date_posted part
		}
	},


	on_element_edit_start: function (edit, post) {
		if ( edit == 'write' && this.parent_module_view ){
			this.parent_module_view.$el.find('>.upfront-module').addClass('upfront-module-editing');
			this.parent_module_view.disable_interaction(false, true, false, false, true);
		}
		else {
			this.constructor.__super__.on_element_edit_start.call(this, edit, post);
		}
	},

	on_element_edit_stop: function (edit, post, saving_draft) {
		if ( edit == 'write' && this.parent_module_view && this.parent_module_view.enable_interaction && saving_draft !== true ){
			this.parent_module_view.$el.find('>.upfront-module').removeClass('upfront-module-editing');
			this.parent_module_view.enable_interaction(true);
		}
		else {
			this.constructor.__super__.on_element_edit_stop.call(this, edit, post, saving_draft);
		}
	},

});


var PostDataElement = Upfront.Views.Editor.Sidebar.Element.extend({
	
	_default_data: {
		type: '',
		columns: 24,
		rows: Upfront.Util.height_to_row(200),
		name: '',
		parts: {

		}
	},
	
	_post_parts: [],

	render: function () {
		//this.$el.addClass('upfront-icon-element upfront-icon-element-post-data');
		this.$el.html(this._default_data.name);
	},
	
	/**
	 * Create default part objects
	 * @param {Array} types
	 */
	create_part_objects: function (types) {
		var me = this,
			objects = [],
			wrappers = []
		;
		_.each(types, function(type){
			var object = me.create_part_object(type);
			objects.push( object.object );
			wrappers.push( object.wrapper );
		});
		return {
			objects: objects,
			wrappers: wrappers
		};
	},
	
	/**
	 * Create default part object
	 * @param {String} type
	 */
	create_part_object: function (type) {
		var default_data = _.isObject(this._default_data.parts) && _.isObject(this._default_data.parts[type]) ? this._default_data.parts[type] : {},
			wrapper_id = Upfront.Util.get_unique_id("wrapper"),
			wrapper = new Upfront.Models.Wrapper({
				properties: [
					{ name: 'wrapper_id', value: wrapper_id },
					{ name: 'class', value: 'c24' }
				]
			}),
			object = new PostDataPartModel({
				properties: [
					{ name: 'view_class', value: 'PostDataPartView' },
					{ name: 'part_type', value: type },
					{ name: 'has_settings', value: 0 },
					{ name: 'class', value: 'c24 upfront-post-data-part' },
					{ name: 'wrapper_id', value: wrapper_id },
				]
			})
		;
		if ( !_.isUndefined(default_data.rows) ) {
			object.set_property('row', default_data.rows, true);
		}
		return {
			object: object,
			wrapper: wrapper
		};
	},

	add_element: function () {

		var part_objects = this.create_part_objects(this._post_parts),
			object = new PostDataModel({
				properties: [
					{"name": "data_type", "value": this._default_data.type},
					{"name": "row", "value": this._default_data.rows}
				],
				objects: part_objects.objects,
				wrappers: part_objects.wrappers
			}),
			module = new Upfront.Models.Module({
				name: "",
				properties: [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c" + this._default_data.columns + " upfront-post_data_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": this._default_data.rows}
				],
				objects: [object]
			})
		;
		this.add_module(module);
	}
});

var PostDataElement_PostData = PostDataElement.extend({
	_default_data: {
		type: 'post_data',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Post Data'
	},
	_post_parts: [
		'date_posted',
		'title',
		'content'
	]
});

var PostDataElement_Author = PostDataElement.extend({
	_default_data: {
		type: 'author',
		columns: 4,
		rows: Upfront.Util.height_to_row(100),
		name: 'Author'
	},
	_post_parts: [
		'author',
		'gravatar',
		'author_email',
		'author_url',
		'author_bio'
	]
});

var PostDataElement_Taxonomy = PostDataElement.extend({
	_default_data: {
		type: 'taxonomy',
		columns: 18,
		rows: Upfront.Util.height_to_row(50),
		name: 'Categories & Tags'
	},
	_post_parts: [
		'tags',
		'categories'
	]
});

var PostDataElement_FeaturedImage = PostDataElement.extend({
	_default_data: {
		type: 'featured_image',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Featured Image',
		parts: {
			featured_image: {
				rows: Upfront.Util.height_to_row(200)
			}
		}
	},
	_post_parts: [
		'featured_image'
	]
});

var PostDataElement_Comments = PostDataElement.extend({
	_default_data: {
		type: 'comments',
		columns: 18,
		rows: Upfront.Util.height_to_row(200),
		name: 'Comments'
	},
	_post_parts: [
		'comment_count',
		'comments',
		'comments_pagination',
		'comment_form'
	]
});

var PostDataElement_Meta = PostDataElement.extend({
	_default_data: {
		type: 'meta',
		columns: 4,
		rows: Upfront.Util.height_to_row(50),
		name: 'Meta'
	},
	_post_parts: [
		'meta'
	]
});

/**
 * Add the elements to Upfront, only when in single layout. Place the element in DataElement.
 */
function add_elements () {
	if ( 'type' in _upfront_post_data.layout && 'single' === _upfront_post_data.layout.type ) {
		Upfront.Application.LayoutEditor.add_object("Upostdata-post_data", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_PostData,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
		
		Upfront.Application.LayoutEditor.add_object("Upostdata-author", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Author,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
		
		Upfront.Application.LayoutEditor.add_object("Upostdata-taxonomy", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Taxonomy,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
		
		Upfront.Application.LayoutEditor.add_object("Upostdata-featured_image", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_FeaturedImage,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
		
		Upfront.Application.LayoutEditor.add_object("Upostdata-comments", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Comments,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});

		Upfront.Application.LayoutEditor.add_object("Upostdata-meta", {
			"Model": PostDataModel,
			"View": PostDataView,
			"DataElement": PostDataElement_Meta,
			"Settings": PostDataSettings,
			cssSelectors: {
			},
			cssSelectorsId: 'PostDataModel'
		});
	}
	else {
		Upfront.Application.LayoutEditor.remove_object('Upostdata-post_data');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-author');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-taxonomy');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-featured_image');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-comments');
		Upfront.Application.LayoutEditor.remove_object('Upostdata-meta');
	}
}

Upfront.Events.on("application:setup:editor_interface", function () {
	add_elements();
});
add_elements();



Upfront.Models.PostDataModel = PostDataModel;
Upfront.Models.PostDataPartModel = PostDataPartModel;
Upfront.Views.PostDataView = PostDataView;
Upfront.Views.PostDataPartView = PostDataPartView;


});
}(jQuery));
