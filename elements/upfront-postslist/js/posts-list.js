(function ($) {
define([
	'text!elements/upfront-postslist/tpl/views.html',
	'elements/upfront-postslist/js/post-list-views',
	'elements/upfront-postslist/js/post-list-settings'
], function(tpl, Views, PostsListsSettings) {

var l10n = Upfront.Settings.l10n.postslist_element;
var $template = $(tpl);


var PostsListsPartModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		var properties = Upfront.data.upfront_postslists_part
			? _.clone(Upfront.data.upfront_postslists_part)
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});

var PostsListsModel = Upfront.Models.ObjectGroup.extend({
	init: function () {
		var properties = Upfront.data.upfront_postslists
			? _.clone(Upfront.data.upfront_postslists)
			: {}
		;
		properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
		this.init_properties(properties);
	}
});


var PostsListsPartView = Upfront.Views.ObjectView.extend({
	init: function () {
		this.events = _.extend({}, this.events, {
			'click a' : 'disable_default',
		});
		this.delegateEvents();
	},

	attributes: function(){
		var part_type = this.model.get_property_value_by_name('part_type'),
			part_title = l10n.modules[part_type + '_title']
		;

		return {
			"title": part_title
		};
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
		debugger; // rendering part type check if parent wrapper is correct and available
		// Force columns
		var parts_columns = (_.findWhere(Upfront.mainData.postslistsPresets, { id: this.object_group_view.model.get_property_value_by_name('preset') || 'default' }) || {}).parts_columns;
		if (parts_columns) {
			this.$el.find('.upfront-object').removeClass('c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15 c16 c17 c18 c19 c20 c21 c22 c23 c24').addClass(parts_columns[type] || 'c24');
			this.$el.parent().removeClass('c1 c2 c3 c4 c5 c6 c7 c8 c9 c10 c11 c12 c13 c14 c15 c16 c17 c18 c19 c20 c21 c22 c23 c24').addClass(parts_columns[type] || 'c24');
		}

		// Move parent to ene
		// var p1 = this.$el.parent();
		// var p2 = this.$el.parent().parent();
		// p1.detach();
		// p2.append(p1);

		this.$el.find('.upfront-object-content').empty().append(markup);
		//this.adjust_featured_image();
		//this.adjust_inserted_image();

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

	getControlItems: function () {
		var controls = [];
		controls.push(this.createPaddingControl());
		controls.push(this.createControl('settings', l10n.settings, 'on_child_settings_click'));
		return _(controls);
	},

	on_child_settings_click: function () {
		if( typeof e !== "undefined" ){
			e.preventDefault();
		}

		var me = this;

		// Render settings
		this.object_group_view.object_group_view.on_settings_click();

		// Open part settings
		setTimeout( function() {
			var $sidebar = $('#element-settings-sidebar'),
				$preset_manager = $sidebar.find('.preset-manager-panel'),
				$preset_parts = $preset_manager.find('.upfront-post-modules'),
				part_type = me.model.get_property_value_by_name('part_type'),
				$preset_part = $preset_parts.find('.' + part_type)

			;

			// Open Presets tab
			$preset_manager.find('.uf-settings-panel__title').click();

			// Close Defautl Preset warning
			$preset_manager.find('.overlay-button-input').click();

			$('#sidebar-scroll-wrapper').animate({scrollTop: $preset_part.offset().top - 30 }, function() {
				// Open part settings
				$preset_part.find('.upfront-settings-item-title').click();
			});

		}, 100);
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
	},

	disable_default: function (e) {
		if (Upfront.Application.user_can_modify_layout()) {
			e.preventDefault();
			e.stopPropagation();
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

var PostsListsEachView = Upfront.Views.ObjectGroup.extend({

	tagName: "article",
	className: "upfront-object-group-view upfront-posts-each",
	editable: false,

	render: function (options) {
		this.editable = !!(options.editable);

		var me = this;

		// Listen to object edit toggle if in ObjectGroup
		if ( this.editable && this.object_group_view ) {
			this.stopListening(this.object_group_view, 'toggle_object_edit');
			this.listenTo(this.object_group_view, 'toggle_object_edit', this.on_toggle_object_edit);
		}
		if ( this.object_group_view ) {
			this.ref_model = this.object_group_view.model;
		}

		// Disable object edit when new part is added
		this.listenTo(Upfront.Events, 'posts:disable:part:edit', this.disable_object_edit);

		this.$el.addClass( this.editable ? 'upfront-object-group-editable' : 'upfront-object-group-uneditable' );

		if( !this.editable ) {
			this.wrapper_view.$el.resizable('option', 'disabled', true);
		} else {
			// Prevent multiple Done buttons
			setTimeout( function() {
				me.$el.find('.upfront-object-group-finish-edit').remove();
			}, 50);
		}

		Upfront.Views.ObjectGroup.prototype.render.call(this, options);
		this.render_object_view(options.data);
	},

	update: function (prop) {
		Upfront.Views.ObjectGroup.prototype.update.call(this, prop);
		var ed = Upfront.Behaviors.GridEditor,
			breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
			value = prop.get('value'),
			prev_value = prop.previous('value')
		;
		if ( prop.id == 'class' ) {
			this._prev_col = prev_value ? ed.get_class_num(prev_value, ed.grid.class) : false;
			this._current_col = ed.get_class_num(value, ed.grid.class);
		}
		else if ( prop.id == 'breakpoint' ) {
			this._prev_col = prev_value[breakpoint.id] && prev_value[breakpoint.id]['col'] ? parseInt(prev_value[breakpoint.id]['col'], 10) : false;
			this._current_col = value[breakpoint.id] && value[breakpoint.id]['col'] ? parseInt(value[breakpoint.id]['col'], 10) : false;
		}
	},

	normalize_child_modules: function (prev_col) {
		if ( !this._objects_view ) return;
		var breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
			ed = Upfront.Behaviors.GridEditor,
			$obj = this.$el.find('> .upfront-object-group'),
			col = ( !breakpoint || breakpoint['default'] ) ? ed.get_class_num($obj, ed.grid['class']) : $obj.data('breakpoint_col')
		;
		this._objects_view.normalize_child_modules(col, prev_col, this.model.get('wrappers'));
		this._objects_view.lazy_apply_wrapper_height();
	},

	on_resize: function () {
		if ( _.isNumber(this._prev_col) && _.isNumber(this._current_col) && this._prev_col != this._current_col ) {
			this.normalize_child_modules(this._prev_col);
			if ( this.object_group_view ) {
				this.object_group_view.model.set_breakpoint_property('post_col', this._current_col);
			}
		}
	},

	/**
	 * Render the child object view
	 * @param {Object} data
	 */
	render_object_view: function (data) {
		var me = this;

		debugger; // here here check all the wrappers are ok
		var presets = (Upfront.mainData || {})["postslistsPresets"] || [],
			preset = _.findWhere(presets, {id: this.object_group_view.model.get_property_value_by_name('preset')});
		;

		// Check wrappers presence and order
		var wrappers = this.$el.find('.upfront-output-postslist .upfront-editable_entities_container').children('.upfront-wrapper');
		var render_from_scratch = false;

		// First add all wrappers from preset to this model wrappers
		_.each(preset.wrappers, function(pw) {
			// w.id;
			var pw_exists = false;
			this.model.get('wrappers').each( function(mw) {
				if (pw_exists) return;

				if (pw.id === mw.get_property_value_by_name('wrapper_id')) {
					pw_exists = true;
				}
			});

			if (pw_exists) return;

			// Wrapper is not present, let's make one
			render_from_scratch = true;
			var pw_class = pw.is_spacer ? ' upfront-wrapper-spacer ' : '';
			pw_class += pw.is_clr ? ' clr ' : '';
			pw_class += pw.cols;
			this.model.get('wrappers').add(new Upfront.Models.Wrapper({
				properties: [
					{ name: 'wrapper_id', value: pw.id },
					{ name: 'class', value: pw_class }
				]
			}), {silent: true});
		}, this);

		debugger;
		// Second remove any wrappers from this model wrappers that are not in preset
		var to_remove = [];
		this.model.get('wrappers').each( function(mw) {
			var remove = true;

			_.each(preset.wrappers, function(pw) {
				if (pw.id === mw.get_property_value_by_name('wrapper_id')) {
					remove = false;
				}
			});

			if (remove) {
				to_remove.push(mw.cid);
			}
		}, this);
		_.each(to_remove, function(cid) {
			this.model.get('wrappers').remove(cid, { silent: true });
			render_from_scratch = true;
		}, this);

		//TODO Finally order wrappers in correct order

		debugger;

		var order = preset.parts_order || [];
		var part_type_objects;
		if (order.length) {
			part_type_objects = [];
			_.each(order, function(o) {
				_.each(me.model.get('objects').models, function(m) {
					if (m.get_property_value_by_name('part_type') === o) {
						part_type_objects.push(m);
					}
				});
			});
		} else {
			part_type_objects = this.model.get('objects').models;
		}
		_.each(part_type_objects, function(part_type_object) {
			var part_type_view = Upfront.data.object_views[part_type_object.cid],
				type = part_type_object.get_property_value_by_name('part_type')
			;
			if (!part_type_view) {
			var view_class = part_type_object.get_property_value_by_name('view_class');
					part_type_view = new Upfront.Views[view_class]({model: part_type_object});
					part_type_view.object_group_view = this.object_group_view;
			}
			if ( !part_type_view || !type || !data[type] ) return;
			part_type_view.render_view(data[type]);
		}, this);
	},

	on_toggle_object_edit: function (enable) {
		if ( enable ) this.enable_object_edit();
		else this.disable_object_edit();
	},

	enable_object_edit: function () {
		this.toggle_object_edit(true);

		var me = this,
			$posts_module = this.$el.closest('.upfront-posts_module'),
			$wrapper = this.$el.closest('ul.uf-posts-list'),
			$elements = $wrapper.find('li').not(':first, :nth-child(2)')
		;

		this.init_tooltips();

		$elements.wrapAll('<div class="posts-edit-wrapper" />');
		$wrapper.find('.posts-edit-wrapper').prepend('<div class="posts-edit-wrapper-content"><span>' + l10n.modify_first + '</span></div>');

		this.$el.before($posts_module.find('.upfront-object-group-finish-edit'));
	},

	disable_object_edit: function () {
		if ( !this.editing ) return;
		this.toggle_object_edit(false);
		if ( this.object_group_view ) this.object_group_view.trigger('posts:layout:edited');

		var $wrapper = this.$el.closest('ul.uf-posts-list'),
			$elements = $wrapper.find('li').not(':first')
		;

		$wrapper.find('.posts-edit-wrapper-content').remove();
		$elements.last().unwrap('.posts-edit-wrapper');

		// Parse columns info from element, update preset with column values and save preset
		var presets = (Upfront.mainData || {})["postslistsPresets"] || [],
			preset = _.findWhere(presets, {id: this.model.get_property_value_by_name('preset')});
		;

		var wrappers = this.$el.find('.upfront-output-postslist .upfront-editable_entities_container').children('.upfront-wrapper');
		var parts_columns = {};
		var parts_order = [];
		var wrappers_layout = [];
		var parts_wrappers = {};

		wrappers.each( function(index, wrapper) {
			var id = $(wrapper).attr('id');
			var is_spacer = $(wrapper).hasClass('upfront-wrapper-spacer');
			var is_clr = $(wrapper).hasClass('clr');

			var col_class = $(wrapper).attr('class').match(/c\d+/);

			if (!col_class) col_class = ['c24'];
			col_class = col_class[0];

			wrappers_layout.push({ id: id, spacer: is_spacer, cols: col_class, clr: is_clr });

			var part_type = $(wrapper).find('.upostslist-part, .uposts-part').attr('class');
			if (part_type) part_type = part_type.match(/(content|title|date_posted|comment_count|author|thumbnail|read_more|post_tags|post_categories)/);
			if (!part_type) return;

			part_type = part_type[0];

			console.log(col_class, part_type);
			parts_columns[part_type] = col_class;
			if (part_type === 'post_categories') part_type = 'categories';
			if (part_type === 'post_tags') part_type = 'tags';
			if (part_type === 'thumbnail') part_type = 'featured_image';
			parts_order.push(part_type);

			parts_wrappers[part_type] = id;
		});
		console.log(parts_columns);
		preset.wrappers = wrappers_layout;
		preset.parts_columns = parts_columns;
		preset.parts_order = parts_order;
		preset.parts_wrappers = parts_wrappers;

		// Update main collection (nicked from PresetManager, should be extracted to Preset Util)
		var index;

		_.each(Upfront.mainData['postslistsPresets'], function(p, presetIndex) {
			if (p.id === preset.id) {
				index = presetIndex;
			}
		});

		if (typeof index !== 'undefined') {
			Upfront.mainData['postslistsPresets'][index] = preset;
		} else {
			Upfront.mainData['postslistsPresets'].push(preset);
		}
		// And queue save
		Upfront.Application.presetSaver.queue(preset, 'postslists');
	},

	init_tooltips: function() {
		var $wrapper = this.$el.closest('ul.uf-posts-list');

		// Add parts tooltips
		$wrapper.find('.uf-post:first-of-type .upfront-object-view').utooltip({
			fromTitle: true,
			panel: 'postslist'
		});

		$wrapper.find('.uf-post:first-of-type').utooltip({
			fromTitle: false,
			panel: 'postslist',
			content: l10n.modules.post_wrapper
		});

		$wrapper.find('.upfront-posts_module:first-of-type').utooltip({
			fromTitle: false,
			panel: 'postslist',
			content: l10n.modules.element_wrapper
		});
	}

});

var PostsListsObjectsView = Upfront.Views.Objects.extend({

	tagName: "ul",
	className: "upfront-editable_entities_container uf-posts-list",

	render: function () {
		this.wrappers_collection = ( this.object_group_view && this.object_group_view._posts_model )
			? this.object_group_view._posts_model.get('wrappers')
			: false
		;

		Upfront.Views.Objects.prototype.render.call(this);
	},

	create_wrapper_view: function (wrapper) {
		return new PostsListsEachWrapper({ model: wrapper });
	}

});

var PostsListsEachWrapper = Upfront.Views.Wrapper.extend({

	tagName: "li",
	attributes: function(){
		var cls = "upfront-wrapper uf-post",
			model_cls = this.model.get_property_value_by_name('class')
			;
		return {
			"class": cls + " " + model_cls,
			"id": this.model.get_wrapper_id()
		};
	}

});


var PostsListsView = Upfront.Views.ObjectGroup.extend({

	_posts_model: false,
	_is_compat: false,

	init: function () {
		this.debouncedOnRender = _.debounce(this.on_render, 1000);

		this.listenTo(this.model.get('objects'), 'change', this.debouncedOnRender);
		this.listenTo(this.model.get('objects'), 'add', this.debouncedOnRender);
		this.listenTo(this.model.get('objects'), 'remove', this.debouncedOnRender);

		this.listenTo(Upfront.Events, 'posts:nuke-render', this.renderOnDemand);

		this.listenTo(Upfront.Events, 'posts:settings:dispatched', this.settings_dispatch);

		this.listenTo(Upfront.Events, 'csseditor:open', this.on_csseditor_open);
		this.listenTo(Upfront.Events, 'csseditor:closed', this.on_csseditor_closed);

		this.on('posts:layout:edited', this.on_posts_layout_edit);

		$(window).on('scroll', this, this.on_scroll);

		if ( this.model.get('objects').length === 0 ) {
			this._is_compat = true;
		}

		this.events = _.extend({}, this.events, {
			'click .reorder-overlay p' : 'on_edit_click',
			'hover .reorder-overlay' : 'on_scroll',
			"click  .upfront-object-group-finish-edit": "on_finish",
		});

		this.delegateEvents();
	},

	is_compat: function () {
		return this._is_compat;
	},

	renderOnDemand: function(modelId) {
		if (modelId !== this.model.cid)
		this.render();
		// Upfront.Events.trigger('posts:nuke-render:after', this.model.cid);
	},

	render: function () {
		console.log('rendered');
		if ( this.is_compat() ) {
			Upfront.Views.ObjectGroup.prototype.render.call(this);
			return;
		}

		// Setup views and models that will render individual posts, this model won't be saved as it only serve to render posts
		this._posts_model = new Upfront.Models.ObjectGroup();
		this._objects_view = new PostsListsObjectsView({model: this._posts_model.get('objects')});

		Upfront.Views.ObjectGroup.prototype.render.call(this);
	},

	settings_dispatch: function() {
		this.child_view = false;
		this.render();
	},

	on_render: function () {
		// Query plugin output only if single page is loading
		if (Upfront.Application.is_single() === false) {
			var pluginLayout = Upfront.Application.is_plugin_layout();
			if (pluginLayout) {
				this.$el.find(".upfront-object-content").empty().append('<div>Below is sample content for ' + pluginLayout.pluginName + '. Use it as a reference for styling.</div>' + pluginLayout.content);
				return;
			}
		}

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
			type = this.model.get_property_value_by_name("display_type"),
			lock_icon = ''
		;

		if ( objects.length > 1 && type !== '' ) {
			if ( Upfront.Application.user_can_modify_layout() && !this.$el.find('.reorder-overlay').length ) {
				this.$el.find('b.upfront-entity_meta').after('<div class="reorder-overlay"><p class="upfront-icon-swap-image"><span>'+ l10n.reoder_layout +'</span></p></div>');
				this.$el.addClass('uf-post-layout-edit');
			}
			this._multiple = true;
		} else {
			this.$el.removeClass('uf-post-layout-edit');
			this._multiple = false;
		}

		controls.push(this.createPaddingControl());
		controls.push(this.createControl('settings', l10n.settings, 'on_settings_click'));
		return _(controls);
	},

	on_scroll: function (e) {
		var $element = $('.upfront-posts_module'),
			$overlay = $element.find('.reorder-overlay')
		;

		// Return if overlay doesn't exist
		if(!$overlay.length) return;

		var $element_top = $element.offset().top,
			$element_bottom  = $element.offset().top + $element.height(),
			viewportTop = $(window).scrollTop()
		;

		// Check if overlay exist just in case
		if($overlay.length) {
			var $overlay_top = $overlay.offset().top;
			if( (viewportTop > $element_top) &&  (viewportTop < ($element_bottom - 100))) {
				$overlay.find('p').css({
					top: (viewportTop - $overlay_top) + 50,
				});
			}
		}
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
			type = this.model.get_property_value_by_name("display_type"),
			need_rerender = ( ( objects.length > 1 && !this._multiple ) || ( objects.length == 1 && this._multiple ) )
		;

		if ( objects.length > 1 && type !== '' ) {
			if ( Upfront.Application.user_can_modify_layout() && !this.$el.find('.reorder-overlay').length ) {
				this.$el.find('b.upfront-entity_meta').after('<div class="reorder-overlay"><p class="upfront-icon-swap-image"><span>'+ l10n.reoder_layout +'</span></p></div>');
				this.$el.addClass('uf-post-layout-edit');
			}
			this._multiple = true;
		} else {
			this.$el.removeClass('uf-post-layout-edit');
			this._multiple = false;
		}

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
			if ( 'PostsListsPartView' == view_class ) return true;
			else return ( include_spacer === true );
		});
	},

	render_view: function (type) {
		var me = this;

		if ( this.child_view ) {
			this.child_view.render(this.editing);
			this.render_view_after();
			return;
		}

		// Decode preset to make sure desktop one is applied properly before render
		this.model.decode_preset();

		type = type || Views.DEFAULT;
		var view = Views[type]
			? new Views[type]({model: this.model})
			: new Views[Views.DEFAULT]({model: this.model})
		;
		view.element = this;
		view.render();

		this.child_view = view;
		this.render_view_after();

		this.$el.find(".upfront-object-group-default").empty().append(view.$el);

		// Hide objects container if compat mode
		if ( this.is_compat() ) {
			this.$el.find(".upfront-objects_container").hide();
		}
	},

	render_view_after: function () {
		var me = this;

		if ( this.child_view._posts_load ){
			this.child_view._posts_load.success(function(){
				me.adjust_featured_images();
				Upfront.Events.trigger('entity:object:refresh', me);
			});
		}
	},

	render_post_view: function (post_id, data, silent) {
		var breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
			breakpoints = Upfront.Views.breakpoints_storage.get_breakpoints().get_enabled(),
			post_wrappers = this._posts_model.get('wrappers'),
			posts = this._posts_model.get('objects'),
			post = posts.find(function(obj){
				return parseInt(obj.get_property_value_by_name('post_id'), 10) === parseInt(post_id, 10);
			}),
			is_editable = ( posts.length === 0 || (post && posts.indexOf(post) === 0) ), // Only the first post is editable
			model = is_editable ? this.clone_model(this.model, false) : this.clone_model(this.model, true),
			post_view = post ? Upfront.data.object_views[post.cid] : false,
			post_col = this.model.get_breakpoint_property_value('post_col', true) || breakpoint['columns'],
			post_class = Upfront.Settings.LayoutEditor.Grid.class + post_col
		;

		if ( !post && breakpoint['default'] ) {
			var wrapper_id = Upfront.Util.get_unique_id("wrapper"),
				wrapper = new Upfront.Models.Wrapper({
					properties: [
						{ name: 'wrapper_id', value: wrapper_id },
						{ name: 'class', value: post_class }
					]
				})
			;
			// Set breakpoint columns
			_.each(breakpoints, function(each){
				var each_bp = each.toJSON();
				if ( each_bp['default'] ) return;
				var bp_post_col = this.model.get_breakpoint_property_value('post_col', false, post_col, each_bp);
				bp_post_col = bp_post_col <= each_bp['columns'] ? bp_post_col : each_bp['columns'];
				model.set_breakpoint_property('col', bp_post_col, true, each_bp);
				model.set_breakpoint_property('edited', true, true, each_bp); // Set edited to true to prevent adaptation
				wrapper.set_breakpoint_property('col', bp_post_col, true, each_bp);
				wrapper.set_breakpoint_property('edited', true, true, each_bp); // Set edited to true to prevent adaptation
			}, this);
			model.set_property('class', post_class);
			model.set_property('post_id', post_id);
			model.set_property('wrapper_id', wrapper_id);
			model.set_property('element_id', Upfront.Util.get_unique_id(Upfront.data.upfront_postslists.id_slug + '-object'));
			post_wrappers.add(wrapper, {silent: true});
			posts.add(model, {post_id: post_id, data: data, editable: is_editable});
		}
		else if ( post && !silent ) {
			var wrapper = post_wrappers.get_by_wrapper_id(post.get_wrapper_id());
			if ( breakpoint['default'] ) {
				post.replace_class(post_class);
				wrapper.replace_class(post_class);
			}
			else {
				post.set_breakpoint_property('col', post_col);
				wrapper.set_breakpoint_property('col', post_col);
			}
			if ( !is_editable ) { // Reset the objects and wrappers to new updated model
				var obj_wrappers = post.get('wrappers'),
					obj_objects = post.get('objects'),
					obj_wrappers_arr = obj_wrappers.map(function(wrap){ return wrap; }),
					obj_objects_arr = obj_objects.map(function(obj){ return obj; })
				;
				_.each(obj_objects_arr, function(object){
					obj_objects.remove(object);
				});
				_.each(obj_wrappers_arr, function(wrapper){
					obj_wrappers.remove(wrapper);
				});
				model.get('wrappers').each(function(wrap){
					obj_wrappers.add(wrap);
				});
				model.get('objects').each(function(obj){
					obj_objects.add(obj);
				});
			}
			if ( post_view ) {
				post_view.render_object_view(data);
			}
		}
	},

	clone_model: function (model, unique) {
		var cloned = Upfront.Util.clone(Upfront.Util.model_to_json(model)),
			new_model = new PostsListsModel(cloned)
		;
		if ( unique ) {
			new_model.get('wrappers').each(function(wrapper){
				var wrapper_id = wrapper.get_wrapper_id(),
					new_wrapper_id = Upfront.Util.get_unique_id('wrapper')
				;
				wrapper.set_property('wrapper_id', new_wrapper_id);
				wrapper.set_property('ref_wrapper_id', wrapper_id);
				new_model.get('objects').each(function(object){
					if ( object.get_wrapper_id() !== wrapper_id ) return;
					var object_id = object.get_element_id();
					object.set_property('wrapper_id', new_wrapper_id);
					object.set_property('element_id', Upfront.Util.get_unique_id(Upfront.data.upfront_postslists_part.id_slug + '-object'));
					object.set_property('ref_element_id', object_id);
				});
			});
		}
		else {
			// Not unique, use the same objects and wrappers
			new_model.set('wrappers', model.get('wrappers'));
			new_model.set('objects', model.get('objects'));
		}
		new_model.set_property('view_class', 'PostsListsEachView');
		return new_model;
	},

	enable_object_edit: function () {

		if(typeof this._posts_model === "undefined" || this._posts_model === false) {
			this._posts_model = new Upfront.Models.ObjectGroup();
		}

		var breakpoint = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().toJSON(),
			ed = Upfront.Behaviors.GridEditor,
			wrappers = this._posts_model.get('wrappers'),
			objects = this._posts_model.get('objects'),
			$module = this.parent_module_view.$el.find('> .upfront-module'),
			col = ( !breakpoint || breakpoint['default'] ) ? ed.get_class_num($module, ed.grid['class']) : $module.data('breakpoint_col'),
			post_col = this.model.get_breakpoint_property_value('post_col', true) || col
		;

		// Create spacer to simulate resizing experience
		objects.each(function(object){
			var obj_view = Upfront.data.object_views[object.cid],
				wrapper = wrappers.get_by_wrapper_id(object.get_wrapper_id()),
				wrapper_view = wrapper ? Upfront.data.wrapper_views[wrapper.cid] : false
			;
			if ( !obj_view.editable ) return;
			if ( !wrapper_view ) return;
			if ( col-post_col <= 0 ) return;
			ed.start(obj_view, object);
			wrapper_view.add_spacer('right', col-post_col, col, true);
		});

		Upfront.Views.ObjectGroup.prototype.enable_object_edit.call(this);
	},

	on_posts_layout_edit: function () {
		var wrappers = this._posts_model.get('wrappers'),
			objects = this._posts_model.get('objects'),
			to_remove = []
		;

		// Remove any spacers that simulate resizing experience
		objects.each(function(object){
			var wrapper = wrappers.get_by_wrapper_id(object.get_wrapper_id()),
				object_class = object.get_property_value_by_name('class'),
				is_spacer = !!object_class.match(/upfront-object-spacer/)
			;
			if ( !is_spacer ) return;
			to_remove.push({
				wrapper: wrapper,
				object: object}
			);
		});
		_.each(to_remove, function(each) {
			wrappers.remove(each.wrapper);
			objects.remove(each.object);
		});

		this.on_finish();
		// Also update all posts object
		var type = this.model.get_property_value_by_name("display_type");
		this.render_view(type);
	},

	after_breakpoint_change: function () {
		// Re-render all posts object
		var type = this.model.get_property_value_by_name("display_type");
		this.render_view(type);
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


var PostsListsElement = Upfront.Views.Editor.Sidebar.Element.extend({
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

		var presets = (Upfront.mainData || {})["postslistsPresets"] || [],
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
					{ name: 'class', value: 'c24 upostslist-object' }
				]
			}),
			object = new PostsListsPartModel({
				properties: [
					{ name: 'view_class', value: 'PostsListsPartView' },
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
			object = new PostsListsModel({
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


Upfront.Application.LayoutEditor.add_object("Upostslist", {
	"Model": PostsListsModel,
	"View": PostsListsView,
	"Element": PostsListsElement,
	"Settings": PostsListsSettings,
	cssSelectors: {
		'.upostslist-object ul': {label: l10n.css.container_label, info: l10n.css.container_info},
		'.upostslist-object li': {label: l10n.css.post_label, info: l10n.css.post_info},
		'.upostslist-object li .date_posted': {label: l10n.css.date_label, info: l10n.css.date_info},
		'.upostslist-object li .author': {label: l10n.css.author_label, info: l10n.css.author_info},
		'.upostslist-object li .post_categories': {label: l10n.css.categories_label, info: l10n.css.categories_info},
		'.upostslist-object li .comment_count': {label: l10n.css.comment_count_label, info: l10n.css.comment_count_info},
		'.upostslist-object li .content': {label: l10n.css.content_label, info: l10n.css.content_info},
		'.upostslist-object li .gravatar': {label: l10n.css.gravatar_label, info: l10n.css.gravatar_info},
		'.upostslist-object li .read_more': {label: l10n.css.read_more_label, info: l10n.css.read_more_info},
		'.upostslist-object li .post_tags': {label: l10n.css.post_tags_label, info: l10n.css.post_tags_info},
		'.upostslist-object li .thumbnail': {label: l10n.css.thumbnail_label, info: l10n.css.thumbnail_info},
		'.upostslist-object li .title': {label: l10n.css.title_label, info: l10n.css.title_info}
	},
	cssSelectorsId: Upfront.data.upfront_postslists.type
});
Upfront.Models.PostsListsModel = PostsListsModel;
Upfront.Views.PostsListsView = PostsListsView;
Upfront.Views.PostsListsEachView = PostsListsEachView;
Upfront.Models.PostsListsPartModel = PostsListsPartModel;
Upfront.Views.PostsListsPartView = PostsListsPartView;


});
}(jQuery));
