;(function($){
	$(function () {
		$('.uyoutube-gallery-item, .uyoutube-list-item').on('click', function(event) {
      
			if($(this).hasClass('firstHidden')) {
				var existing_videoUrl = $(this).parent().prev().find('iframe').attr('src');
				var existing_videoTitle = $(this).parent().prev().find('h3').html();
				
				if(existing_videoUrl) {
					videoId = existing_videoUrl.match(/^(https?:\/\/(www\.)?)?youtube\.com\/embed\/([-_A-Za-z0-9]+)/)[3];
				}
			}
		    
			var videoUrl =  'http://www.youtube.com/embed/' + $(this).data('video-id') + '?modestbranding=1';
			$(this).parent().prev().find('iframe').attr('src', videoUrl);
			$(this).parent().prev().find('h3').html($(this).find('h4').html());

			if($(this).hasClass('firstHidden')) {
				$(this).data('video-id', videoId);
				$(this).find('.uyoutube-thumb').attr('src', 'https://i.ytimg.com/vi/'+videoId+'/hqdefault.jpg');
				$(this).find('h4').html(existing_videoTitle);
			}
		});
	});
})(jQuery);
