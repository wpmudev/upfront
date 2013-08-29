(function ($) {

var PlainTxtModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "PlainTxtModel");
		this.init_property("view_class", "PlainTxtView");
		this.init_property("element_id", Upfront.Util.get_unique_id("text-object"));
		this.init_property("class", "c22 upfront-plain_txt");
		this.init_property("has_settings", 0);
	}
});

var PlainTxtView = Upfront.Views.ObjectView.extend({
	model: PlainTxtModel,

	get_content_markup: function () {
		return this.model.get_content();
	},
	on_edit: function () {
		this.$el.html('<div contenteditable class="upfront-object">' + this.get_content_markup() + '</div>');
		var me = this,
			$el = this.$el.find('div[contenteditable]'),
			$parent = this.parent_module_view.$el.find('.upfront-editable_entity:first'),
			editor = CKEDITOR.inline($el.get(0))
		;
		if ($parent.is(".ui-draggable")) $parent.draggable('disable');
		editor.on('change', function (e) {
			me.model.set_content(e.editor.getData(), {silent: true});
		});
		Upfront.Events.on("entity:deactivated", this.on_cancel, this);
		$el.on("dblclick", function (e) {e.stopPropagation();}); // Allow double-click word selecting.
		this.model.set_property("_cke", editor.name, true);
	},
	on_cancel: function () {
		var editor_name = this.model.get_property_value_by_name("_cke");
		if (editor_name && CKEDITOR.instances[editor_name]) CKEDITOR.instances[editor_name].destroy();
		this.$el.html(this.get_content_markup());
		var $parent = this.parent_module_view.$el.find('.upfront-editable_entity:first');
		this.undelegateEvents();
		this.deactivate();
		// Re-enable the draggable on edit stop
		if ($parent.is(".ui-draggable")) $parent.draggable('enable');
		this.delegateEvents();
		Upfront.Events.off("entity:deactivated", this.on_cancel, this);
		this.render();
	}
});


var PlainTxtElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 10,
	render: function () {
		this.$el.addClass('upfront-icon-element upfront-icon-element-text');
		this.$el.html('Text');
	},
	add_element: function () {
		var object = new PlainTxtModel({
				"name": "",
				"properties": [
					{"name": "content", "value": "<p>My awesome stub content goes here</p>"}
				]
			}),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c11"},
					{"name": "row", "value": "5"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});

Upfront.Application.LayoutEditor.add_object("PlainTxt", {
	"Model": PlainTxtModel,
	"View": PlainTxtView,
	"Element": PlainTxtElement
});
Upfront.Models.PlainTxtModel = PlainTxtModel;
Upfront.Views.PlainTxtView = PlainTxtView;

})(jQuery);