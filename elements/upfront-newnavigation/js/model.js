define(function() {
	var UnewnavigationModel = Upfront.Models.ObjectModel.extend({
		/**
		 * A quasi-constructor, called after actual constructor *and* the built-in `initialize()` method.
		 * Used for setting up instance defaults, initialization and the like.
		 */
		init: function () {
			var properties = _.clone(Upfront.data.unewnavigation.defaults);
			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + "-object");
			this.init_properties(properties);

		}
	});

	return UnewnavigationModel;
});