(function ($) {


/**
 * Define the model - initialize properties to their default values.
 * @type {Upfront.Models.ObjectModel}
 */
var ThisPostModel = Upfront.Models.ObjectModel.extend({
	/**
	 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
	 * Used for setting up instance defaults, initialization and the like.
	 */
	init: function () {
		this.init_property("type", "ThisPostModel");
		this.init_property("view_class", "ThisPostView");

		this.init_property("element_id", Upfront.Util.get_unique_id("this_post-object"));
		this.init_property("class", "c22");
		this.init_property("has_settings", 0);
	}
});

/**
 * View instance - what the element looks like.
 * @type {Upfront.Views.ObjectView}
 */
var ThisPostView = Upfront.Views.ObjectView.extend({
	/**
	 * Element contents markup.
	 * @return {string} Markup to be shown.
	 */
	get_content_markup: function () {
		return 'Hold on please';
	},

	on_render: function () {
		var element_id = this.model.get_property_value_by_name("element_id");

		Upfront.Util.post({
			"action": "this_post-get_markup",
			"data": JSON.stringify({
				"post_id": _upfront_post_data.post_id
			})
		}).success(function (response) {
			$("#" + element_id)
				.find(".upfront-object-content").html(response.data)
			;
		});
	}
});


/**
 * Editor command class - this will be injected into commands
 * and allow adding the new entity instance to the work area.
 * @type {Upfront.Views.Editor.Command}
 */
var ThisPostElement = Upfront.Views.Editor.Sidebar.Element.extend({
	/**
	 * Set up command appearance.
	 */
	render: function () {
		this.$el.html('This Post');
	},

	/**
	 * What happens when user clicks the command?
	 * We're instantiating a module with search entity (object), and add it to the workspace.
	 */
	add_element: function () {
		var object = new ThisPostModel(), // Instantiate the model
			// Since search entity is an object,
			// we don't need a specific module instance -
			// we're wrapping the search entity in 
			// an anonymous general-purpose module
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c6 upfront-this_post_module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object // The anonymous module will contain our search object model
				]
			})
		;
		// We instantiated the module, add it to the workspace
		this.add_module(module);
	}
});

// ----- Bringing everything together -----
// The definitions part is over.
// Now, to tie it all up and expose to the Subapplication.

if (_upfront_post_data.post_id) {
	Upfront.Application.LayoutEditor.add_object("ThisPost", {
		"Model": ThisPostModel,
		"View": ThisPostView,
		"Element": ThisPostElement
	});
	Upfront.Models.ThisPostModel = ThisPostModel;
	Upfront.Views.ThisPostView = ThisPostView;
}
	
})(jQuery);