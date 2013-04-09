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

	Transient: {

		// Local storage object, or the in-memory queue
		_memory_queue: {},

		_key: window.location.path + window.location.search,

		initialize: function () {
			/*try {
				if ('sessionStorage' in window && window['sessionStorage'] !== null) this._memory_queue = sessionStorage;
			} catch (e) {
				Util.log("No local storage available, working off memory");
			}*/
			if (!Upfront.Settings.Debug.transients) this._memory_queue[this._key] = JSON.stringify({});
		},

		get_current: function () {
			return (this._memory_queue[this._key] ? JSON.parse(this._memory_queue[this._key]) : {});
		},

		length: function (key) {
			var data = this.get(key);
			return data.length;
		},

		set: function (key, value) {
			var current = this.get_current();
			current[key] = Util.model_to_json(value);
			this._memory_queue[this._key] = JSON.stringify(current);
		},

		get: function (key) {
			var current = this.get_current(),
				raw = current[key] || false
			;
			return raw;// ? JSON.parse(raw) : false;
		},

		get_all: function (prefix) {
			var key_rx = (prefix ? new RegExp(prefix) : false),
				data = [],
				history = (this._memory_queue[this._key] ? JSON.parse(this._memory_queue[this._key]) : false)
			;
			if (history) _(history).each(function (obj, key) {
				if (key_rx && !key.match(key_rx)) return true;
				data = obj;
			});
			return data;
		},

// ----- Stack-like interface (for history) -----
		
		push: function (key, value) {
			var items = this.get(key) || [];
			items.push(value);
			return this.set(key, items);
		},

		pop: function (key) {
			var items = this.get(key) || [],
				item = items && items.pop ? items.pop() : false
			;
			this.set(key, items);
			return item;

		}
	}
};

define({
	"Util": Util
});

})(jQuery);
