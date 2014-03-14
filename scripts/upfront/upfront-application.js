(function ($) {

define(['models', 'views', 'editor_views', 'behaviors', 'upfront-data', 'scripts/backbone-query-parameters/backbone-query-parameters'], function (models, views, editor, behaviors, data) {
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
	}
});

var LayoutEditor = new (Subapplication.extend({

	Objects: {},

	boot: function () {

	},

	start: function () {
		this.stop();
		this.set_up_event_plumbing_before_render();
		this.set_up_editor_interface();

		this.set_up_event_plumbing_after_render();
		$("html").removeClass("upfront-edit-content").addClass("upfront-edit-layout");
	},

	stop: function () {
		return this.stopListening(Upfront.Events);
	},

	save_layout_as: function () {
		Upfront.Behaviors.LayoutEditor.save_dialog(this._save_layout, this);
	},

	save_layout: function () {
		this._save_layout(this.layout.get("current_layout"));
	},

	_save_layout: function (preferred_layout) {
		var data = Upfront.Util.model_to_json(this.layout);
		data.layout = _upfront_post_data.layout;
		data.preferred_layout = preferred_layout;
		data = JSON.stringify(data, undefined, 2);

		Upfront.Events.trigger("command:layout:save_start");

		if (Upfront.Settings.Application.NO_SAVE) {
			Upfront.Events.trigger("command:layout:save_success");
			return false;
		}

		Upfront.Util.post({"action": Upfront.Application.actions.save, "data": data})
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

  get_layout_data: function() {
		var data = Upfront.Util.model_to_json(this.layout);
		data.layout = _upfront_post_data.layout;
    return data;
  },

	preview_layout: function () {
		var preview = false,
			url = false
		;
		url = Upfront.PreviewUpdate.preview_url();
		if (!url) {
			Upfront.Views.Editor.notify("Your preview is not ready yet");
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
						'<h3>Revisions</h3><ul>{[ _.each(data, function (item) { ]}' +
							'<li><a target="_blank" href="{{item.preview_url}}">{{item.date_created}}</a><br /><small>created by {{item.created_by.display_name}}</small></li>' +
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
		this.listenTo(Upfront.Events, "elements:requirements:async:added", _set_up_draggables);
	},

	add_object: function (name, data) {
		this.Objects[name] = _.extend({}, Upfront.Mixins.Anchorable, data);
	},


	set_up_event_plumbing_before_render: function () {
		// Set up behavior
		this.listenTo(Upfront.Events, "entity:module:after_render", Upfront.Behaviors.GridEditor.create_resizable);
		this.listenTo(Upfront.Events, "entity:module:after_render", Upfront.Behaviors.GridEditor.create_draggable);
		// Enable resizables and draggables
		//Upfront.Behaviors.GridEditor.toggle_resizables(true);
		//Upfront.Behaviors.GridEditor.toggle_draggables(true);

		this.listenTo(Upfront.Events, "entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_resizable);
		this.listenTo(Upfront.Events, "entity:region_container:after_render", Upfront.Behaviors.GridEditor.create_region_container_resizable);
		this.listenTo(Upfront.Events, "layout:render", Upfront.Behaviors.GridEditor.refresh_draggables);
		this.listenTo(Upfront.Events, "layout:after_render", Upfront.Behaviors.GridEditor.init);
	},

	set_up_event_plumbing_after_render: function () {
		// Set up properties
		this.listenTo(Upfront.Events, "entity:activated", this.create_properties);
		this.listenTo(Upfront.Events, "entity:deactivated", this.destroy_properties);

		// Layout manipulation
		this.listenTo(Upfront.Events, "command:exit", this.destroy_editor);
		this.listenTo(Upfront.Events, "command:layout:save", this.save_layout);
		this.listenTo(Upfront.Events, "command:layout:save_as", this.save_layout_as);
		this.listenTo(Upfront.Events, "command:layout:preview", this.preview_layout);

		// Region
		this.listenTo(Upfront.Events, "command:region:edit_toggle", Upfront.Behaviors.GridEditor.toggle_region_resizable);

		// Undo / Redo
		this.listenTo(Upfront.Events, "entity:activated", Upfront.Behaviors.LayoutEditor.create_undo);
		this.listenTo(Upfront.Events, "entity:resize_start", Upfront.Behaviors.LayoutEditor.create_undo);
		this.listenTo(Upfront.Events, "entity:drag_start", Upfront.Behaviors.LayoutEditor.create_undo);
		this.listenTo(Upfront.Events, "entity:removed:before", Upfront.Behaviors.LayoutEditor.create_undo);
		this.listenTo(Upfront.Events, "entity:region:activated", Upfront.Behaviors.LayoutEditor.create_undo);

		this.listenTo(Upfront.Events, "command:undo", Upfront.Behaviors.LayoutEditor.apply_history_change);
		this.listenTo(Upfront.Events, "command:redo", Upfront.Behaviors.LayoutEditor.apply_history_change);

		// Set up element merging
		this.listenTo(Upfront.Events, "command:select", Upfront.Behaviors.LayoutEditor.create_mergeable);
		this.listenTo(Upfront.Events, "command:deselect", Upfront.Behaviors.LayoutEditor.destroy_mergeable);
		this.listenTo(Upfront.Events, "command:merge", Upfront.Behaviors.LayoutEditor.destroy_mergeable);

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
					loading: "Saving...",
					done: "All done!",
					fixed: true
				});
				loading.render();
				$('body').append(loading.$el);
			},
			stop = function () {
				loading.done();
			}
		;
		this.listenTo(Upfront.Events, "command:layout:save_start", start);
		this.listenTo(Upfront.Events, "command:layout:save_success", stop);
		this.listenTo(Upfront.Events, "command:layout:save_error", stop);
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

			context_menu_view = new current_object.ContextMenu({
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

		context_menu_view.trigger('closed');
	},
	create_settings: function (view) {
		if (this.settings_view) return this.destroy_settings();
		if (!parseInt(view.model.get_property_value_by_name("has_settings"), 10)) return false;
		var current_object = _(this.Objects).reduce(function (obj, current) {
				return (view instanceof current.View) ? current : obj;
			}, false),
			current_object = (current_object && current_object.Settings ? current_object : Upfront.Views.Editor.Settings)
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

	destroy_settings: function () {
		if (!this.settings_view) return false;

		this.settings_view.remove();
		this.settings_view = false;

		//Restore the settings div
		$('body').append('<div id="settings"/>');

		settings_view.trigger('closed');
	},

	create_post: function(postType){
		Upfront.Settings.LayoutEditor.newpostType = postType;
		this.load_layout({item: 'single-' + postType, type: 'single'});
	}

}))();


var ContentEditor = new (Subapplication.extend({
	boot: function () {
		Upfront.Util.log("Preparing content mode for execution")
	},

	start: function () {
		Upfront.Util.log("Starting the content edit mode");

		$("html").removeClass("upfront-edit-layout").addClass("upfront-edit-content");
	},

	stop: function () {
		Upfront.Util.log("Stopping the content edit mode");
	}

}))();


var Application = new (Backbone.Router.extend({
	LayoutEditor: LayoutEditor,
	ContentEditor: ContentEditor,

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
		LAYOUT: "layout"
	},

	mode: {
		last: false,
		current: false
	},

	urlCache: {},

	current_subapplication: false,
	sidebar: false,
	layout: false,

	boot: function () {
		this.MODE = Upfront.Settings.Application.MODE;
		var me = this;
		$("body").on("click", ".upfront-edit_layout", function () {
			//$(".upfront-editable_trigger").hide();
			//app.go("layout");
			me.start();
			return false;
		});
		$(document).trigger("upfront-load");
	},

	start: function (mode) {
		if (!mode) mode = this.MODE.DEFAULT;
		if (this.mode.current == mode) return false;

		$('#wpadminbar').hide();
		$('html').attr('style', 'margin-top: 0 !important;');

		this.set_current(mode);
		if (!(this.current_subapplication && this.current_subapplication.start)) {
			Upfront.Util.log("Can't boot invalid subapplication");
		}
		Upfront.Events.trigger("application:mode:before_switch");

		if (!!this.layout) {
			var regions = this.layout.get("regions"),
				region = regions.get_by_name("shadow")
			;
			if (regions && region) regions.remove(region, {silent: true});
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
			loading: "Loading...",
			done: "Thank you for waiting",
			fixed: true
		});
		app.loading.on_finish(function(){
			$(Upfront.Settings.LayoutEditor.Selectors.sidebar).show();
			$(".upfront-editable_trigger").hide();
		});
		app.loading.render();
		$('body').append(app.loading.$el);

		app.create_sidebar();

		require(["objects", 'media', 'content', 'spectrum', 'responsive', "uaccordion", 'redactor', 'ueditor', "ucomment", "ucontact", "ugallery", "uimage", "upfront-like-box", "upfront_login", "upfront_maps", "upfront-navigation", "unewnavigation", "uposts", "usearch", "upfront_slider", "upfront-social_media", "utabs", "this_post", "this_page", "uwidget", "uyoutube", "upfront_code"],
	        function(objects) {
				_.extend(Upfront.Objects, objects);

				app.currentUrl = window.location.pathname + window.location.search;
				app.saveCache = true;
				app.load_layout(_upfront_post_data.layout);
				//app.load_layout(window.location.pathname + window.location.search);
				app.start_navigation();

				app.create_cssEditor();

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

	load_layout: function (layout_ids, new_post) {
		var app = this,
			request_data = {
				action: this.actions.load,
				data: layout_ids
			}
		;
		if (new_post)
			request_data['new_post'] = new_post;

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

	set_layout_up: function(layoutData){
		var me = this,
			data = $.extend(true, {}, layoutData.data.layout) || {} //Deep cloning
		;

		if (layoutData.data.post)
			this.post_set_up(layoutData.data.post);

		if(this.layout)
			this.unset_layout();

		//Uncomment this debbugger to check how the layout has been cleaned up
		//debugger;

		this.layout = new Upfront.Models.Layout(data);
		this.current_subapplication.layout = this.layout;
		this.sidebar.model.set(this.layout.toJSON());

		var shadow = this.layout.get('regions').get_by_name("shadow");
		if(shadow)
			this.layout.get('regions').remove(shadow);

		if(this.layout.get('regions'))

		_upfront_post_data.layout = layoutData.data.cascade;

		Upfront.Application.loading.done(function () {
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
			//}

			Upfront.PreviewUpdate.run(me.layout);

			Upfront.Events.trigger("application:mode:after_switch");
		});
	},

	unset_layout: function(){
		var layoutTag, layoutElement, newElement;

		Upfront.data.currentEntity = false;

		if(this.current_subapplication){
			this.current_subapplication.stop();
		}

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
			loading = this.set_loading('Preparing new ' + post_type + '...', 'Here we are!')
		;

		// @TODO is this correct to call stop before load_layout? fixed double event assignment
		if (this.current_subapplication && this.current_subapplication.stop) {
			this.current_subapplication.stop();
		}

		this.load_layout(layoutOps, post_type).done(function(response){
			Upfront.Settings.LayoutEditor.newpostType = post_type;
			postData = response.data.post;
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
		var bodyClasses = 'logged-in admin-bar upfront customize-support flex-support';

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

		if (!this.layout_sizes) {
			this.layout_sizes = new Upfront.Views.Editor.Layouts({
				"model": this.layout,
				"el": $(Upfront.Settings.LayoutEditor.Selectors.layouts)
			});
		}
		this.layout_sizes.render();
	},

	create_cssEditor: function(){
		var cssEditor = new Upfront.Views.Editor.CSSEditor();

		cssEditor.fetchThemeStyles(true).done(function(styles){

			$('#upfront-theme-styles').remove();
			_.each(styles, function(elementStyles, elementType){
				_.each(elementStyles, function(style, name){
					var styleNode = $('#upfront-style-' + name);
					if(!styleNode.length){
						styleNode = $('<style id="upfront-style-' + name + '"></style>');
						$('body').append(styleNode);
					}

					styleNode.append(cssEditor.stylesAddSelector(style, '.upfront-object.' + name));
				});
			});
		});

		cssEditor.createSelectors(Upfront.Application.LayoutEditor.Objects);

		this.cssEditor = cssEditor;
	},

	fetchLayout: function(path, urlParams){
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

		loading = this.set_loading('Loading ' + fullPath, 'Here we are!');

		if(this.urlCache[fullPath]){
			//Wait a bit to let the loading screen render
			setTimeout(function(){
				me.set_layout_up(me.urlCache[fullPath]);
				me.currentUrl = fullPath;
				loading.done();
			}, 150);
		}
		else{
			this.load_layout(fullPath).done(function(response){
				loading.done();
				Upfront.Settings.LayoutEditor.newpostType = false;
				me.urlCache[fullPath] = response;
				this.currentUrl = fullPath;
			});
			//Wait a bit to let the loading screen render
			setTimeout(function(){
				//Unload the layout while fetching the new one
				me.unset_layout();
			}, 150);
		}
	},

	start_navigation: function(){
		var me = this,
			site_url =  document.createElement('a');
		console.log('Starting router history');
		site_url.href = Upfront.Settings.site_url;
		Backbone.history.start({pushState: true, root: site_url.pathname, silent:true});
		$(document).on('click', 'a', function(e){
			var href = e.target.getAttribute('href'),
				a = e.target,
				now = window.location
			;
			if(href == '#' || a.origin != now.origin || (a.pathname == now.pathname && a.search == now.search))
				return;

			//If we are editing text, don't follow the link
			if($(e.target).closest('.redactor_box').length)
				return;


			e.preventDefault();
			if(!Upfront.PreviewUpdate._is_dirty || confirm("You have unsaved changes you're about to lose by navigating off this page. Do you really want to leave this page?"))
				me.navigate(a.pathname + a.search, {trigger: true});
		});
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
	}

}))();

return {
	"Application": Application
};
});

})(jQuery);
