(function ($) {

define(function() {

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
		var content = this.model.get_content();
		return content + ( !this.is_edited() || $.trim(content) == '' ? '<div class="upfront-quick-swap"><p>Double click to edit text</p></div>' : '');
	},

	is_edited: function () {
		var is_edited = this.model.get_property_value_by_name('is_edited');
		return is_edited ? true : false;
	},

	on_render: function() {
		console.log('Text');
		var me = this,
			blurTimeout = false;

		this.$el.find('.upfront-object-content').ueditor({
				linebreaks: false,
				autostart: false
			})
			.on('start', function(){
				var $swap = $(this).find('.upfront-quick-swap');
				if ( $swap.length ){
					$swap.remove();
				}
				me.model.set_property('is_edited', true, true);
				Upfront.Events.trigger('upfront:element:edit:start', 'text');
			})
			.on('stop', function(){
				me.model.trigger('change');
				Upfront.Events.trigger('upfront:element:edit:stop');
			})
			.on('syncAfter', function(){
				me.model.set_content($(this).html(), {silent: true});
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

});
})(jQuery);
