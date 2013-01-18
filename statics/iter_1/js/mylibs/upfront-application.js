(function () {

var Application = Backbone.Router.extend({
	routes: {
		"done": "destroy_editor",
		"layout(/:id)": "dispatch_layout_loading",
		"new-layout": "dispatch_layout_creation"
	},

	run: function () {
		var app = this;
		// Temporary Edit switch event plumbing
		$("body").on("click", ".upfront-edit_layout", function () {
			$(this).remove();
			app.go("layout");
			return false; 
		});
		$("body").on("click", ".upfront-finish_layout_editing", function () {
			$("#commands, #properties").hide("slow", function () {
				app.go("done"); 
			});
			return false;
		});

		Backbone.history.start();
	},

	go: function (frag) {
		return this.navigate(frag, {trigger: true});
	},

	set_up_editor_interface: function () {
		if (!this.layout) return false;
		command_view = new Upfront.Views.Editor.Commands({
			"model": this.layout,
			"el": $("#commands")
		});
		command_view.render();
	},

	set_up_event_plumbing: function () {
		// Temporary Event plumbing
		$(document).on("upfront-editable_entity-selected", "#main", function (e, model, view) {
			var property_view = new Upfront.Views.Editor.Properties({
				"model": model, 
				"el": $("#properties")
			});
			property_view.render();

			// --- Set up behaviors - contained objects ---

			// --- Sortable
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

			// --- Resizable
			// - Removing old resizables
			$(".ui-resizable").each(function () {
				$(this).resizable("destroy");
			});
			// - Resizable - snap to base grid and replace size with class on release
			var $parent = view.$el,
				parent_width = $parent.width() || 100,
				GRID_SIZE = 22,
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
		});
	},

	load_layout: function (layout_id) {
		var app = this;
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
		 	$(".upfront-edit_layout").remove();
			$("#upfront-loading").remove();
		});
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
			app.load_layout(layout);
		});
	},
	dispatch_layout_creation: function () {
		console.log("creating new layout");
	},
	destroy_editor: function () {
		this.navigate("");
		window.location.reload();
		return false;
	}
});

define({
	"Application": new Application()
});

})();