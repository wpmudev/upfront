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

	dbg: function () {
		Upfront.Util.log(JSON.stringify(arguments[0]));
	},

	post: function (data) {
		var request = (_.isObject(data) && data.action) 
			? data 
			: {"action": "upfront_request", "data": data}
		;
		// @TODO need a better way to attach upfront layout data on request?
		if ( Upfront.Application.LayoutEditor.layout ) {
			//request.upfront_layout = Upfront.Application.LayoutEditor.layout.get('layout');
			request.layout = Upfront.Application.LayoutEditor.layout.get('layout');
		}
		return $.post(Upfront.Settings.ajax_url, request, function () {}, "json");
	},

	format_date: function(date, show_time){
		var output = date.getFullYear() + '/',
			day = date.getDate(),
			month = (date.getMonth()+1)
		;
		if(day < 10)
			day = '0' + day;
		if(month < 10)
			month = '0' + month;

		output += month + '/' + day;
		
		if(show_time)
			output += ' ' + date.getHours() + ':' + date.getMinutes();
		return output;
	},

	get_avatar: function(obj, size){
		var protocolParts = window.location.href.split('//'),
			url = protocolParts[0] + '//www.gravatar.com/avatar/',
			size = size && parseInt(size) == size ? size : 32,
			hash = ''
		;
		if(_.isString(obj))
			hash = obj;
		else if(obj instanceof Upfront.Models.User || obj instanceof Upfront.Models.Comment)
			hash = obj.get('gravatar');
		else
			return false;

		return url + hash + '?d=mm&s=' + size;
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

var Popup = {

	$popup: {},
	$background: {},
	_deferred: {},

	init: function () {
		if (!$("#upfront-popup").length) {
			$("#page")
				.append('<div id="upfront-popup" style="display:none">' +
					'<div id="upfront-popup-close">X</div>' +
					'<div class="upfront-popup-meta" id="upfront-popup-top">' +
					'</div>' +
					'<div id="upfront-popup-content"></div>' +
					'<div class="upfront-popup-meta" id="upfront-popup-bottom">' +
					'</div>' +
				'</div>')
				.append("<div id='upfront-popup-background' style='display:none' />")
			;
		} else {
			this.close();
		}
		this.$popup = $("#upfront-popup");
		this.$background = $("#upfront-popup-background");

		this.$popup.find("#upfront-popup-content").empty();
	},

	open: function (callback, data) {
		data = data || {};
		this.init();
		var me = this,
			sidebarWidth = $('#sidebar-ui').width(),
			$win = $(window),
			width = data.width || 630,
			left_pos = ($win.width() - width) / 2 + sidebarWidth / 2,
			height = ($win.height() / 3) * 2,
			close_func = function () { me.close(); return false; }
		;
		data.width = width, data.height = height;
		this.$background
			.css({
				'height': $win.height(),
				'width': $win.width() - sidebarWidth,
				'left': sidebarWidth
			})
			.on("click", close_func)
			.show()
		;
		this.$popup
			.css({
				'width': width,
				'height': height,
				'left': left_pos
			})
			.show()
			.find("#upfront-popup-close").on("click", close_func).end()
		;

		$win.off("resize.upfront-popup").on("resize.upfront-popup", function () {
			var sidebarWidth = $('#sidebar-ui').width();

			if (me.$background.is(":visible")) me.$background
				.css({
					'height': $win.height(),
					'width': $win.width() - sidebarWidth,
					'left': sidebarWidth
				})
			;
			if (me.$popup.is(":visible")) {
				var left_pos = ($win.width() - width) / 2 + sidebarWidth / 2,
					height = ($win.height() / 3) * 2
				;
				me.$popup
					.css({
						'width': width,
						'height': height,
						'left': left_pos
					})
				;
			}
		});

		callback.apply(this.$popup.find("#upfront-popup-content").get(), [data, this.$popup.find("#upfront-popup-top"), this.$popup.find("#upfront-popup-bottom")]);
		this._deferred = new $.Deferred();
		return this._deferred.promise();
	},

	close: function (result) {
		this._deferred.notify('before_close');

		this.$background.hide();
		this.$popup.hide().css('height', 'auto').find("#upfront-popup-content").empty();

		this.$popup.find("#upfront-popup-top").empty();
		this.$popup.find("#upfront-popup-bottom").empty();

		this._deferred.resolve(this.$popup, result);
	}

};

define({
	"Util": Util,
	"Popup": Popup
});

})(jQuery);
