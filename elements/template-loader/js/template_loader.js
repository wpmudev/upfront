(function ($) {
define([
], function() {

	var TemplateLoaderView = Upfront.Views.ObjectView.extend({
		get_content_markup: function () {
			//TODO Implement actual content loading
			return '<h1>This is place where actual template content will be loaded on live site. You can resize it, reposition it and add other elements around it.</h1>';
		},
		on_render: function() {
			this.$el.css('background', 'rgba(0,0,0,0.2');
		}
	});

	Upfront.Application.LayoutEditor.add_object('TemplateLoader', {
		'View': TemplateLoaderView,
	});

	Upfront.Views.TemplateLoaderView = TemplateLoaderView

});
})(jQuery);
