(function ($) {

define(function() {
var TestResizeModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "TestResizeModel");
		this.init_property("view_class", "TestResizeView");

		this.init_property("element_id", Upfront.Util.get_unique_id("testresize-object"));
		this.init_property("class", "c22");
		this.init_property("has_settings", 0);
	}
});

var TestResizeView = Upfront.Views.ObjectView.extend({
	
	on_render: function () {
		var me = this;
		this.$el.on('click', '.get-max', function (e) {
			e.preventDefault();
			var max = me.get_element_max_size(),
				max_px = me.get_element_max_size_px();
			me.$el.find('.max-dimension').text( 'col: ' + max.col + '(' + max_px.col + 'px) row: ' + max.row + '(' + max_px.row + 'px)' );
		});
		this.$el.on('click', '.resize-shrink-col', function (e) {
			e.preventDefault();
			var col = me.get_element_columns();
			me.set_element_size(col-1);
		});
		this.$el.on('click', '.resize-expand-col', function (e) {
			e.preventDefault();
			var col = me.get_element_columns();
			me.set_element_size(col+1);
		});
		this.$el.on('click', '.resize-shrink-row', function (e) {
			e.preventDefault();
			var row = me.get_element_rows();
			me.set_element_size(false, row-1);
		});
		this.$el.on('click', '.resize-expand-row', function (e) {
			e.preventDefault();
			var row = me.get_element_rows();
			me.set_element_size(false, row+1);
		});
		this.$el.on('click', '.resize-1', function (e) {
			e.preventDefault();
			me.set_element_size(6, 20);
		});
		this.$el.on('click', '.resize-max', function (e) {
			e.preventDefault();
			var max = me.get_element_max_size();
			me.set_element_size(max.col, max.row);
		});
	},
	
	on_after_layout_render: function () {
		var size = this.get_element_size();
		this.$el.find('.dimension').text('col: ' + size.col + ', row:' + size.row);
	},

	get_content_markup: function () {
		var size = this.get_element_size();
		return '<span class="dimension">col: ' + size.col + ', row:' + size.row + '</span><br />' +
			'<a href="#" class="get-max">Get max data</a><br />' + 
			'<span class="max-dimension"></span><br />' + 
			'<a href="#" class="resize-shrink-col">-1 col</a> | <a href="#" class="resize-expand-col">+1 col</a><br />' + 
			'<a href="#" class="resize-shrink-row">-1 row</a> | <a href="#" class="resize-expand-row">+1 row</a><br />' + 
			'<a href="#" class="resize-1">Resize to 6x20</a><br />' + 
			'<a href="#" class="resize-max">Resize to max</a>'
		;
	}

});

var TestResizeElement = Upfront.Views.Editor.Sidebar.Element.extend({

	draggable: true,
	render: function () {
		this.$el.html('Test Resize');
	},

	add_element: function () {
		var object = new TestResizeModel(),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c8 upfront-testresize_module"},
					{"name": "has_settings", "value": 0},
					{"name": "row", "value": 20}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});



Upfront.Application.LayoutEditor.add_object("TestResize", {
	"Model": TestResizeModel,
	"View": TestResizeView,
	"Element": TestResizeElement
});
Upfront.Models.TestResizeModel = TestResizeModel;
Upfront.Views.TestResizeView = TestResizeView;


});
})(jQuery);
