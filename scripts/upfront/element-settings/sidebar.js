(function ($) {
define([], function () {
	// Setup basics
	$('body').append('<div id="element-settings-sidebar" />');
	$('#element-settings-sidebar').width(0);
	var the_settings_view;

	var destroySettings = function() {
		//If settings are opened, destroy
		if (the_settings_view) {
			the_settings_view.cleanUp();
			the_settings_view = false;
			$('#element-settings-sidebar').width(0).html('');
			Upfront.Events.off('element:settings:saved', destroySettings);
		}
	};

	var showSettings = function(view) {
		var current_object_proto, settings_obj_view;

		if (the_settings_view) {
			/** triggering the event instead of directly calling the destroy function,
				so that elements can subscribe to this event even when executed by virtue
				of toggling the settings button **/
			Upfront.Events.trigger("element:settings:canceled");
			return;
		}

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
			anchor: ( current_object_proto ? current_object_proto.anchor : false ),
			elementView: view
		});
		the_settings_view.for_view = view;
		the_settings_view.render();
		$('#element-settings-sidebar').html(the_settings_view.el);
		$('#element-settings-sidebar').width(260);
		$('.uf-settings-panel--expanded:not(:first)').toggleClass('uf-settings-panel--expanded').find('.uf-settings-panel__body').toggle();

		Upfront.Events.on('element:settings:saved', destroySettings);
	};

	Upfront.Events.on('element:settings:activate', showSettings);

	//Destroy settings when element is removed
	Upfront.Events.on("entity:removed:after", destroySettings);

	//Destroy settings when Cancel button is clicked
	Upfront.Events.on('element:settings:canceled', destroySettings);

});
})(jQuery);
