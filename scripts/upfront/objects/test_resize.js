(function ($) {

define(function() {
var TestResizeModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "TestResizeModel");
		this.init_property("view_class", "TestResizeView");

		this.init_property("element_id", Upfront.Util.get_unique_id("testresize-object"));
		this.init_property("class", "c24");
		this.init_property("has_settings", 0);
	}
});

var TestResizeView = Upfront.Views.ObjectView.extend({
	
	on_render: function () {
		var me = this;
		this.$el.on('click', '.get-max', function (e) {
			e.preventDefault();
			var axis = $(this).attr('data-axis'),
				max = me.get_element_max_size(axis),
				max_px = me.get_element_max_size_px(axis);
			me.$el.find('.max-dimension').text( 'col: ' + max.col + '(' + max_px.col + 'px) row: ' + max.row + '(' + max_px.row + 'px)' );
		});
		this.$el.on('click', '.resize-shrink-col', function (e) {
			e.preventDefault();
			var axis = $(this).attr('data-axis'),
				col = me.get_element_columns();
			me.set_element_size(col-1, false, axis);
		});
		this.$el.on('click', '.resize-expand-col', function (e) {
			e.preventDefault();
			var axis = $(this).attr('data-axis'),
				col = me.get_element_columns();
			me.set_element_size(col+1, false, axis);
		});
		this.$el.on('click', '.resize-shrink-row', function (e) {
			e.preventDefault();
			var axis = $(this).attr('data-axis'),
				row = me.get_element_rows();
			me.set_element_size(false, row-1, axis);
		});
		this.$el.on('click', '.resize-expand-row', function (e) {
			e.preventDefault();
			var axis = $(this).attr('data-axis'),
				row = me.get_element_rows();
			me.set_element_size(false, row+1, axis);
		});
		this.$el.on('click', '.resize-1', function (e) {
			e.preventDefault();
			var axis = $(this).attr('data-axis');
			me.set_element_size(8, 20, axis);
		});
		this.$el.on('click', '.resize-max', function (e) {
			e.preventDefault();
			var axis = $(this).attr('data-axis'),
				max = me.get_element_max_size(axis);
			me.set_element_size(max.col, max.row, axis);
		});
	},
	
	on_after_layout_render: function () {
		var size = this.get_element_size();
		this.$el.find('.dimension').text('col: ' + size.col + ', row:' + size.row);
	},

	get_content_markup: function () {
		var size = this.get_element_size();
		return '<span style="font-size:10px;line-height:15px;"><span class="dimension">col: ' + size.col + ', row:' + size.row + '</span><br />' +
			'<a href="#" class="get-max" data-axis="all">Get max (all)</a> | ' + 
			'<a href="#" class="get-max" data-axis="se">Get max (se)</a> | ' + 
			'<a href="#" class="get-max" data-axis="nw">Get max (nw)</a><br />' + 
			'<span class="max-dimension"></span><br />' + 
			'<a href="#" class="resize-shrink-col" data-axis="all">-1 col (all)</a> | <a href="#" class="resize-expand-col" data-axis="all">+1 col (all)</a> | ' + 
			'<a href="#" class="resize-shrink-row" data-axis="all">-1 row (all)</a> | <a href="#" class="resize-expand-row" data-axis="all">+1 row (all)</a><br />' + 
			'<a href="#" class="resize-shrink-col" data-axis="se">-1 col (se)</a> | <a href="#" class="resize-expand-col" data-axis="se">+1 col (se)</a> | ' + 
			'<a href="#" class="resize-shrink-row" data-axis="se">-1 row (se)</a> | <a href="#" class="resize-expand-row" data-axis="se">+1 row (se)</a><br />' + 
			'<a href="#" class="resize-shrink-col" data-axis="nw">-1 col (nw)</a> | <a href="#" class="resize-expand-col" data-axis="nw">+1 col (nw)</a> | ' + 
			'<a href="#" class="resize-shrink-row" data-axis="nw">-1 row (nw)</a> | <a href="#" class="resize-expand-row" data-axis="nw">+1 row (nw)</a><br />' + 
			'<a href="#" class="resize-1" data-axis="all">Resize to 8x20 (all)</a> | ' + 
			'<a href="#" class="resize-1" data-axis="se">Resize to 8x20 (se)</a> | ' + 
			'<a href="#" class="resize-1" data-axis="nw">Resize to 8x20 (nw)</a><br />' + 
			'<a href="#" class="resize-max" data-axis="all">Resize to max (all)</a> | ' + 
			'<a href="#" class="resize-max" data-axis="se">Resize to max (se)</a> | ' + 
			'<a href="#" class="resize-max" data-axis="nw">Resize to max (nw)</a></span>'
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
