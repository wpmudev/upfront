jQuery(document).ready(function($){
	var throttle = function(a,b,c){var d,e,f,g=null,h=0;c||(c={});var i=function(){h=c.leading===!1?0:new Date().getTime(),g=null,f=a.apply(d,e),g||(d=e=null)};return function(){var j=new Date().getTime();h||c.leading!==!1||(h=j);var k=b-(j-h);return d=this,e=arguments,0>=k||k>b?(clearTimeout(g),g=null,h=j,f=a.apply(d,e),g||(d=e=null)):g||c.trailing===!1||(g=setTimeout(i,k)),f}};

	function css_support( property )
	{
		var div = document.createElement('div'),
		    reg = new RegExp("(khtml|moz|ms|webkit|)"+property, "i");
		for ( s in div.style ) {
			if ( s.match(reg) )
				return true;
		}
		return false;
	}

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

		if(breakpoint === null && $('html').hasClass('ie8')) {
			breakpoint = window.get_breakpoint_ie8($( window ).width());
			$(window).trigger('resize');
		}

		if(breakpoint) {
			breakpoint = breakpoint.replace(/['"]/g, '')
			if (current_breakpoint != breakpoint) {
				previous_breakpoint = current_breakpoint;
				current_breakpoint = breakpoint;
			}
			return breakpoint;
		}
	}
	window.upfront_get_breakpoint = get_breakpoint; // Expose to global

	/**
	 * Get the previously used breakpoint
	 *
	 * @return {String} Previous breakpoint
	 */
	function get_previous_breakpoint () {
		get_breakpoint();
		return previous_breakpoint;
	}
	window.upfront_get_previous_breakpoint = get_previous_breakpoint; // Expose to global

	/* Youtube API */
	var youtube_api_loaded = false;
	var youtube_api_ready = false;
	var youtube_player_ids = [];

	function change_youtube_video (id, type) {
		youtube_player_ids.push(id);
		if ( !youtube_api_loaded ){
			var tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			window.onYouTubeIframeAPIReady = function () {
				youtube_api_ready = true;
				create_youtube_players(type);
			}
			youtube_api_loaded = true;
			return;
		}
		if ( youtube_api_ready ) {
			create_youtube_players(type);
		}
	}

	function create_youtube_players (type) {
		for ( var i = 0; i < youtube_player_ids.length; i++ )
			// Only Loop video.
			if (type === 'loop') {
				var player = new YT.Player(youtube_player_ids[i], {
					events: {
						'onReady': on_loop_youtube_ready
					}
				});
			} else if (type === 'loopAndMute') {
				// Loop and mute video.
				var player = new YT.Player(youtube_player_ids[i], {
					events: {
						'onReady': function(e) {
							on_loop_youtube_ready(e);
							on_mute_youtube_ready(e);
						}
					}
				});
			// Only mute:
			} else {
				var player = new YT.Player(youtube_player_ids[i], {
					events: {
						'onReady': on_mute_youtube_ready
					}
				});
			}
		youtube_player_ids = [];
	}

	function on_mute_youtube_ready (event) {
		return event.target.mute();
	}

	function on_loop_youtube_ready (event) {
		var time, duration;
		return setInterval(function(){
			time = event.target.getCurrentTime();
			duration = event.target.getDuration();
			if(time > duration - 0.5) {
				event.target.seekTo(0);
				event.target.playVideo();
			}
		}, 200);
	}

	/* Vimeo API */
	var vimeo_listened  = false;
	function mute_vimeo_video (id) {
		if ( !vimeo_listened ) {
			if (window.addEventListener)
				window.addEventListener('message', on_vimeo_message, false);
			else
				window.attachEvent('onmessage', on_vimeo_message, false);
			vimeo_listened = true;
		}
	}

	function on_vimeo_message (e) {
		if ( !e.origin.match(/vimeo\./) )
			return;
		var data = JSON.parse(e.data);
		if ( data.event == 'ready' ) {
			var player = $('#'+data.player_id),
				url = player.attr('src').split('?'),
				data = {
					method: 'setVolume',
					value: 0
				};
			player[0].contentWindow.postMessage(data, url);
		}
	}


	/* Responsive background */
	var windowWidth = $(window).width();
	var initialUpdateBackgroundDone = false;
	function update_background () {
		var newWindowWidth = $(window).width();
		// Update background only on width change, do initial update always
		if (initialUpdateBackgroundDone && windowWidth === newWindowWidth) {
			return;
		}
		initialUpdateBackgroundDone = true;
		windowWidth = newWindowWidth;

		var breakpoint = get_breakpoint();
		breakpoint = !breakpoint ? 'desktop' : breakpoint;
		$('[data-bg-type-'+breakpoint+']').each(function(){
			var type = $(this).attr('data-bg-type-'+breakpoint),
				$overlay = $(this).find('> .upfront-output-bg-'+breakpoint)
			;
			$(this).find('> .upfront-output-bg-overlay').not($overlay).each(function(){
				if ( $(this).is('.upfront-output-bg-video') ) {
					$(this).children().not('script.video-embed-code').remove();
				}
				if ( $(this).attr('data-bg-parallax') && $(this).data('uparallax') ) {
					$(this).uparallax('destroy');
				}
			});
			if ( $overlay.attr('data-bg-parallax') ) {
				setTimeout(function () { // Zero timeout to shift it out
					var $container = $overlay.closest('.upfront-output-region-container');
					if ( $container.length ) {
						var $next = $container.next('.upfront-output-region-container'),
							$next_bg = $next.find('.upfront-region-container-bg'),
							$prev = $container.prev('.upfront-output-region-container'),
							$prev_bg = $prev.find('.upfront-region-container-bg'),
							next_bg_color = $next_bg.css('background-color'),
							next_type = $next_bg.attr('data-bg-type-' + breakpoint),
							prev_bg_color = $prev_bg.css('background-color'),
							prev_type = $prev_bg.attr('data-bg-type-' + breakpoint),
							has_alpha = function (color) {
								if (!color) return false;
								if ("transparent" == color) return true;
								var matches = color.match(/(rgba|hsla)\(.*?,.*?,.*?,.*?([\d.]+).*?\)/);
								if (matches && matches[2] && parseFloat(matches[2]) < 1) return true;
								return false;
							},
							overflow_top = ( $prev.length > 0 && prev_type == 'color' && prev_bg_color && has_alpha(prev_bg_color) ? 0 : false ),
							overflow_bottom = ( $next.length > 0 && next_type == 'color' && next_bg_color && has_alpha(next_bg_color) ? 0 : false )
						;
						// No overlow if the next/prev container is contained
						if ( $prev.length > 0 && $prev.hasClass('upfront-region-container-clip') ) overflow_top = 0;
						if ( $next.length > 0 && $next.hasClass('upfront-region-container-clip') ) overflow_bottom = 0;
						$overlay.uparallax({
							element: $overlay.attr('data-bg-parallax')
						});
						if (false === overflow_top && $prev.length > 0 && $prev.height() < 100) overflow_top = $prev.height();
						if (false === overflow_bottom && $next.length > 0 && $next.height() < 100) overflow_bottom = $next.height();
						if (false !== overflow_top) $overlay.uparallax('setOption', 'overflowTop', overflow_top);
						if (false !== overflow_bottom) $overlay.uparallax('setOption', 'overflowBottom', overflow_bottom);
						$(document).on('upfront-responsive-nav-open upfront-responsive-nav-close', function () {
							if ( $overlay.data('uparallax') ) {
								$overlay.uparallax('refresh');
							}
						});
					}
				}, 0);
			}
			if ( type == 'image' || type == 'featured' ) {
				var is_overlay = $(this).attr('data-bg-overlay-'+breakpoint),
					$el = is_overlay ? $overlay.children('.upfront-bg-image') : $(this),
					before_src = $el.attr('data-src'),
					src = $el.attr('data-src-'+breakpoint),
					ratio = $el.attr('data-bg-image-ratio-'+breakpoint)
				;
				if ( is_overlay ) {
					$(this).css('background-image', 'none');
				}
				if ( src ) {
					$el.attr('data-src', src);
				}
				else {
					$el.removeAttr('data-src');
				}
				if ( ratio ) {
					$el.attr('data-bg-image-ratio', ratio);
				}
				else {
					$el.removeAttr('data-bg-image-ratio').css('background-position', '').css('background-size', '');
				}
				if ( src && before_src != src && $el.hasClass('upfront-image-lazy') ){
					$el.removeClass('upfront-image-lazy-loaded');
				}
				else {
					$el.css('background-image', 'url("' + src + '")');
				}
			}
			else if ( type == 'color' ) {
				$(this).css('background-image', 'none');
			}
			else {
				$(this).css('background-image', 'none');
				$overlay.each(function(){
					if ( $(this).is('.upfront-output-bg-video') && $(this).children().length == 1 ){
						var $iframe = $($(this).children('script.video-embed-code').html()),
							id = $iframe.attr('id');
						$(this).append($iframe);
						// If mute is enabled:
						var src;
						if ( $(this).attr('data-bg-video-mute') == 1 ) {
							src = $iframe.attr('src');
							if ( src.match(/youtube\.com/i) ) {
								// If loop is enabled too.
								if ( $(this).attr('data-bg-video-loop') == 1 ) {
									change_youtube_video(id, 'loopAndMute');
								} else {
									change_youtube_video(id, 'mute');
								}
							} else if ( src.match(/vimeo\./i) ) {
								mute_vimeo_video(id);
							}
						// If only loop is enabled:
						} else if ( $(this).attr('data-bg-video-loop') == 1 ) {
							src = $iframe.attr('src');
							// Only loop via this method if youtube video.
							if ( src.match(/youtube\.com/i) ) {
								change_youtube_video(id, 'loop');
							}
						}
					}
				});
			}
		});
	}
	update_background();
	var lazyUpdateBackground = throttle(update_background, 300);
	$(window).on('resize.uf_layout', lazyUpdateBackground);

	// Making sure sidebar region height is fixed
	function fix_region_height () {
		set_full_screen();
		$('.upfront-output-region-container').each(function(){
			var $regions = $(this).find('.upfront-output-region').filter('.upfront-region-center, .upfront-region-side-left, .upfront-region-side-right'),
				is_full_screen = $(this).hasClass('upfront-region-container-full'),
				min_height = height = 0;
			if ( $regions.length > 1 ){
				$regions.each(function(){
					var min = parseInt($(this).css('min-height'), 10),
						h = $(this).outerHeight();
					if ( min )
						min_height = min > min_height ? min : min_height;
					height = h > height ? h : height;
				});
				$regions.css({
					minHeight: height,
					height: "",
					maxHeight: ""
				});
			}
		});
	}
	function set_full_screen () {
		$('.upfront-output-region-container.upfront-region-container-full').each(function(){
			var $region = $(this).find('.upfront-region-center'),
				$sub = $(this).find('.upfront-region-side-top, .upfront-region-side-bottom'),
				body_off = $('body').offset(),
				height = $(window).height() - body_off.top,
				$bg_overlay = $(this).find('.upfront-output-bg-overlay')
			;
			if ( $bg_overlay.length ) $bg_overlay.css('height', height);
			$sub.each(function(){
				height -= $(this).outerHeight();
			});
			$region.css({
				minHeight: height
			});
			// Keep element position to ratio if enabled
			var behavior = $(this).attr('data-behavior'),
				original_height = parseInt($(this).attr('data-original-height'), 10)
			;
			if ( behavior == 'keep-ratio' && original_height > 0 ){
				var $wrappers = $region.find('> .upfront-region-wrapper > .upfront-output-wrapper'),
					region_off = $region.offset(),
					modules = [],
					lines = [],
					line_index = -1,
					total_height = 0,
					total_fill = 0,
					ori_bottom_space = 0,
					avail_bottom_space = 0,
					available_space = 0,
					original_space = 0
				;

				$wrappers.each(function(){
					var $modules = $(this).find('> .upfront-output-module, > .upfront-output-module-group');
					if ( $modules.length == 0 ) return;
					var wrap_obj = {
						$el: $(this),
						top_space: 0,
						bottom_space: 0,
						fill: 0,
						modules: []
					};
					$modules.each(function(module_index){
						var $el = $(this).hasClass('upfront-output-module-group') ? $(this) : $(this).find('> .upfront-output-object');
						$el.css({
							paddingTop: '',
							paddingBottom: '',
							minHeight: ''
						});
						var padding_top = parseFloat($el.css('padding-top')),
							padding_bottom = parseFloat($el.css('padding-bottom')),
							height = parseFloat($(this).css('height')),
							min_height = parseFloat($el.css('min-height'))
						;
						if ( module_index == 0 ) {
							wrap_obj.top_space = padding_top;
						}
						wrap_obj.bottom_space = padding_bottom;
						wrap_obj.fill += height;
						wrap_obj.modules.push({
							$el: $el,
							top: padding_top,
							bottom: padding_bottom,
							height: height - padding_top - padding_bottom,
							min_height: min_height !== min_height ? 0 : min_height
						});
					});
					wrap_obj.fill -= wrap_obj.top_space + wrap_obj.bottom_space;

					var wrap_off = $(this).offset(),
						wrap_left = parseFloat($(this).css('margin-left')),
						wrap_height = parseFloat($(this).css('height'))
					;

					if ( Math.abs(wrap_off.left-wrap_left-region_off.left) < 5 ){
						line_index++;
						lines[line_index] = {
							wrappers: [wrap_obj],
							height: wrap_height,
							top_space: wrap_obj.top_space,
							bottom_space: wrap_obj.bottom_space
						};
					}
					else {
						lines[line_index].top_space = wrap_obj.top_space < lines[line_index].top_space ? wrap_obj.top_space : lines[line_index].top_space;
						if ( wrap_height >= lines[line_index].height ) {
							lines[line_index].height = wrap_height;
							lines[line_index].bottom_space = wrap_obj.bottom_space < lines[line_index].bottom_space ? wrap_obj.bottom_space : lines[line_index].bottom_space;
						}
						lines[line_index].wrappers.push(wrap_obj);
					}
				});

				$.each(lines, function(index, line){
					total_height += line.height;
					total_fill += line.height - line.top_space - line.bottom_space;
					original_space += line.top_space + line.bottom_space;
				});
				ori_bottom_space = original_height > total_height ? original_height-total_height : 0;
				original_space += ori_bottom_space;
				available_space = height > total_fill ? height - total_fill : 0;

				var count_space = function (from, until) {
					var total_space = 0,
						from = typeof from == "number" ? from : 0,
						until = typeof until == "number" ? until : -1
					;
					$.each(lines, function(index, line){
						if ( index < from || ( until > -1 && index > until ) ) return;
						var top_space = false,
							bottom_space = false,
							line_height = 0
						;
						$.each(line.wrappers, function(w, wrap){
							var wrap_height = wrap.fill + wrap.top_space + wrap.bottom_space;
							line_height = wrap_height > line_height ? wrap_height : line_height;
						});
						$.each(line.wrappers, function(w, wrap){
							var wrap_bottom_space = line_height - wrap.fill - wrap.top_space;
							top_space = ( top_space === false || wrap.top_space < top_space ) ? wrap.top_space : top_space;
							bottom_space = ( bottom_space === false || wrap_bottom_space < bottom_space ) ? wrap_bottom_space : bottom_space;
						});
						total_space += top_space + bottom_space;
					});
					return total_space;
				}

				$.each(lines, function(index, line){
					var line_top_space = Math.round(line.top_space/original_space * available_space),
						line_bottom_space = Math.round(line.bottom_space/original_space * available_space)
					;
					$.each(line.wrappers, function(w, wrap){
						$.each(wrap.modules, function(m, module){
							var new_top = module.top - line.top_space + line_top_space,
								new_bottom = module.bottom - line.bottom_space + line_bottom_space,
								min_height = module.min_height
							;
							if ( m == 0 ) {
								module.$el.css('padding-top', new_top + 'px');
								min_height -= module.top - new_top;
							}
							if ( m == wrap.modules.length - 1 ) {
								module.$el.css('padding-bottom', new_bottom + 'px');
								min_height -= module.bottom - new_bottom;
							}
							min_height = min_height > 0 ? min_height : 0;
							module.$el.css('min-height', min_height + 'px');
						});
					});
				});
			}
		});
	}
	var lazySetFullScreen = throttle(set_full_screen, 100);
	var lazyFixRegionHeight = throttle(fix_region_height, 100);
	if ( css_support('flex') ){
		$('html').addClass('flexbox-support');
		set_full_screen();
		$(window).on('load.uf_layout', set_full_screen);
		$(window).on('resize.uf_layout', lazySetFullScreen);
	}
	else {
		fix_region_height();
		$(window).on('load.uf_layout', fix_region_height);
		$(window).on('resize.uf_layout', lazyFixRegionHeight);
	}

	// Full width image and video background
	function fix_full_bg () {
		var body_off = $('body').offset();
		$('[data-bg-image-ratio]').each(function(){
			var is_layout = $(this).is('.upfront-output-layout'),
				is_full_screen = ( ( $(this).is('.upfront-region-container-bg') || $(this).is('.upfront-output-region') ) && $(this).closest('.upfront-region-container-full').length > 0 ),
				width = is_layout ? $(window).width() : $(this).outerWidth(),
				height = is_layout ? $(window).height() : ( is_full_screen ? $(window).height()-body_off.top : $(this).outerHeight() ),
				ratio = parseFloat($(this).attr('data-bg-image-ratio'));

			// If Parallax, do not change background size/position.
			if (this.parentNode.getAttribute('data-bg-parallax')) {
				return;
			}

			if ( Math.round(height/width*100)/100 > ratio ) {
				$(this).data('bg-position-y', 0);
				$(this).data('bg-position-x', '50%');
				$(this).css({
					'background-position': '50% 0',
					'background-size': Math.round(height/ratio) + "px " + height + "px" /*"auto 100%"*/
				});
			} else {
				$(this).data('bg-position-y', Math.round( ( height - (width*ratio) ) / 2 ));
				$(this).data('bg-position-x', '0');
				$(this).css({
					'background-position': '0 ' + Math.round( ( ( height - (width*ratio) ) / 2) ) + 'px',
					'background-size': width + "px " + Math.round(width*ratio) + "px" /*"100% auto"*/
				});
			}
		});
		$('[data-bg-video-ratio]').each(function(){
			var is_layout = $(this).parent().is('.upfront-output-layout'),
				is_full_screen = (  $(this).parent().is('.upfront-output-region, .upfront-region-container-bg') && $(this).closest('.upfront-region-container-full').length > 0 ),
				width = is_layout ? $(window).width() : $(this).outerWidth(),
				height = is_layout ? $(window).height() : ( is_full_screen ? $(window).height()-body_off.top : $(this).outerHeight() ),
				ratio = parseFloat($(this).attr('data-bg-video-ratio')),
				style = $(this).attr('data-bg-video-style') || 'crop',
				$embed = $(this).children('iframe');
			$(this).css('overflow', 'hidden');
			$embed.css({
				position: 'absolute'
			});
			if ( style == 'crop' ){
				if ( Math.round(height/width*100)/100 > ratio ){
					var embed_w = Math.round(height/ratio);
					$embed.css({
						width: embed_w,
						height: height,
						top: 0,
						left: Math.round((width-embed_w)/2)
					});
				}
				else {
					var embed_h = Math.round(width*ratio);
					$embed.css({
						width: width,
						height: embed_h,
						top: Math.round((height-embed_h)/2),
						left: 0
					});
				}
			}
			else if ( style == 'full' ) {
				$embed.css({
					top: 0,
					left: 0,
					width: width,
					height: height
				});
			}
			else if ( style == 'inside' ) {
				if ( Math.round(height/width*100)/100 < ratio ){
					var embed_w = Math.round(height/ratio);
					$embed.css({
						width: embed_w,
						height: height,
						top: 0,
						left: Math.round((width-embed_w)/2)
					});
				}
				else {
					var embed_h = Math.round(width*ratio);
					$embed.css({
						width: width,
						height: embed_h,
						top: Math.round((height-embed_h)/2),
						left: 0
					});
				}
			}
		});
		$('.upfront-output-object .upfront-featured-image-smaller').each(function() {
			var $img = $(this),
				$container = $img.parent(),
				data = $img.data('featured-image'),
				align = $img.data('featured-align'),
				valign = $img.data('featured-valign'),
				dotalign = $img.data('featured-dotalign'),
				mode = $img.data('featured-mode'),
				imgHeight = $img.height(),
				imgWidth = $img.width(),
				breakpoint = get_breakpoint()
			;

			// If table or mobile breakpoint, image is smaller than container and dotAlign is true make it inline
			if((breakpoint === "tablet" || breakpoint === "mobile") &&
					((mode === "small" || mode === "vertical" ) && dotalign === true)) {

				// Set text-align for parent container
				$container.css({
					'textAlign': align,
					'maxWidth': '100%'
				});

				// Make image inline
				$img.css({
					'position': 'static',
					'display': 'inline-block'
				});

				// Update margin to position image top or bottom
				/*if(valign === "center") {
					$img.css({
						'marginTop': (data.offsetHeight / 2) - (imgHeight / 2),
					});
				} else if (valign === "bottom") {
					$img.css({
						'marginTop': (data.offsetHeight - imgHeight),
					});
				}*/
			} else {
				if((breakpoint === "tablet" || breakpoint === "mobile") && mode === "small") {
					// Null above
					$container.css({
						'textAlign': 'center',
						'maxWidth': '100%',
						'width': '100%'
					});

					$img.css({
						'position': 'static',
						'display': 'inline-block'
					});
				} else if ((breakpoint === "tablet" || breakpoint === "mobile") && mode !== "small") {
					// Set image 100% width
					$container.css({
						'width': '100%',
						'height': 'auto'
					});
					$img.css({
						'width': '100%',
						'height': 'auto',
						'left': 0
					});
				} else {
					// Null above and position image into parent container
					$img.css({
						'top': data.offsetTop,
						'left': data.offsetLeft,
						'position': 'relative',
						'display': 'block',
						'marginTop': 0,
						'width': 'initial'
					});

					$container.css({ 'width': data.offsetWidth, 'height': data.offsetHeight});
				}
			}
		});
		$('.upfront-output-object .uf-post .thumbnail, .uf-post-data .upostdata-part.thumbnail').each(function(){
			var is_upostdata = $(this).hasClass('upostdata-part'),
				$object = $(this).closest('.upfront-output-object'),
				height = is_upostdata ? parseInt($object.css('min-height'), 10) : $(this).height(),
				width = $(this).width(),
				padding_top = parseInt($object.css('padding-top'), 10),
				padding_bottom = parseInt($object.css('padding-bottom'), 10),
				$img = $(this).find('img'),
				$container = $(this),
				imgHeight = $img.height(),
				imgWidth = $img.width(),
				breakpoint = get_breakpoint(),
				img = new Image,
				img_h, img_w
			;
			if ( is_upostdata ) {
				if(breakpoint === "tablet" || breakpoint === "mobile") {
					// Set image 100% width
					$container.css({
						'width': '100%',
						'height': 'auto'
					});
					$img.css({
						'width': '100%',
						'height': 'auto'
					});
					// Set height to image
					height = imgHeight;
					$object.css('min-height', height);
					$object.closest('.upfront-output-object-group').css('min-height', height);
				}
				else {
					$object.css('min-height', '');
					$object.closest('.upfront-output-object-group').css('min-height', '');
				}

				if ( !$img.hasClass('upfront-featured-image-fit-wrapper') ) return; // No fit for this
				height -= padding_top + padding_bottom;
				$(this).css('height', height);
			}
			if ( $(this).attr('data-resize') == "1" ) {
				img.src = $img.attr('src');
				img_h = img.height;
				img_w = img.width;
				if ( height/width > img_h/img_w ) {
					$img.css({ height: '100%', width: 'auto', marginLeft: (width-Math.round(height/img_h*img_w))/2, marginTop: "" });
				}
				else {
					$img.css({ height: 'auto', width: '100%', marginLeft: "", marginTop: (height-Math.round(width/img_w*img_h))/2 });
				}
			}
			else {
				img_h = $img.height();
				if ( height != img_h ) {
					$img.css('margin-top', (height-img_h)/2);
				}
			}
		});
	}
	fix_full_bg();
	var lazyFixFullBg = throttle(fix_full_bg, 500);
	$(window).on('resize.uf_layout', lazyFixFullBg);
	$(window).on('load.uf_layout', lazyFixFullBg);

	// Regions behavior on scroll
	var _scroll_data = {};
	function regions_scroll_update () {
		var breakpoint = get_breakpoint(),
			body_off = typeof _scroll_data.body_off != 'undefined' ? _scroll_data.body_off : $('body').offset(),
			scroll_top = $(window).scrollTop(),
			win_height = $(window).height(),
			scroll_bottom = scroll_top + win_height,
			$sticky_regions = typeof _scroll_data.$sticky_regions != 'undefined'
				? _scroll_data.$sticky_regions
				: $('.upfront-output-region-container[data-sticky="1"], .upfront-output-region-sub-container[data-sticky="1"]'),
			$floating_regions = typeof _scroll_data.$floating_regions != 'undefined'
				? _scroll_data.$floating_regions
				: $('.upfront-output-region-container.upfront-region-container-full, .upfront-output-region-container.upfront-region-container-full .upfront-output-region-sub-container:not(.upfront-output-region-container-sticky), .upfront-output-region.upfront-region-side-fixed[data-restrict-to-container="1"]')
		;
		_scroll_data.body_off = body_off;
		_scroll_data.$sticky_regions = $sticky_regions;
		_scroll_data.$floating_regions = $floating_regions;

		if ( body_off.top > 0 ){
			scroll_top += body_off.top;
			win_height -= body_off.top;
		}
		scroll_top = scroll_top < body_off.top ? body_off.top : scroll_top;

		// Sticky region behavior
		$sticky_regions.each(function(){
			var is_sub_container = $(this).hasClass('upfront-output-region-sub-container'),
				is_top = ( is_sub_container && $(this).nextAll('.upfront-grid-layout').length > 0 ),
				offset = $(this).offset(),
				sticky_top = $(this).data('sticky-top'),
				css = {};
			if ( typeof sticky_top != 'number' && scroll_top > offset.top ) {
				css.position = 'fixed';
				css.top = $('#wpadminbar').css('position') != 'fixed' ? 0 : body_off.top;
				css.left = 0;
				css.right = 0;
				css.bottom = 'auto';
				$(this).addClass('upfront-output-region-container-sticky');
				$(this).data('sticky-top', offset.top);
				if ( is_sub_container ) {
					$(this).closest('.upfront-region-container-bg').css( ( is_top ? 'padding-top' : 'padding-bottom' ), $(this).height() );
				}
				else {
					$(this).next('.upfront-output-region-container').css('padding-top', $(this).height());
				}
			}
			else if ( typeof sticky_top == 'number' && scroll_top <= sticky_top ) {
				css.position = '';
				css.top = '';
				css.left = '';
				css.right = '';
				css.bottom = '';
				$(this).removeClass('upfront-output-region-container-sticky');
				$(this).removeData('sticky-top');
				if ( is_sub_container )
					$(this).closest('.upfront-region-container-bg').css( ( is_top ? 'padding-top' : 'padding-bottom' ), '');
				else
					$(this).next('.upfront-output-region-container').css('padding-top', '');
			}
			$(this).css(css);
		});

		// Floating behavior
		$floating_regions.each(function(){
			var is_float = $(this).is('.upfront-region-side-fixed'),
				is_full_screen = $(this).is('.upfront-region-container-full'),
				is_sub_container = $(this).is('.upfront-output-region-sub-container'),
				$container = $(this).closest('.upfront-output-region-container'),
				container_height = $container.outerHeight(),
				container_offset = $container.offset(),
				container_bottom = container_offset.top + container_height,
				height = $(this).height(),
				top = is_float ? parseInt($(this).attr('data-top'), 10) : 0,
				is_top = is_float ? ( typeof $(this).attr('data-top') != "undefined" ) : ( $(this).nextAll('.upfront-grid-layout').length > 0 ),
				bottom = is_float ? parseInt($(this).attr('data-bottom'), 10) : 0,
				is_bottom = is_float ? ( typeof $(this).attr('data-bottom') != "undefined" ) : ( $(this).prevAll('.upfront-grid-layout').length > 0 ),
				css = {}
			;
			if ( is_full_screen ) {
				var $bg_image = $(this).find('.upfront-region-container-bg'),
					is_bg_image = ( $bg_image.css('background-image') != 'none' ),
					$bg_overlay = $(this).find('.upfront-output-bg-overlay:visible'),
					is_bg_overlay = ( $bg_overlay.length > 0 ),
					bg_position_y = 0,
					bg_position_x = 0,
					bg_position_css = $bg_image.css('background-position')
				;
				if ( is_bg_image ) {
					if ( typeof $bg_image.data('bg-position-y') == 'undefined' )
						$bg_image.data('bg-position-y', bg_position_css.match(/\d+(%|px|)$/)[0]);
					if ( typeof $bg_image.data('bg-position-x') == 'undefined' )
						$bg_image.data('bg-position-x', bg_position_css.match(/^\d+(%|px|)/)[0]);
					bg_position_y = $bg_image.data('bg-position-y');
					bg_position_x = $bg_image.data('bg-position-x');
					if ( typeof bg_position_y == 'string' && bg_position_y.match(/%$/) ){
						var img = new Image;
						img.src = $bg_image.css('background-image').replace(/^url\(\s*['"]?\s*/, '').replace(/\s*['"]?\s*\)$/, '');
						bg_position_y = parseInt(bg_position_y, 10)/100 * (height-img.height);
					}
					else {
						bg_position_y = parseInt(bg_position_y, 10);
					}
				}
			}
			if ( scroll_top >= container_offset.top && scroll_bottom <= container_bottom ){
				if ( is_float || is_sub_container ) {
					css.position = 'fixed';
					if ( is_top )
						css.top = top + body_off.top;
					else
						css.bottom = bottom;
				}
				if ( is_sub_container ){
					css.left = 0;
					css.right = 0;
					if ( is_top )
						$container.find('> .upfront-region-container-bg').css('padding-top', height);
					else
						$container.find('> .upfront-region-container-bg').css('padding-bottom', height);
				}
				if ( is_full_screen ){
					if ( is_bg_image ) {
						$bg_image.css('background-position', bg_position_x + ' ' + ( bg_position_y + scroll_top - body_off.top ) + 'px');
					}
					else if ( is_bg_overlay ) {
						$bg_overlay.css('top', ( scroll_top - body_off.top ));
					}
				}
			}
			else {
				if ( is_float ) {
					css.position = 'absolute';
					if ( is_top ) {
						if ( container_height > win_height && scroll_top >= ( container_offset.top + container_height - win_height ) )
							css.top = container_height - win_height + top;
						else
							css.top = top;
					}
					else {
						if ( container_height > win_height && scroll_bottom <= ( container_offset.top + win_height ) )
							css.bottom =  container_height - win_height + bottom;
						else
							css.bottom = bottom;
					}
				}
				else if ( is_sub_container ) {
					css.position = 'relative';
					if ( is_top )
						css.top = container_height - win_height + top;
					css.bottom = '';
					css.left = '';
					css.right = '';
					$container.find('> .upfront-region-container-bg').css({
						paddingTop: '',
						paddingBottom: ''
					});
				}
				else if ( is_full_screen ) {
					if ( is_bg_image ) {
						$bg_image.css('background-position', bg_position_x + ' ' + ( bg_position_y + ( container_height - win_height ) ) + 'px');
					}
					else if ( is_bg_overlay ) {
						$bg_overlay.css('top', ( container_height - win_height ));
					}
				}
			}
			$(this).css(css);
		});
	}
	regions_scroll_update();
	$(window).on('load.uf_layout', regions_scroll_update);
	var lazyScrollUpdate = throttle(regions_scroll_update, 100);
	$(window).on('scroll.uf_layout', regions_scroll_update);
	$(window).on('resize.uf_layout', lazyScrollUpdate);

	/* Lightbox front end logic */
	var overlay = $('<div class="upfront-lightbox-bg"></div>'),
		close= $('<div class="upfront-ui close_lightbox"></div>'),
		close_icon= $('<div class="upfront-icon upfront-icon-popup-close"></div>');

	$("[data-group-link]").css({'cursor': 'pointer'});
	$(document).on("click", "[data-group-link]", function () {
		var url = $(this).data("groupLink");
		var target = $(this).data("groupTarget") || '_self';

		if(url.indexOf('#') === -1) {
			// Not an anchor, follow link
			window.open(url, target);
			return;
		}

		// It is an anchor
		if (url.match(/^#.*/) !== null) {
			// Starts with #, it's safe to do the jQuery stuff
			var nav = $('.upfront-output-region-container[data-sticky="1"], .upfront-output-region-sub-container[data-sticky="1"]').first();
			var height = nav.height() ? nav.height() : 0;
			$('html,body').animate({scrollTop: $(url).offset().top - height },'slow');
			return;
		}

		// It's an absolute url with anchor
		var urlParts = url.split('#');
		if (urlParts[0] === location.origin + location.pathname) {
			// Target is on the current page
			var nav = $('.upfront-output-region-container[data-sticky="1"], .upfront-output-region-sub-container[data-sticky="1"]').first();
			var height = nav.height() ? nav.height() : 0;
			$('html,body').animate({scrollTop: $('#' + urlParts[1]).offset().top - height },'slow');
			return;
		}

		// It's not on the current page
		if ($(this).attr('target') === '_blank') {
			// Open in a new window
			window.open(url);
			return;
		}

		// Open in this window
		window.location = url;
	});

	$(document).on('click', 'a', function(e) {
		//If we are in the editor the lightbox is open using the region.
		//if(typeof(Upfront) != 'undefined' && Upfront.Views)
			//return;

		if($(e.target).closest('div.redactor_box') > 0)
			return;

		if($('div#sidebar-ui').length > 0 && $('div#sidebar-ui').css('display') == 'block') {

				if($(e.target).hasClass('upfront_cta')) {
					e.preventDefault();
					return;
				}

				var url = $(e.target).attr('href');

				if(url && url.indexOf && url.indexOf('#ltb-') > -1)	 {

					e.preventDefault();
					var regions = Upfront.Application.layout.get('regions');
					var urlanchor = url.split('#');

					region = regions ? regions.get_by_name(urlanchor[1]) : false;
					if(region){
						//hide other lightboxes
						_.each(regions.models, function(model) {
							if(model.attributes.sub == 'lightbox')
								Upfront.data.region_views[model.cid].hide();
						});
						var regionview = Upfront.data.region_views[region.cid];
						regionview.show();

					}
				}

			return;
		}

		var url = $(this).attr('href');
		if(!url) {
			return;
		}

		if(url.indexOf('#') === -1) return;

		if($(this).closest('div.upfront-navigation').data('style') == 'burger' && $(this).parent('li.menu-item.menu-item-has-children').length > 0) {
			var linkitem = $(this).parent('li.menu-item.menu-item-has-children');

			if(linkitem.children('ul.sub-menu').closest('li.menu-item').hasClass('burger_sub_display'))
					linkitem.children('ul.sub-menu').closest('li.menu-item').removeClass('burger_sub_display');
			else
				linkitem.children('ul.sub-menu').closest('li.menu-item').addClass('burger_sub_display');

			var menu = linkitem.closest('ul.menu');
			var menucontainer = menu.closest('div.upfront-output-unewnavigation').children('div');
			if(menucontainer.data('burger_over') == 'pushes' && menucontainer.data('burger_alignment') == 'top') {

				$('div#page').css('margin-top', menu.height());


				//var topbar_height = $('div#upfront-ui-topbar').outerHeight();
				var adminbar_height = $('div#wpadminbar').outerHeight();
				menu.offset({top:adminbar_height, left:$('div').offset().left});
				//menu.width($('div#page').width());

			}
		}

		e.preventDefault();
		var tempurl = url.split('#');
		if(tempurl[1].trim() === '') {
			return;
		}

		if (tempurl[1].trim().indexOf('ltb-') == 0) {
			var lightbox =  $('div.upfront-region-'+tempurl[1].trim());

			overlay.css('background-color', lightbox .data('overlay')).insertBefore(lightbox);

			if(lightbox.data('closeicon') == 'yes' || lightbox.data('addclosetext') == 'yes') {
				lightbox.prepend(close);

				if(lightbox.data('addclosetext') == 'yes') {
					close.append($('<h3>'+lightbox.data('closetext')+'</h3>'));
					if(lightbox.data('closeicon') == 'yes')
						close.children('h3').css('margin-right', '40px');
				}
				if(lightbox.data('closeicon') == 'yes')
					close.append(close_icon);

				close.bind('click', function() {
					lightboxhide();
				});
			}

			if(lightbox.data('clickout') == 'yes') {
				overlay.bind('click', function() {
					lightboxhide();
				});
			}
			//translate width in columns to width in pixels as per the total width of upfront-grid-layout being 24 cols
			lightbox.css('width', $('div.upfront-grid-layout').first().width()*lightbox.data('col')/24);
			lightbox.show().css({'margin-left': -(parseInt(lightbox.width()/2)), 'margin-top': -(parseInt(lightbox.height()/2))});

			/* elements can subscribe to the following event to
			 * to render their content based
			 * on the dimensions of the lightbox
			 * itself, such elements are gallery and slider
			*/
			$(document).trigger("upfront-lightbox-open", lightbox);

			e.preventDefault();
			function lightboxhide() {
				close.html('').remove()
				overlay.remove();
				lightbox.hide();
			}
			return;
		}

		var nav = $('.upfront-output-region-container[data-sticky="1"], .upfront-output-region-sub-container[data-sticky="1"]').first();
		var height = nav.height() ? nav.height() : 0;
		//It is an anchor
		// Starts with #, it's safe to do the jQuery stuff
		if (url.match(/^#.*/) !== null) {
			$('html,body').animate({scrollTop: $(url).offset().top - height },'slow');
			return;
		}

		// It's an absolute url with anchor
		var urlParts = url.split('#');
		if (urlParts[0] === location.origin + location.pathname) {
			// Target is on the current page
			$('html,body').animate({scrollTop: $('#' + urlParts[1]).offset().top - height },'slow');
			return;
		}

		// It's not on the current page
		if ($(this).attr('target') === '_blank') {
			// Open in a new window
			window.open(url);
			return;
		}

		// Open in this window
		window.location = url;
	});

	/* Lazy loaded image */
	var image_lazy_load_t;
	var image_lazy_scroll = window._upfront_image_lazy_scroll;
	function image_lazy_load () {
		clearTimeout(image_lazy_load_t);
		image_lazy_load_t = setTimeout(function(){
			var scroll = $(window).scrollTop(),
				w_height = $(window).height(),
				w_width = $(window).width();
			$('.upfront-image-lazy').each(function(){
				if ( $(this).hasClass('upfront-image-lazy-loading') )
					return;
				var me = this,
					offset = $(this).offset(),
					height = $(this).height(),
					width = $(this).width(),
					source, src, closest;
				if (
					( ( image_lazy_scroll && offset.top+height >= scroll && offset.top < scroll+w_height ) || !image_lazy_scroll ) &&
					( width > 0 && height > 0 )
				){
					source = $(this).attr('data-sources');
					if ( source )
						source = JSON.parse(source);
					else
						src = $(this).attr('data-src');
					if ( typeof source != 'undefined' && source.length || src ){
						if ( typeof source != 'undefined' && source.length ){
							for ( var s = 0; s < source.length; s++ ) {
								if ( source[s][1] <= width || ( closest >= 0 && source[closest][1] < width && source[s][1] > width ) )
									closest = s;
							}
							if ( $(this).data('loaded') == closest )
								return;
							src = source[closest][0];
							$(this).data('loaded', closest);
						}
						else if ( src && $(this).hasClass('upfront-image-lazy-loaded') ){
							return;
						}
						$(this).removeClass('upfront-image-lazy-loaded').addClass('upfront-image-lazy-loading');
						$('<img>').attr('src', src).on('load', function(){
							if ( $(me).hasClass('upfront-image-lazy-bg') )
								$(me).css('background-image', 'url("' + $(this).attr('src') + '")');
							else
								$(me).attr('src', $(this).attr('src'));
							$(me).removeClass('upfront-image-lazy-loading').addClass('upfront-image-lazy-loaded');
						});
					}
				}
			});
		}, 100);
	}


	/**
	 * The queue object, used to chain-load images within a load level.
	 */
	function LazyLoad_Queue () {
		var deferreds = [],
			targets = []
		;

		function get_lazy_loading_image_promise (obj) {
			var deferred = new $.Deferred();
			obj.$el.removeClass('upfront-image-lazy-loaded').addClass('upfront-image-lazy-loading');
			$('<img />')
				.attr('src', obj.url)
				.on('load', function () {
					if (obj.$el.is(".upfront-image-lazy-bg")) obj.$el.css('background-image', 'url("' + obj.url + '")');
					else (obj.$el.attr('src', obj.url));
					obj.$el.removeClass('upfront-image-lazy-loading').addClass('upfront-image-lazy-loaded');
					deferred.resolve();
				})
				.on('error abort', function () {
					deferred.reject();
				})
			;
			return deferred.promise();
		}
		function add (src, $img) {
			targets.push({
				url: src,
				$el: $img
			});
		}
		function start () {
			var semaphore = new $.Deferred();
			$.each(targets, function (idx, obj) {
				deferreds.push(get_lazy_loading_image_promise(obj));
			});
			$.when.apply($, deferreds)
				.always(function () {
					semaphore.resolve();
				})
			;
			return semaphore.promise();
		}
		return {
			add: add,
			start: start
		}
	}

	/**
	 * The stack of queues, used to chain-load queued levels.
	 */
	function LazyLoad_QueueStack (queues) {
		function start () {
			queues.reverse();
			execute();
		}
		function execute () {
			var q = queues.pop();
			if (!q) return false;
			q.start().done(execute);
		}
		return { start: start };
	}

	/**
	 * Initial background loading of the images.
	 * Separate images into priority queues and load each one appropriately.
	 */
	function image_lazy_load_bg () {
		var secondary_delta = 1500,
		// Sources
			$images = $('.upfront-image-lazy'),
		// Queues
			primary = new LazyLoad_Queue(),
			secondary = new LazyLoad_Queue(),
			tertiary = new LazyLoad_Queue(),
		// Misc
			scroll = $(window).scrollTop(),
			w_height = $(window).height(),
			w_width = $(window).width(),
			breakpoint = get_breakpoint()
		;
		breakpoint = !breakpoint || 'none' === breakpoint ? 'desktop' : breakpoint; // "none" in FF

		if (!$images.length) return false;
		$images.each(function () {
			var $img = $(this),
				offset = $img.offset(),
				source = $img.attr('data-sources'),
				src = $img.attr('data-src'),
				point_src = $img.attr('data-src-' + breakpoint),
				height = $img.height(),
				width = $img.width()
			;

			//Remove blank.gif to calculate width correctly
			$img.attr('src', '');

			if ($img.is(".upfront-image-lazy-loaded")) return true; // already loaded
			if (!source && !src && !point_src) return true; // we don't know how to load
			if (height <= 0 && width <= 0) return true; // Don't lazy load backgrounds for hidden regions.

			if (source) {
				// Deal with source JSON and populate `src` from there
				var width = $img.width(),
					closest = 0
				;
				source = JSON.parse(source);
				for ( var s = 0; s < source.length; s++ ) {
					if ( source[s][1] <= width || ( closest >= 0 && source[closest][1] < width && source[s][1] > width ) )
						closest = s;
				}
				if ( $(this).data('loaded') == closest ) return true;
				src = source[closest][0]; // Use this to load
				$(this).data('loaded', closest);
			} else if (point_src) src = point_src;

			if (offset.top+height >= scroll && offset.top < scroll+w_height) {
				primary.add(src, $img);
			} else if (offset.top+height+secondary_delta >= scroll && offset.top < scroll+w_height+secondary_delta) {
				secondary.add(src, $img);
			} else {
				tertiary.add(src, $img);
			}

		});
		$(window).off('scroll', image_lazy_load); // Since we scheduled image loads, kill the scroll load

		// We're ready now
		var stack = new LazyLoad_QueueStack([
			// Order is significant
			primary,
			secondary,
			tertiary
		]).start();

	}

	// Initialize appropriate behavior
	var lazyImageLazyLoad = throttle(image_lazy_load, 100);
	$(window).on('resize', lazyImageLazyLoad); // Okay, so this should keep on happening on resizes
	if ( image_lazy_scroll ) {
		$(window).on('scroll', lazyImageLazyLoad);
		image_lazy_load();
	} else {
		$(image_lazy_load_bg); // Do background load instead
	}


	/* Responsive custom theme styles */
	function update_theme_styles () {
		var breakpoint = get_breakpoint();
		$('[data-theme-styles]').each(function(){
			var theme_styles = $(this).attr('data-theme-styles'),
				classes = [];
			theme_styles = theme_styles.replace("\"default\":", "\"defaults\":");
			if ( theme_styles )
				theme_styles = JSON.parse(theme_styles);
			$.each(theme_styles, function(id, style_class){
				classes.push(style_class);
			});
			$(this).removeClass(classes.join(' '));
			if ( !breakpoint && theme_styles.defaults )
				$(this).addClass( theme_styles.defaults );
			else if ( breakpoint && ( theme_styles[breakpoint] || theme_styles.defaults ) )
				$(this).addClass( theme_styles[breakpoint] ? theme_styles[breakpoint] : theme_styles.defaults );
		});
	}
	update_theme_styles();
	var lazyUpdateThemeStyles = throttle(update_theme_styles, 100);
	$(window).on('resize.uf_layout', lazyUpdateThemeStyles);

	/* Apply responsive class */
	function update_responsive_class () {
		var breakpoint = get_breakpoint();
		if ( $('#page').hasClass('upfront-layout-view') ){
			return remove_responsive_class();
		}
		if (previous_breakpoint) {
			$('#page').removeClass(previous_breakpoint + '-breakpoint');
		}
		if ( breakpoint && breakpoint !== 'none' && breakpoint !== 'desktop' ) {
			$('html').addClass('uf-responsive');
			$('#page').removeClass('desktop-breakpoint default-breakpoint').addClass('responsive-breakpoint ' + breakpoint + '-breakpoint');
		}
		else {
			$('#page').removeClass('responsive-breakpoint').addClass('default-breakpoint desktop-breakpoint');
			remove_responsive_class();
		}
	}
	function remove_responsive_class () {
		$('html').removeClass('uf-responsive');
	}
	function reset_responsive_class () {
		var breakpoint = get_breakpoint();
		if ( breakpoint ) {
			$('#page').removeClass(breakpoint + '-breakpoint');
		}
	}
	update_responsive_class();
	var lazyUpdateResponsiveClass = throttle(update_responsive_class, 100);
	$(window).on('resize.uf_layout', lazyUpdateResponsiveClass);



	/**
	 * Trigger DOM event on breakpoint change,
	 * so elements can subscribe to it
	 *
	 * Front-end responsive presets propagation depends on this
	 * event being fired properly
	 */
	function propagate_breakpoint_change () {
		var breakpoint = get_breakpoint() || 'desktop',
			previous = get_previous_breakpoint() || 'desktop'
		;
		if (breakpoint !== previous) {
			/**
			 * Trigger a DOM event on actual breakpoint change
			 * Responsive presets propagation listens for this event
			 */
			$(document).trigger("upfront-breakpoint-change", breakpoint);
		}
	}
	var lazy_propagate_breakpoint_change = throttle(propagate_breakpoint_change, 20, {trailing: false});
	$(window).on('resize.uf_layout', lazy_propagate_breakpoint_change);
	// done propagating breakpoint change

	/**
	 * Swap preset classes per breakpoint for each of the object elements
	 * Happens only on breakpoint change event
	 */
	function propagate_responsive_presets (e, breakpoint) {
		breakpoint = breakpoint || get_breakpoint() || 'desktop';
		if (!breakpoint) return;

		$("[data-preset_map]").each(function () {
			var $me = $(this),
				rmap = $me.attr("data-preset_map"),
				map = rmap ? JSON.parse(rmap) : {},
				current_preset_class,
				final_preset_class
			;

			// Edge case, for when we don't have a preset for this
			// breakpoint in an element - it should retain its classes
			// if (!map[breakpoint]) return true;

			// we have to provide proper fallback here, mobile -> tablet -> desktop
			if ( breakpoint == 'mobile' ) {
				map[breakpoint] = map[breakpoint] || map['tablet'] || map['desktop'];
			} else if ( breakpoint == 'tablet' ) {
				map[breakpoint] = map[breakpoint] || map['desktop'];
			} else {
				map[breakpoint] = map[breakpoint];
			}

			$.each(map, function (bp, preset) {
				if ( $me.hasClass(preset) ) {
					current_preset_class = preset;
					$me.removeClass(preset);
				}
				if (bp === breakpoint && !final_preset_class) final_preset_class = preset;
			});

			if (final_preset_class) {
				$me.addClass(final_preset_class);
				// find all children with such preset class, some elements do have this
				$me.find('.' + current_preset_class).each(function(){
					$(this).removeClass(current_preset_class);
					$(this).addClass(final_preset_class);
				});
			}

		});

		/**
		 * Trigger a DOM event on responsive presets change
		 * The legacy preset elements (accordion, tabs, button) listen to this event
		 */
		$(document).trigger("upfront-responsive_presets-changed", breakpoint);
	}
	var lazy_propagate_responsive_presets = throttle(propagate_responsive_presets, 200, {trailing: false});
	$(document).on("upfront-breakpoint-change", lazy_propagate_responsive_presets);
	// done propagating presets

	// Make sure breakpoint change is propagated
	propagate_breakpoint_change();
	// end

	function remove_all_bound_events () {
		$(window).off('resize.uf_layout');
		$(window).off('scroll.uf_layout');
		$(window).off('load.uf_layout');
		// Also destroy parallax
		$('.upfront-output-layout .upfront-parallax').uparallax('destroy');
	}

	$(document).on('upfront-load', function(){
		Upfront.Events.once("application:mode:before_switch", remove_all_bound_events);
		Upfront.Events.once("application:mode:before_switch", reset_responsive_class);
		Upfront.Events.once("layout:render", remove_responsive_class);
	});

	// remove inline panels on Image Insert redactor-box FE
	var $image_insert_inline_panels = $('.upfront-output-wrapper .upfront-inserted_image-basic-wrapper').find('.upfront-inline-panel-item');
	if ( $image_insert_inline_panels.length > 0 ) {
		$image_insert_inline_panels.remove();
	}

});
