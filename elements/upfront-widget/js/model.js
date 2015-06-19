define(function () {
	var Model = Upfront.Models.ObjectModel.extend({
		
		init: function () {
			var properties = _.clone(Upfront.data.uwidget.defaults);
			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug + '-object');
			this.init_properties(properties);
		},

		cache: {
			_widget_cache: {},
			
			get: function (prop) {
				if (prop in this._widget_cache) return this._widget_cache[prop];
				return false;
			},
			set: function (prop, value) {
				this._widget_cache[prop] = value;
			},
			get_all: function () {
				return this._widget_cache;
			},
			clear: function () {
				this._widget_cache = {};
			}
		}
	});
	return Model;
});