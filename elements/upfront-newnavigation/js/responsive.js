
;(function($,sr){

  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
	  var timeout;

	  return function debounced () {
		  var obj = this, args = arguments;
		  function delayed () {
			  if (!execAsap)
				  func.apply(obj, args);
			  timeout = null;
		  }

		  if (timeout)
			  clearTimeout(timeout);
		  else if (execAsap)
			  func.apply(obj, args);

		  timeout = setTimeout(delayed, threshold || 400);
	  };
  };
  // smartresize
  jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery,'smartresize');

jQuery(document).ready(function($) {

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
			$root.closest('.upfront-output-region-container').css('z-index', 999);

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
			$root.closest('.upfront-output-region-container').css('z-index', '');
			if(adminbarheight > 0)
				$root.css('margin-top', '');
		};

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
		};
	};

	function floatInit () {
		//lets do the clean up first
		$(".upfront-navigation").each(function () {
			var $me = $(this);

			if ($me.data('style') == 'triggered' || $me.data('style') === 'burger') {
				$toggler = $me.children('.responsive_nav_toggler');
				$toggler.attr('id', $me.attr('id')+'-toggler');
				if (_cache[$toggler.attr("id")]) _cache[$toggler.attr("id")].destroy();
			} else {
				if (_cache[$me.attr("id")]) _cache[$me.attr("id")].destroy();
			}
		});

		$(".upfront-navigation.upfront-navigation-float").each(function () {
			var $me = $(this);

			if($me.data('style') == 'burger' || $me.data('style') == 'triggered') {
				$toggler = $me.children('.responsive_nav_toggler');
				$toggler.attr('id', $me.attr('id')+'-toggler');
				//if (_cache[$toggler.attr("id")]) _cache[$toggler.attr("id")].destroy();
				_cache[$toggler.attr("id")] = new FloatNav($toggler);
			}
			else {
				//if (_cache[$me.attr("id")]) _cache[$me.attr("id")].destroy();
				_cache[$me.attr("id")] = new FloatNav($me);
			}
		});
	}

	$win
		.load(floatInit);

	//Work around for having the region container have a higher z-index if it contains the nav, so that the dropdowns, if overlapping to the following regions should not loose "hover" when the mouse travels down to the next region.
	$('div.upfront-navigation').each(function() {
		if($(this).find('ul.sub-menu').length > 0) {
			$(this).closest('.upfront-output-region-container, .upfront-output-region-sub-container').each(function() {
				$(this).addClass('upfront-region-container-has-nav');
			});
		}
	});

	$('body').on('touchstart click', '.burger_nav_close', null, function() {
		$('div.responsive_nav_toggler').trigger('click');
	});

	$('body').on('touchstart click', '.upfront-navigation .upfront-navigation div.responsive_nav_toggler', null, function(e) {
		e.preventDefault();
		if($(this).parent().find('ul.menu').css('display') == 'none') {
			$(this).closest('div.upfront-output-wrapper').addClass('on_the_top');

			if($(this).parent().data('burger_over') != 'pushes' && $(this).parent().data('burger_alignment') != 'whole') {
				$('<div class="burger_overlay"></div>').insertBefore($(this).parent().find('ul.menu'));
			}

			$(this).parent().find('ul.menu').show();
			//$(this).parent().find('ul.sub-menu').show();

			if($(this).parent().data('burger_over') == 'pushes' && $(this).parent().data('burger_alignment') == 'top') {

				$('div#page').css('margin-top', $(this).parent().find('ul.menu').height());


				//var topbar_height = $('div#upfront-ui-topbar').outerHeight();
				var adminbar_height = ($('div#wpadminbar').length > 0)?$('div#wpadminbar').outerHeight():0;

				$(this).parent().find('ul.menu').offset({top:adminbar_height, left:$('div').offset().left});
				$(this).parent().find('ul.menu').width($('div#page').width());

			}


			var offset = $(this).parent().find('ul.menu').position();

			//$(e.target).closest('.responsive_nav_toggler').css({position: 'fixed', left: offset.left, top: offset.top+(($('div#wpadminbar').length && $('div#wpadminbar').css('display') == 'block')?$('div#wpadminbar').outerHeight():0)});
			//$(this).parent().find('ul.menu').css('padding-top', '60px');
			var close_icon = $('<i class="burger_nav_close"></i>');

			$(this).parent().find('ul.menu').prepend($('<li>').addClass('wrap_burger_nav_close').append(close_icon));

			//close_icon.css({position: 'fixed', left: offset.left+$(this).parent().find('ul.menu').width()-close_icon.width()-10, top: offset.top+(($('div#wpadminbar').length && $('div#wpadminbar').css('display') == 'block')?$('div#wpadminbar').outerHeight():0) + 10});

			/*

			if($(this).parent().data('burger_over') == 'pushes')
				pushContent($(this).parent());
			*/



			$(this).closest('.upfront-output-region-container').each(function() {
				$(this).addClass('upfront-region-container-has-nav');
			});

		}
		else {
			$(this).parent().find('ul.menu').hide();
			$(this).parent().find('ul.menu').siblings('.burger_overlay').remove();
			//$(this).parent().find('ul.sub-menu').hide();

			//$(e.target).closest('.responsive_nav_toggler').css({position: '', left: '', top: ''});
			//$(this).parent().find('ul.menu').css('padding-top', '');

			$('i.burger_nav_close').parent('li.wrap_burger_nav_close').remove();

			$(this).closest('div.upfront-output-wrapper').removeClass('on_the_top');

			/*
			if($(this).parent().data('burger_over') == 'pushes')
				pullContent($(this).parent());
			*/

			if($(this).parent().data('burger_over') == 'pushes')
				$('div#page').css('margin-top', '');


			$(this).closest('.upfront-output-region-container').each(function() {
				$(this).removeClass('upfront-region-container-has-nav');
			});
		}
	});

	function pushContent(nav) {
		var currentwidth = $('div#page').width();
		var navwidth = nav.find('ul.menu').width();
		var navheight = nav.find('ul.menu').height();

		$('div#page').css('margin-'+nav.data('burger_alignment'), (nav.data('burger_alignment') == 'top' || nav.data('burger_alignment') == 'whole')?navheight:navwidth);

		if(nav.data('burger_alignment') == 'left' || nav.data('burger_alignment') == 'right') {
			$('div#page').css('width', currentwidth-navwidth);
			$('div#page').css('minWidth', currentwidth-navwidth);
		}
	}

	function pullContent(nav) {
		$('div#page').css('margin-'+nav.data('burger_alignment'), '');
		$('div#page').css('width', '');
		$('div#page').css('minWidth', '');
	}

	// the following is used to find the current breakpoint on resize
	var previous_breakpoint = '';
	var current_breakpoint = '';

	function get_breakpoint(){
		if (!window.getComputedStyle) {
				window.getComputedStyle = function(el, pseudo) {
				this.el = el;
				this.getPropertyValue = function(prop) {
					var re = /(\-([a-z]){1})/g;
					if (prop == 'float') prop = 'styleFloat';
					if (re.test(prop)) {
						prop = prop.replace(re, function () {
							return arguments[2].toUpperCase();
						});
					}
					return el.currentStyle[prop] ? el.currentStyle[prop] : null;
				}
				return this;
			}
		}
		var breakpoint = window.getComputedStyle(document.body,':after').getPropertyValue('content');
		if(breakpoint) {
			breakpoint = breakpoint.replace(/['"]/g, '')
			if (current_breakpoint != breakpoint) {
				previous_breakpoint = current_breakpoint;
				current_breakpoint = breakpoint;
			}
			return breakpoint;
		}
	}


	function roll_responsive_nav(selector, bpwidth) {
		var elements = (typeof(selector) == 'object')?selector:$(selector);
		elements.each(function () {

			var breakpoints = $(this).data('breakpoints');

			var currentwidth = (typeof(bpwidth) != 'undefined') ? parseInt(bpwidth) : $(window).width();

			var currentKey, preset, responsive_css;

			if (breakpoints.preset) {
				currentKey = get_breakpoint();
				if(currentKey === '')
					currentKey = 'desktop';

				preset = breakpoints.preset[currentKey];

				if (preset.menu_style == 'triggered') {
					$(this).attr('data-style', 'burger');
					$(this).attr('data-alignment', ( preset.menu_alignment ? preset.menu_alignment : $(this).data('alignmentbk') ));
					$(this).attr('data-burger_alignment', preset.burger_alignment);
					$(this).attr('data-burger_over', preset.burger_over);

					// Add responsive nav toggler
					if(!$(this).find('div.responsive_nav_toggler').length)
						$(this).prepend($('<div class="responsive_nav_toggler"><div></div><div></div><div></div></div>'));

					//offset a bit if admin bar or side bar is present
					if($('div#wpadminbar').length && $('div#wpadminbar').css('display') == 'block') {
						$(this).find('ul.menu').css('margin-top', $('div#wpadminbar').outerHeight());
					}

					if ($(this).hasClass('upfront-output-unewnavigation')) {
						$('head').find('style#responsive_nav_sidebar_offset').remove();
						responsive_css = 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="top"] ul.menu, div.upfront-navigation div[data-style="burger"][ data-burger_alignment="whole"] ul.menu {left:'+parseInt($('div.upfront-regions').offset().left)+'px !important; right:'+parseInt(($(window).width()-currentwidth-$('div#sidebar-ui').outerWidth()) / 2)+'px !important; } ';
						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="left"] ul.menu {left:'+parseInt($('div.upfront-regions').offset().left)+'px !important; right:inherit !important; width:'+parseInt(30/100*$('div.upfront-regions').outerWidth())+'px !important;} ';
						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="right"] ul.menu {left:inherit !important; right:'+parseInt(($(window).width()-currentwidth-$('div#sidebar-ui').outerWidth()) / 2)+'px !important; width:'+parseInt(30/100*$('div.upfront-regions').outerWidth())+'px !important; } ';
						responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"] ul.menu {top:'+parseInt($('div#upfront-ui-topbar').outerHeight())+'px !important; } ';

						$('head').append($('<style id="responsive_nav_sidebar_offset">'+responsive_css+'</style>'));
					}
					//Z-index the container module to always be on top, in the layout edit mode
					$(this).closest('div.upfront-newnavigation_module').css('z-index', 3);

					
					$(this).find('ul.menu').hide();
				} else {
					$(this).attr('data-style', ( preset.menu_style ? preset.menu_style : $(this).data('stylebk') ));
					$(this).attr('data-alignment', ( preset.menu_alignment ? preset.menu_alignment : $(this).data('alignmentbk') ));
					$(this).removeAttr('data-burger_alignment','');
					$(this).removeAttr('data-burger_over', '');

					// Remove responsive nav toggler
					$(this).find('div.responsive_nav_toggler').remove();
					$(this).find('ul.menu').show();

					//remove any display:block|none specifications from the sub-menus
					$(this).find('ul.menu, ul.sub-menu').each(function() {
						$(this).css('display', '');
					});

					// remove any adjustments done because of the sidebar or the adminbar
					if($('div#wpadminbar').length) {
						$(this).find('ul.menu').css('margin-top', '');
					}


					//remove the z-index from the container module
					$(this).closest('div.upfront-newnavigation_module').css('z-index', '');
				}
				
				$(this).find('ul.menu').siblings('.burger_overlay').remove();

				if(preset.is_floating && preset.is_floating == 'yes')
					$(this).addClass('upfront-navigation-float');
				else
					$(this).removeClass('upfront-navigation-float');
			} else {
				// Leave old code for backward compatibility
				var bparray = [];
				for (key in breakpoints) {
					bparray.push(breakpoints[key]);
				}

				bparray.sort(function(a, b) {
					if (a && b && a.width && b.width) {
						return a.width - b.width;
					}
					return 0;
				});

				for (key in bparray) {
					if(bparray[key] && bparray[key]['width'] && parseInt(currentwidth) >= parseInt(bparray[key]['width'])) {

						if(bparray[key]['burger_menu'] == 'yes') {

							$(this).attr('data-style', 'burger');
							$(this).attr('data-aliment', ( bparray[key]['menu_alignment'] ? bparray[key]['menu_alignment'] : $(this).data('alimentbk') ));
							$(this).attr('data-burger_alignment', bparray[key]['burger_alignment']);
							$(this).attr('data-burger_over', bparray[key]['burger_over']);

							// Add responsive nav toggler
							if(!$(this).find('div.responsive_nav_toggler').length)
								$(this).prepend($('<div class="responsive_nav_toggler"><div></div><div></div><div></div></div>'));

							//offset a bit if admin bar or side bar is present
							if($('div#wpadminbar').length && $('div#wpadminbar').css('display') == 'block') {
								$(this).find('ul.menu').css('margin-top', $('div#wpadminbar').outerHeight());
								//$(this).find('div.responsive_nav_toggler').css('margin-top', $('div#wpadminbar').outerHeight());
							}

							if($(this).hasClass('upfront-output-unewnavigation')) {

								$('head').find('style#responsive_nav_sidebar_offset').remove();
								responsive_css = 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="top"] ul.menu, div.upfront-navigation div[data-style="burger"][ data-burger_alignment="whole"] ul.menu {left:'+parseInt($('div.upfront-regions').offset().left)+'px !important; right:'+parseInt(($(window).width()-currentwidth-$('div#sidebar-ui').outerWidth()) / 2)+'px !important; } ';

								responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="left"] ul.menu {left:'+parseInt($('div.upfront-regions').offset().left)+'px !important; right:inherit !important; width:'+parseInt(30/100*$('div.upfront-regions').outerWidth())+'px !important;} ';

								responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"][ data-burger_alignment="right"] ul.menu {left:inherit !important; right:'+parseInt(($(window).width()-currentwidth-$('div#sidebar-ui').outerWidth()) / 2)+'px !important; width:'+parseInt(30/100*$('div.upfront-regions').outerWidth())+'px !important; } ';
								responsive_css = responsive_css + 'div.upfront-navigation div[data-style="burger"] ul.menu {top:'+parseInt($('div#upfront-ui-topbar').outerHeight())+'px !important; } ';

								$('head').append($('<style id="responsive_nav_sidebar_offset">'+responsive_css+'</style>'));
							}
							//Z-index the container module to always be on top, in the layout edit mode
							$(this).closest('div.upfront-newnavigation_module').css('z-index', 3);

							$(this).find('ul.menu').siblings('.burger_overlay').remove();
							$(this).find('ul.menu').hide();
						}
						else {
							$(this).attr('data-style', ( bparray[key]['menu_style'] ? bparray[key]['menu_style'] : $(this).data('stylebk') ));
							$(this).attr('data-aliment', ( bparray[key]['menu_alignment'] ? bparray[key]['menu_alignment'] : $(this).data('alimentbk') ));
							$(this).removeAttr('data-burger_alignment','');
							$(this).removeAttr('data-burger_over', '');

							// Remove responsive nav toggler
							$(this).find('div.responsive_nav_toggler').remove();
							$(this).find('ul.menu').show();

							//remove any display:block|none specifications from the sub-menus
							$(this).find('ul.menu, ul.sub-menu').each(function() {
								$(this).css('display', '');
							});

							// remove any adjustments done because of the sidebar or the adminbar
							if($('div#wpadminbar').length) {
								$(this).find('ul.menu').css('margin-top', '');
							}

							//remove the z-index from the container module
							$(this).closest('div.upfront-newnavigation_module').css('z-index', '');
						}

						if(bparray[key]['is_floating'] && bparray[key]['is_floating'] == 'yes')
							$(this).addClass('upfront-navigation-float');
						else
							$(this).removeClass('upfront-navigation-float');
					}
				}
			}
		});
	}
	roll_responsive_nav(".upfront-output-unewnavigation > .upfront-navigation");

	$(window).smartresize(function() {
		$('div#page').css('margin-top', '');
		$('.responsive_nav_toggler').css({position: '', left: '', top: ''});
		$('ul.menu').css('padding-top', '');
		$('.burger_nav_close').parent('li.wrap_burger_nav_close').remove();
		
		roll_responsive_nav(".upfront-output-unewnavigation > .upfront-navigation");
		floatInit();
	});

	$(document).on('changed_breakpoint', function(e) {
		roll_responsive_nav( e.selector, e.width);
	});
});

