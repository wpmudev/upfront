jQuery(document).ready(function($){
	// Making sure sidebar region height is fixed
	function fix_region_height () {
		$('.upfront-output-region-container').each(function(){
			var $region = $(this).find('.upfront-output-region'),
				min_height = height = 0;
			if ( $region.length <= 1 )
				return;
			$region.each(function(){
				var min = parseInt($(this).css('min-height')),
					h = $(this).outerHeight();
				if ( min )
					min_height = min > min_height ? min : min_height;
				height = h > height ? h : height;
			});
			$region.css('min-height', height);
		});
	}
	fix_region_height();
	$(window).on('load', fix_region_height);
	$(window).on('resize', fix_region_height);
	
	// Full width image background
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
	}
	fix_full_bg();
	$(window).on('resize', fix_full_bg);
})
