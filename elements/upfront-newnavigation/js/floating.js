(function ($) {
	define([], function() {
		var $win = $(window),
			_cache = {}
		;
		var FloatNav = function ($el) {
			var toolbarsheight = 0;
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

				$root.closest('.upfront-wrapper').css('z-index', 999);

				if($root.hasClass('responsive_nav_toggler'))
					$root.offset($current_offset);
				else
					$root.css(start_size);

				if(toolbarsheight > 0)
					$root.css('margin-top', toolbarsheight);
			};

			var stop_floating = function () {
				$root
					.attr("style", "")
					.attr("data-already_floating", "no")
				;
				$root.closest('.upfront-wrapper').css('z-index', '');

				if(toolbarsheight > 0)
					$root.css('margin-top', '');
			};

			var dispatch_movement = function () {
				var top = $win.scrollTop();
				var top_offset = $('section.upfront-layout').css('margin-top') ? parseInt($('section.upfront-layout').css('margin-top'), 10) : 0;
				if (top > (start_position.top+top_offset-toolbarsheight) && !$root.is('[data-already_floating="yes"]')) start_floating();
				else if (top <= (start_position.top+top_offset-toolbarsheight) && $root.is('[data-already_floating="yes"]')) stop_floating();
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
				var toptoolbarheight = ($('#upfront-ui-topbar').length > 0)?$('#upfront-ui-topbar').outerHeight():0;
				var rulerheight = ($('.upfront-ruler-container').length > 0)?$('.upfront-ruler-container').outerHeight():0;
				toolbarsheight = toptoolbarheight+rulerheight;
			};

			init();

			return {
				destroy: destroy
			};
		};


		return FloatNav;
	});

})(jQuery);
