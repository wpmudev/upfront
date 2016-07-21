(function ($) {

define(function() {

var LoadingModel = Upfront.Models.ObjectModel.extend({
	init: function () {
		this.init_property("type", "LoadingModel");
		this.init_property("view_class", "LoadingView");
		this.init_property("element_id", Upfront.Util.get_unique_id("please_wait"));
		this.init_property("content", 'Please, wait...');
		this.init_property("class", 'c24');
	}
});

var LoadingView = Upfront.Views.ObjectView.extend({
	model: LoadingModel,
	get_content_markup: function () {
		return '<img src="' + Upfront.Settings.root_url + '/img/loading.gif" /> ' +
			'<i>' + this.model.get_content() + '</i>' +
		'';
	}
});

//Upfront.Application.LayoutEditor.add_object("Image", {"Model": LoadingModel, "Command": ImageCommand}); // No command, this is built-in stub
Upfront.Models.LoadingModel = LoadingModel;
Upfront.Views.LoadingView = LoadingView;

});
})(jQuery);
