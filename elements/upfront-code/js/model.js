define(function () {
	var Model = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.upfront_code.defaults);
			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
			this.init_properties(properties);
		}
	});
	return Model;
});