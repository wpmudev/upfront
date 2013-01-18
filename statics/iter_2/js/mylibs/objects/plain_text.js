(function () {

var PlainTxtModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		if (!this.get("properties").where({"name": "type"}).length) this.get("properties").add(new Upfront.Models.Property({"name": "type", "value": "PlainTxtModel"}));
		if (!this.get("properties").where({"name": "view_class"}).length) this.get("properties").add(new Upfront.Models.Property({"name": "view_class", "value": "PlainTxtView"}));
	}
});

var PlainTxtView = Upfront.Views.ObjectView.extend({
	model: PlainTxtModel,
	get_content_markup: function () {
		return '<pre>' + this.model.get_content() + '</pre>';
	},
	on_edit: function () {
		this.$el.html(
			'<textarea style="width:99%">' + this.model.get_content() + '</textarea>' +
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
		this.delegateEvents();
		this.render();	
	}
});

var PlainTxtCommand = Upfront.Views.Editor.Command.extend({
	render: function () {
		this.$el.html('Add new Plain Text object');
	},
	on_click: function () {
		var object = new PlainTxtModel({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("text-object")},
					{"name": "content", "value": "My awesome stub content goes here"},
					{"name": "class", "value": "c22"}
				]
			}),
			module = new Upfront.Models.Module({
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c20 ml2"}
				],
				"objects": [
					object
				]
			})
		;
		this.add_module(module);
	}
});

Upfront.Application.LayoutEditor.add_object("PlainTxt", {"Model": PlainTxtModel, "Command": PlainTxtCommand});
Upfront.Models.PlainTxtModel = PlainTxtModel;
Upfront.Views.PlainTxtView = PlainTxtView;

})();