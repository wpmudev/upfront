define(function() {
	var Model = Upfront.Models.ObjectModel.extend({
		init: function () {
			var properties = _.clone(Upfront.data.uimage.defaults);
			properties.element_id = Upfront.Util.get_unique_id(properties.id_slug);
			/**
			 * Init with caption in p block so that block level formatting will work for the caption without any issues
			 * @type {string}
             */
			properties.image_caption = "<p>$s</p>".replace("$s", properties.image_caption);
			this.init_properties(properties);
		}
	});

	return Model;
});
