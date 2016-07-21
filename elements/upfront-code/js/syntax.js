(function ($, undefined) {
define(function () {

var l10n = Upfront.Settings.l10n.code_element;

var Checker = {

	_promise: false,
	_value: false,
	_message: false,

	set: function (value) {
		this._promise = new $.Deferred();
		this._value = value;
		this._message = false;

		return this._promise.promise();
	},
	reset: function () {
		this.set(false);
	},

	test: function () {
		this._message = false;
		this._promise.notify();
		if (this.validate()) {
			this._promise.resolve();
		} else {
			this._promise.reject(this._message);
		}
	},
	check: function (value) {
		this.set(value);
		var ret = this.validate();
		this.reset();
		return ret;
	},
	validate: function () {
		return true;
	}
};

var Checker_Js = _.extend({}, Checker, {
	validate: function () {
		var ret = true;
		try {
			JSON.parse(this._value);
		} catch (e) {
			this._message = e.message;
			ret = false;
		}
		return ret;
	}
});

var Checker_Html = _.extend({}, Checker, {
	validate: function () {
		var ret = true,
			test = this._value.replace(/\r|\n/g, "\n"), // Normalize newlines
			$div = $("<div />")
		;
		$div.html(test);

		if ($div.html().length != test.length) {
			this._message = l10n.errors.error_markup;
			ret = false;
		}

		return ret;
	}
});

var Syntax = function () {
	var _types = {
		"markup": "html",
		"style": "css",
		"script": "javascript"
	};
	var _checkers = {
		"markup": _.extend(Checker_Html, {}),
		"script": _.extend(Checker_Js, {})
	};

	var _get_checker = function (syntax) {
		var checker = syntax in _checkers
			? _checkers[syntax]
			: _.extend(Checker, {})
		;
		checker.reset();
		return checker;
	};

	return {
		TYPES: _types,
		checker: _get_checker,
	};
};

return new Syntax();

});
})(jQuery);
