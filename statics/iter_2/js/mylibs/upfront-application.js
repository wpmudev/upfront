(function () {

var Subapplication = Backbone.Router.extend({
	run: function () {
		Upfront.Util.log("Implement runner method");
	},

	go: function (frag) {
		return this.navigate(frag, {trigger: true});
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
			app.go("layout");
			return false; 
		});
		$("body").on("click", ".upfront-finish_layout_editing", function () {
			$(Upfront.Settings.LayoutEditor.Selectors.commands + ", " + Upfront.Settings.LayoutEditor.Selectors.properties).hide("slow", function () {
				app.go("done"); 
			});
			return false;
		});
	},

	save_layout: function () {
		var raw = this.layout.toJSON(),
			data_str = JSON.stringify(raw),
			data = JSON.parse(data_str)
		;
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
				$(Upfront.Settings.LayoutEditor.Selectors.commands + ", " + Upfront.Settings.LayoutEditor.Selectors.properties).show("slow", function () {
				 	$(".upfront-editable_trigger").hide();
					$("#upfront-loading").remove();
				});
			})
			.error(function (xhr) {
				Upfront.Util.log("Error loading layout " + layout_id)
				// @TODO:remove this
				$(Upfront.Settings.LayoutEditor.Selectors.commands + ", " + Upfront.Settings.LayoutEditor.Selectors.properties).hide("slow", function () {
				 	$(".upfront-editable_trigger").show();
					$("#upfront-loading").remove();
					app.go("");
				});
			})
		;
			/*
		require(['../mylibs/data-stubs/upfront-stub-layout-' + layout_id], function (test_data) {
			app.layout = new Upfront.Models.Layout(test_data);
			app.layout_view = new Upfront.Views.Layout({
				"model": app.layout, 
				"el": $("#upfront-output")
			});

			app.set_up_editor_interface();
			app.set_up_event_plumbing();
		});
		// @TODO:remove this
		$("#commands, #properties").show("slow", function () {
		 	$(".upfront-editable_trigger").hide();
			$("#upfront-loading").remove();
		});
			*/
	},

	dispatch_layout_loading: function (layout_id) {
		var layout = layout_id || "1",
			app = this
		;

		// @TODO:remove this
		$("body").append('<div id="upfront-loading">Loading...</div>');

		require(['models', 'views', 'editor_views'], function (models, views, editor) {
			_.extend(Upfront, models);
			_.extend(Upfront, views);
			_.extend(Upfront.Views, editor);
			require(['objects'], function (objects) {
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
	},

	add_object: function (name, data) {
		this.Objects[name] = data;
	},

	set_up_event_plumbing: function () {
		// Set up properties
		Upfront.Events.on("entity:activated", this.create_properties, this);
		Upfront.Events.on("entity:deactivated", this.destroy_properties, this);

		// Set up behaviors - resizable/selectable
		Upfront.Events.on("entity:activated", this.create_sortable, this);
		Upfront.Events.on("entity:activated", this.create_resizable, this);
		
		// Set up element merging
		Upfront.Events.on("command:select", this.on_select, this);
		Upfront.Events.on("command:deselect", this.on_deselect, this);
		Upfront.Events.on("command:merge", this.on_deselect, this);

		// Layout manipulation
		Upfront.Events.on("command:layout:save", this.save_layout, this);
		Upfront.Events.on("command:layout:load", this.dispatch_layout_loading, this);	
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

	create_sortable: function (view, model) {
		var $sortable = view.$el.parents(".upfront-editable_entities_container:first");
		// Sortable (x axis only, widths take care of y axis sorting)
		if ($sortable.sortable) $sortable.sortable({
			"connectWith": $sortable,
			"axis": "x",
			"placeholder": "upfront-placeholder",
			"opacity": 0.01,
			"tolerance": "pointer",
			start: function (e, ui) {
				$(ui.placeholder).width($(ui.item).find(".upfront-editable_entity:first").outerWidth());
			},
			update: function (e, ui) {
				view.resort_bound_collection();
			}
		});
	},

	create_resizable: function (view, model) {
		$(".ui-resizable").each(function () {
			$(this).resizable("destroy");
		});
		// - Resizable - snap to base grid and replace size with class on release
		var $parent = view.$el,
			parent_width = $parent.width() || 100,
			GRID_SIZE = Upfront.Settings.LayoutEditor.grid_size,
			$resizable = view.$el.find(">.upfront-editable_entity")
		;
		if ($resizable.resizable) $resizable.resizable({
			"containment": "parent",
			"grid": [parseInt(parent_width/GRID_SIZE, 10), 10],
			stop: function (e, ui) {
				var $el = ui.element,
					diff = $el.outerWidth() / parent_width,
					classNum = parseInt(diff * GRID_SIZE, 10), // @TODO: do NOT hardcode grid increments
					className = "c" + classNum,
					prop = model.replace_class(className)
				;
			}
		});
	},

	on_select: function () {
		$(".ui-selectable").each(function () {
			$(this).selectable("destroy");
		});
		var app = this,
			models = [],
			region = app.layout.get("regions").active_region
			collection = (region ? region.get("modules") : false)
		;
		if (collection) $(".upfront-region").selectable({
			filter: ".upfront-module",
			stop: function () {
				if ($(".ui-selected").length < 2) return false;
				$(".ui-selected").each(function () {
					var $node = $(this),
						element_id = $node.attr("id"),
						model = collection.get_by_element_id(element_id)
					;
					if (model && model.get && !model.get("name")) models.push(model);
					else $node.removeClass("ui-selected");
				});
				$(".upfront-active_entity").removeClass("upfront-active_entity");
				$(".ui-selected").removeClass("ui-selected").addClass("upfront-active_entity");
				if (!models.length) return false;

				// @TODO: refactor this!
				app.command_view.commands.push(new Upfront.Views.Editor.Command_Merge({"model": _.extend({}, app.layout, {"merge": models})}));
				app.command_view.render();
			}
		});
	},

	on_deselect: function () {
		$(".ui-selectable").each(function () {
			$(this).selectable("destroy");
		});
	},
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
			$(Upfront.Settings.LayoutEditor.Selectors.commands + ", " + Upfront.Settings.LayoutEditor.Selectors.properties).hide("slow", function () {
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

})();