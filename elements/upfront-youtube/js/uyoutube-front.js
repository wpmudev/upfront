;(function($){
	$(function () {
		$('.uyoutube-gallery-item, .uyoutube-list-item').on('click', function(event) {
      
			if($(this).hasClass('firstHidden')) {
				var existing_videoUrl = $('.uyoutube-main-video iframe').attr('src');
				
				if(existing_videoUrl) {
					videoId = existing_videoUrl.match(/^(https?:\/\/(www\.)?)?youtube\.com\/embed\/([-_A-Za-z0-9]+)/)[3];
				}
			}
		    
			var videoUrl =  'http://www.youtube.com/embed/' + $(this).data('video-id') + '?modestbranding=1';
			$(this).parent().prev().find('iframe').attr('src', videoUrl);
						
			if($(this).hasClass('firstHidden')) {
				$(this).data('video-id', videoId);
				$(this).find('.uyoutube-thumb').attr('src', 'https://i.ytimg.com/vi/'+videoId+'/hqdefault.jpg');
			}
		});
	});
})(jQuery);
