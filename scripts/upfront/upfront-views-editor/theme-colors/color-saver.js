(function($) {
define([
], function() {
	var l10n = Upfront.Settings && Upfront.Settings.l10n ?
		Upfront.Settings.l10n.global.views :
		Upfront.mainData.l10n.global.views;

	var ColorSaver = function() {
		var pending = [];

		var saveOne = function(data, result, result2) {
			var params = {
				action: 'upfront_update_theme_colors',
				theme_colors: data[0],
				range : data[1]
			};

			Upfront.Util.post(params)
				.done(function() {
						result.resolve();
				})
				.fail( function() {
					result.reject();
					Upfront.Views.Editor.notify(l10n.theme_colors_save_fail);
				});

			var params2 = {
				action: 'upfront_save_theme_colors_styles',
				styles: data[2]
			};

			Upfront.Util.post(params2)
				.done(function() {
						result2.resolve();
				}).fail( function() {
					result2.reject();
					Upfront.Views.Editor.notify(l10n.theme_color_style_save_fail);
				});
		};

		/**
		 * Loops through queued colors and requests saving of each one.
		 */
		this.save = function() {
			var results = [],
				result = $.Deferred();
			// Iterate through all colors to save
			while (pending.length) {
				var d = $.Deferred();
				var d2 = $.Deferred();
				results.push(d);
				results.push(d2);
				saveOne(pending.pop(), d, d2);
			}

			if (results.length > 0) {
				$.when.apply($, results).done( function() {
					result.resolve();
				}).fail( function() {
					result.reject();
				});
				return result;
			}

			// Nothing to do, resolve immediately
			return result.resolve();
		};

		/**
		 * Allows queueing colors save from anywhere.
		 */
		this.queue = function(data) {
			pending.push(data);
		};
	};

	// Make single instance
	var colorSaver = new ColorSaver();

	return colorSaver;
});
})(jQuery);
