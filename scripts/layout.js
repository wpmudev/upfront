jQuery(document).ready(function($){

	// Making sure sidebar region height is fixed
	function fix_region_height () {
		$('.upfront-output-region-container').each(function(){
			var $regions = $(this).find('.upfront-output-region').not('.upfront-region-fixed, .upfront-region-lightbox'),
				is_full_screen = $(this).hasClass('upfront-region-container-full'),
				min_height = height = 0,
				exclude = [];
			if ( is_full_screen ){
				height = $(window).height();
				$regions.each(function(){
					if ( $(this).closest('.upfront-output-region-sub-container').length ){
						height -= $(this).outerHeight();
						exclude.push(this);
					}
				});
				$regions.each(function(){
					var found = false,
						me = this;
					$.each(exclude, function(i, node){
						if ( node == me )
							found = true;
					});
					if ( !found ){
						$(this).css({
							minHeight: height,
							height: height,
							maxHeight: height
						});
					}
				});
			}
			else if ( $regions.length > 1 ){
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
	fix_region_height();
	$(window).on('load', fix_region_height);
	$(window).on('resize', fix_region_height);

	// Full width image and video background
	function fix_full_bg () {
		$('[data-bg-image-ratio]').each(function(){
			var width = $(this).outerWidth(),
				height = $(this).outerHeight(),
				ratio = parseFloat($(this).attr('data-bg-image-ratio'));
			if ( Math.round(height/width*100)/100 > ratio )
				$(this).css('background-size', (height/ratio) + "px " + height + "px" /*"auto 100%"*/);
			else
				$(this).css('background-size', width + "px " + (width*ratio) + "px" /*"100% auto"*/);
		});
		$('[data-bg-video-ratio]').each(function(){
			var width = $(this).outerWidth(),
				height = $(this).outerHeight(),
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
			console.log($('div#sidebar-ui').length);
		if($('div#sidebar-ui').length > 0 && $('div#sidebar-ui').css('display') == 'block')
			return;
		  var url = $(this).attr('href');
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
					console.log(lightbox.css('width'));
					e.preventDefault();
					function lightboxhide() {
						close.html('').remove()
						overlay.remove();
						lightbox.hide();
					}
				}
			}
		});
});
