;(function ($) {

var $win = $(window),
	_cache = {}
;
var FloatNav = function ($el) {
	var adminbarheight = ($('div#wpadminbar').length > 0)?$('div#wpadminbar').outerHeight():0;
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

		$current_offset = $root.offset();

		$root.attr("data-already_floating", "yes");

		$root.closest('.upfront-output-wrapper').css('z-index', 999);

		if($root.hasClass('responsive_nav_toggler'))
			$root.offset($current_offset);
		else
			$root.css(start_size);

		if(adminbarheight > 0)
			$root.css('margin-top', adminbarheight);
	};

	var stop_floating = function () {
		$root
			.attr("style", "")
			.attr("data-already_floating", "no")
		;
		$root.closest('.upfront-output-wrapper').css('z-index', '');

		if(adminbarheight > 0)
			$root.css('margin-top', '');
	}

	var dispatch_movement = function () {
		var top = $win.scrollTop();
		
		if (top > (start_position.top-adminbarheight) && !$root.is('[data-already_floating="yes"]')) start_floating();
		else if (top <= (start_position.top-adminbarheight) && $root.is('[data-already_floating="yes"]')) stop_floating();
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
		
		if($me.data('style') == 'burger') {
			$toggler = $me.children('.responsive_nav_toggler');
			$toggler.attr('id', $me.attr('id')+'-toggler');
			if (_cache[$toggler.attr("id")]) _cache[$toggler.attr("id")].destroy();
			_cache[$toggler.attr("id")] = new FloatNav($toggler);	
		}
		else {
			if (_cache[$me.attr("id")]) _cache[$me.attr("id")].destroy();
			_cache[$me.attr("id")] = new FloatNav($me);
		}
	});
}

$win
	.load(init)
	.resize(init)
;



})(jQuery);