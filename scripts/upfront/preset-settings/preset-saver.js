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
			})
				.done( function() {
					Upfront.Events("command:layout:save_error", {id: slug + presetProperties.id});
				})
				.fail( function() {
					Upfront.Events.trigger("command:layout:save_success", { id: slug + presetProperties.id});
				});
		};

		/**
		 * Loops through queued presets and requests saving of each one.
		 * Clears queued presets after all is done.
		 */
		var onLayoutSave = function() {
			_.each(pendingSavePresets, function(data, slug) {
				_.each(data,  function(presetProperties, presetId) {
						Upfront.Events.trigger(
							"command:layout:save:loading:queue",
							{
								id: slug + presetId,
								message: 'Saved ' + presetProperties.name + ' preset.',
								errorMessage: 'There was an error while saving ' + presetProperties.name + ' preset.'
							}
						);
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
		Upfront.Events.on("command:layout:save_start", onLayoutSave);
	};

	// Make single instance
	var presetSaver = new PresetSaver();

	return presetSaver;
});
})(jQuery);
