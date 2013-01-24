(function ($) {

var ImageModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "ImageModel");
		this.init_property("view_class", "ImageView");
		
		this.init_property("element_id", Upfront.Util.get_unique_id("image-object"));
		this.init_property("class", "c22");
	}
});

var ImageView = Upfront.Views.ObjectView.extend(_.extend({}, Upfront.Mixins.FixedObjectInAnonymousModule, {
	model: ImageModel,
	get_content_markup: function () {
		return '<img src="' + this.model.get_content() + '" />';
	},

	on_edit: function () {
		this.$el.html(
			'<input type="text" style="width:99%" value="' + this.model.get_content() + '" />' +
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
		var txt = this.$el.find(":text").val();
		this.model.set_content(txt);
		this.undelegateEvents();
		this.delegateEvents();
		this.render();
	},
	on_cancel: function () {
		this.undelegateEvents();
		this.delegateEvents();
		this.render();	
	}
}));

var ImageCommand = Upfront.Views.Editor.Command.extend({
	render: function () {
		this.$el.html('Add new Image');
	},
	on_click: function () {
		var object = new ImageModel({
				"name": "",
				"properties": [
					{"name": "content", "value": "http://wpsalad.com/wp-content/uploads/2012/11/wpmudev.png"},
				]
			}),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c22 upfront-image_module"}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});

Upfront.Application.LayoutEditor.add_object("Image", {"Model": ImageModel, "Command": ImageCommand});
Upfront.Models.ImageModel = ImageModel;
Upfront.Views.ImageView = ImageView;

})(jQuery);