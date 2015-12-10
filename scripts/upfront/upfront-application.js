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
	save_layout_as: function () {
		Upfront.Behaviors.LayoutEditor.save_dialog(this._save_layout, this);
	},

	save_layout: function () {
		this._save_layout(this.layout.get("current_layout"));
	},

	publish_layout: function () {
		this._save_layout(this.layout.get("current_layout"), true);
	},

	_save_layout: function (preferred_layout, publish) {
		var data = Upfront.Util.model_to_json(this.layout),
			storage_key = publish === true ? _upfront_storage_key : _upfront_save_storage_key;
		data.layout = _upfront_post_data.layout;
		data.preferred_layout = preferred_layout;
		data = JSON.stringify(data, undefined, 2);

		Upfront.Events.trigger("command:layout:save_start");

		if (Upfront.Settings.Application.NO_SAVE) {
			Upfront.Events.trigger("command:layout:save_success");
			return false;
		}
		data = Upfront.Util.colors.update_colors_to_match_ufc(data);
		Upfront.Util.post({"action": Upfront.Application.actions.save, "data": data, "storage_key": storage_key})
			.success(function () {
				Upfront.Util.log("layout saved");
				Upfront.Events.trigger("command:layout:save_success");
			})
			.error(function () {
				Upfront.Util.log("error saving layout");
				Upfront.Events.trigger("command:layout:save_error");
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
			var elements = [];
			_(app.Objects).each(function (obj, idx) {
				if ( obj.Element ) {
					var el = new obj.Element({"model": app.layout});
					el.element_type = idx;
					elements.push(el);
				}
				if ( obj.Command )
					app.sidebar.get_commands("control").commands.push(new obj.Command({"model": app.layout}));
			});
			Upfront.Application.sidebar.get_panel("elements").elements = _(_.sortBy(elements, function(element){
				return element.priority;
			}));
			Upfront.Application.sidebar.render();
		};
		_set_up_draggables();
		//this.listenTo(Upfront.Events, "elements:requirements:async:added", _set_up_draggables); // Deprecated
	},

	add_object: function (name, data) {
		this.Objects[name] = _.extend({}, Upfront.Mixins.Anchorable, data);
	},


	set_up_event_plumbing_before_render: function () {
		// Set up behavior
		this.listenTo(Upfront.Events, "entity:module:after_render", Upfront.Behaviors.GridEditor.create_resizable);
		this.listenTo(Upfront.Events, "entity:module:after_render", Upfront.Behaviors.GridEditor.create_draggable);
		this.listenTo(Upfront.Events, "entity:module_group:after_render", Upfront.Behaviors.GridEditor.create_resizable);
		this.listenTo(Upfront.Events, "entity:module_group:after_render", Upfront.Behaviors.GridEditor.create_draggable);
		this.listenTo(Upfront.Events, "entity:wrapper:after_render", Upfront.Behaviors.GridEditor.create_wrapper_resizable);
		// Enable resizables and draggables
		//Upfront.Behaviors.GridEditor.toggle_resizables(true);
		//Upfront.Behaviors.GridEditor.toggle_draggables(true);

		this.listenTo(Upfront.Events, "entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_resizable);
		this.listenTo(Upfront.Events, "entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_draggable);
		this.listenTo(Upfront.Events, "entity:region_container:after_render", Upfront.Behaviors.LayoutEditor.create_mergeable);
		this.listenTo(Upfront.Events, "entity:region_container:after_render", Upfront.Behaviors.GridEditor.create_region_container_resizable);
		this.listenTo(Upfront.Events, "entity:region_sub_container:after_render", Upfront.Behaviors.GridEditor.create_region_container_resizable);

		this.listenTo(Upfront.Events, "layout:after_render", Upfront.Behaviors.GridEditor.init);
	},

	set_up_event_plumbing_after_render: function () {
		// Set up properties
		//this.listenTo(Upfront.Events, "entity:activated", this.create_properties);
		//this.listenTo(Upfront.Events, "entity:deactivated", this.destroy_properties);

		// Layout manipulation
		this.listenTo(Upfront.Events, "command:exit", this.destroy_editor);
		this.listenTo(Upfront.Events, "command:layout:save", this.save_layout);
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
			}, false),
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

	createLightboxRegion: function(regionName){

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

		var	safeName = 'ltb-' + regionName.toLowerCase().replace(/\s/g, '-') + (regions.length+1),
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

var PostLayoutEditor = new (LayoutEditorSubapplication.extend({
	initialize: function(){
		this.listenTo(Upfront.Events, 'post:layout:edit', this.togglePostLayoutEditorMode);
	},
	boot: function () {
		Upfront.Util.log("Preparing postlayout mode for execution");
		this.started = 0;
	},

	start: function () {
		if(this.started)
			return;

		this.started = 1;

		this.Objects = Upfront.Application.LayoutEditor.Objects;

		Upfront.Util.log("Starting the postlayout edit mode");

		this.set_up_event_plumbing_before_render();

		this.prepareSidebar();

		this.listenTo(Upfront.Events, "post:layout:cancel", this.cancelEdition);
		this.listenTo(Upfront.Events, "post:layout:save", this.saveEdition);
		this.listenTo(Upfront.Events, "post:edit:templatepart", this.editTemplatePart);

		$("html").removeClass("upfront-edit-layout upfront-edit-theme upfront-edit-content").addClass("upfront-edit-postlayout");

		this.prepareViews();

		this.set_up_event_plumbing_after_render();
	},

	stop: function () {
		var sidebar = Application.sidebar;
		//Upfront.Util.log("Stopping the postlayout edit mode");

		this.restoreSidebar();
		this.restoreViews();

		this.started = 0;

		this.stopListening(Upfront.Events);
		this.listenTo(Upfront.Events, 'post:layout:edit', this.togglePostLayoutEditorMode);
	},

	cancelEdition: function(){
        if( Upfront.Application.is_post_content_style() ) return;

		//Gagan: The code inside the following if, is to accomodate the posts element
		var me = this;
		if(typeof(this.postwrapperclone) != 'undefined' && this.postwrapperclone) {
			this.postWrapper.find('.post_editor_container').css('display', '');
			this.postwrapperclone.find('.post_editor_container').each(function() {
				me.postWrapper.find('.upfront-object-content').append($(this));
			});

			this.postwrapperclone.remove();

		}

		if(Application.current_subapplication != PostLayoutEditor)
			return;
		Application.start(Application.mode.last);
	},

	saveEdition: function(){
		if(Application.current_subapplication != PostLayoutEditor)
			return;
		var me = this,
			saveDialog = new Upfront.Views.Editor.SaveDialog({
				question: Upfront.Settings.l10n.global.application.save_layout_pop,
				thisPostButton: Upfront.Settings.l10n.global.application.this_post_only,
				allPostsButton: Upfront.Settings.l10n.global.application.all_posts_of_this_type
			})
		;

		saveDialog
			.render()
			.on('closed', function(){
				saveDialog.remove();
				saveDialog = false;
			})
		;

		saveDialog.on('save', function(type){

			var elementType = me.postView.property('type');
			var specificity;
					elementSlug = elementType == 'ThisPostModel' ? 'single' : 'archive',
					loading = new Upfront.Views.Editor.Loading({
						loading: Upfront.Settings.l10n.global.application.saving_post_layout,
						done: Upfront.Settings.l10n.global.application.thank_you_for_waiting,
						fixed: false
					})

				;
				if(elementSlug == 'single')
					specificity = type == 'this-post' ? me.postView.postId : me.postView.editor.post.get('post_type');
				else
					specificity = type == 'this-post' ? me.postView.property('element_id').replace('uposts-object-','') : me.postView.property('post_type');


				console.log(type);

				var layoutData = {
					postLayout: me.exportPostLayout(),
					partOptions: me.postView.partOptions || {}
				}

				loading.render();
				saveDialog.$('#upfront-save-dialog').append(loading.$el);

				Upfront.Util.post({
					action: 'upfront_save_postlayout',
					layoutData: layoutData,
					cascade: elementSlug + '-' + specificity
				}).done(function(response){
					loading.done();
					console.log(response);
					saveDialog.close();

					me.postView.postLayout = layoutData.postLayout;

					me.postView.render();

					Application.start(Application.mode.last);
				});

		});


	},

	exportPostLayout: function(){
		var me = this,
			regionLayout = Upfront.Util.model_to_json(this.regionView.model),
			wrappers = regionLayout.wrappers,
			modules = regionLayout.modules,
			wrapperIds = {},
			layout = []
		;

		_.each(modules, function(m){
			var props = me.propertiesToObject(m.properties),
				object = {classes: props['class']},
				wrapper = wrapperIds[props.wrapper_id]
			;

			_.each(m.objects, function(o){
				object.slug = me.propertiesToObject(o.properties).postPart;
			});

			if (wrapper) {
				wrapper.objects.push(object);
				//wrapper.objects = [object];
			} else {
				wrapper = {objects: [object]};
				layout.push(wrapper);
				wrapperIds[props.wrapper_id] = wrapper;
			}
		});

		_.each(wrappers, function(w){
			var props = me.propertiesToObject(w.properties),
				wrapper = wrapperIds[props.wrapper_id]
			;
			if(wrapper)
				wrapper['classes'] = props['class'];

		});

		return layout;
	},

	importPostLayout: function(layout){
		var me = this,
			region = this.getPostRegionData(),
			options = this.postView.property('partOptions')
		;

		if(!layout)
			return region;

		_.each(layout, function(w){
			var wrapperId =	Upfront.Util.get_unique_id("wrapper"),
				wrapper = new Upfront.Models.Wrapper({
					name: "",
					properties: [
						{name: "wrapper_id", value: wrapperId},
						{name: "class", value: w['classes']}
					]
				})
			;
			region.get('wrappers').add(wrapper);

			_.each(w.objects, function(o){
				var properties = {
					type: 'PostPart_' + o.slug + 'Model',
					view_class: 'PostPart_' + o.slug + 'View',
					has_settings: 1,
					id_slug: 'PostPart_' + o.slug,
					postPart: o.slug
				};
				if(options[o.slug])
					_.extend(properties, options[o.slug]);

				var object = new Upfront.Content.PostPart({
						properties: properties,
						options: o.options
					}),
					module = new Upfront.Models.Module({
						name: '',
						properties: [
							{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
							{"name": "class", "value": o['classes']},
							{"name": "has_settings", "value": 0},
							{"name": "row", "value": 1},
							{"name": "wrapper_id", "value": wrapperId}
						],
						objects: [object]
					})
				;
				object.postModel = me.postView.model;
				region.get('modules').add(module);
			})
		});

		return region;
	},

	editTemplatePart: function(tpl, part){
		if(this.templateEditor)
			this.templateEditor.close();

		this.destroy_settings();
		this.templateEditor.open({tpl: tpl, postPart: part});
		Upfront.Events.trigger('post:parttemplates:edit');
	},

	togglePostLayoutEditorMode: function(postView, elementType){
		if(Application.current_subapplication != PostLayoutEditor){
			this.postView = postView;
			this.elementType = elementType;
			this.partMarkup = postView.editor.parts.replacements;
			Application.start(Application.MODE.POST);
		}
		else
			Application.start(Application.mode.last);
	},

	prepareViews: function(){
		console.log('Updating layout');
		var me = this,
			postView = this.postView,
			region = this.importPostLayout(postView.postLayout),
			layoutRegions = Application.layout.get('regions')
		;

		this.templateEditor = new Upfront.Content.TemplateEditor();
		this.listenTo(this.templateEditor, 'save', function(tpl, postPart){
			me.savePartTemplate(tpl, postPart);
		});

		this.listenTo(this.templateEditor, 'cancel', function(){
			me.templateEditor.close();
		});

		this.listenToOnce(Upfront.Events, 'entity:region:added', this.preparePostRegion);
		region.add_to(layoutRegions, layoutRegions.length - 1);
		$('.upfront-region-postlayouteditor').addClass(postView.editor.$el.attr('class'));
	},

	destroy_settings: function(){
		if (!this.settings_view) return false;

		this.settings_view.trigger('closed');

		this.settings_view.remove();
		this.settings_view = false;

		//Restore the settings div
		$('body').append('<div id="settings"/>');
	},

	savePartTemplate: function(tpl, postPart){
		var me = this,
			saveDialog = new Upfront.Views.Editor.SaveDialog({
				question: Upfront.Settings.l10n.global.application.save_part_pop,
				thisPostButton: Upfront.Settings.l10n.global.application.this_element_only,
				allPostsButton: Upfront.Settings.l10n.global.application.all_elements
			})
		;

        var id = me.postView.editor.post.get('post_type'),
            element = me.postView.property('type');

        Upfront.Util.post({
            action: 'upfront_save_postparttemplate',
            part: postPart,
            tpl: tpl,
            type: element,
            id: id
        })
            .done(function(response){
                me.postView.partTemplates[postPart] = tpl;
                me.postView.model.trigger('template:' + postPart);
                me.templateEditor.close();
                //saveDialog.close();
                Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.application.saved_template.replace(/%s/, postPart));
            })
        ;
        return;
		saveDialog
			.render()
			.on('closed', function(){
				saveDialog.remove();
				saveDialog = false;
			})
			.on('save', function(type){
				var id, element = me.postView.property('type');

				if(type == 'this-post'){
					if(element == 'UpostsModel')
						id = me.postView.property('element_id').replace('uposts-object-', '');
					else
						id = me.postView.editor.postId;
				}
				else
					id = me.postView.editor.post.get('post_type');

				Upfront.Util.post({
						action: 'upfront_save_postparttemplate',
						part: postPart,
						tpl: tpl,
						type: element,
						id: id
					})
					.done(function(response){
						me.postView.partTemplates[postPart] = tpl;
						me.postView.model.trigger('template:' + postPart);
						me.templateEditor.close();
						saveDialog.close();
						Upfront.Views.Editor.notify(Upfront.Settings.l10n.global.application.saved_template.replace(/%s/, postPart));
					})
				;
			})
		;

/*
		var templates = me.postView.property('templates');
		if(!templates)
			templates = {};
		templates[postPart] = tpl;
		me.postView.property('templates', templates, false);*/
	},

	getPostRegionData: function(postView){
		var container = this.postView.parent_module_view.region,
			elementSize =  this.postView.get_element_size(),
			region = {
				title: Upfront.Settings.l10n.global.application.post_layout_editor,
				name: 'postLayoutEditor',
				container: 'postLayoutEditor',
				allow_sidebar: false,
				type: 'clip',
				modules: [],
				position: container.get('position') - 1,
				properties: [
					{name: 'col', value: elementSize.col}
				],
				scope: 'local'
            },
			regionModel = new Upfront.Models.Region(region);
		;

		return regionModel;
	},

	preparePostRegion: function(region){
		var max_col = region.model.get_property_value_by_name('col'),
			grid = Upfront.Settings.LayoutEditor.Grid
		;
		this.regionView = region;
		this.regionContainerView = region.parent_view.get_container_view(region.model);
		this.regionContainer = this.regionContainerView.$el.detach();
		this.postWrapper = this.postView.$el.closest('.upfront-wrapper');

		if(this.elementType == 'archive'){
			this.postView.editor.$el.hide();
			this.postWrapper.before(this.regionContainer);
		} else {
			this.postWrapper.hide().after(this.regionContainer);
		}

		// Hack into region container columns to render correctly
		this.regionContainerView.$layout.removeClass(grid.class + this.regionContainerView.max_col);
		this.regionContainerView.max_col = max_col;
		this.regionContainerView.$layout.addClass(grid.class + max_col);
		this.regionView.update();

		if(!this.postRegionClass) {
			this.postRegionClass = this.regionContainer.attr('class');
		}
		this.regionContainer.attr('class', this.postRegionClass + ' ' + this.postView.parent_module_view.model.get_property_value_by_name('class'));

		//The post region should be the only available for dropping
		$('#page').find('.upfront-region')
			.not('.upfront-region-postlayouteditor')
			.not('.upfront-region-shadow')
			.addClass('upfront-region-locked')
			//Stop interaction with the rest of the page
			.find('.upfront-module').each(function(){
				if ( $(this).is('.ui-draggable') )
					$(this).draggable('disable');
				if ( $(this).is('.ui-resizable') )
					$(this).resizable('disable');
			})
		;
		$('#page').find('.upfront-region-postlayouteditor').find('.upfront-module').each(function(){
			if ( $(this).is('.ui-draggable') )
				$(this).draggable('enable');
			if ( $(this).is('.ui-resizable') )
				$(this).resizable('enable');
		});
	},

	restoreViews: function(){
		this.regionContainer.remove();
		this.regionContainer = false;

		//Gagan: The code inside the following if, is to accomodate the posts element
		if(typeof(this.postwrapperclone) != 'undefined' && this.postwrapperclone)
			this.postwrapperclone.remove();

		if(this.elementType == 'archive'){
			this.postView.editor.$el.show();
		} else {
			this.postWrapper.show();
		}

		this.postWrapper = false;

		this.regionView.remove();
		var regions = Application.layout.get('regions').filter(function(r){
			return r.get('name') != 'postLayoutEditor';
		});
		Application.layout.get('regions').reset(regions, {silent:true});
		this.regionView = false;

		this.postView = false;

		$('#page').find('.upfront-region-locked').removeClass('upfront-region-locked')
			.find('.upfront-module').each(function(){
				if ( $(this).is('.ui-draggable') )
					$(this).draggable('enable');
				if ( $(this).is('.ui-resizable') )
					$(this).resizable('enable');
			})
		;
	},

	prepareSidebar: function(){
		var commands = {},
			sidebar = Application.sidebar
		;

		this.sidebarCommands = sidebar.sidebar_commands.control.commands;

		//Show post components panel
		sidebar.get_panel('posts').loadElements().active = true;
		sidebar.get_panel('elements').active = false;

		this.sidebarCommands.each(function(command){
			var el = command.$el;
			if(el.hasClass('command-undo'))
				commands.undo = command;
			else if(el.hasClass('command-redo'))
				commands.redo = command;
			else if(el.hasClass('command-grid'))
				commands.grid = command;
		});

        sidebar.sidebar_commands.control._commands = [
            commands.undo,
            commands.redo,
            commands.grid,
            new Upfront.Views.Editor.Command_CancelPostLayout(this.sidebarCommands.model)
        ];

        if( Upfront.Application.is_editor() ){
            sidebar.sidebar_commands.control._commands.push( new Upfront.Views.Editor.Command_SavePostLayout(this.sidebarCommands.model) );
        }

		sidebar.sidebar_commands.control.commands = _( sidebar.sidebar_commands.control._commands );

		Upfront.Events.trigger('post:layout:sidebarcommands');

		//Hide not necessary parts
		sidebar.sidebar_commands.primary.$el.hide();
		sidebar.sidebar_profile.$el.hide();


		this.listenToOnce(Upfront.Events, 'sidebar:rendered', function(){
			sidebar.get_panel('posts').$('h3.sidebar-panel-title').click();
		});
	},

	restoreSidebar: function(){
		var sidebar = Application.sidebar;

		//Show hidden parts
		sidebar.sidebar_commands.primary.$el.show();
		sidebar.sidebar_profile.$el.show();

		//Restore commands
		sidebar.sidebar_commands.control.commands = this.sidebarCommands;
		this.sidebarCommands = false;

		//Hide post component panel
		sidebar.get_panel('posts').unloadElements().active = false;
		sidebar.get_panel('elements').active = true;
	},

	create_settings: function (view) {
		if (this.settings_view) return this.destroy_settings();
		if (!parseInt(view.model.get_property_value_by_name("has_settings"), 10)) return false;
		var slug = 'PostPart_' + view.postPart,
			current_object = this.Objects[slug] ? this.Objects[slug] : Upfront.Views.Editor.Settings,
			settings_view = new current_object.Settings({
				model: view.model,
				anchor: current_object.anchor,
				el: $(Upfront.Settings.LayoutEditor.Selectors.settings)
			})
		;
		settings_view.for_view = view;
		settings_view.render();
		this.settings_view = settings_view;
		settings_view.trigger('rendered');
	},

	objectToProperties: function(ob){
		var props = [];
		_.each(ob, function(value, key){
			props.push({name: key, value: value});
		});
		return props;
	},
	propertiesToObject: function(properties){
		var ob = {};
		_.each(properties, function(p){
			ob[p.name] = p.value;
		});
		return ob;
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
		Application.set_current(Application.MODE.POSTCONTENT);
		$page.find('.upfront-module').each(function(){
			if ( $(this).is('.ui-draggable') )
				$(this).draggable('disable');
			if ( $(this).is('.ui-resizable') )
				$(this).resizable('disable');
		});
		Upfront.Events.trigger('upfront:element:edit:start', 'write', contentEditor.post);
		$page.find('.upfront-region-edit-trigger').hide();

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
}));



var ContentEditor = new (Subapplication.extend({
	boot: function () {
		Upfront.Util.log("Preparing content mode for execution")
	},

	start: function () {
		Upfront.Util.log("Starting the content edit mode");

		$("html").removeClass("upfront-edit-layout upfront-edit-theme upfront-edit-postlayout upfront-edit-responsive").addClass("upfront-edit-content");
	},

	stop: function () {
		Upfront.Util.log("Stopping the content edit mode");
	}
}))();

var ThemeEditor = new (LayoutEditorSubapplication.extend({
	boot: function () {

	},

	start: function () {
		this.stop();
		this.set_up_event_plumbing_before_render();
		// @TODO hack to implement LayoutEditor objects
		this.Objects = Upfront.Application.LayoutEditor.Objects;
		this.set_up_editor_interface();

		this.set_up_event_plumbing_after_render();
		$("html").removeClass("upfront-edit-layout upfront-edit-content upfront-edit-postlayout upfront-edit-responsive").addClass("upfront-edit-theme");
		if ( Upfront.themeExporter.currentTheme === 'upfront') {
			this.listenToOnce(Upfront.Events, 'layout:render', function() {
				Upfront.Events.trigger("command:layout:edit_structure");
			});
		}
		this.listenToOnce(Upfront.Events, 'layout:render', Upfront.Behaviors.GridEditor.apply_grid);
		this.listenToOnce(Upfront.Events, 'command:layout:save_done', Upfront.Behaviors.LayoutEditor.first_save_dialog);
		this.listenTo(Upfront.Events, "command:layout:create", Upfront.Behaviors.LayoutEditor.create_layout_dialog); // DEPRECATED
		this.listenTo(Upfront.Events, "command:themefontsmanager:open", Upfront.Behaviors.LayoutEditor.open_theme_fonts_manager);
		this.listenTo(Upfront.Events, "command:layout:browse", Upfront.Behaviors.LayoutEditor.browse_layout_dialog); // DEPRECATED
		this.listenTo(Upfront.Events, "command:layout:edit_structure", Upfront.Behaviors.GridEditor.edit_structure);
		this.listenTo(Upfront.Events, "command:layout:export_theme", Upfront.Behaviors.LayoutEditor.export_dialog);
		this.listenTo(Upfront.Events, "builder:load_theme", Upfront.Behaviors.LayoutEditor.load_theme);
	},

	stop: function () {
		return this.stopListening(Upfront.Events);
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
	ThemeEditor: ThemeEditor,
	PostLayoutEditor: PostLayoutEditor,
	PostContentEditor: PostContentEditor,
	ResponsiveEditor: ResponsiveEditor,

	actions: {
		"save": "upfront_save_layout",
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
		return this.MODE.POSTCONTENT_STYLE;
	},
	is_builder: function(){
		return this.mode.current === this.MODE.THEME || this.mode.last === this.MODE.THEME;
	},
	is_editor: function(){
		return !this.is_builder();
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
		$("body").off("click", ".upfront-edit_layout").on("click", ".upfront-edit_layout", function () {
			//$(".upfront-editable_trigger").hide();
			//app.go("layout");

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
		// Start loading animation
		app.loading = new Upfront.Views.Editor.Loading({
			loading: Upfront.Settings.l10n.global.application.loading,
			loading_type: 'upfront-boot',
			done: Upfront.Settings.l10n.global.application.thank_you_for_waiting,
			fixed: true
		});
		app.loading.on_finish(function(){
			$(Upfront.Settings.LayoutEditor.Selectors.sidebar).show();
			$(".upfront-editable_trigger").hide();
		});
		app.loading.render();
		$('body').append(app.loading.$el);

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
				
				app.migrateStylesToPreset();

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

		if (layoutData.data.post)
			this.post_set_up(layoutData.data.post);

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

		var shadow = this.layout.get('regions').get_by_name("shadow");
		if(shadow)
			this.layout.get('regions').remove(shadow);

		window._upfront_post_data.layout = layoutData.data.cascade;

		Upfront.Events.trigger("upfront:layout:loaded");
		if (me.current_subapplication && me.current_subapplication.start)
			me.current_subapplication.start();

		else Upfront.Util.log("No current subapplication");

		//if (!me.layout_view) {
		me.layout_view = new Upfront.Views.Layout({
			"model": me.layout,
			"el": $(Upfront.Settings.LayoutEditor.Selectors.main)
		});
		Upfront.Events.trigger("layout:render", me.current_subapplication);
		me.layout_ready = true;
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

		post.is_new = postData.post_status == 'auto-draft' && postData.post_content === '';

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
		} else if(mode && this.MODE.POST == mode) {
			this.mode.current = this.MODE.POST;
			this.current_subapplication = this.PostLayoutEditor;
		} else if(mode && this.MODE.POSTCONTENT == mode) {
			this.mode.current = this.MODE.POSTCONTENT;
			this.current_subapplication = this.PostContentEditor;
            if ( this.sidebar.visible && this.is_editor())
                this.sidebar.toggleSidebar();
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
	
	updatePreset: function(properties, slug) {
		Upfront.Util.post({
			action: 'upfront_save_' + slug + '_preset',
			data: properties
		}).done( function() { });
	},
	
	deleteMigratedStyles: function(elementType, styleName) {
		var deleteData = {
			elementType: elementType,
			styleName: styleName,
			action: 'upfront_delete_styles'
		};

		Upfront.Util.post(deleteData)
			.done(function(){
				var styleIndex = Upfront.data.styles[elementType].indexOf(styleName);

				//Remove the styles from the available styles
				if(styleIndex != -1)
					Upfront.data.styles[elementType].splice(styleIndex, 1);

				//Remove the styles from the dom
				$('#' + styleName).remove();
			});
	},

	fetchThemeStylesMigrate: function(separately){
		var fetchData = {
				action:'upfront_theme_styles',
				separately: separately
			},
			deferred = $.Deferred()
		;

		Upfront.Util.post(fetchData)
			.success(function(response){
				deferred.resolve(response.data.styles);
			});
		return deferred.promise();
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
	
	migrateStylesToPreset: function() {
		var me = this,
			presetElements = ['image', 'plain_text', 'ucontact', 'ugallery', 'uslider', 'unewnavigation', 'uwidget'];

		this.fetchThemeStylesMigrate(true).done(function(styles){
			Upfront.data.styles = {};
			_.each(styles, function(elementStyles, elementType){

				Upfront.data.styles[elementType] = [];

				var presetElement = elementType.replace(/^u+/, "");

				if(presetElement === "plain_text") { presetElement = 'text'; }
				if(presetElement === "newnavigation") { presetElement = 'nav'; }
				if(presetElement === "tabs") { presetElement = 'tab'; }
				
				var presets = new Backbone.Collection(Upfront.mainData[presetElement + 'Presets'] || []),
					presetDefaults = Upfront.mainData.presetDefaults[presetElement] || [];

				_.each(elementStyles, function(style, name) {
					var havePreset = _.contains(presetElements, elementType);

					if(havePreset && name.indexOf('_default') > -1) {
						var preset = presets.findWhere({id: 'default'});
					
						if(typeof preset === "undefined") {
							Upfront.mainData[presetElement + 'Presets'] = _.isArray(Upfront.mainData[presetElement + 'Presets']) ? Upfront.mainData[presetElement + 'Presets'] : [];
							Upfront.mainData[presetElement + 'Presets'].unshift(presetDefaults);
							
							presets = new Backbone.Collection(Upfront.mainData[presetElement + 'Presets'] || []);
							preset = presets.findWhere({id: 'default'});
						}
						
						//Convert UFC colors to real colors
						style = Upfront.Util.colors.convert_string_ufc_to_color(style);

						//Set preset style with preset classes
						preset.set({
							preset_style: me.stylesAddSelectorMigration($.trim(style), '#page .' + preset.get('id'))
						});
						
						var properties = preset.toJSON();
						
						//Save preset to DB
						me.updatePreset(properties, presetElement);
						
						//Delete style
						me.deleteMigratedStyles(elementType, name);
					}
				});
			});
		});		
	},

	create_cssEditor: function(){
		var me = this,
			cssEditor = new Upfront.Views.Editor.CSSEditor(),
			icon_font_style,
			longSrc = '';
			
		Upfront.data.styles = {};
		
		cssEditor.fetchThemeStyles(true).done(function(styles){
			_.each(styles, function(elementStyles, elementType){
				
				Upfront.data.styles[elementType] = [];
				
				_.each(elementStyles, function(style, name){
					style = Upfront.Util.colors.convert_string_ufc_to_color(style);
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
					
					Upfront.data.styles[elementType].push(name);
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
		$region = $(region).parent(),
			padding_top = parseInt($region.css('padding-top')),
			padding_bottom = parseInt($region.css('padding-bottom'));

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
				fixed: true
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

}))();

return {
	"Application": Application
};
});

$(function () {
	$("body").on("click", ".upfront-edit_layout", function (e) {
		e.preventDefault();
		alert(_upfront_please_hold_on);
	});
})

})(jQuery);
//@ sourceURL=upfront-application.js
