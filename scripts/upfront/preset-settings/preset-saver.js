(function($) {
define([
], function() {
	var PresetSaver = function() {
		var pendingSavePresets = {};

		/**
		 * Saves type presets to server one by one, when done typeResult will
		 * be resolved with either fail or success depending on result.
		 */
		var saveTypePresets = function(slug, typePresets, typeResult) {
			var currentPreset = typePresets.pop();
			Upfront.Util.post({
				action: 'upfront_save_' + slug + '_preset',
				data: currentPreset
			}).done(function() {
				if (typePresets.length > 0) {
					saveTypePresets(slug, typePresets, typeResult);
				} else {
					typeResult.resolve();
				}
			}).fail( function() {
				typeResult.reject();
				Upfront.Views.Editor.notify('Preset ' + currentPreset.name + ' save failed.');
			});
		};

		/**
		 * Loops through queued presets and requests saving of each one.
		 * Clears queued presets after all is done.
		 */
		this.savePresets = function() {
			var typesResults = [];
			result = $.Deferred();
			// Iterate through all preset types (text, image, gallery...)
			_.each(pendingSavePresets, function(typePresets, slug) {
				// Save presets from type sequentially, if done in parallel some
				// won't be saved since server will read/write to db in parallel
				if (typePresets.length > 0) {
					var typeResult = $.Deferred();
					typesResults.push(typeResult);
					saveTypePresets(slug, typePresets, typeResult);
				}
			});

			if (typesResults.length > 0) {
				$.when.apply($, typesResults).done( function() {
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
		this.queuePresetSave = function(presetProperties, ajaxSlug) {
			pendingSavePresets[ajaxSlug] = pendingSavePresets[ajaxSlug] || [];
			// First remove preset if already added
			pendingSavePresets[ajaxSlug] = _.reject(pendingSavePresets[ajaxSlug], function(preset) {
				return preset.id === presetProperties.id;
			});
			pendingSavePresets[ajaxSlug].push(presetProperties);
		};
	};

	// Make single instance
	var presetSaver = new PresetSaver();

	return presetSaver;
});
})(jQuery);
