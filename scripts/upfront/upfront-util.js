(function ($) {

var Util = {

	model_to_json: function (model) {
		var raw = (model.toJSON ? model.toJSON() : model),
			data_str = JSON.stringify(raw),
			json = JSON.parse(data_str)
		;
		return json;
	},

	get_unique_id: function (pfx) {
		return _.template("{{prefix}}-{{stamp}}-{{numeric}}", {
			prefix: pfx || "entity",
			stamp: (new Date).getTime(),
			numeric: Math.floor((Math.random()*999)+1000)
		});
	},

	log: function () {
		var msg = "UPFRONT: ",
			parts = "",
			vessel = (typeof console != "undefined" && console && console.log ? console.log : alert)
		;
		if (arguments.length > 1) {
			for (var idx in arguments) {
				msg += "[" + idx + "]: " + arguments[idx] + "\n";
			}
		} else msg += arguments[0];
		console.log(msg);
	},

	post: function (data) {
		var request = (_.isObject(data) && data.action) 
			? data 
			: {"action": "upfront_request", "data": data}
		;
		return $.post(Upfront.Settings.ajax_url, request, function () {}, "json");
	},
};

define({
	"Util": Util
});

})(jQuery);