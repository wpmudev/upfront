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
		this.$el.html(
			'<textarea style="width:90%; margin:0 5%;" rows="10">' + this.model.get_content() + '</textarea>' +
			'<button type="button" class="upfront-save">Save</button>' +
			'<button type="button" class="upfront-cancel">Cancel</button>'
		);
		this.undelegateEvents();
		this.delegateEvents({
			"click .upfront-save": "on_save",
			"click .upfront-cancel": "on_cancel",
		});
	},
	on_save: function () {
		var txt = this.$el.find("textarea").val();
		this.model.set_content(txt);
		this.undelegateEvents();
		this.delegateEvents();
		this.render();
	},
	on_cancel: function () {
		this.undelegateEvents();
		this.deactivate();
		this.delegateEvents();
		this.render();	
	}
});


var PlainTxtElement = Upfront.Views.Editor.Sidebar.Element.extend({
	render: function () {
		this.$el.html('Text');
	},
	add_element: function () {
		var object = new PlainTxtModel({
				"name": "",
				"properties": [
					{"name": "content", "value": "My awesome stub content goes here"},
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