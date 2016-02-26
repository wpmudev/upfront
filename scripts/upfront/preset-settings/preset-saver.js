(function($) {
define([
], function() {
	var PresetSaver = function() {
		var pendingSavePresets = {};

		/**
		 * Saves preset to server
		 */
		var savePreset = function(slug, typePresets) {
			var currentPreset = typePresets.pop();
			Upfront.Util.post({
				action: 'upfront_save_' + slug + '_preset',
				data: currentPreset
			}).done(function() {
				if (typePresets.length > 0) {
					savePreset(slug, typePresets);
				}
			}).fail( function() {
				Upfront.Views.Editor.notify('Preset ' + currentPreset.name + ' save failed.');
			});
		};

		/**
		 * Loops through queued presets and requests saving of each one.
		 * Clears queued presets after all is done.
		 */
		var onLayoutSaveStart = function() {
			// Iterate through all preset types (text, image, gallery...)
			_.each(pendingSavePresets, function(typePresets, slug) {
				// Save presets from type sequentially, if done in parallel some
				// won't be saved since server will read/write to db in parallel
				if (typePresets.length > 0) {
					savePreset(slug, typePresets);
				}
			});
		};

		/**
		 * Allows queueing presets from anywhere.
		 */
		this.queuePresetSave = function(presetProperties, ajaxSlug) {
			pendingSavePresets[ajaxSlug] = pendingSavePresets[ajaxSlug] || [];
			pendingSavePresets[ajaxSlug].push(presetProperties);
		};

		// Subscribe to events
		Upfront.Events.on("command:layout:save_start", onLayoutSaveStart);
	};

	// Make single instance
	var presetSaver = new PresetSaver();

	return presetSaver;
});
})(jQuery);
