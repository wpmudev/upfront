(function ($) {

var LoadingModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		if (!this.get("properties").where({"name": "type"}).length) this.get("properties").add(new Upfront.Models.Property({"name": "type", "value": "LoadingModel"}));
		if (!this.get("properties").where({"name": "view_class"}).length) this.get("properties").add(new Upfront.Models.Property({"name": "view_class", "value": "LoadingView"}));
	}
});

var LoadingView = Upfront.Views.ObjectView.extend({
	model: LoadingModel,
	get_content_markup: function () {
		return '<img src="' + Upfront.Settings.root_url + '/img/loading.gif" /> ' +
			'<i>' + this.model.get_content() + '</i>' +
		'';
	},
});

//Upfront.Application.LayoutEditor.add_object("Image", {"Model": LoadingModel, "Command": ImageCommand}); // No command, this is built-in stub
Upfront.Models.LoadingModel = LoadingModel;
Upfront.Views.LoadingView = LoadingView;

})(jQuery);