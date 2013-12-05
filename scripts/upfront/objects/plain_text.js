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
		return this.model.get_content() + '<div class="upfront-quick-swap"><p>Double click to edit text</p></div>';
	},
	on_edit: function () {
		var editor = Upfront.Content.editors.add({
			type: Upfront.Content.TYPES.PLAIN,
			editor_id: this.model.get_property_value_by_name("element_id"),
			view: this
		});
		editor.start();
	},
	on_cancel: function () {
		var editor = Upfront.Content.editors.get(this.model.get_property_value_by_name("element_id"));
		editor.stop();
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