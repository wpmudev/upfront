(function($) {
define([
], function() {
	var PresetSaver = function() {
		var pendingSavePresets = {};

		/**
		 * Saves preset to server
		 */
		var savePreset = function(slug, presetProperties) {
			Upfront.Util.post({
				action: 'upfront_save_' + slug + '_preset',
				data: presetProperties
			});
		};

		/**
		 * Loops through queued presets and requests saving of each one.
		 * Clears queued presets after all is done.
		 */
		var onLayoutSave = function() {
			_.each(pendingSavePresets, function(data, slug) {
				_.each(data,  function(presetProperties, presetId) {
						savePreset(slug, presetProperties);
					});
			});
			pendingSavePresets = {};
		};

		/**
		 * Allows queueing presets from anywhere.
		 */
		this.queuePresetSave = function(presetProperties, ajaxSlug) {
			pendingSavePresets[ajaxSlug] = pendingSavePresets[ajaxSlug] || {};
			pendingSavePresets[ajaxSlug][presetProperties.id] = presetProperties;
		};

		// Subscribe to events
		Upfront.Events.on("command:layout:save", onLayoutSave);
		Upfront.Events.on("command:layout:save_as", onLayoutSave);
		Upfront.Events.on("command:layout:publish", onLayoutSave);
	};

	// Make single instance
	var presetSaver = new PresetSaver();

	return presetSaver;
});
})(jQuery);
