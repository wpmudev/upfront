(function ($) {

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
		this.set_up_event_plumbing_before_render();
		this.set_up_editor_interface();

		this.set_up_event_plumbing_after_render();
		$("html").removeClass("upfront-edit-content").addClass("upfront-edit-layout");
	},

	stop: function () {
		Upfront.Events.off("entity:module:after_render", Upfront.Behaviors.GridEditor.create_resizable, this);
		Upfront.Events.off("entity:module:after_render", Upfront.Behaviors.GridEditor.create_draggable, this);
		Upfront.Events.off("entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_resizable, this);
		
		Upfront.Events.off("entity:activated", this.create_properties, this);
		Upfront.Events.off("entity:deactivated", this.destroy_properties, this);
		Upfront.Events.off("command:layout:save", this.save_layout, this);
		Upfront.Events.off("command:layout:save_as", this.save_layout_as, this);
		Upfront.Events.off("command:region:edit_toggle", Upfront.Behaviors.GridEditor.toggle_region_resizable, this);
		Upfront.Events.off("entity:activated", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("entity:resize_start", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("entity:drag_start", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("entity:removed:before", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.off("command:undo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);
		Upfront.Events.off("command:redo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);
		Upfront.Events.off("command:select", Upfront.Behaviors.LayoutEditor.create_mergeable, this);
		Upfront.Events.off("command:deselect", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);
		Upfront.Events.off("command:merge", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);
		Upfront.Events.off("entity:settings:activate", this.create_settings, this);
		Upfront.Events.off("entity:settings:deactivate", this.destroy_settings, this);
		
		Upfront.Events.off("layout:render", Upfront.Behaviors.GridEditor.refresh_draggables, this);
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
		}
		_set_up_draggables();
		Upfront.Events.on("elements:requirements:async:added", _set_up_draggables, this);
	},

	add_object: function (name, data) {
		this.Objects[name] = _.extend({}, Upfront.Mixins.Anchorable, data);
	},


	set_up_event_plumbing_before_render: function () {
		// Set up behavior
		Upfront.Events.on("entity:module:after_render", Upfront.Behaviors.GridEditor.create_resizable, this);
		Upfront.Events.on("entity:module:after_render", Upfront.Behaviors.GridEditor.create_draggable, this);
		Upfront.Events.on("entity:region:after_render", Upfront.Behaviors.GridEditor.create_region_resizable, this);
		Upfront.Events.on("layout:render", Upfront.Behaviors.GridEditor.refresh_draggables, this);
	},

	set_up_event_plumbing_after_render: function () {
		// Set up properties
		Upfront.Events.on("entity:activated", this.create_properties, this);
		Upfront.Events.on("entity:deactivated", this.destroy_properties, this);

		// Layout manipulation
		Upfront.Events.on("command:layout:save", this.save_layout, this);
		Upfront.Events.on("command:layout:save_as", this.save_layout_as, this);

		Upfront.Behaviors.GridEditor.init();
		
		// Region
		Upfront.Events.on("command:region:edit_toggle", Upfront.Behaviors.GridEditor.toggle_region_resizable, this);

		// Undo / Redo
		Upfront.Events.on("entity:activated", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.on("entity:resize_start", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.on("entity:drag_start", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.on("entity:removed:before", Upfront.Behaviors.LayoutEditor.create_undo, this);
		
		Upfront.Events.on("command:undo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);
		Upfront.Events.on("command:redo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);

		// Set up element merging
		Upfront.Events.on("command:select", Upfront.Behaviors.LayoutEditor.create_mergeable, this);
		Upfront.Events.on("command:deselect", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);
		Upfront.Events.on("command:merge", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);

		// Set up entity settings (modules, for now)
		Upfront.Events.on("entity:settings:activate", this.create_settings, this);
		Upfront.Events.on("entity:settings:deactivate", this.destroy_settings, this);
		
		//Upfront.Events.on("upfront:posts:post:post_updated", this.layout_view.render, this.layout_view);

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
		Upfront.Events.on("command:layout:save", start, this);
		Upfront.Events.on("command:layout:save_success", stop, this);
		Upfront.Events.on("command:layout:save_error", stop, this);
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
		$(Upfront.Settings.LayoutEditor.Selectors.settings).html('').hide();
		this.settings_view = false;
		
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

		// Null out draggables
		Upfront.Application.sidebar.get_panel("elements").elements = _([]);
		Upfront.Application.sidebar.render();
		if (Upfront.Application.sidebar.get_panel("settings")) {
			Upfront.Application.sidebar.get_panel("settings").$el.empty(); // This is UGLY, refactor
		}

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
		"create(/:postType)": "create_post",
	},

	MODE: {
		CONTENT: "content",
		LAYOUT: "layout"
	},

	mode: {
		last: false,
		current: false
	},

	current_subapplication: false,
	sidebar: false,
	layout: false,

	boot: function () {
		this.MODE = Upfront.Settings.Application.MODE;
		var me = this;
		$("body").on("click", ".upfront-edit_layout", function () {
			$(".upfront-editable_trigger").hide();
			//app.go("layout");
			me.start();
			return false;
		});
		$(document).trigger("upfront-load");
	},

	start: function (mode) {
		if (!mode) mode = this.MODE.DEFAULT;
		if (this.mode.current == mode) return false;
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
		require(Upfront.Settings.LayoutEditor.Requirements.core, function (models, views, editor, behaviors, data) {
			_.extend(Upfront, data);
			Upfront.Events.trigger('data:ready');		
			_.extend(Upfront, models);
			_.extend(Upfront, views);
			_.extend(Upfront.Views, editor);
			_.extend(Upfront, behaviors);
			
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
			$('body').append(app.loading.$el)
			
			app.create_sidebar();

			require(Upfront.Settings.LayoutEditor.Requirements.entities, function (objects) {
				_.extend(Upfront.Objects, objects);
				app.load_layout(_upfront_post_data.layout);
			});
		});
	},

	stop: function () {

	},

	restart: function () {
		var last = this.mode.last || this.MODE.DEFAULT;
		this.start(last);
	},

	load_layout: function (layout_ids, new_post) {
		var app = this,
			present = !!this.layout,
			request_data = {
				action: this.actions.load,
				data: layout_ids
			}
		;
		if (new_post) request_data['new_post'] = new_post;
		$("body").removeClass(Upfront.Settings.LayoutEditor.Grid.scope);
		return Upfront.Util.post(request_data)
			.success(function (response) {
				if (response.data.post) app.new_post_set_up(response.data.post);

				var data = response.data.layout || {};
				app.layout = new Upfront.Models.Layout(data);
				app.current_subapplication.layout = app.layout;
				app.sidebar.model.set(app.layout.toJSON());
				Upfront.Application.loading.done(function () {
					Upfront.Events.trigger("upfront:layout:loaded");
					if (app.current_subapplication && app.current_subapplication.start) app.current_subapplication.start();
					else Upfront.Util.log("No current subapplication");

					//if (!app.layout_view) {
					app.layout_view = new Upfront.Views.Layout({
						"model": app.layout,
						"el": $(Upfront.Settings.LayoutEditor.Selectors.main)
					});
					Upfront.Events.trigger("layout:render", app.current_subapplication);
					//}

					Upfront.Events.trigger("application:mode:after_switch");
				});
			})
			.error(function (xhr) {
				Upfront.Util.log("Error loading layout " + layout_ids);
				app.loading.cancel(function(){
					$(Upfront.Settings.LayoutEditor.Selectors.sidebar).hide();
					$(".upfront-editable_trigger").show();
					app.go("");
				});
			})
		;
	},

	new_post: function(post_type){
		var layoutOps = {
				item: 'single-' + post_type, 
				type: 'single', 
				specificity: 'single-' + post_type + '-1000000' //Big number to assure default layout
			},
			deferred = new $.Deferred(),
			postData = {}
		;

		this.load_layout(layoutOps, post_type).done(function(response){
			postData = response.data.post;
			deferred.resolve(Upfront.data.posts[postData.ID]);
		});

		return deferred.promise();
	},

	new_post_set_up: function(postData){
		//Create the post with meta
		postData.meta = [];
		var post = new Upfront.Models.Post(postData);

		post.is_new = true;

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
	}

}))();

define({
	"Application": Application
});

})(jQuery);