(function ($) {

var UcommentModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "UcommentModel");
		this.init_property("view_class", "UcommentView");
		
		this.init_property("element_id", Upfront.Util.get_unique_id("ucomment-object"));
		this.init_property("class", "c22 upfront-comment");
		this.init_property("has_settings", 0);
	}
});

var UcommentView = Upfront.Views.ObjectView.extend({
	
	get_content_markup: function () {
		var comment_data = $(document).data('upfront-comment-' + _upfront_post_data.post_id);
		return comment_data ? comment_data : 'Loading';
	},
	
	on_render: function () {
		if ( !$(document).data('upfront-comment-' + _upfront_post_data.post_id) )
			this._get_comment_markup();
	},
	
	_get_comment_markup: function () {
		var me = this;
		Upfront.Util.post({"action": "ucomment_get_comment_markup", "data": JSON.stringify({"post_id": _upfront_post_data.post_id})})
			.success(function (ret) {
				var html = ret.data.replace(/<script.*?>.*?<\/script>/gim, ''); // strip script
				$(document).data('upfront-comment-' + _upfront_post_data.post_id, html);
				me.render();
			})
			.error(function (ret) {
				Upfront.Util.log("Error loading comment");
		});
	}
});

var UcommentElement = Upfront.Views.Editor.Sidebar.Element.extend({
	
	render: function () {
		//this.$el.addClass('upfront-icon-element upfront-icon-element-comment');
		this.$el.html('Comment');
	},

	add_element: function () {
		var object = new UcommentModel(),
			module = new Upfront.Models.Module({ 
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c11 upfront-comment_module"},
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


if (_upfront_post_data.post_id) {
	Upfront.Application.LayoutEditor.add_object("Ucomment", {
		"Model": UcommentModel, 
		"View": UcommentView,
		"Element": UcommentElement
	});
	Upfront.Models.UcommentModel = UcommentModel;
	Upfront.Views.UcommentView = UcommentView;
}

})(jQuery);