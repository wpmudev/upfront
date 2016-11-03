(function ($, undefined) {
define(function () {

var l10n = Upfront.Settings.l10n.code_element;

var Checker = {

	_promise: false,
	_value: false,
	_message: false,

	/**
	 * Sets new value
	 *
	 * @param {String} value Value to set
	 *
	 * @return {Object} Promise
	 */
	set: function (value) {
		this._promise = new $.Deferred();
		this._value = value;
		this._message = false;

		return this._promise.promise();
	},

	/**
	 * Reset current value to default
	 */
	reset: function () {
		this.set(false);
	},

	/**
	 * Test current value for validity and notify promise listeners
	 */
	test: function () {
		this._message = false;
		this._promise.notify();
		if (this.validate()) {
			this._promise.resolve();
		} else {
			this._promise.reject(this._message);
		}
	},

	/**
	 * Value checking method, without actually setting the value
	 *
	 * @param {String} value Value to check
	 *
	 * @return {Boolean} Whether the new value is valid
	 */
	check: function (value) {
		this.set(value);
		var ret = this.validate();
		this.reset();
		return ret;
	},

	/**
	 * Placeholder for actual validation routine
	 *
	 * @return {Boolean} Whether we're valid or not
	 */
	validate: function () {
		return true;
	},

	/**
	 * Raw entry wrapping placeholder
	 *
	 * @param {String} what What to wrap
	 *
	 * @return {String} Wrapped entry
	 */
	wrap: function (what) {
		return what;
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
	},
	wrap: function (what) {
		return ';(function ($) { {' + what + ';}\n })(jQuery);'; // Do not use try/catch block for in-flight testing
	}
});

var Checker_Html = _.extend({}, Checker, {
	validate: function () {
		var ret = true,
			test = this._value.replace(/\r|\n/g, "\n"), // Normalize newlines
			$div = $("<div />")
		;

		// Normalize HTML entities before validating HTML
		// Fixes: https://www.meistertask.com/app/task/8UUuqpmu/
		test = test.replace(/&[^; ]+?;/g, 'HTMLENTITY');

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
		checker: _get_checker
	};
};

return new Syntax();

});
})(jQuery);
