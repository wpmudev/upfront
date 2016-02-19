define(function() {
	var UtextModel = Upfront.Models.ObjectModel.extend({
		init: function () {
			this.init_property("type", "PlainTxtModel");
			this.init_property("view_class", "PlainTxtView");
			this.init_property("element_id", Upfront.Util.get_unique_id("text-object"));
			this.init_property("class", "c24 upfront-plain_txt");
			this.init_property("has_settings", 1);
			this.init_property("id_slug", "plain_text");
			this.init_property("preset", "default");
		}
	});

	return UtextModel;
});
