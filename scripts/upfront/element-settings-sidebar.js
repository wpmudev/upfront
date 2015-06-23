(function ($) {
define([], function () {
	// Setup basics
	$('body').append('<div id="element-settings-sidebar" />');
	$('#element-settings-sidebar').width(0);
	var the_settings_view;

	var destroySettings = function() {
		the_settings_view.cleanUp();
		the_settings_view = false;
		$('#element-settings-sidebar').width(0).html('');
		Upfront.Events.off('element:settings:saved', destroySettings);
	};

	var showSettings = function(view) {
		var current_object_proto, settings_obj_view;

		if (the_settings_view) return destroySettings();

		current_object_proto = _(Upfront.Application.LayoutEditor.Objects).reduce(function (obj, current) {
			if (view instanceof current.View) {
				return current;
			}
			return obj;
		}, false);

		current_object_proto = (current_object_proto && current_object_proto.Settings ? current_object_proto : Upfront.Views.Editor.Settings);
		settings_obj_view = current_object_proto.Settings;

		the_settings_view = new settings_obj_view({
			model: view.model,
			anchor: ( current_object_proto ? current_object_proto.anchor : false )
		});
		the_settings_view.for_view = view;
		the_settings_view.render();
		$('#element-settings-sidebar').html(the_settings_view.el);
		$('#element-settings-sidebar').width(260);

		Upfront.Events.on('element:settings:saved', destroySettings);
	};

	Upfront.Events.on('element:settings:activate', showSettings);

});
})(jQuery);
