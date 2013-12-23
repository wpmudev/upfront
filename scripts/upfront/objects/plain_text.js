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
	get_content_markup: function () {
		return this.model.get_content();
	},

	on_render: function() {
		console.log('Text');
		var blurTimeout = false;

		this.$el.find('.upfront-object-content').ueditor({
				linebreaks: false,
				autostart: false
			})
			.on('start', function(){				
    			Upfront.Events.trigger('upfront:element:edit:start', 'text');
			})
			.on('stop', function(){
    			Upfront.Events.trigger('upfront:element:edit:stop');
			})
		;
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
