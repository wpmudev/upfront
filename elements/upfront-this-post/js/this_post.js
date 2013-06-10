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
		var content = $(document).data("upfront-post-" + _upfront_post_data.post_id);
		return content ? content.filtered : 'Hold on please';
	},

	on_render: function () {
		var me = this,
			element_id = this.model.get_property_value_by_name("element_id"),
			content = $(document).data("upfront-post-" + _upfront_post_data.post_id)
		;

		if (content) $("#" + element_id).find(".upfront-object-content").html(content.filtered);
		else this._get_post_content();
		Upfront.Application.ContentEditor.stop();
		Upfront.Events.on("upfront:posts:post:post_updated", function () {
			me._get_post_content();
		});
		this.trigger("rendered", this);
	},

	_get_post_content: function () {
		var me = this;
		if (!this._content) Upfront.Util.post({
			"action": "this_post-get_markup",
			"data": JSON.stringify({
				"post_id": _upfront_post_data.post_id
			})
		}).success(function (response) {
			$(document).data("upfront-post-" + _upfront_post_data.post_id, response.data);
			me.render();
			Upfront.Events.trigger("elements:this_post:loaded", me);
		});
	},

	on_edit: function () {
		var me = this,
			content = $(document).data("upfront-post-" + _upfront_post_data.post_id),
			$title = this.$el.find('h3.post_title a'),
			$body = this.$el.find('.post_content'),
			$parent = me.parent_module_view.$el.find('.upfront-editable_entity:first')
		;
		// Hacky way of closing other instances
		if ($("#upfront-post-cancel_edit").length) {
			$("#upfront-post-cancel_edit").trigger("click");
		}
		// End hack
		$title.html('<input type="text" id="upfront-title" style="width:100%" value="' + content.raw.title + '"/>');
		$body.html(
			'<input type="hidden" name="post_id" id="upfront-post_id" value="' + _upfront_post_data.post_id + '" />' +
			'<div contenteditable="true" id="upfront-body" rows="8" style="width:100%">' + content.raw.content + '</div>' +
			'<button type="button" id="upfront-post-cancel_edit">Cancel</button>'
		);
		// Prevent default events, we're in editor mode.
		me.undelegateEvents();
		// Kill the draggable, so we can work with regular inline editor.
		if ($parent.is(".ui-draggable")) $parent.draggable('disable');

		CKEDITOR.inline('upfront-body');
		$body
			.find("#upfront-body").focus().end()
			.find("#upfront-post-cancel_edit").on("click", function () {
				me.stop_editor();
			})
		;
		Upfront.Application.ContentEditor.run();

		Upfront.Events.on("entity:deactivated", this.stop_editor, this);
	},
	stop_editor: function () {
		this.on_cancel();
		Upfront.Application.ContentEditor.stop();
	},
	on_save: function () {
		this.undelegateEvents();
		// Re-enable the draggable on edit stop
		this.parent_module_view.$el.find('.upfront-editable_entity:first').draggable('enable');
		this.delegateEvents();
		this.render();
	},
	on_cancel: function () {
		var $parent = this.parent_module_view.$el.find('.upfront-editable_entity:first');
		this.undelegateEvents();
		this.deactivate();
		if (CKEDITOR.instances['upfront-body']) CKEDITOR.instances['upfront-body'].destroy(); // Clean up the editor.
		// Re-enable the draggable on edit stop
		if ($parent.is(".ui-draggable")) $parent.draggable('enable');
		this.delegateEvents();
		this.render();
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