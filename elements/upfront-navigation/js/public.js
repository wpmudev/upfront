;(function ($) {

var $win = $(window),
	_cache = {}
;
var FloatNav = function ($el) {

	var start_position = {
		top: 0,
		left: 0
	};
	var start_size = {
		width: 0,
		height: 0
	};
	var $root = $el;

	var start_floating = function () {
		$root
			.css(start_size)
			.attr("data-already_floating", "yes")
		;
	};

	var stop_floating = function () {
		$root
			.attr("style", "")
			.attr("data-already_floating", "no")
		;
	}

	var dispatch_movement = function () {
		var top = $win.scrollTop();
		if (top > start_position.top && !$root.is('[data-already_floating="yes"]')) start_floating();
		else if (top <= start_position.top && $root.is('[data-already_floating="yes"]')) stop_floating();
	};

	var destroy = function () {		
		start_position = {
			top: 0,
			left: 0
		};
		start_size = {
			width: 0,
			height: 0
		};
		$root = false;
		$win.off("scroll", dispatch_movement);
	};

	var init = function () {
		start_position = $root.offset();
		start_size = {width: $root.width(), height: $root.height()};
		$win
			.off("scroll", dispatch_movement)
			.on("scroll", dispatch_movement)
		;
	};
	init();

	return {
		destroy: destroy
	}
};

function init () {
	$(".upfront-navigation.upfront-navigation-float").each(function () {
		var $me = $(this);
		if (_cache[$me.attr("id")]) _cache[$me.attr("id")].destroy();
		_cache[$me.attr("id")] = new FloatNav($me);
	});
}

$win
	.load(init)
	.resize(init)
;

})(jQuery);