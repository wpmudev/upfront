// Set up the global namespace
var Upfront = window.Upfront || {};

(function () {

require.config({
	urlArgs: "nocache=" + (new Date).getTime(),
	baseUrl: 'js/libs',
	paths: {
		underscore: "underscore-min",
		backbone: "backbone-min",
		jquery: "jquery-1.8.3",
		ui: "jquery-ui-1.9.2.custom.min",
	// Upfront
		models: "../mylibs/upfront-models",
		views: "../mylibs/upfront-views",
		editor_views: "../mylibs/upfront-views-editor",
		util: "../mylibs/upfront-util",
		application: "../mylibs/upfront-application",
		objects: "../mylibs/upfront-objects"
	},
	shim: {
		ui: {
			deps: ["jquery"]
		},
		underscore: {
			exports: '_'
		},
		backbone: {
			deps: ["underscore", "jquery"],
			exports: "Backbone"
		}
	}
});

require(['jquery', 'underscore', 'backbone', 'ui'], function ($, _, Backbone) {
	// Shim the jQuery in
	window.$ = $;

	// Fix Underscore templating to Mustache style
	_.templateSettings = {
		interpolate : /\{\{(.+?)\}\}/g
	};

	require(['application', 'util'], function (application, util) {
		// Shims and stubs
		Upfront.Events = {}
		Upfront.Settings = {
			"ajax_url": "http://localhost/upfront/wp-admin/admin-ajax.php",
			"LayoutEditor": {
				"Selectors": {
					"commands": "#commands",
					"properties": "#properties",
					"main": "#upfront-output"
				},
				"grid_size": 22,
			}
		};

		// Populate basics
		_.extend(Upfront.Events, Backbone.Events);
		_.extend(Upfront, application);
		_.extend(Upfront, util);
		
		if (Upfront.Application && Upfront.Application.run) Upfront.Application.run();
		else Upfront.Util.log('something went wrong');
	}); // Upfront
}); // Base deps

})();