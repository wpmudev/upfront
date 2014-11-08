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

	return {
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
				var styleId = element + '-preset-' + properties.id;

				if ($('style#' + styleId).length === 0) {
					$('body').append('<style id="' + styleId + '"></style>');
				}
				$('style#' + styleId).text(generateCss(properties, styleTpl));
			});
		}
	};
});
})(jQuery);
