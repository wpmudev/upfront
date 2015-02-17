(function($) {
define(
function() {
	/**
	 * Generates CSS rules for placing into page styles.
	 *
	 * @param properties - preset properties
	 * @return String - CSS for preset
	 */
	var generateCss = function(properties, styleTpl) {
		var tpl = Upfront.Util.template(styleTpl);
		return tpl({properties: properties});
	};

	var Util = {
		generateCss: generateCss,
		/**
		 * Generates and appends element preset styles to page using element presets from
		 * Upfront.mainData and preset style template.
		 *
		 * @param element String - element name
		 * @param styleTpl String - style template
		 */
		generatePresetsToPage: function(element, styleTpl) {
			_.each(Upfront.mainData[element + 'Presets'], function(properties) {
				Util.updatePresetStyle(element, properties, styleTpl);
			});
		},

		getPresetProperties: function (element, preset_id) {
			var presets = Upfront.mainData[element + 'Presets'] || [],
				props = {}
			;
			$.each(presets, function (idx, preset) {
				if (!(preset && preset.id && preset_id === preset.id)) return true;
				props = _.extend({}, preset);
			})
			return props;
		},

		updatePresetStyle: function (element, properties, styleTpl) {
			var styleId = element + '-preset-' + properties.id,
				props = _.extend({}, properties)
			;

			// Do we have come colors here? Yes? Expand them then
			_.each(props, function (prop, idx) {
				if (Upfront.Util.colors.is_theme_color(prop)) {
					props[idx] = Upfront.Util.colors.get_color(prop);
				}
			});

			if ($('style#' + styleId).length === 0) {
				$('body').append('<style id="' + styleId + '"></style>');
			}
			$('style#' + styleId).text(generateCss(props, styleTpl));
		}
	};

	return Util;
});
})(jQuery);
