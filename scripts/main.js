// Set up the global namespace
var Upfront = window.Upfront || {};
Upfront.mainData = Upfront.mainData || {};
Upfront.Events = {};

// Fix to use the already loaded jquery as dependency
define('jquery', [], function(){
	return jQuery;
});

require.config(Upfront.mainData.requireConfig);

require(['backbone'], function (Backbone) {
	// Fix Underscore templating to Mustache style
	_.templateSettings = {
		evaluate : /\{\[([\s\S]+?)\]\}/g,
		interpolate : /\{\{([\s\S]+?)\}\}/g
	};
	require(['application', 'util'], function (application, util) {
		// Shims and stubs
		_.extend(Upfront.Events, Backbone.Events);
		Upfront.Settings = {
			"ace_url": "//cdnjs.cloudflare.com/ajax/libs/ace/1.1.01/ace.js",
			"root_url": Upfront.mainData.root,
			"ajax_url": Upfront.mainData.ajax,
			"admin_url": Upfront.mainData.admin,
			"site_url": Upfront.mainData.site,
			"Debug": Upfront.mainData.debug,
			"ContentEditor": {
			"Requirements": Upfront.mainData.layoutEditorRequirements,
			"Selectors": {
				"sidebar": "#sidebar-ui"
				}
			},
			"Application": {
				"MODE": Upfront.mainData.applicationModes,
				"NO_SAVE": Upfront.mainData.readOnly,
				"DEBUG": false,
				"PERMS": Upfront.mainData.PERMS
			},
			"LayoutEditor": {
				"Requirements": Upfront.mainData.layoutEditorRequirements,
				"Selectors": {
					"sidebar": "#sidebar-ui",
					"commands": "#commands",
					"properties": "#properties",
					"layouts": "#layouts",
					"settings": "#settings",
					"contextmenu": "#contextmenu",
					//"main": "#upfront-output"
					"main": "#page"
				},
				"Specificity": Upfront.mainData.specificity,
				"ArchiveSpecificity": Upfront.mainData.archiveSpecificity,
				"Grid": Upfront.mainData.gridInfo,
				'Theme': Upfront.mainData.themeInfo
			},
			"Content": Upfront.mainData.content,
			"l10n": Upfront.mainData.l10n
		};

		if (window._upfront_debug_mode) {
			Upfront.Settings.Application.DEBUG = true;
			Upfront.Settings.Application.NO_SAVE = true;
		}

		// Populate basics
		_.extend(Upfront, application);
		_.extend(Upfront, util);
		Upfront.Util.Transient.initialize();

		// Set up deferreds
		Upfront.LoadedObjectsDeferreds = {};
		Upfront.Events.trigger("application:loaded:layout_editor");

		if (Upfront.Application && Upfront.Application.boot) Upfront.Application.boot();
		else Upfront.Util.log('something went wrong');

	}); // Upfront
});
