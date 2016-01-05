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
		if(breakpoint) {
			breakpoint = breakpoint.replace(/['"]/g, '')
			if (current_breakpoint != breakpoint) {
				previous_breakpoint = current_breakpoint;
				current_breakpoint = breakpoint;
			}
			return breakpoint;
		}
	}

	/**
	 * Get the previously used breakpoint
	 *
	 * @return {String} Previous breakpoint
	 */
	function get_previous_breakpoint () {
		get_breakpoint();
		return previous_breakpoint;
	}

	/* Youtube API */
	var youtube_api_loaded = false;
	var youtube_api_ready = false;
	var youtube_player_ids = [];

	function mute_youtube_video (id) {
		youtube_player_ids.push(id);
		if ( !youtube_api_loaded ){
			var tag = document.createElement('script');
			tag.src = "https://www.youtube.com/iframe_api";
			var firstScriptTag = document.getElementsByTagName('script')[0];
			firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			window.onYouTubeIframeAPIReady = function () {
				youtube_api_ready = true;
				create_youtube_players();
			}
			youtube_api_loaded = true;
			return;
		}
		if ( youtube_api_ready )
			create_youtube_players();
	}

	function create_youtube_players () {
		for ( var i = 0; i < youtube_player_ids.length; i++ )
			var player = new YT.Player(youtube_player_ids[i], {
				events: {
					'onReady': on_mute_youtube_ready
				}
			});
		youtube_player_ids = [];
	}

	function on_mute_youtube_ready (event) {
		event.target.mute();

		var time, duration;
		setInterval(function(){
			time = event.target.getCurrentTime();
			duration = event.target.getDuration();
			if(time > duration - 0.5) {
				event.target.seekTo(0);
				event.target.playVideo();
			}
		},200);
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
						var $next = $container
										.next('.upfront-output-region-container')
										.find('.upfront-region-container-bg'),
							$prev = $container
										.prev('.upfront-output-region-container')
										.find('.upfront-region-container-bg'),
							next_bg_color = $next.css('background-color'),
							next_type = $next.attr('data-bg-type-' + breakpoint),
							prev_bg_color = $prev.css('background-color'),
							prev_type = $prev.attr('data-bg-type-' + breakpoint),
							has_alpha = function (color) {
								if (!color) return false;
								var matches = color.match(/(rgba|hsla)\(.*?,.*?,.*?,.*?([\d.]+).*?\)/);
								if (matches && matches[2] && parseFloat(matches[2]) < 1) return true;
								return false;
							},
							overflow_top = ( $prev.length > 0 && prev_type == 'color' && prev_bg_color && has_alpha(prev_bg_color) ? 0 : false ),
							overflow_bottom = ( $next.length > 0 && next_type == 'color' && next_bg_color && has_alpha(next_bg_color) ? 0 : false )
						;
						$overlay.uparallax({
							element: $overlay.attr('data-bg-parallax')
						});
						if (false === overflow_top && $prev.length > 0 && $prev.height() < 100) overflow_top = $prev.height();
						if (false === overflow_bottom && $next.length > 0 && $next.height() < 100) overflow_bottom = $next.height();
						if (false !== overflow_top) $overlay.uparallax('setOption', 'overflowTop', overflow_top);
						if (false !== overflow_bottom) $overlay.uparallax('setOption', 'overflowBottom', overflow_bottom);
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
						if ( $(this).attr('data-bg-video-mute') == 1 ){
							var src = $iframe.attr('src');
							if ( src.match(/youtube\.com/i) )
								mute_youtube_video(id);
							else if ( src.match(/vimeo\./i) )
								mute_vimeo_video(id);
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
					var min = parseInt($(this).css('min-height')),
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
				$bg_overlay = $(this).find('.upfront-output-bg-overlay');
			if ( $bg_overlay.length )
				$bg_overlay.css('height', height);
			$sub.each(function(){
				height -= $(this).outerHeight();
			});
			$region.css({
				minHeight: height
			});
			// Keep element position to ratio if enabled
			var behavior = $(this).attr('data-behavior'),
				original_height = parseInt($(this).attr('data-original-height'));
			if ( behavior == 'keep-ratio' && original_height > 0 ){
				var $wrappers = $region.find('> .upfront-region-wrapper > .upfront-output-wrapper'),
					region_off = $region.offset(),
					modules = [],
					lines = [],
					line_index = -1,
					total_height = 0,
					ori_bottom_space = 0,
					pos_top = false,
					pos_bottom = false,
					available_space = false,
					original_space = false,
					top_ref = 0;

				$wrappers.each(function(){
					var $modules = $(this).find('> .upfront-output-module, > .upfront-output-module-group');
					$modules.css('margin-top', '');
					var wrap_off = $(this).offset(),
						wrap_height = $(this).height();
					if ( Math.abs(wrap_off.left-region_off.left) < 5 ){
						line_index++;
						lines[line_index] = {
							wrappers: [],
							height: wrap_height
						};
					}
					else {
						if ( wrap_height > lines[line_index].height )
							lines[line_index].height = wrap_height;
					}
					var wrap_obj = {
						$el: $(this),
						space: 0,
						fill: 0,
						modules: []
					};
					$modules.each(function(){
						var margin_top = parseInt($(this).css('margin-top')),
							height = $(this).height();
						wrap_obj.space += margin_top;
						wrap_obj.fill += height;
						wrap_obj.modules.push({
							$el: $(this),
							top: margin_top,
							height: height
						});
					});
					lines[line_index].wrappers.push(wrap_obj);
				});

				$.each(lines, function(index, line){
					total_height += line.height;
				});
				ori_bottom_space = original_height > total_height ? original_height-total_height : 0;
				avail_bottom_space = height - original_height + ori_bottom_space;

				var count_space = function (from, until) {
					var total_space = 0,
						from = typeof from == "number" ? from : 0,
						until = typeof until == "number" ? until : -1;
					$.each(lines, function(index, line){
						if ( index < from || ( until > -1 && index > until ) )
							return;
						var space = 0;
						$.each(line.wrappers, function(w, wrap){
							space = wrap.space > space ? wrap.space : space;
						});
						total_space += space;
					});
					return total_space;
				}

				$.each(lines, function(index, line){
					var top_space = 0,
						bottom_space = 0;
					if ( index > 0 )
						top_space = count_space(0, index-1);
					if ( index < lines.length-1 )
						bottom_space = count_space(index+1);
					$.each(line.wrappers, function(w, wrap){
						var ori_space = top_space + bottom_space + ori_bottom_space + wrap.space,
							avail_space = top_space + bottom_space + avail_bottom_space + wrap.space;
						avail_space = avail_space > 0 ? avail_space : 0;
						$.each(wrap.modules, function(m, module){
							var margin_top = module.top/ori_space * avail_space;
							module.$el.css('margin-top', margin_top + 'px');
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
			if ( Math.round(height/width*100)/100 > ratio ) {
				$(this).data('bg-position-y', 0);
				$(this).data('bg-position-x', '50%');
				$(this).css({
					'background-position': '50% 0',
					'background-size': Math.round(height/ratio) + "px " + height + "px" /*"auto 100%"*/
				});
			}
			else {
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
		$('.upfront-output-object .uf-post .thumbnail').each(function(){
			var height = $(this).height(),
				width = $(this).width(),
				$img = $(this).find('img'),
				img = new Image,
				img_h, img_w;
			if ( $(this).attr('data-resize') == "1" ) {
				img.src = $img.attr('src');
				img_h = img.height;
				img_w = img.width;
				if ( height/width > img_h/img_w )
					$img.css({ height: '100%', width: 'auto', marginLeft: (width-Math.round(height/img_h*img_w))/2, marginTop: "" });
				else
					$img.css({ height: 'auto', width: '100%', marginLeft: "", marginTop: (height-Math.round(width/img_w*img_h))/2 });
			}
			else {
				img_h = $img.height();
				if ( height != img_h )
					$img.css('margin-top', (height-img_h)/2);
			}
		});
	}
	fix_full_bg();
	var lazyFixFullBg = throttle(fix_full_bg, 500);
	$(window).on('resize.uf_layout', lazyFixFullBg);
	$(window).on('load.uf_layout', lazyFixFullBg);

	// Regions behavior on scroll
	function regions_scroll_update () {
		var breakpoint = get_breakpoint(),
			body_off = $('body').offset(),
			scroll_top = $(window).scrollTop(),
			win_height = $(window).height(),
			scroll_bottom = scroll_top + win_height;
		if ( body_off.top > 0 ){
			scroll_top += body_off.top;
			win_height -= body_off.top;
		}
		scroll_top = scroll_top < body_off.top ? body_off.top : scroll_top;

		// Sticky region behavior
		$('.upfront-output-region-container[data-sticky="1"], .upfront-output-region-sub-container[data-sticky="1"]').each(function(){
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
		$('.upfront-output-region-container.upfront-region-container-full, .upfront-output-region-container.upfront-region-container-full .upfront-output-region-sub-container:not(.upfront-output-region-container-sticky), .upfront-output-region.upfront-region-side-fixed[data-restrict-to-container="1"]').each(function(){
			var is_float = $(this).is('.upfront-region-side-fixed'),
				is_full_screen = $(this).is('.upfront-region-container-full'),
				is_sub_container = $(this).is('.upfront-output-region-sub-container'),
				$container = $(this).closest('.upfront-output-region-container'),
				container_height = $container.outerHeight(),
				container_offset = $container.offset(),
				container_bottom = container_offset.top + container_height,
				height = $(this).height(),
				top = is_float ? parseInt($(this).attr('data-top')) : 0,
				is_top = is_float ? ( typeof $(this).attr('data-top') != "undefined" ) : ( $(this).nextAll('.upfront-grid-layout').length > 0 ),
				bottom = is_float ? parseInt($(this).attr('data-bottom')) : 0,
				is_bottom = is_float ? ( typeof $(this).attr('data-bottom') != "undefined" ) : ( $(this).prevAll('.upfront-grid-layout').length > 0 ),
				css = {};
			if ( is_full_screen ) {
				var $bg_image = $(this).find('.upfront-region-container-bg'),
					is_bg_image = ( $bg_image.css('background-image') != 'none' ),
					$bg_overlay = $(this).find('.upfront-output-bg-overlay'),
					is_bg_overlay = ( $bg_overlay.length > 0 ),
					bg_position_y = 0,
					bg_position_x = 0,
					bg_position_css = $bg_image.css('background-position'),
					full_screen_height = parseInt($(this).find('.upfront-region-center').css('min-height'));
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
						bg_position_y = parseInt(bg_position_y)/100 * (height-img.height);
					}
					else {
						bg_position_y = parseInt(bg_position_y);
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

	$( "[data-group-link]" ).each( function() {
		$(this).css({'cursor': 'pointer'});
		$(this).live( "click", function () {
			var url = $(this).data("groupLink");
			var target = $(this).data("groupTarget");

			if(url.indexOf('#') === -1) {
				// Not an anchor, follow link
				window.open(url, $(this).data("groupTarget"));
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
	 * Swap preset classes per breakpoint
	 * for each of the object elements
	 */
	function propagate_responsive_presets () {
		var breakpoint = get_breakpoint() || 'desktop';

		if (!breakpoint) return;

		$("[data-preset_map]").each(function () {
			var $me = $(this),
				rmap = $me.attr("data-preset_map"),
				map = rmap ? JSON.parse(rmap) : {}
			;
			
			// Edge case, for when we don't have a preset for this
			// breakpoint in an element - it should retain its classes
			if (!map[breakpoint]) return true;

			$.each(map, function (bp, preset) {
				$me.removeClass(preset);
				if (bp === breakpoint) $me.addClass(preset);
			});
		});
	}
	propagate_responsive_presets();
	var lazy_propagate_responsive_presets = throttle(propagate_responsive_presets, 200, {trailing: false});
	$(window).on('resize.uf_layout', lazy_propagate_responsive_presets);
	// done propagating presets

	/**
	 * Trigger DOM event on breakpoint change,
	 * so elements can subscribe to it
	 */
	function propagate_breakpoint_change () {
		var breakpoint = get_breakpoint() || 'desktop',
			previous = get_previous_breakpoint() || 'desktop'
		;
		if (breakpoint !== previous) $(document).trigger("upfront-breakpoint-change", breakpoint);
	}
	var lazy_propagate_breakpoint_change = throttle(propagate_breakpoint_change, 200, {trailing: false});
	$(window).on('resize.uf_layout', lazy_propagate_breakpoint_change);
	// done propagating breakpoint change

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

});
