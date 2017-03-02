;(function($){
	/*
	 * Replace main video placeholder image+button with actual main video.
	 */
	function replace_ph_with_video(ph) {
		if (ph.size() === 0) return;

		var video_id = ph.data('video-id') || 'none';
		var loop = ph.data('loop');
		var width = ph.data('width') || parseInt(ph.width(), 10);
		var height = ph.data('height') || parseInt(ph.height(), 10);

		if (loop) loop = '&' + loop;

		ph.after('<iframe src="https://www.youtube.com/embed/'+video_id+'?modestbranding=1'+loop+'&autoplay=true" width="'+width+'" height="'+height+'"></iframe>');
		ph.remove();
	}

	/**
	 * Take data from list item and load video in player.
	 * @param {Object} - jQuery object of selected list item
	 */
	function load_video_from_list(list_item) {
		var el = list_item.parents('.upfront-youtube-container');
		var video_id = list_item.data('video-id') || 'none';

		// Make sure iframe is present and initialized properly
		if (el.find('iframe').size() === 0) {
			replace_ph_with_video(el.find('.ufyt_main-video-placeholder'));
		}

		// Setup ifram and title for selected video
		var videoUrl = 'https://www.youtube.com/embed/' + video_id + '?modestbranding=1';
		el.find('iframe').attr('src', videoUrl);
		el.find('.ufyt_main-video-title').html(list_item.find('h4').html());

		// Handle hidding active video thumbnail
		if(el.data('first-hidden')) {
			list_item.siblings().css('display', 'inline-block');
			list_item.hide();
		}
	}

	$('.uyoutube-gallery-item, .uyoutube-list-item').on('click', function(event) {
		load_video_from_list($(this));
	});

	$('.ufyt_main-video-placeholder').on('click', function(event) {
		replace_ph_with_video($(this));
	});
})(jQuery);
