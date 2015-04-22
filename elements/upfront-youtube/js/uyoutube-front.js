;(function($){
	$(function () {
    	$('.uyoutube-gallery-item, .uyoutube-list-item').on('click', function(event) {
			var videoUrl =  'http://www.youtube.com/embed/' + $(this).data('video-id') + '?modestbranding=1';
			$(this).siblings('.uyoutube-main-video').find('iframe').attr('src', videoUrl);
		});
	});

	$(window).on('load', function() {
		$(window).resize(_.debounce(function() {
			
		}, 500));
	});

	$(document).ready(function() {
		fixVideoheight();
	}

	function fixVideoheight() {
		$('.upfront-youtube-container > iframe').each(function() {
			$(this).css('height', parseInt($(this).width()/1.641, 10));
		});
	}

})(jQuery);
