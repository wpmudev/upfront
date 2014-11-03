define(function() {
	var Model = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.utabs.defaults);
			var defaults = Upfront.data.utabs.defaults;

			//copy the default tabs data by value, so that the source does not get updated if passed by reference

			properties.tabs = [];
			properties.tabs[0] = {};
			properties.tabs[0].content = _.clone(defaults.tabs[0].content);
			properties.tabs[0].title = _.clone(defaults.tabs[0].title);

			properties.tabs[1] = {};
			properties.tabs[1].content = _.clone(defaults.tabs[1].content);
			properties.tabs[1].title = _.clone(defaults.tabs[1].title);

			properties.element_id = Upfront.Util.get_unique_id('utabs-object');
			this.init_properties(properties);
		}
	});

	return Model;
});
