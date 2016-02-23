define([
	'scripts/upfront/settings/fields/slides'
], function(SlidesField) {
	var FieldFactory = function() {
		var fieldClasses = {
			'SlidesField': SlidesField
		};

		this.createField = function(type, options) {
			var fieldClass = Upfront.Views.Editor.Field[type];

			if (_.isUndefined(fieldClass)) {
				fieldClass = fieldClasses[type];
			}

			if (type === 'Settings_CSS') fieldClass = Upfront.Views.Editor.Settings.Settings_CSS;
			if (_.isUndefined(fieldClass)) throw 'There is no \'' + type + '\' field class defined.';

			if (_.isFunction(options.values)) {
				options.values = options.values();
			}

			return new fieldClass(options);
		};
	};

	fieldFactory = new FieldFactory();

	return fieldFactory;
});
