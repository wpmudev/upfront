jQuery(document).ready(function($){
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
				height = $(window).height() - body_off.top;
			$sub.each(function(){
				height -= $(this).outerHeight();
			});
			$region.css({
				minHeight: height,
				height: height,
				maxHeight: height
			});
		});
	}
	if ( css_support('flex') ){
		$('html').addClass('flexbox-support');
		set_full_screen();
		$(window).on('load', set_full_screen);
		$(window).on('resize', set_full_screen);
	}
	else {
		fix_region_height();
		$(window).on('load', fix_region_height);
		$(window).on('resize', fix_region_height);
	}

	// Full width image and video background
	function fix_full_bg () {
		$('[data-bg-image-ratio]').each(function(){
			var is_layout = $(this).is('.upfront-output-layout'),
				width = is_layout ? $(window).width() : $(this).outerWidth(),
				height = is_layout ? $(window).height() : $(this).outerHeight(),
				ratio = parseFloat($(this).attr('data-bg-image-ratio'));
			if ( Math.round(height/width*100)/100 > ratio )
				$(this).css('background-size', (height/ratio) + "px " + height + "px" /*"auto 100%"*/);
			else
				$(this).css('background-size', width + "px " + (width*ratio) + "px" /*"100% auto"*/);
		});
		$('[data-bg-video-ratio]').each(function(){
			var is_layout = $(this).parent().is('.upfront-output-layout'),
				width = is_layout ? $(window).width() : $(this).outerWidth(),
				height = is_layout ? $(window).height() : $(this).outerHeight(),
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
	}
	fix_full_bg();
	$(window).on('resize', fix_full_bg);

	/* Lightbox front end logic */
	var overlay = $('<div class="upfront-lightbox-bg"></div>'),
		close= $('<div class="upfront-ui close_lightbox"></div>'),
		close_icon= $('<div class="upfront-icon upfront-icon-popup-close"></div>');

	$(document).on('click', 'a', function(e) {
		//If we are in the editor the lightbox is open using the region.
		//if(typeof(Upfront) != 'undefined' && Upfront.Views)
			//return;

		if($('div#sidebar-ui').length > 0 && $('div#sidebar-ui').css('display') == 'block') {
		
				console.log('this is happening');
				var url = $(e.target).attr('href');
				if(url.indexOf('#ltb-') > -1)	 {
					
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
	var image_lazy_scroll = true;
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
	
	image_lazy_load();
	$(window).on('resize', image_lazy_load);
	if ( image_lazy_scroll )
		$(window).on('scroll', image_lazy_load);
	
	
	/* Responsive custom theme styles */
	function update_theme_styles () {
		var breakpoint = window.getComputedStyle(document.body,':after').getPropertyValue('content');
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
	$(window).on('resize', update_theme_styles);
	
});
