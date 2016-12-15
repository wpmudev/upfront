(function($) {
define([
], function() {
	var PresetSaver = function() {
		var pending = {};

		/**
		 * Saves type presets to server one by one, when done result will
		 * be resolved with either fail or success depending on result.
		 */
		var saveType = function(slug, type, result) {
			var preset = type.pop();
			Upfront.Util.post({
				action: 'upfront_save_' + slug + '_preset',
				data: preset
			}).done(function() {
				if (type.length > 0) {
					saveType(slug, type, result);
				} else {
					result.resolve();
				}
			}).fail( function() {
				result.reject();
				Upfront.Views.Editor.notify('Preset ' + preset.name + ' save failed.');
			});
		};

		/**
		 * Loops through queued presets and requests saving of each one.
		 * Clears queued presets after all is done.
		 */
		this.save = function() {
			var results = [],
				result = $.Deferred();
			// Iterate through all preset types (text, image, gallery...)
			_.each(pending, function(type, slug) {
				// Save presets from type sequentially, if done in parallel some
				// won't be saved since server will read/write to db in parallel
				if (type.length > 0) {
					var d = $.Deferred();
					results.push(d);
					saveType(slug, type, d);
				}
			});

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
		 * Allows queueing presets from anywhere.
		 */
		this.queue = function(properties, ajaxSlug) {
			pending[ajaxSlug] = pending[ajaxSlug] || [];
			// First remove preset if already added
			pending[ajaxSlug] = _.reject(pending[ajaxSlug], function(preset) {
				return preset.id === properties.id;
			});
			pending[ajaxSlug].push(properties);
		};
	};

	// Make single instance
	var presetSaver = new PresetSaver();

	return presetSaver;
});
})(jQuery);
