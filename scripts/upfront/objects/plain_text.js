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
	events: {
		'editor-change [contenteditable]': 'saveContent'
	},

	get_content_markup: function () {
		return ['<div contenteditable="true">',
					this.model.get_content(), '</div>'].join('');
	},
	saveContent: function (event){
		this.model.set_content($(event.currentTarget).html(), {silent: true});
		event.stopPropagation(); // Only this view handles 'editor-change' of descendant contenteditables.
	}
});


var PlainTxtElement = Upfront.Views.Editor.Sidebar.Element.extend({
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