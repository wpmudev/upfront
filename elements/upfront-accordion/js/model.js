define(function() {
	var UaccordionModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.uaccordion.defaults);

			var defaults = Upfront.data.uaccordion.defaults;

			// Copy the default panel data by value, so that the source does not get updated if passed by reference
			properties.accordion = [];
			properties.accordion[0] = {};
			properties.accordion[0].content = _.clone(defaults.accordion[0].content);
			properties.accordion[0].title = _.clone(defaults.accordion[0].title);

			properties.accordion[1] = {};
			properties.accordion[1].content = _.clone(defaults.accordion[1].content);
			properties.accordion[1].title = _.clone(defaults.accordion[1].title);

			properties.element_id = Upfront.Util.get_unique_id('uaccordion-object');
			this.init_properties(properties);
		}
	});

	return UaccordionModel;
});
