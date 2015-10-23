define(function() {
	var ButtonModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.ubutton.defaults);

			var defaults = Upfront.data.ubutton.defaults;
			
			properties.content = _.clone(defaults.content);

			properties.element_id = Upfront.Util.get_unique_id('button-object');
			
			this.init_properties(properties);
		}
	});

	return ButtonModel;
});
