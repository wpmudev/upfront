(function ($) {

define(['models', 'views', 'editor_views', 'behaviors', 'upfront-data', 'jquery-df', 'jquery-simulate', 'scripts/backbone-query-parameters/backbone-query-parameters', 'responsive', 'findandreplace'], function (models, views, editor, behaviors, data, findandreplace) {
  _.extend(Upfront, data);
  Upfront.Events.trigger('data:ready');
  _.extend(Upfront, models);
  _.extend(Upfront, views);
  _.extend(Upfront.Views, editor);
  _.extend(Upfront, behaviors);

var Subapplication = Backbone.Router.extend({
	start: function () {
		Upfront.Util.log("Implement runner method");
	},

	go: function (frag) {
		Upfront.Events.trigger("subapplication:navigate:" + frag);
		return this.navigate(frag);
	},

	get_layout_data: function() {
		var data = Upfront.Util.model_to_json(this.layout);
		data.layout = _upfront_post_data.layout;
		return data;
	}
});

var LayoutEditorSubapplication = Subapplication.extend({
	save_layout_changes: function (layout_changed) {
		Upfront.Behaviors.LayoutEditor.save_dialog(this._save_layout, this, layout_changed, false);
	},

	save_layout_as: function () {
		if ( _upfront_post_data.layout.type == 'archive' ) {
			Upfront.Behaviors.LayoutEditor.save_dialog(this._save_layout, this, true, true);
		}
	},

	save_layout: function () {
		this._save_layout(this.layout.get("current_layout"));
	},

	save_post_layout: function ($post_layout_key) {
		this._save_layout($post_layout_key);
	},

	save_layout_meta: function () {
		this._save_layout_meta(this.layout.get("current_layout"));
	},

	publish_layout: function () {
		this._save_layout(this.layout.get("current_layout"), true);
	},

	delete_layout: function () {
		this._delete_layout();
	},

	reset_changes: function () {
		this._reset_changes();
	},

	_save_layout_meta: function (preferred_layout, publish) {
		var me = this,
			post_id = ( typeof _upfront_post_data.post_id !== 'undefined' ) ? _upfront_post_data.post_id : '',
			template_type = ( typeof _upfront_post_data.template_type !== 'undefined' ) ? _upfront_post_data.template_type : 'layout',
			template_slug = ( typeof _upfront_post_data.template_slug !== 'undefined' ) ? _upfront_post_data.template_slug : '',
			save_dev = ( _upfront_storage_key != _upfront_save_storage_key ? 1 : 0 );

		Upfront.Events.trigger("command:layout:save_start");

		if (Upfront.Settings.Application.NO_SAVE) {
			Upfront.Events.trigger("command:layout:save_success");
			return false;
		}
		Upfront.Util.post({
				"action": Upfront.Application.actions.save_meta,
				"post_id": post_id,
				"save_dev": save_dev,
				"template_type": template_type,
				"template_slug": template_slug
			})
			.success(function () {
				Upfront.Util.log("layout applied");

				// remove the old cache of layouts as cache will be updated upon loading layouts
				var url_key = '/' + Backbone.history.getFragment();
				Upfront.Application.urlCache[url_key] = false;

				setTimeout(function(){
					Upfront.Application.load_layout(_upfront_post_data.layout);
					Upfront.Events.trigger("command:layout:save_success");
				},100);

			})
			.error(function () {
				Upfront.Util.log("error saving layout");
				Upfront.Events.trigger("command:layout:save_error");
			})
		;
	},

	_save_layout: function (preferred_layout, publish) {
		var data = Upfront.Util.model_to_json(this.layout),
			storage_key = publish === true ? _upfront_storage_key : _upfront_save_storage_key,
			post_id = ( typeof _upfront_post_data.post_id !== 'undefined' ) ? _upfront_post_data.post_id : '',
			template_type = ( typeof _upfront_post_data.template_type !== 'undefined' ) ? _upfront_post_data.template_type : 'layout',
			template_slug = ( typeof _upfront_post_data.template_slug !== 'undefined' ) ? _upfront_post_data.template_slug : '',
			layout_action = ( typeof _upfront_post_data.layout_action !== 'undefined' ) ? _upfront_post_data.layout_action : '',
			layout_change = ( typeof _upfront_post_data.layout_change !== 'undefined' ) ? _upfront_post_data.layout_change : 0,
			save_dev = ( _upfront_storage_key != _upfront_save_storage_key ? 1 : 0 ),
			breakpoint = Upfront.Settings.LayoutEditor.CurrentBreakpoint,
			is_responsive = breakpoint && !breakpoint['default']
		;
		data.layout = _upfront_post_data.layout;
		data.preferred_layout = preferred_layout;
		data = JSON.stringify(data, undefined, 2);

		Upfront.Events.trigger("command:layout:save_start");

		if (Upfront.Settings.Application.NO_SAVE) {
			Upfront.Events.trigger("command:layout:save_success");
			return false;
		}
		data = Upfront.Util.colors.update_colors_to_match_ufc(data);
		Upfront.Util.post({
				"action": Upfront.Application.actions.save,
				"data": data,
				"storage_key": storage_key,
				"post_id": post_id,
				"layout_action": layout_action,
				"layout_change": layout_change,
				"save_dev": save_dev,
				"template_type": template_type,
				"template_slug": template_slug
			})
			.success(function (resp) {
				Upfront.Util.log("layout saved");
				Upfront.Events.trigger("command:layout:save_success");

				if ( layout_action == 'save_as' ) {
					// refresh page templates list
					_upfront_post_data.layout_action = '';
					_upfront_post_data.template_slug = resp.data.template_slug;
					_upfront_post_data.added_template_name = resp.data.template_name;
					Upfront.Events.trigger("update:page:layout:list");
				} else if ( layout_action == 'update' ) {
					// for updating page template
					_upfront_post_data.layout_action = '';
					Upfront.Events.trigger("page:layout:updated");
				}

				// remove the old cache of layouts as cache will be updated upon loading layouts
				var url_key = '/' + Backbone.history.getFragment();
				Upfront.Application.urlCache[url_key] = false;

			})
			.error(function () {
				Upfront.Util.log("error saving layout");
				Upfront.Events.trigger("command:layout:save_error");
			})
		;
	},

	_delete_layout: function () {
		var me = this,
			template_slug = ( typeof _upfront_post_data.template_slug !== 'undefined' ) ? _upfront_post_data.template_slug : '',
			is_dev = ( _upfront_storage_key != _upfront_save_storage_key ) ? 1 : 0
		;
		Upfront.Events.trigger("command:layout:save_start");
		Upfront.Util.post({
				"action": Upfront.Application.actions.delete_layout,
				"template_slug": template_slug,
				"is_dev": is_dev
			})
			.done(function () {
				Upfront.Events.trigger("command:layout:save_success");
				Upfront.Application.load_layout(_upfront_post_data.layout);
			})
		;
	},

	_reset_changes: function () {
		var me = this,
			post_id = ( typeof _upfront_post_data.post_id !== 'undefined' ) ? _upfront_post_data.post_id : '',
			is_dev = ( _upfront_storage_key != _upfront_save_storage_key ) ? 1 : 0
		;
		Upfront.Events.trigger("command:layout:save_start");
		Upfront.Util.post({
				"action": Upfront.Application.actions.reset_changes,
				"post_id": post_id,
				"is_dev": is_dev
			})
			.done(function () {
				Upfront.Events.trigger("command:layout:save_success");
				Upfront.Application.load_layout(_upfront_post_data.layout);
			})
		;
	},

	preview_layout: function () {
		var preview = false,
			url = false
		;
		url = Upfront.PreviewUpdate.preview_url();
		if (!url) {
			Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.application.preview_not_ready);
			return false;
		}
		preview = window.open(url, "_blank");
	},

	list_revisions: function () {
		var data = {
			action: "upfront_list_revisions",
			cascade:  _upfront_post_data.layout,
			current_url: window.location.href
		};
		Upfront.Util.post(data)
			.done(function (resp) {
				Upfront.Popup.open(function () {
					var tpl = _.template(
						'<h3>' + Upfront.Settings.l10n.global.application.revisions + '</h3><ul>{[ _.each(data, function (item) { ]}' +
							'<li><a target="_blank" href="{{item.preview_url}}">{{item.date_created}}</a><br /><small>' +  Upfront.Settings.l10n.global.application.created_by + ' {{item.created_by.display_name}}</small></li>' +
						'{[ }); ]}</ul>'
					);
					$(this).html(tpl(resp));
				});
			})
			.error(function (resp) {
				console.log(resp);
			})
		;
	},

	destroy_editor: function () {
		this.navigate("");
		window.location.reload();
		return false;
	},

	set_up_editor_interface: function () {
		if (!this.layout) return false;
		var app = this;

		var _set_up_draggables = function () {
			var elements = {},
				panel = Upfront.Application.sidebar.get_panel("elements"),
				sort_cb = function(element){ return element.priority; };
			_(app.Objects).each(function (obj, idx) {
				_.each(["Element", "DataElement", "PluginElement"], function(type_el){
					if ( !_.isObject(obj[type_el]) )
						return;
					var el = new obj[type_el]({"model": app.layout});
					el.element_type = idx;
					if ( !_.isArray(elements[type_el]) )
						elements[type_el] = [];
					elements[type_el].push(el);
				});
				if ( obj.Command )
					app.sidebar.get_commands("control").commands.push(new obj.Command({"model": app.layout}));
			});
			panel.get_section("layout").elements = _(_.sortBy(elements.Element, sort_cb));
			panel.get_section("data").elements = _(_.sortBy(elements.DataElement, sort_cb));
			panel.get_section("plugins").elements = _(_.sortBy(elements.PluginElement, sort_cb));
			Upfront.Application.sidebar.render();
		};
		Upfront.Events.trigger("application:setup:editor_interface");
		_set_up_draggables();
		//this.listenTo(Upfront.Events, "elements:requirements:async:added", _set_up_draggables); // Deprecated
	},

	add_object: function (name, data) {
		this.Objects[name] = _.extend({}, Upfront.Mixins.Anchorable, data);
	},

	remove_object: function (name) {
		delete this.Objects[name];
	},


	set_up_event_plumbing_before_render: function () {
		// Set up behavior
		this.listenTo(Upfront.Events, "entity:module:after_render", Upfront.Behaviors.GridEditor.create_resizable);
		this.listenTo(Upfront.Events, "entity:module:after_render", Upfront.Behaviors.GridEditor.create_draggable);
		this.listenTo(Upfront.Events, "entity:module_group:after_render", Upfront.Behaviors.GridEditor.create_resizable);
		this.listenTo(Upfront.Events, "entity:module_group:after_render", Upfront.Behaviors.GridEditor.create_draggable);
		this.listenTo(Upfront.Events, "entity:wrapper:after_render", Upfront.Behaviors.GridEditor.create_wrapper_resizable);
		this.listenTo(Upfront.Events, "entity:object:after_render", Upfront.Behaviors.GridEditor.create_resizable);
		this.listenTo(Upfront.Events, "entity:object:after_render", Upfront.Behaviors.GridEditor.create_draggable);
		// Enable resizables and draggables
		//Upfront.Behaviors.GridEditor.toggle_resizables(true);
		//Upfront.Behaviors.GridEditor.toggle_draggables(true);

		this.listenTo(Upfront.Events, "entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_resizable);
		this.listenTo(Upfront.Events, "entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_draggable);
		this.listenTo(Upfront.Events, "entity:region_container:after_render", Upfront.Behaviors.LayoutEditor.create_mergeable);
		this.listenTo(Upfront.Events, "entity:region_container:after_render", Upfront.Behaviors.GridEditor.create_region_container_resizable);
		this.listenTo(Upfront.Events, "entity:region_sub_container:after_render", Upfront.Behaviors.GridEditor.create_region_container_resizable);

		if ( !Upfront.Behaviors.GridEditor.grid ) {
			Upfront.Behaviors.GridEditor.init();
		}
		this.listenTo(Upfront.Events, "layout:after_render", Upfront.Behaviors.GridEditor.init);
		if ( false === Upfront.plugins.isForbiddenByPlugin('show import image dialog') ) {
			this.listenTo(Upfront.Events, "layout:after_render", Upfront.Behaviors.LayoutEditor.import_image_dialog);
		}
	},

	set_up_event_plumbing_after_render: function () {
		// Set up properties
		//this.listenTo(Upfront.Events, "entity:activated", this.create_properties);
		//this.listenTo(Upfront.Events, "entity:deactivated", this.destroy_properties);

		// Layout manipulation
		this.listenTo(Upfront.Events, "command:exit", this.destroy_editor);
		this.listenTo(Upfront.Events, "command:layout:save", this.save_layout);
		this.listenTo(Upfront.Events, "command:layout:save_post_layout", this.save_post_layout);
		this.listenTo(Upfront.Events, "command:layout:save_meta", this.save_layout_meta);
		this.listenTo(Upfront.Events, "command:layout:delete_layout", this.delete_layout);
		this.listenTo(Upfront.Events, "command:layout:reset_changes", this.reset_changes);
		this.listenTo(Upfront.Events, "command:layout:layout_changes", this.save_layout_changes);
		this.listenTo(Upfront.Events, "command:layout:save_as", this.save_layout_as);
		this.listenTo(Upfront.Events, "command:layout:preview", this.preview_layout);
		this.listenTo(Upfront.Events, "command:layout:publish", this.publish_layout);

		// Region
		this.listenTo(Upfront.Events, "command:region:edit_toggle", Upfront.Behaviors.GridEditor.toggle_region_resizable);
		this.listenTo(Upfront.Events, "command:region:fixed_edit_toggle", Upfront.Behaviors.GridEditor.toggle_region_resizable);
		this.listenTo(Upfront.Events, "command:region:fixed_edit_toggle", Upfront.Behaviors.GridEditor.toggle_region_draggable);

		// Selection
		this.listenTo(Upfront.Events, "command:selection:remove", Upfront.Behaviors.LayoutEditor.remove_selections);

		// Undo / Redo
		this.listenTo(Upfront.Events, "entity:activated", Upfront.Behaviors.LayoutEditor.create_undo);
		this.listenTo(Upfront.Events, "entity:resize_start", Upfront.Behaviors.LayoutEditor.create_undo);
		this.listenTo(Upfront.Events, "entity:drag_start", Upfront.Behaviors.LayoutEditor.create_undo);
		this.listenTo(Upfront.Events, "entity:removed:before", Upfront.Behaviors.LayoutEditor.create_undo);
		this.listenTo(Upfront.Events, "entity:region:activated", Upfront.Behaviors.LayoutEditor.create_undo);

		this.listenTo(Upfront.Events, "command:undo", Upfront.Behaviors.LayoutEditor.apply_history_change);
		this.listenTo(Upfront.Events, "command:redo", Upfront.Behaviors.LayoutEditor.apply_history_change);

		// Set up entity settings (modules, for now)
		this.listenTo(Upfront.Events, "entity:settings:activate", this.create_settings);
		this.listenTo(Upfront.Events, "entity:settings:deactivate", this.destroy_settings);
		this.listenTo(Upfront.Events, "entity:removed:after", this.destroy_settings);

		// Set up entity context menu
		this.listenTo(Upfront.Events, "entity:contextmenu:activate", this.create_menu);
		this.listenTo(Upfront.Events, "entity:contextmenu:deactivate", this.destroy_menu);
		//this.listenTo(Upfront.Events, "entity:removed:after", this.destroy_settings);

		//this.layout_views.listenTo(Upfront.Events, "upfront:posts:post:post_updated", this.layout_view.render);

		// Showing the "busy" overlay on saving.
		var loading = false,
			start = function () {
				loading = new Upfront.Views.Editor.Loading({
					loading: Upfront.Settings.l10n.global.application.saving,
					done: Upfront.Settings.l10n.global.application.saving_success,
					fixed: true
				});
				loading.render();
				// if there are any active loading overlay, remove it first
				if ( $('.upfront-loading').length ) $('.upfront-loading').remove();
				// append loading overlay
				$('body').append(loading.$el);
			},
			stop = function (success) {
				if (!success) {
					loading.update_loading_text(Upfront.Settings.l10n.global.application.saving_error);
				}
				loading.on_finish(function(){
					Upfront.Events.trigger("command:layout:save_done", success);
				});
				if (!success) {
					loading.done(false, Upfront.Settings.l10n.global.application.saving_error);
				} else {
					loading.done();
				}
			}
		;
		this.listenTo(Upfront.Events, "command:layout:save_start", start);
		this.listenTo(Upfront.Events, "command:layout:save_success", function(){ stop(true); });
		this.listenTo(Upfront.Events, "command:layout:save_error", function(){ stop(false); });
		this.listenTo(Upfront.Events, "command:themefontsmanager:open", Upfront.Behaviors.LayoutEditor.open_theme_fonts_manager);
		this.listenTo(Upfront.Events, "command:layout:edit_global_regions", Upfront.Behaviors.LayoutEditor.open_global_region_manager);

		this.listenTo(Upfront.Events, "command:layout:save_success", Upfront.Behaviors.LayoutEditor.clean_region_css);
		this.listenTo(Upfront.Events, "command:layout:save_success", Upfront.Behaviors.LayoutEditor.clean_global_regions);
	},

	create_properties: function (view, model) {
		this.property_view = new Upfront.Views.Editor.Properties({
			"model": model,
			"el": $(Upfront.Settings.LayoutEditor.Selectors.properties)
		});
		this.property_view.render();
	},

	destroy_properties: function () {
		$(Upfront.Settings.LayoutEditor.Selectors.properties).html('');
	},

	create_menu: function( view ) {

		var current_object = _(this.Objects).reduce(function (obj, current) {
				return (view instanceof current.View) ? current : obj;
			}, false)
		;
		current_object = (current_object && current_object.ContextMenu ? current_object : Upfront.Views.ContextMenu);
		if(current_object.ContextMenu === false)
			return false;
		else if (typeof current_object.ContextMenu == 'undefined')
			current_object.ContextMenu = Upfront.Views.ContextMenu;

        var context_menu_view = new current_object.ContextMenu({
            model: view.model,
            for_view: view,
            el: $(Upfront.Settings.LayoutEditor.Selectors.contextmenu)
        })
		;

		context_menu_view.for_view = view;
		context_menu_view.render();
		this.context_menu_view = context_menu_view;

	},
	destroy_menu: function () {
		if (!this.context_menu_view) return false;
		$(Upfront.Settings.LayoutEditor.Selectors.contextmenu).html('').hide();
		this.context_menu_view = false;

		//context_menu_view.trigger('closed');
	},
	create_settings: function (view, settings_obj_view) {
		var current_object, settings_view;

		if (this.settings_view) return this.destroy_settings();

		if (!parseInt(view.model.get_property_value_by_name("has_settings"), 10)) return false;

		if ( !settings_obj_view ) {
			current_object = _(this.Objects).reduce(function (obj, current) {
				if(view instanceof current.View){
					return current;
				}
				return obj;
			}, false);
			current_object = (current_object && current_object.Settings ? current_object : Upfront.Views.Editor.Settings);
			settings_obj_view = current_object.Settings;
		}

		settings_view = new settings_obj_view({
			model: view.model,
			anchor: ( current_object ? current_object.anchor : false ),
			el: $(Upfront.Settings.LayoutEditor.Selectors.settings)
		});
		settings_view.for_view = view;
		settings_view.render();
		this.settings_view = settings_view;
		settings_view.trigger('rendered');
	},

	destroy_settings: function () {
		if (!this.settings_view) return false;

		this.settings_view.trigger('closed');

		this.settings_view.remove();
		this.settings_view = false;

		//Restore the settings div
		$('body').append('<div id="settings"/>');
	},

	create_post: function(postType){
		Upfront.Settings.LayoutEditor.newpostType = postType;
		this.load_layout({item: 'single-' + postType, type: 'single'});
	},

	openLightboxRegion: function(regionName){
		var regions = Upfront.Application.layout.get('regions'),
			region = regions.get_by_name(regionName)
		;

		if(!region)
			return;

		//hide other lightboxes
		_.each(regions.models, function(model) {
			if(model.attributes.sub == 'lightbox')
				Upfront.data.region_views[model.cid].hide();
		});

		Upfront.data.region_views[region.cid].show();
	},
	getLightboxSafeName: function(regionName) {
		var regions = (this.layout && this.layout.get ? this.layout.get('regions') : Upfront.Application.current_subapplication.layout.get('regions')),
			region = regions ? regions.get_by_name('lightbox') : false;

		if ( ! region ){
			region = new Upfront.Models.Region({
				"name": "lightbox",
				"container": "lightbox",
				"title": "lightbox Region"
			});
			region.add_to(regions, regions.length-1);
		}

		return 'ltb-' + regionName.toLowerCase().replace(/\s/g, '-') + (regions.length+1);
	},
	createLightboxRegion: function(regionName){

		var regions = (this.layout && this.layout.get ? this.layout.get('regions') : Upfront.Application.current_subapplication.layout.get('regions'));
		//	region = regions ? regions.get_by_name('lightbox') : false;

		/*if ( ! region ){
			region = new Upfront.Models.Region({
				"name": "lightbox",
				"container": "lightbox",
				"title": "lightbox Region"
			});
			region.add_to(regions, regions.length-1);
		}*/

		var	safeName = this.getLightboxSafeName(regionName),
			lightbox = new Upfront.Models.Region(_.extend({}, Upfront.data.region_default_args, {
				name: safeName,
				container: 'lightbox',
				title: regionName,
				type: 'lightbox',
				sub: 'lightbox'
			}))
		;

		lightbox.init_properties({
			col: 10,
			height: 400,
			click_out_close: 'yes',
			show_close: 'yes',
			overlay_color: 'rgba(38,58,77,0.75)',
			lightbox_color: 'rgba(248,254,255,0.9)'
		});

		//Wait for the region view to be added and open it
		this.listenToOnce(Upfront.Events, 'entity:region:added', this.openNewRegion);
		lightbox.add_to(regions, regions.length-1, {sub: 'lightbox'});

		return safeName;
	},

	openNewRegion: function(region){
		if(region.show){
			region.show();
			region.on_settings_click();
		}
	}
});

var LayoutEditor = new (LayoutEditorSubapplication.extend({
	Objects: {},

	boot: function () {

	},

	start: function () {
		this.stop();
		this.set_up_event_plumbing_before_render();
		this.set_up_editor_interface();

		this.set_up_event_plumbing_after_render();
		$("html").removeClass("upfront-edit-content upfront-edit-theme upfront-edit-postlayout upfront-edit-responsive").addClass("upfront-edit-layout");
	},

	stop: function () {
		return this.stopListening(Upfront.Events);
	}

}))();



var PostContentEditor = new (Subapplication.extend({
	initialize: function(){
		this.listenTo(Upfront.Events, 'post:content:edit:start', this.startContentEditorMode);
		this.listenTo(Upfront.Events, 'post:content:edit:stop', this.stopContentEditorMode);
	},

	boot: function () {
		Upfront.Util.log("Preparing post content mode for execution");
        Upfront.Events.trigger('upfront:post:edit:booted', this);
    },

	start: function () {
		Upfront.Util.log("Starting post the content edit mode");
	},

	stop: function () {
		var $page = $('#page');
		Upfront.Util.log("Stopping post the content edit mode");
		$page.find('.upfront-module').each(function(){
			if ( $(this).is('.ui-draggable') )
				$(this).draggable('enable');
			if ( $(this).is('.ui-resizable') )
				$(this).resizable('enable');
		});
		Upfront.Events.trigger('upfront:element:edit:stop');
		$page.find('.upfront-region-edit-trigger').show();
		this.contentEditor = false;
	},

	startContentEditorMode: function(contentEditor){
		if(Application.current_subapplication == PostContentEditor)
			return;

		this.contentEditor = contentEditor;

		var $page = $('#page');

		//There is no need of start the application, just set the current one
		//Application.set_current(Application.MODE.POSTCONTENT);
		//$page.find('.upfront-module').each(function(){
		//	if ( $(this).is('.ui-draggable') )
		//		$(this).draggable('disable');
		//	if ( $(this).is('.ui-resizable') )
		//		$(this).resizable('disable');
		//});
		//Upfront.Events.trigger('upfront:element:edit:start', 'write', contentEditor.post);
		//$page.find('.upfront-region-edit-trigger').hide();

		Upfront.Events.on('content:insertcount:updated', this.updateInsertCount);
	},

	stopContentEditorMode: function(){
		Upfront.Events.off('content:insertcount:updated', this.updateInsertCount);
		if(Application.current_subapplication == PostContentEditor)
			Application.start(Application.mode.last);
	},
	updateInsertCount: function(){
		console.log('update insertcount');
		Upfront.Util.post({
			action: 'upfront_update_insertcount'
		});
	}
}))();



var ContentEditor = new (Subapplication.extend({
	boot: function () {
		Upfront.Util.log("Preparing content mode for execution");
	},

	start: function () {
		Upfront.Util.log("Starting the content edit mode");
		if ( !Upfront.Behaviors.GridEditor.grid ) {
			Upfront.Behaviors.GridEditor.init();
		}

		$("html").removeClass("upfront-edit-layout upfront-edit-theme upfront-edit-postlayout upfront-edit-responsive").addClass("upfront-edit-content");
	},

	stop: function () {
		Upfront.Util.log("Stopping the content edit mode");
		this.stopListening(Upfront.Events);
	}
}))();

var ResponsiveEditor = new (LayoutEditorSubapplication.extend({
	Objects: {},

	boot: function () {
	},

	start: function () {
		this.stop();
		this.Objects = Upfront.Application.LayoutEditor.Objects;
		this.set_up_event_plumbing_before_render();
    	Upfront.Application.sidebar.render();
    	this.topbar = new Upfront.Views.Editor.Topbar.Topbar();
    	this.topbar.start();
		this.set_up_event_plumbing_after_render();
		this.listenTo(Upfront.Events, "command:layout:browse", Upfront.Behaviors.LayoutEditor.browse_layout_dialog); // DEPRECATED

		$("html").removeClass("upfront-edit-content upfront-edit-theme upfront-edit-postlayout upfront-edit-layout").addClass("upfront-edit-responsive");
	},

	stop: function () {
		if ( this.topbar )
		    this.topbar.stop();
		return this.stopListening(Upfront.Events);
	}

}))();

var Application = new (Backbone.Router.extend({
	LayoutEditor: LayoutEditor,
	ContentEditor: ContentEditor,
	PostContentEditor: PostContentEditor,
	ResponsiveEditor: ResponsiveEditor,

	actions: {
		"save": "upfront_save_layout",
		"save_meta": "upfront_save_layout_meta",
		"delete_layout": "upfront_delete_page_template",
		"reset_changes": "upfront_reset_layout",
		"load": "upfront_load_layout"
	},

	routes: {
		"done": "destroy_editor",
		"new-layout": "dispatch_layout_creation",
		"create_new(/:postType)": "create_new_entry",
		"*otherRoutes": "fetchLayout"
	},

	MODE: {
		CONTENT: "content",
		LAYOUT: "layout",
		THEME: "theme",
		POST: 'post layout',
		POSTCONTENT: "post content",
		RESPONSIVE: "responsive"
	},

	mode: {
		last: false,
		current: false
	},
	set_post_content_style: function(mode){
		mode = typeof mode === "undefined" ? true : mode;
		this.MODE.POSTCONTENT_STYLE = mode;
		return true;
	},
	is_post_content_style: function(){
		return this.MODE.POSTCONTENT_STYLE === this.mode.current;
	},
	is_builder: function(){
		return this.mode.current === this.MODE.THEME || this.mode.last === this.MODE.THEME;
	},
	is_editor: function(){
		return !this.is_builder();
	},
	is_single: function(post_type){
		if ( !('type' in _upfront_post_data.layout && 'single' === _upfront_post_data.layout.type) ) return false;
		if ( typeof post_type === "undefined" ) return true;
		if ( 'item' in _upfront_post_data.layout && 'single-'+post_type === _upfront_post_data.layout.item ) return true;
		return false;
	},
	is_archive: function(item){
		if ( !('type' in _upfront_post_data.layout && 'archive' === _upfront_post_data.layout.type) ) return false;
		if ( typeof item === "undefined" ) return true;
		if ( 'item' in _upfront_post_data.layout && 'archive-'+item === _upfront_post_data.layout.item ) return true;
		return false;
	},
	urlCache: {},

	current_subapplication: false,
	sidebar: false,
	layout: false,

	layout_ready: false,

	responsiveMode: false,

	boot: function () {
		this.MODE = Upfront.Settings.Application.MODE;
		var me = this;
		$("body .upfront-edit_layout a").addClass('active');
		$("body").off("click", ".upfront-edit_layout").on("click", ".upfront-edit_layout", function () {

			me.start();
			return false;
		});
		$(document).trigger("upfront-load");
	},

	start: function (mode) {
		// Main stylesheet needs to be loaded without element styles
		// which will be edited in upfront.
		Upfront.Util.post({
			action: 'upfront_load_styles',
			layout: {
				item: 'archive-home',
				type: 'archive'
			},
			base_only: true // flag for w/o element styles
		})
			.success(function(response) {
				// Switch styles
				$('#upfront-main-css').after('<style id="upfront-main-base-css">' + response.data.styles + '</style>');
				$('#upfront-main-css').remove();
			});

		if (!mode) mode = this.MODE.DEFAULT;
		if (this.mode.current == mode) return false;

		$('#wpadminbar').hide();
		$('html').attr('style', 'margin-top: 0 !important;');

		this.set_current(mode);
		if (!(this.current_subapplication && this.current_subapplication.start)) {
			Upfront.Util.log("Can't boot invalid subapplication");
		}
		Upfront.Events.trigger("application:mode:before_switch");

		this.listenToResponsiveModes();

		if (!!this.layout) {
			var regions = this.layout.get("regions"),
				region = regions.get_by_name("shadow")
			;
			if (regions && region) regions.remove(region);
			this.create_sidebar();
			this.current_subapplication.layout = this.layout;
			if (this.current_subapplication && this.current_subapplication.start) this.current_subapplication.start();
			else Upfront.Util.log("No current subapplication");
			Upfront.Events.trigger("application:mode:after_switch");
			return false;
		}

		var app = this;
		// Get the appropriate Loading Notice – whether builder or editor.
		var loadingNoticeResult = Upfront.plugins.call('long-loading-notice');
		// Editor Notice.
		var loadingNotice = Upfront.Settings.l10n.global.application.long_loading_notice;
		if(loadingNoticeResult.status && loadingNoticeResult.status === 'called' && loadingNoticeResult.result) {
			// If Builder is loading, use its long_loading_notice instead.
			loadingNotice = loadingNoticeResult.result;
		}
		// Start loading animation
		app.loading = new Upfront.Views.Editor.Loading({
			loading: Upfront.Settings.l10n.global.application.loading,
			loading_notice: loadingNotice,
			loading_type: 'upfront-boot',
			done: Upfront.Settings.l10n.global.application.thank_you_for_waiting,
			fixed: true,
			remove_on_event: 'upfront:renderingqueue:start'
		});
		app.loading.on_finish(function(){
			$(Upfront.Settings.LayoutEditor.Selectors.sidebar).show();
			$(".upfront-editable_trigger").hide();

			// Disable settings if LAYOUT_MODE permission is disabled
			if (!Upfront.Application.user_can_modify_layout()) {
				app.setup_edit_layout();
			}
		});
		app.loading.render();
		$('body').append(app.loading.$el);

		/*setTimeout(function(){
			if ( app.loading.is_done ) return;
			app.loading.update_loading_notice(Upfront.Settings.l10n.global.application.long_loading_notice);
		}, 10000);*/

		app.create_sidebar();

		require(
			[
				"objects",
				'media',
				'content',
				'bg-settings',
				'spectrum',
				'responsive',
				"uaccordion",
				'redactor',
				'ueditor',
				'utext',
				"ucomment",
				"ucontact",
				"ugallery",
				"uimage",
				"upfront-like-box",
				"upfront_login",
				"upfront_maps",
				"unewnavigation",
				"ubutton",
				"uposts",
				"usearch",
				"upfront_slider",
				"upfront-social_media",
				"utabs",
				"this_post",
				"upostdata",
				"this_page",
				"uwidget",
				"uyoutube",
				"upfront_code",
				"uspacer"
			],
			function (objects) {
				app.currentUrl = window.location.pathname + window.location.search;
				app.saveCache = true;
				app.load_layout(_upfront_post_data.layout);
				//app.load_layout(window.location.pathname + window.location.search);
				app.start_navigation();

				app.create_cssEditor();

                $(document).trigger('Upfront:loaded');
				Upfront.Events.trigger('Upfront:loaded');
			}
		);
	},

	stop: function () {

	},

	restart: function () {
		var last = this.mode.last || this.MODE.DEFAULT;
		this.start(last);
	},

	setup_edit_layout: function() {
		var app = this;

		app.loading.on_finish(function(){
			var $page = $('#page');

			//Remove region edit button
			$page.find('.upfront-region-edit-trigger').remove();

			//Remove delete buttons
			$('a.upfront-entity-delete_trigger').remove();
		});
	},


	load_layout: function (layout_ids, additional) {
		var app = this,
			request_data = {
				action: this.actions.load,
				data: layout_ids,
				load_dev: ( _upfront_storage_key != _upfront_save_storage_key ? 1 : 0 )
			}
		;
		if (additional)
			request_data = _.extend(request_data, additional);

		if(_upfront_post_data)
			request_data.post_id = _upfront_post_data.post_id;

		$("body").removeClass(Upfront.Settings.LayoutEditor.Grid.scope);

		//If we are already loading a layout, abort the load
		if(this.loadingLayout)
			this.loadingLayout.abort();

		this.loadingLayout = Upfront.Util.post(request_data)
			.success(function (response) {
				app.set_layout_up(response);

				if(app.saveCache){
					app.urlCache[app.currentUrl] = $.extend(true, {}, response);
					app.saveCache = false;
				}
			})
			.error(function (xhr) {
				if(xhr.statusText == 'abort') //we are ok
					return;

				Upfront.Util.log("Error loading layout " + layout_ids);
				app.loading.cancel(function(){
					$(Upfront.Settings.LayoutEditor.Selectors.sidebar).hide();
					//$(".upfront-editable_trigger").show();
					$('#wpadminbar').show();
					$('html').removeAttr('style');
				});
			})
		;
		return this.loadingLayout;
	},

	create_layout: function (layout_ids, additional) {
		var app = this,
			request_data = {
				action: 'upfront_create_layout',
				data: layout_ids,
				load_dev: ( _upfront_storage_key != _upfront_save_storage_key ? 1 : 0 )
			}
		;
		if (additional)
			request_data = _.extend(request_data, additional);

		if(_upfront_post_data)
			request_data.post_id = _upfront_post_data.post_id;

		$("body").removeClass(Upfront.Settings.LayoutEditor.Grid.scope);

		//If we are already loading a layout, abort the load
		if(this.loadingLayout)
			this.loadingLayout.abort();

		this.loadingLayout = Upfront.Util.post(request_data)
			.success(function (response) {
				app.set_layout_up(response);
				if(app.saveCache){
					app.urlCache[app.currentUrl] = $.extend(true, {}, response);
					app.saveCache = false;
				}
			})
			.error(function (xhr) {
				if(xhr.statusText == 'abort') //we are ok
					return;

				Upfront.Util.log("Error creating layout " + layout_ids);
				app.loading.cancel(function(){
					$(Upfront.Settings.LayoutEditor.Selectors.sidebar).hide();
					//$(".upfront-editable_trigger").show();
					$('#wpadminbar').show();
					$('html').removeAttr('style');
				});
			})
		;
		return this.loadingLayout;
	},
	set_layout_up: function(layoutData){
		var me = this,
			data = $.extend(true, {}, layoutData.data.layout) || {} //Deep cloning
		;

		if ( typeof layoutData.data.template_type !== 'undefined' ) _upfront_post_data.template_type = layoutData.data.template_type;
		if ( typeof layoutData.data.template_slug !== 'undefined' ) _upfront_post_data.template_slug = layoutData.data.template_slug;
		if ( typeof layoutData.data.layout_change !== 'undefined' ) {
			_upfront_post_data.layout_change = parseInt(layoutData.data.layout_change, 10);
			if ( _upfront_post_data.layout_change !== 1 ) _upfront_post_data.layout_change = 0;
		}

		if (layoutData.data.post) {
			this.post_set_up(layoutData.data.post);
		}

		//Set the query for the posts
		var query = layoutData.data.query || {};

		if(this.layout){
			this.unset_layout();
			//We only set the query if there is already a layout.
			//In the first loading, upfront does it for us
			window._upfront_get_current_query = function(){ return query; };
		}

		this.layout = new Upfront.Models.Layout(data);
		this.current_subapplication.layout = this.layout;
		this.sidebar.model.set(this.layout.toJSON());

		if(typeof layoutData.data.post !== "undefined" && layoutData.data.post !== null) {
			if((layoutData.data.post.ID !== "undefined" && layoutData.data.query.post_count) || (layoutData.data.post.ID !== "undefined" && layoutData.data.cascade.type === "single") || layoutData.data.query.is_singular) {
				Upfront.Events.trigger('click:edit:navigate', layoutData.data.post.ID);
			} else {
				Upfront.Events.trigger('click:edit:navigate', false);
			}
		} else {
			Upfront.Events.trigger('click:edit:navigate', false);
		}

		var shadow = this.layout.get('regions').get_by_name("shadow");
		if(shadow)
			this.layout.get('regions').remove(shadow);

		window._upfront_post_data.layout = layoutData.data.cascade;

		Upfront.Events.trigger("upfront:layout:loaded");
		if (me.current_subapplication && me.current_subapplication.start)
			me.current_subapplication.start();

		else Upfront.Util.log("No current subapplication");

		Upfront.Events.once("layout:after_render", function(){
			me.layout_ready = true;
		});

		//if (!me.layout_view) {
		me.layout_view = new Upfront.Views.Layout({
			"model": me.layout,
			"el": $(Upfront.Settings.LayoutEditor.Selectors.main)
		});
		Upfront.Events.trigger('upfront:renderingqueue:settotal', me.layout_view);
		Upfront.Events.trigger("layout:render", me.current_subapplication);
		//}

		Upfront.Application.loading.done(function () {

			Upfront.PreviewUpdate.run(me.layout);

			Upfront.Events.trigger("application:mode:after_switch");
		});
	},

	unset_layout: function(){
		var layoutTag, layoutElement, newElement;

		Upfront.data.currentEntity = false;

		if(Upfront.data.Ueditor){
			_.each(Upfront.data.Ueditor.instances, function(ueditor){
				ueditor.stop();
			});
		}

		if(this.layout){
			this.layout.trigger('destroy');
			this.layout = false;
		}
		if(this.current_subapplication.layout)
			this.current_subapplication.layout = false;

		if(this.layout_view){
			//Create a new layout element, because it will be destroyed
			layoutElement = this.layout_view.el;
			layoutTag = {
				name: layoutElement.tagName,
				id: layoutElement.id,
				className: layoutElement.className
			};
			newElement = $('<' + layoutTag.name + '>');
			this.layout_view.$el.after(newElement);

			//Destroy
			this.layout_view.remove();
			this.layout_view = false;
			this.layout_ready = false;

			//Restore tag attributes
			newElement.attr({
				'class': layoutTag.className,
				'id': layoutTag.id
			});

			//Free region/object events
			Upfront.Events.off('upfront:editor:init'); // Link dispatcher, upfront-content.php
			Upfront.Events.off('upfront:post:taxonomy_changed'); // Link dispatcher, upfront-content.php
		}
		if(!$(Upfront.Settings.LayoutEditor.Selectors.main).length)
			$('body').prepend('<div id="page" />');

	},

	create_new_entry: function(post_type){
		var me= this,
			layoutOps = {
				item: 'single-' + post_type,
				type: 'single',
				specificity: 'single-' + post_type + '-1000000' //Big number to assure default layout
			},
			deferred = new $.Deferred(),
			postData = {},
			loading = this.set_loading(Upfront.Settings.l10n.global.application.preparing_new_post_type.replace(/%s/, post_type), Upfront.Settings.l10n.global.application.here_we_are)
		;

		// @TODO is this correct to call stop before load_layout? fixed double event assignment
		if (this.current_subapplication && this.current_subapplication.stop) {
			this.current_subapplication.stop();
		}


        Upfront.Events.once('upfront:post:edit:stop', function(action, post){
            me.navigate('/edit/' + post.post_type + '/' + post.ID + location.search, {trigger: false, replace: true});
        });

		//Set some listener for the new post view
		Upfront.Events.once('post:initialized', function(postView){
			postView
				.once('post:updated', function(post){
					//Update the url on save
					Upfront.Settings.LayoutEditor.newpostType = false;
					me.navigate('/edit/' + post.post_type + '/' + post.ID, {trigger: false, replace: true});
				})
			;
			me.listenToOnce(postView.editor, 'rendered', function(){
				setTimeout(function(){
					postView.editor.editContents(false, postView.$('.upfront-content-marker-title'));
				}, 200);
			});
		});

		//Load the new layout
		this.load_layout(layoutOps, {new_post: post_type}).done(function(response){

			Upfront.Settings.LayoutEditor.newpostType = post_type;
			postData = response.data.post;
            Upfront.data.posts[postData.ID].is_new = true;
			deferred.resolve(Upfront.data.posts[postData.ID]);
			loading.done();
		});

		return deferred.promise();
	},

	post_set_up: function(postData){

		//Create the post with meta
		postData.meta = [];
		var post = new Upfront.Models.Post(postData);

		post.is_new = postData.post_status === 'draft' && postData.post_content.indexOf('<p') < 0 ;//postData.post_status == 'auto-draft' && postData.post_content === '';

		//Set global variables
		Upfront.data.posts[post.id] = post;
		_upfront_post_data.post_id = post.id;


		//Load body classes
		//var bodyClasses = 'logged-in admin-bar upfront customize-support flex-support'; // NOPE! Don't re-add the .upfront, it should have been removed:
		var bodyClasses = 'logged-in admin-bar customize-support flex-support';

		if(postData.post_type == 'page')
			bodyClasses += ' page page-id-' + post.id + ' page-template-default';
		else
			bodyClasses += ' single single-' + postData.post_type + ' postid-' + post.id;

		if(post.is_new)
			bodyClasses += ' is_new';

		$('body')
			.removeClass()
			.addClass(bodyClasses)
		;
	},
	set_gridstate: function( state ) {
		this.gridstate = state;
	},
	get_gridstate: function() {
		return this.gridstate;
	},

	get_current: function () {
		return this.mode.current || this.MODE.DEFAULT;
	},

	set_current: function (mode) {
		if (this.current_subapplication && this.current_subapplication.stop) {
			this.current_subapplication.stop();
		}
		if (!mode) mode = this.MODE.DEFAULT;
		if (this.mode.current == mode) return false;

		this.mode.last = this.mode.current;

		if (mode && this.MODE.CONTENT == mode) {
			this.mode.current = this.MODE.CONTENT;
			this.current_subapplication = this.ContentEditor;
		} else if(mode && this.MODE.THEME == mode) {
			this.mode.current = this.MODE.THEME;
			this.current_subapplication = this.ThemeEditor;
		} else if(mode && this.MODE.POSTCONTENT == mode) {
			this.mode.current = this.MODE.POSTCONTENT;
			this.current_subapplication = this.PostContentEditor;
		} else if(mode && this.MODE.RESPONSIVE == mode) {
			this.mode.current = this.MODE.RESPONSIVE;
			this.current_subapplication = this.ResponsiveEditor;
		} else {
			this.mode.current = this.MODE.LAYOUT;
			this.current_subapplication = this.LayoutEditor;
		}
		this.current_subapplication.boot();
	},

	create_sidebar: function () {
		if (!this.sidebar) {
			this.sidebar = new Upfront.Views.Editor.Sidebar.Sidebar({
				"model": new Upfront.Models.Layout({}),
				"el": $(Upfront.Settings.LayoutEditor.Selectors.sidebar)
			});
		}
		//this.sidebar.render(); <-- Subapplications do this
	},

	recursiveExistenceMigration: function(selector, clean_selector) {
		var splitted = clean_selector.split(' ');
		var me = this;
		while(splitted.length > 0) {
			try{
				if(!!$(selector + splitted.join(' ')).closest('#' + me.element_id).length)
					return true;
			}
			catch (err) {

			}
			splitted.pop();
		}

		return false;
	},

	stylesAddSelectorMigration: function(contents, selector) {
		if (this.is_global_stylesheet && empty(selector)) return contents;

		var me = this,
			rules = contents.split('}'),
			processed = ''
		;

		_.each(rules, function (rl) {
			var src = $.trim(rl).split('{');

			if (src.length != 2) return true; // wtf

			var individual_selectors = src[0].split(','),
				processed_selectors = []
			;
			_.each(individual_selectors, function (sel) {
				sel = $.trim(sel);
				var clean_selector = sel.replace(/:[^\s]+/, ''); // Clean up states states such as :hover, so as to not mess up the matching
				var	is_container = clean_selector[0] === '@' || me.recursiveExistenceMigration(selector, clean_selector),
					spacer = is_container
						? '' // This is not a descentent selector - used for containers
						: ' ' // This is a descentent selector
				;

				processed_selectors.push('' +
					selector + spacer + sel +
				'');
			});
			processed += processed_selectors.join(', ') + ' {' +
				src[1] + // Actual rule
			'\n}\n';
		});
		return processed;
	},

	create_cssEditor: function(){
		var me = this,
			cssEditor = new Upfront.Views.Editor.CSSEditor(),
			icon_font_style,
			longSrc = '';

		cssEditor.fetchThemeStyles(true).done(function(styles){
			Upfront.data.styles = {};
			_.each(styles, function(elementStyles, elementType){

				Upfront.data.styles[elementType] = [];
				_.each(elementStyles, function(style, name){
					style = Upfront.Util.colors.convert_string_ufc_to_color(style);
					Upfront.data.styles[elementType].push(name);
					var styleNode = $('#'+name);
					// Increase element style priority over preset styles
					var styleOutput = style.replace(/#page/g, 'div#page.upfront-layout-view .upfront-editable_entity.upfront-module');
					if(!styleNode.length){
						styleNode = $('<style id="' + name + '">' + styleOutput + '</style>');
						$('body').append(styleNode);
					}
					else {
						styleNode.html(styleOutput);
					}
				});
			});

			// Good place to add active icon font style
			_.each(Upfront.mainData.iconFonts, function(font) {
				if (font.active === true) {
					_.each(font.files, function(file, type) {
						longSrc += "url('" + Upfront.mainData.currentThemeUrl + '/icon-fonts/' + file + "') format('";
						switch(type) {
							case 'eot':
								longSrc += 'embedded-opentype';
								break;
							case 'woff':
								longSrc += 'woff';
								break;
							case 'ttf':
								longSrc += 'truetype';
								break;
							case 'svg':
								longSrc += 'svg';
								break;
						}
						longSrc += "'),";
					});

					icon_font_style = "@font-face {" +
						"font-family: '" + font.family + "';";
					if (font.files.eot) {
						icon_font_style += "src: url('" + Upfront.mainData.currentThemeUrl + '/icon-fonts/' + font.files.eot + "');";
					}
					icon_font_style += "	src:" + longSrc.substring(0, longSrc.length - 1) + ';';

					icon_font_style +=
						"	font-weight: normal;" +
						"	font-style: normal;" +
						"}" +
						".uf_font_icon, .uf_font_icon * {" +
						"	font-family: '" + font.family + "'!important;" +
						"}";

					$('body').append('<style id="active-icon-font">' + icon_font_style + '</style>');
				}
			});

			if (_upfront_post_data.layout) me.apply_region_css();
			Upfront.Events.trigger("upfront:csseditor:ready");
		});

		cssEditor.createSelectors(Upfront.Application.LayoutEditor.Objects);

		// Group selectors
		cssEditor.createSelector(Upfront.Models.ModuleGroup, Upfront.Views.ModuleGroup, 'ModuleGroup');

		// Region selectors
		cssEditor.createSelector(Upfront.Models.Region, Upfront.Views.RegionContainerView, 'RegionContainer');
		cssEditor.createSelector(Upfront.Models.Region, Upfront.Views.RegionView, 'Region');
		cssEditor.createSelector(Upfront.Models.Region, Upfront.Views.RegionLightboxView, 'RegionLightbox');

		Upfront.Events.on("upfront:layout:loaded", me.apply_region_css, me);
		Upfront.Events.on("upfront:layout:loaded", me.ensure_layout_style, me);
		this.cssEditor = cssEditor;
	},

	ensure_layout_style: function() {
		var style;

		if (Upfront.Application.current_subapplication.layout && !$('style#layout-style').length) {
			style = Upfront.Application.current_subapplication.layout.get('properties').findWhere({name: 'layout_style'}) ?  Upfront.Application.current_subapplication.layout.get('properties').findWhere({name: 'layout_style'}).get('value') : "";
			// Make sure we also properly pre-process the layout styles:
			if (style && style.length) style = Upfront.Util.colors.convert_string_ufc_to_color(style);
			$('body').append('<style id="layout-style">' + style + '</style>');
		}
	},

	apply_region_css: function () {
		var me = this,
			layout_id = _upfront_post_data.layout.specificity || _upfront_post_data.layout.item || _upfront_post_data.layout.type;

		_.each(Upfront.data.styles, function(elementStyles, elementType){

			if ( elementType != me.cssEditor.elementTypes.RegionContainer.id && elementType != me.cssEditor.elementTypes.Region.id )
				return;
			if ( !_.isArray(elementStyles) )
				return;
			_.each(elementStyles, function(name){
				var styleNode = $('#'+name);
				if ( styleNode.length && ( name.match(new RegExp('^' + layout_id)) || name.match(new RegExp('^' + elementType)) ) )
					styleNode.prop('disabled', false);
				else
					styleNode.prop('disabled', true);
			});
		});
	},

	adjust_grid_padding_settings: function(region) {
		//Handle region top/bottom padding and move grid rulers
		var $region = $(region).parent(),
			padding_top = parseInt($region.css('padding-top'), 10),
			padding_bottom = parseInt($region.css('padding-bottom'), 10)
		;

		if(padding_top > 0) {
			$region.find('.upfront-overlay-grid').css("top", padding_top * -1);
		}

		if(padding_bottom > 0) {
			$region.find('.upfront-overlay-grid').css("bottom", padding_bottom * -1);
		}
	},

	fetchLayout: function(path, urlParams){
		if(this.mode.current != this.MODE.LAYOUT)
			this.start(this.MODE.LAYOUT);

		var me = this,
			urlQueryParts = urlParams ? [] : false,
			fullPath = path ? '/' + path : '/',
			loading
		;

		if(urlQueryParts){
			_.each(urlParams, function(value, key){
				urlQueryParts.push(key + '=' + value);
			});
			fullPath += '?' + urlQueryParts.join('&');
		}

		loading = this.set_loading(Upfront.Settings.l10n.global.application.loading_path.replace(/%s/, fullPath), Upfront.Settings.l10n.global.application.here_we_are);

		if(this.urlCache[fullPath]){
			//Wait a bit to let the loading screen render
			setTimeout(function(){
				Upfront.Settings.LayoutEditor.newpostType = false;
				me.set_layout_up(me.urlCache[fullPath]);
				me.currentUrl = fullPath;
				loading.done();
			}, 150);
		}
		else{
			// First unload layout without any delay, since on fast environments load_layout
			// could be done instantly which would lead to mix of layouts in page.
			me.unset_layout();
			this.load_layout(fullPath).done(function(response){
				Upfront.Settings.LayoutEditor.newpostType = false;
				loading.done();
				Upfront.Settings.LayoutEditor.newpostType = false;
				me.urlCache[fullPath] = response;
				this.currentUrl = fullPath;
			});
		}
	},

	start_navigation: function(){
		var me = this,
			site_url =  document.createElement('a')
		;

		site_url.href = Upfront.Settings.site_url;
		Backbone.history.start({pushState: true, root: site_url.pathname, silent:true});
	},

	set_loading: function(message, done){
		var me = this,
			loading = this.loadingLayer
		;
		if(loading){
			document.querySelector('.upfront-loading-text').innerText = message;
			loading.options.done = done;
		}
		else {
			loading = new Upfront.Views.Editor.Loading({
				loading: message,
				done: done,
				fixed: true,
				remove_on_event: 'upfront:renderingqueue:start'
			});
			loading.render();
			$('body').append(loading.$el);
			loading.on_finish(function(){
				me.loadingLayer = false;
			});
		}

		this.loadingLayer = loading;

		return loading;
	},

	listenToResponsiveModes: function(){
		// If a responsive mode is set we already are listening
		if(this.responsiveMode)
			return;

		var me = this;

		// Initial mode is desktop
		this.responsiveMode = 'desktop';

		this.listenTo(Upfront.Events, 'upfront:layout_size:change_breakpoint', function(newMode, previousMode){
			me.responsiveMode = newMode.id;
		});
	},

	/**
	 * Determine user ability to perform something
	 *
	 * @param {String} what Ability to check
	 *
	 * @return {Boolean}
	 */
	user_can: function (what) {
		what = (_.isString(what) ? what : "").toUpperCase();
		return !!((Upfront.Settings.Application || {}).PERMS || {})[what];
	},

	/**
	 * Check if user can modify layout
	 *
	 * @return {Boolean}
	 */
	user_can_modify_layout: function () {
		var is_archive = this.is_archive(),
			is_home = this.is_archive('home'),
			is_single = this.is_single(),
			is_single_page = this.is_single('page')
		;
		if ( !this.user_can("LAYOUT_MODE") ) return false;
		if ( is_home && this.user_can("HOME_LAYOUT_MODE") ) return true;
		if ( !is_home && is_archive && this.user_can("ARCHIVE_LAYOUT_MODE") ) return true;
		if ( is_single_page && this.user_can("SINGLEPAGE_LAYOUT_MODE") ) return true;
		if ( !is_single_page && is_single && this.user_can("SINGLEPOST_LAYOUT_MODE") ) return true;
		return false;
	}

}))();

return {
	Application: Application,
	Subapplication: LayoutEditorSubapplication
};
});

$(function () {
	$("body").on("click", ".upfront-edit_layout", function (e) {
		e.preventDefault();
		// alert(_upfront_please_hold_on);
	});
});

})(jQuery);
//# sourceURL=upfront-application.js
