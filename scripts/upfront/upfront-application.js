(function ($) {

var Subapplication = Backbone.Router.extend({
	run: function () {
		Upfront.Util.log("Implement runner method");
	},

	go: function (frag) {
		Upfront.Events.trigger("subapplication:navigate:" + frag);
		return this.navigate(frag);
	}
});

var LayoutEditor = new (Subapplication.extend({
	
	Objects: {},
	Commands: {},

	actions: {
		"save": "upfront_save_layout",
		"load": "upfront_load_layout",
	},

	routes: {
		"done": "destroy_editor",
		"layout(/:id)": "dispatch_layout_loading",
		"new-layout": "dispatch_layout_creation"
	},

	run: function () {
		var app = this;
		// Temporary Edit switch event plumbing
		$("body").on("click", ".upfront-edit_layout", function () {
			$(".upfront-editable_trigger").hide();
			//app.go("layout");
			app.dispatch_layout_loading();
			return false; 
		});
		$("body").on("click", ".upfront-finish_layout_editing", function () {
			$(
				Upfront.Settings.LayoutEditor.Selectors.commands + 
				", " + 
				Upfront.Settings.LayoutEditor.Selectors.properties +
				", " + 
				Upfront.Settings.LayoutEditor.Selectors.layouts
			).hide("slow", function () {
				//app.go("done"); 
				app.destroy_editor();
			});
			return false;
		});
	},

	save_layout: function () {
		var data = Upfront.Util.model_to_json(this.layout);
		Upfront.Util.post({"action": this.actions.save, "data": data})
			.success(function () {
				Upfront.Util.log("layout saved");
			})
			.error(function () {
				Upfront.Util.log("error saving layout");
			})
		;
	},

	load_layout: function (layout_id) {
		var app = this,
			present = !!app.layout
		;
		$("body").removeClass(Upfront.Settings.LayoutEditor.Grid.scope);
		Upfront.Util.post({"action": this.actions.load, "data": layout_id})
			.success(function (test_data) {
				app.layout = new Upfront.Models.Layout(test_data.data);
				app.layout_view = new Upfront.Views.Layout({
					"model": app.layout, 
					"el": $(Upfront.Settings.LayoutEditor.Selectors.main)
				});

				app.set_up_editor_interface();
				if (!present) app.set_up_event_plumbing();

				// @TODO:remove this
				$(
					Upfront.Settings.LayoutEditor.Selectors.commands + 
					", " + 
					Upfront.Settings.LayoutEditor.Selectors.properties +
					", " + 
					Upfront.Settings.LayoutEditor.Selectors.layouts
				).show("slow", function () {
				 	$(".upfront-editable_trigger").hide();
					$("#upfront-loading").remove();
				});
			})
			.error(function (xhr) {
				Upfront.Util.log("Error loading layout " + layout_id)
				// @TODO:remove this
				$(
					Upfront.Settings.LayoutEditor.Selectors.commands + 
					", " + 
					Upfront.Settings.LayoutEditor.Selectors.properties +
					", " + 
					Upfront.Settings.LayoutEditor.Selectors.layouts
				).hide("slow", function () {
				 	$(".upfront-editable_trigger").show();
					$("#upfront-loading").remove();
					app.go("");
				});
			})
		;
	},

	dispatch_layout_loading: function (layout_id) {
		var layout = layout_id || "1",
			app = this
		;

		// @TODO:remove this
		$("body").append('<div id="upfront-loading">Loading...</div>');
		require(Upfront.Settings.LayoutEditor.Requirements.core, function (models, views, editor, behaviors) {
			_.extend(Upfront, models);
			_.extend(Upfront, views);
			_.extend(Upfront.Views, editor);
			_.extend(Upfront, behaviors);

			require(Upfront.Settings.LayoutEditor.Requirements.entities, function (objects) {
				_.extend(Upfront.Objects, objects);
				app.load_layout(layout);
			});
		});
	},
	dispatch_layout_creation: function () {
		Upfront.Util.log("creating new layout");
	},
	destroy_editor: function () {
		this.navigate("");
		window.location.reload();
		return false;
	},

	set_up_editor_interface: function () {
		if (!this.layout) return false;
		var app = this;

		app.command_view = new Upfront.Views.Editor.Commands({
			"model": app.layout,
			"el": $(Upfront.Settings.LayoutEditor.Selectors.commands)
		});
		_(this.Objects).each(function (obj) {
			if (!obj.Command) return true;
			app.command_view.commands.push(new obj.Command({"model": app.layout}));
		});
		app.command_view.render();

		// Layouts
		app.layout_sizes = new Upfront.Views.Editor.Layouts({
			"model": app.layout,
			"el": $(Upfront.Settings.LayoutEditor.Selectors.layouts)
		});
		app.layout_sizes.render();
	},

	add_object: function (name, data) {
		this.Objects[name] = data;
	},

	set_up_event_plumbing: function () {
		// Set up properties
		Upfront.Events.on("entity:activated", this.create_properties, this);
		Upfront.Events.on("entity:deactivated", this.destroy_properties, this);

		// Layout manipulation
		Upfront.Events.on("command:layout:save", this.save_layout, this);
		Upfront.Events.on("command:layout:load", this.dispatch_layout_loading, this);	

		// Bahviors mixin setup

		// Set up behaviors - resizable/selectable
		Upfront.Events.on("entity:activated", Upfront.Behaviors.LayoutEditor.create_sortable, this);
		Upfront.Events.on("entity:activated", Upfront.Behaviors.LayoutEditor.create_resizable, this);

		// Undo / Redo
		Upfront.Events.on("entity:activated", Upfront.Behaviors.LayoutEditor.create_undo, this);
		Upfront.Events.on("command:undo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);
		Upfront.Events.on("command:redo", Upfront.Behaviors.LayoutEditor.apply_history_change, this);

		// Set up element merging
		Upfront.Events.on("command:select", Upfront.Behaviors.LayoutEditor.create_mergeable, this);
		Upfront.Events.on("command:deselect", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);
		Upfront.Events.on("command:merge", Upfront.Behaviors.LayoutEditor.destroy_mergeable, this);

		// Set up entity settings (modules, for now)
		Upfront.Events.on("entity:settings:activate", this.create_settings, this);
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
				el: $(Upfront.Settings.LayoutEditor.Selectors.settings)
			})
		;
		settings_view.for_view = view;
		settings_view.render();
		this.settings_view = settings_view;
	},

	destroy_settings: function () {
		if (!this.settings_view) return false;
		$(Upfront.Settings.LayoutEditor.Selectors.settings).html('');
		this.settings_view = false;
	}

}))();


var ContentEditor = new (Subapplication.extend({
	routes: {
		//"done": "destroy_editor",
		"content(/:id)": "dispatch_content_loading",
		"new-content": "dispatch_content_creation"
	},

	run: function () {
		var app = this;
		// Temporary Edit switch event plumbing
		$("body").on("click", ".upfront-edit_content", function () {
			$(".upfront-editable_trigger").remove();
			app.go("content");
			return false; 
		});
		$("body").on("click", ".upfront-finish_layout_editing", function () {
			$(
				Upfront.Settings.LayoutEditor.Selectors.commands + 
				", " + 
				Upfront.Settings.LayoutEditor.Selectors.properties +
				", " + 
				Upfront.Settings.LayoutEditor.Selectors.layouts
			).hide("slow", function () {
				app.go("done"); 
			});
			return false;
		});

		//Backbone.history.start();
	},

	dispatch_content_loading: function (content_id) {
		content_id ? Upfront.Util.log('loading') : Upfront.Util.log('loading current')
	},
	dispatch_content_creation: function () {
		Upfront.Util.log('creating')
	},

}))();


var Application = new (Backbone.Router.extend({
	LayoutEditor: LayoutEditor,
	ContentEditor: ContentEditor,

	run: function () {
		this.LayoutEditor.run();
		this.ContentEditor.run();

		Backbone.history.start(); // One history starting
	},
}))();

define({
	"Application": Application
});

})(jQuery);