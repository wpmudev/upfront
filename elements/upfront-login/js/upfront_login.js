(function ($) {


var LoginModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "LoginModel");
		this.init_property("view_class", "LoginView");
		
		this.init_property("element_id", Upfront.Util.get_unique_id("upfront-login_element-object"));
		this.init_property("class", "c22 upfront-login_element-object");
		this.init_property("has_settings", 0);
	}
});

var LoginView = Upfront.Views.ObjectView.extend({
	markup: false,

	render: function () {
		if (!this.markup) {
			var me = this;
			Upfront.Util.post({
				"action": "upfront-login_element-get_markup"
			}).done(function (response) {
				me.markup = response.data;
				Upfront.Views.ObjectView.prototype.render.call(me); 
			});
		}
		Upfront.Views.ObjectView.prototype.render.call(this);
	},

	get_content_markup: function () {
		return !!this.markup ? this.markup : 'Please, hold on';
	}
});


var LoginElement = Upfront.Views.Editor.Sidebar.Element.extend({
	priority: 100,

	render: function () {
		this.$el.html('Login');
	},

	add_element: function () {
		var object = new LoginModel(),
			module = new Upfront.Models.Module({ 
				"name": "",
				"properties": [
					{"name": "element_id", "value": Upfront.Util.get_unique_id("module")},
					{"name": "class", "value": "c22 upfront-login_element-module"},
					{"name": "has_settings", "value": 0}
				],
				"objects": [object]
			})
		;
		this.add_module(module);
	}
});
Upfront.Application.LayoutEditor.add_object("Login", {
	"Model": LoginModel,
	"View": LoginView,
	"Element": LoginElement
});
Upfront.Models.LoginModel = LoginModel;
Upfront.Views.LoginView = LoginView;

})(jQuery);