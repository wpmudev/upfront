jQuery(document).ready(function($){
	
	// Making sure sidebar region height is fixed
	function fix_region_height () {
		$('.upfront-output-region-container').each(function(){
			var $region = $(this).find('.upfront-output-region'),
				is_full_screen = $(this).hasClass('upfront-region-container-full'),
				min_height = height = 0;
			if ( is_full_screen ){
				var height = $(window).height();
				$region.css({
					minHeight: height,
					height: height,
					maxHeight: height
				});
			}
			else if ( $region.length > 1 ){
				$region.each(function(){
					var min = parseInt($(this).css('min-height')),
						h = $(this).outerHeight();
					if ( min )
						min_height = min > min_height ? min : min_height;
					height = h > height ? h : height;
				});
				$region.css({
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
				$embed = $(this).children('iframe');
			$(this).css('overflow', 'hidden');
			$embed.css({
				position: 'absolute'
			});
			if ( typeof upfront_video_embed == 'undefined' )
				upfront_video_embed = 'crop';
			if ( upfront_video_embed == 'crop' ){
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
			else if ( upfront_video_embed == 'full' ) {
				$embed.css({
					top: 0,
					left: 0,
					width: width,
					height: height
				});
			}
			else if ( upfront_video_embed == 'inside' ) {
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
});
