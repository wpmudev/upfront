(function ($) {
define([
	'text!elements/upfront-posts/tpl/views.html',
	'elements/upfront-posts/js/post-list-views',
	'elements/upfront-posts/js/post-list-settings'
], function(tpl, Views, PostsSettings) {

var l10n = Upfront.Settings.l10n.posts_element;
var $template = $(tpl);


var PostsPartModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = Upfront.data.upfront_posts_part
			? _.clone(Upfront.data.upfront_posts_part)
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var PostsModel = Upfront.Models.ObjectGroup.extend({
	init: function () {
		var properties = Upfront.data.upfront_posts
			? _.clone(Upfront.data.upfront_posts)
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});


var PostsPartView = Upfront.Views.ObjectView.extend({
	init: function () {

	},
	
	on_render: function () {
		// Listen to object edit toggle if in ObjectGroup
		if ( this.object_group_view ) {
			this.stopListening(this.object_group_view, 'set:mobile_mode');
			this.listenTo(this.object_group_view, 'set:mobile_mode', this.setMobileMode);
			this.stopListening(this.object_group_view, 'unset:mobile_mode');
			this.listenTo(this.object_group_view, 'unset:mobile_mode', this.unsetMobileMode);
		}

		// Listen to module view position update
		if ( this.parent_module_view ) {
			this.stopListening(this.parent_module_view, 'update_postion');
			this.listenTo(this.parent_module_view, 'update_position', this.update_position);
		}

		this.listenTo(Upfront.Events, 'entity:drop:before_render', this.set_prev_region_container);
		this.update_height();
	},
	
	render_view: function (markup) {
		var me = this,
			type = this.model.get_property_value_by_name('part_type')
		;

		this.$el.find('.upfront-object-content').empty().append(markup);
		this.adjust_featured_image();
		this.adjust_inserted_image();
		if ( Upfront.Application.is_editor() ) {
			this.prepare_editor();
		}

		// Show full image if we are in mobile mode
		if(type === "featured_image") {
			if (this.object_group_view.mobileMode) {
				setTimeout( function () {
					me.setMobileMode();
				}, 100);
			}
		}

		Upfront.Events.trigger('post-data:part:rendered', this, markup);
	},

	prepare_editor: function () {
		var me = this,
			type = this.model.get_property_value_by_name('part_type'),
			node = this.$el.find('.upfront-object-content')
		;
		if ( this._editor_prepared && this.editor_view ){
			this.editor_view.setElement(node);
			this.trigger_edit();
		}
		else if ( !this._editor_prepared && Upfront.Views.PostDataEditor ) {
			Upfront.Views.PostDataEditor.addPartView(type, node.get(0), this.model, this.object_group_view.model).done(function(view){
				me.editor_view = view;
				me.trigger_edit();
			});
			this._editor_prepared = true;
		}
	},
	
	update: function (prop, options) {
		// Ignore preset changes since post part will have no preset
		if ( prop && prop.id == 'preset' ) return;
		this.constructor.__super__.update.call(this, prop, options);
		//this.adjust_featured_image();
		//this.adjust_inserted_image();
	},

	update_position: function () {
		this.constructor.__super__.update_position.call(this);
		this.update_height();
		//this.adjust_featured_image();
		//this.adjust_inserted_image();
	},
	
	update_height: function () {
		var type = this.model.get_property_value_by_name('part_type');
		if ( type == 'content' || type == 'comments' || ( type == 'featured_image' && this.object_group_view.mobileMode ) ) {
			// If type is content or comments, disable min-height to prevent excessive spaces
			this.$el.find('> .upfront-object').css('min-height', '');
			this.object_group_view.$el.find('> .upfront-object-group').css('min-height', '');
			this.object_group_view.parent_module_view.$el.find('> .upfront-module').css('min-height', '');
			this.add_region_class('upfront-region-container-has-' + type, true);
		}
		if ( type == 'featured_image' && !this.object_group_view.mobileMode ) {
			this.remove_region_class('upfront-region-container-has-' + type, true);
		}


		if( this.prev_region_container )
			this.prev_region_container.removeClass( 'upfront-region-container-has-' + type );
	},
	
	cleanup: function () {
		var type = this.model.get_property_value_by_name('part_type');
		this.remove_region_class('upfront-region-container-has-' + type, true);

		// We have to remove this view from _viewInstances
		if ( Upfront.Views.PostDataEditor && Upfront.Views.PostDataEditor.contentEditor && this.editor_view ) {
			Upfront.Views.PostDataEditor.contentEditor._viewInstances = _.without(
				Upfront.Views.PostDataEditor.contentEditor._viewInstances,
				this.editor_view
			);
		}
	},
	/**
	 * Sets previous region container when element is moved to a new region
	 *
	 * @event Upfront.Events::entity:drop:render
	 * @param dragdrop
	 * @param region_container
     */
	set_prev_region_container: function( dragdrop, region_container){
		this.prev_region_container = region_container;
	}
});

var PostsView = Upfront.Views.ObjectGroup.extend({

	init: function () {
		this.listenTo(this.model.get('objects'), 'change', this.on_render);
		this.listenTo(this.model.get('objects'), 'add', this.on_render);
		this.listenTo(this.model.get('objects'), 'remove', this.on_render);

		this.listenTo(Upfront.Events, 'csseditor:open', this.on_csseditor_open);
		this.listenTo(Upfront.Events, 'csseditor:closed', this.on_csseditor_closed);
	},

	on_render: function () {
		var type = this.model.get_property_value_by_name("display_type");
		this.render_view(type);
		// Let's not render min-height (remove it)
		if ( type && Views.DEFAULT != type ) {
			this.$el.find('> .upfront-object').css('min-height', '');
			this.parent_module_view.$el.find('> .upfront-module').css('min-height', '');
			this.add_region_class('upfront-region-container-has-posts', true);
		}
		
		this.render_controls();
	},
	
	getControlItems: function(){
		var me = this,
			objects = this.get_child_objects(false),
			type = this.model.get_property_value_by_name('data_type'),
			is_locked = this.model.get_property_value_by_name('is_locked'),
			controls = [],
			lock_icon = ''
		;

		if ( objects.length > 1 ) {
			controls.push(this.createControl('reorder', l10n.settings, 'on_edit_click'));
			this._multiple = true;
		}
		else {
			this._multiple = false;
		}
		controls.push(this.createPaddingControl());
		controls.push(this.createControl('settings', l10n.settings, 'on_settings_click'));
		return _(controls);
	},
	
	toggle_child_objects_loading: function (loading) {
		loading = _.isUndefined(loading) ? false : loading;
		var objects = this.get_child_objects(false);

		_.each(objects, function (object) {
			var view = Upfront.data.object_views[object.cid];
			if ( !view || !view._editor_prepared || !view.editor_view ) return;
			view.editor_view.loading = loading;
		});
	},
	
	on_edit_click: function (e) {
		if( typeof e !== "undefined" ){
			e.preventDefault();
		}
		this.enable_object_edit();
	},
	

	render_controls: function () {
		var me = this,
			objects = this.get_child_objects(false),
			need_rerender = ( ( objects.length > 1 && !this._multiple ) || ( objects.length == 1 && this._multiple ) )
		;
		if ( this.parent_module_view ) {
			this.$control_el = this.$el;
			if ( this.controls && need_rerender ) {
				this.controls.remove();
				this.controls = false;
				this.$control_el.find('>.upfront-element-controls').remove();
			}
			this.updateControls();
			setTimeout(function() {
				if(me.paddingControl && typeof me.paddingControl.isOpen !== 'undefined' && !me.paddingControl.isOpen)	me.paddingControl.refresh();
			}, 300);
		}
	},
	
	get_child_objects: function (include_spacer) {
		return this.model.get('objects').filter(function(object){
			var view_class = object.get_property_value_by_name('view_class');
			if ( 'PostsPartView' == view_class ) return true;
			else return ( include_spacer === true );
		});
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
	
	render_view: function (type) {
		var preset = this.model.get_property_value_by_name('preset'),
			me = this
		;

		if ( this.child_view ) {
			this.child_view.render();
			return;
		}
		type = type || Views.DEFAULT;
		var view = Views[type]
			? new Views[type]({model: this.model})
			: new Views[Views.DEFAULT]({model: this.model})
		;
		view.element = this;
		view.render();

		this.child_view = view;

		this.$el.find(".upfront-object-group-default").append(view.$el);
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
		Upfront.Events.trigger('upfront:element:edit:start', 'text');
	},

	/**
	 * On edit stop handler, do enable caching back
	 */
	on_edit_stop: function () {
		if ( ! this.child_view ) return;
		this.child_view._do_cache = true;
		Upfront.Events.trigger('upfront:element:edit:stop', 'text');
	},
	
	get_child_padding: function () {
		var column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
			child_objects = this.get_child_objects(false),
			child = child_objects.length == 1 ? child_objects[0] : false,
			padding_left = child ? parseInt( child.get_breakpoint_property_value("left_padding_use", true) ? child.get_breakpoint_property_value('left_padding_num', true) : column_padding, 10 ) : column_padding,
			padding_right = child ? parseInt( child.get_breakpoint_property_value("right_padding_use", true) ? child.get_breakpoint_property_value('right_padding_num', true) : column_padding, 10 ) : column_padding,
			padding_top = child ? parseInt( child.get_breakpoint_property_value("top_padding_use", true) ? child.get_breakpoint_property_value('top_padding_num', true) : column_padding, 10 ) : column_padding,
			padding_bottom = child ? parseInt( child.get_breakpoint_property_value("bottom_padding_use", true) ? child.get_breakpoint_property_value('bottom_padding_num', true) : column_padding, 10 ) : column_padding
		;
		return {
			left: padding_left,
			right: padding_right,
			top: padding_top,
			bottom: padding_bottom
		};
	},

	cleanup: function () {
		this.remove_region_class('upfront-region-container-has-posts', true);
	}
});


var PostsElement = Upfront.Views.Editor.Sidebar.Element.extend({
	_post_parts: [
		'date_posted',
		'author',
		'featured_image',
		'comment_count',
		'tags',
		'gravatar',
		'categories',
		'read_more',
		'title',
		'content'
	],

	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-posts');
		this.$el.html(l10n.element_name);
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

		var presets = (Upfront.mainData || {})["postsPresets"] || [],
			post_parts = (_.findWhere(presets, {id: "default"}) || {}).enabled_post_parts || []
		;

		_.each(post_parts, function(part){
			var object = me.create_part_object(part);
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
		var wrapper_id = Upfront.Util.get_unique_id("wrapper"),
			wrapper = new Upfront.Models.Wrapper({
				properties: [
					{ name: 'wrapper_id', value: wrapper_id },
					{ name: 'class', value: 'c24' }
				]
			}),
			object = new PostsPartModel({
				properties: [
					{ name: 'view_class', value: 'PostsPartView' },
					{ name: 'part_type', value: type },
					{ name: 'has_settings', value: 0 },
					{ name: 'class', value: 'c24 upfront-posts-part part-' + type },
					{ name: 'wrapper_id', value: wrapper_id }
				]
			})
		;
		return {
			object: object,
			wrapper: wrapper
		};
	},

	add_element: function () {
		var part_objects = this.create_part_objects(this._post_parts),
			object = new PostsModel({
				objects: part_objects.objects,
				wrappers: part_objects.wrappers
			}),
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
