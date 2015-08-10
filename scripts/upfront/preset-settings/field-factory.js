define([
	'scripts/upfront/preset-settings/typography-settings-item',
	'scripts/upfront/preset-settings/border-settings-item',
	'scripts/upfront/preset-settings/hov-animation-settings-item',
	'scripts/upfront/preset-settings/radius-settings-item',
	'scripts/upfront/preset-settings/selectbox-settings-item',
	'elements/upfront-image/js/settings/caption-location',
	'scripts/upfront/preset-settings/colors-settings-item'
], function(TypographySettingsItem, BorderSettingsItem, HovAnimationSettingsItem, RadiusSettingsItem,
			SelectboxSettingsItem, CaptionLocation, ColorsSettingsItem) {
	var FieldFactory = function() {
		var classes = {
			'TypographySettingsItem': TypographySettingsItem,
			'BorderSettingsItem': BorderSettingsItem,
			'HovAnimationSettingsItem': HovAnimationSettingsItem,
			'RadiusSettingsItem': RadiusSettingsItem,
			'SelectboxSettingsItem': SelectboxSettingsItem,
			'CaptionLocation': CaptionLocation,
			'ColorsSettingsItem': ColorsSettingsItem
		};

		this.createField = function(field, options, model) {
			var initializationOptions = _.extend({}, options, { model: model });
			if (typeof field === 'string') {
				return new classes[field](initializationOptions);
			}

			return new field(initializationOptions);
		};
	};

	fieldFactory = new FieldFactory();

	return fieldFactory;
});
