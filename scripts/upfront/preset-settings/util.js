(function($) {
define(
function() {
	var expandBreakpoints = function(properties) {
		if (properties['breakpoint'] && properties['breakpoint']['tablet']) {
			properties['tablet'] = [];
			_.each(properties['breakpoint']['tablet'], function(property, name) {
				properties['tablet'][name] = property;
			});
		}
		if (properties['breakpoint'] && properties['breakpoint']['mobile']) {
			properties['mobile'] = [];
			_.each(properties['breakpoint']['mobile'], function(property, name) {
				properties['mobile'][name] = property;
			});
		}
		return properties;
	};
	/**
	 * Generates CSS rules for placing into page styles.
	 *
	 * @param properties - preset properties
	 * @return String - CSS for preset
	 */
	var generateCss = function(properties, styleTpl) {
		var tpl = Upfront.Util.template(styleTpl);
		
		//Increase preset_style css specificity
		if(typeof properties.preset_style !== "undefined") {
			properties.preset_style = properties.preset_style
			.replace(/#page/g, '#page.upfront-layout-view .upfront-editable_entity.upfront-module');

			properties.preset_style = Upfront.Util.colors.convert_string_ufc_to_color( properties.preset_style, true );
		}
		
		return tpl({properties: expandBreakpoints(properties)})
			.replace(/#page/g, 'div#page.upfront-layout-view')
			// Solve case of button loosing its styles
			.replace(new RegExp(properties.id + ' .upfront-button', 'g'), properties.id + '.upfront-button')
			.replace(/\\'/g, "'")
			.replace(/\\'/g, "'")
			.replace(/\\'/g, "'")
			.replace(/\\"/g, '"')
			.replace(/\\"/g, '"')
			.replace(/\\"/g, '"');
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
				Util.updatePresetStyle(element, expandBreakpoints(properties), styleTpl);
			});
		},

		getPresetProperties: function (element, preset_id) {
			var presets = Upfront.mainData[element + 'Presets'] || [],
				props = {}
			;
			
			$.each(presets, function (idx, preset) {
				if (!(preset && preset.id && preset_id === preset.id)) return true;
				props = _.extend({}, preset);
			});
			return props;
		},

		updatePresetStyle: function (element, properties, styleTpl) {
			var styleId = element + '-preset-' + properties.id,
				props = _.extend({}, properties)
			;

			// Do we have come colors here? Yes? Expand them then
			_.each(props, function (prop, idx) {
				if (Upfront.Util.colors.is_theme_color(prop)) {
					/* This is being changed so that whenever the theme color is changed, it gets applied to preset style in editor mode live */
					//props[idx] = Upfront.Util.colors.get_color(prop);
					props[idx] = prop;
				}
			});

			if ($('style#' + styleId).length === 0) {
				$('body').append('<style class="preset-style" id="' + styleId + '"></style>');
			}

			/* This is being changed so that whenever the theme color is changed, it gets applied to preset style in editor mode live */
			//$('style#' + styleId).text(generateCss(props, styleTpl));
			$('style#' + styleId).text(Upfront.Util.colors.convert_string_ufc_to_color(generateCss(props, styleTpl), true));
		}
	};

	return Util;
});
})(jQuery);
