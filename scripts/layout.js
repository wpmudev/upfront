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

	function get_breakpoint(){
		var breakpoint = window.getComputedStyle(document.body,':after').getPropertyValue('content');
		return breakpoint.replace(/['"]/g, '');
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
			var type = $(this).attr('data-bg-type-'+breakpoint);
			$(this).find('> .upfront-output-bg-overlay').not('.upfront-output-bg-'+breakpoint).each(function(){
				if ( $(this).is('.upfront-output-bg-video') )
					$(this).children().not('script.video-embed-code').remove();
			});
			if ( type == 'image' || type == 'featured' ) {
				var before_src = $(this).attr('data-src'),
					src = $(this).attr('data-src-'+breakpoint),
					ratio = $(this).attr('data-bg-image-ratio-'+breakpoint);
				if ( src )
					$(this).attr('data-src', src);
				else
					$(this).removeAttr('data-src');
				if ( ratio )
					$(this).attr('data-bg-image-ratio', ratio);
				else
					$(this).removeAttr('data-bg-image-ratio').css('background-position', '').css('background-size', '');
				if ( src && before_src != src && $(this).hasClass('upfront-image-lazy') )
					$(this).removeClass('upfront-image-lazy-loaded');
			}
			else if ( type == 'color' ) {
				$(this).css('background-image', 'none');
			}
			else {
				$(this).css('background-image', 'none');
				$(this).find('> .upfront-output-bg-'+breakpoint).each(function(){
					if ( $(this).is('.upfront-output-bg-video') && $(this).children().length == 1 )
						$(this).append($(this).children('script.video-embed-code').html());
				});
			}
		});
	}
	update_background();
	var lazyUpdateBackground = throttle(update_background, 300);
	$(window).on('resize', lazyUpdateBackground);

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
					modules = [],
					pos_top = false,
					pos_bottom = false,
					available_space = false,
					original_space = false,
					top_ref = 0;
				$wrappers.each(function(){
					var $module = $(this).find('> .upfront-output-module, > .upfront-output-module-group').first();
					$module.css('margin-top', ''); // Reset margin top first
					var margin_top = parseInt($module.css('margin-top')),
						pos = $(this).position(),
						bottom = pos.top + $(this).height();
					pos_bottom = ( pos_bottom === false || bottom > pos_bottom ) ? bottom : pos_bottom;
					if ( pos.top != 0 )
						return;
					pos_top = ( pos_top === false || margin_top < pos_top ) ? margin_top : pos_top;
					modules.push($module);
				});
				available_space = pos_top + ( height > pos_bottom ? height - pos_bottom : 0 );
				original_space = pos_top + ( original_height > pos_bottom ? original_height - pos_bottom : 0 );
				if ( available_space == original_space )
					top_ref = ( original_height > height ) ? pos_top - ( original_height - height ) : pos_top;
				else
					top_ref = pos_top/original_space * available_space;
				top_ref = top_ref < 0 ? 0 : top_ref;
				$.each(modules, function(i, $module){
					var margin_top = parseInt($module.css('margin-top'));
					if ( margin_top <= 0 )
						return;
					$module.css('margin-top', ( top_ref + margin_top - pos_top ) + 'px');
				});
			}
		});
	}
	var lazySetFullScreen = throttle(set_full_screen, 100);
	var lazyFixRegionHeight = throttle(fix_region_height, 100);
	if ( css_support('flex') ){
		$('html').addClass('flexbox-support');
		set_full_screen();
		$(window).on('load', set_full_screen);
		$(window).on('resize', lazySetFullScreen);
	}
	else {
		fix_region_height();
		$(window).on('load', fix_region_height);
		$(window).on('resize', lazyFixRegionHeight);
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
					'background-size': (height/ratio) + "px " + height + "px" /*"auto 100%"*/
				});
			}
			else {
				$(this).data('bg-position-y', Math.round( ( height - (width*ratio) ) / 2 ));
				$(this).data('bg-position-x', '0');
				$(this).css({
					'background-position': '0 ' + Math.round( ( ( height - (width*ratio) ) / 2) ) + 'px',
					'background-size': width + "px " + (width*ratio) + "px" /*"100% auto"*/
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
					var embed_w = (height/ratio);
					$embed.css({
						width: embed_w,
						height: height,
						top: 0,
						left: (width-embed_w)/2
					});
				}
				else {
					var embed_h = (width*ratio);
					$embed.css({
						width: width,
						height: embed_h,
						top: (height-embed_h)/2,
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
					var embed_w = (height/ratio);
					$embed.css({
						width: embed_w,
						height: height,
						top: 0,
						left: (width-embed_w)/2
					});
				}
				else {
					var embed_h = (width*ratio);
					$embed.css({
						width: width,
						height: embed_h,
						top: (height-embed_h)/2,
						left: 0
					});
				}
			}
		});
		$('.upfront-output-object .uf-post .thumbnail').each(function(){
			var height = $(this).height(),
				width = $(this).width(),
				$img = $(this).find('img'),
				img_h, img_w;
			if ( $(this).attr('data-resize') == "1" ) {
				$img.css({ height: "", width: "" });
				img_h = $img.height();
				img_w = $img.width();
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
	$(window).on('resize', lazyFixFullBg);

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
	$(window).on('load', regions_scroll_update);
	//var lazyScrollUpdate = throttle(regions_scroll_update, 100);
	//$(window).on('scroll', lazyScrollUpdate);
	$(window).on('scroll', regions_scroll_update);

	/* Lightbox front end logic */
	var overlay = $('<div class="upfront-lightbox-bg"></div>'),
		close= $('<div class="upfront-ui close_lightbox"></div>'),
		close_icon= $('<div class="upfront-icon upfront-icon-popup-close"></div>');

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
		  if(!url)
		  	return;

			if(url.indexOf('#') >=0) {
			  var tempurl = url.split('#');
			  if(tempurl[1].trim() != '')
				if(tempurl[1].trim().indexOf('ltb-') == 0) {
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

					if(lightbox.data('clickout') == 'yes')
						overlay.bind('click', function() {
							lightboxhide();
						});
					//translate width in columns to width in pixels as per the total width of upfront-grid-layout being 24 cols
					lightbox.css('width', $('div.upfront-grid-layout').first().width()*lightbox.data('col')/24);
					lightbox.show().css({'margin-left': -(parseInt(lightbox.width()/2)), 'margin-top': -(parseInt(lightbox.height()/2))});
					$(document).trigger("upfront-lightbox-open");
					e.preventDefault();
					function lightboxhide() {
						close.html('').remove()
						overlay.remove();
						lightbox.hide();
					}
				}
			}
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
			if ( theme_styles )
				theme_styles = JSON.parse(theme_styles);
			$.each(theme_styles, function(id, style_class){
				classes.push(style_class);
			});
			$(this).removeClass(classes.join(' '));
			if ( !breakpoint && theme_styles.default )
				$(this).addClass( theme_styles.default );
			else if ( breakpoint && ( theme_styles[breakpoint] || theme_styles.default ) )
				$(this).addClass( theme_styles[breakpoint] ? theme_styles[breakpoint] : theme_styles.default );
		});
	}
	update_theme_styles();
	var lazyUpdateThemeStyles = throttle(update_theme_styles, 100);
	$(window).on('resize', lazyUpdateThemeStyles);

	/* Apply responsive class */
	function update_responsive_class () {
		var breakpoint = get_breakpoint();
		if ( $('#page').hasClass('upfront-layout-view') ){
			return remove_responsive_class();
		}
		if ( breakpoint && breakpoint !== 'none' && breakpoint !== 'desktop' )
			$('html').addClass('uf-responsive');
		else
			remove_responsive_class();
	}
	function remove_responsive_class () {
		$('html').removeClass('uf-responsive');
	}
	update_responsive_class();
	var lazyUpdateResponsiveClass = throttle(update_responsive_class, 100);
	$(window).on('resize', lazyUpdateResponsiveClass);
	$(document).on('upfront-load', function(){ Upfront.Events.on("layout:render", remove_responsive_class); });

});
