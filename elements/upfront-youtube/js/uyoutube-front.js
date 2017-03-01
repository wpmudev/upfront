;(function($){
	/*
	 * Replace main video placeholder image+button with actual main video.
	 */
	function replace_ph_with_video(ph) {
		var video_id = ph.data('video-id');
		var loop = ph.data('loop');
		var width = ph.data('width');
		var height = ph.data('height');
		ph.after('<iframe src="https://www.youtube.com/embed/'+video_id+'?modestbranding=1&'+loop+'&autoplay=true" width="'+width+'" height="'+height+'"></iframe>');
		ph.remove();
	}

	/**
	 * Take data from list item and load video in player.
	 * @param {Object} - jQuery object of selected list item
	 */
	function load_video_from_list(list_item) {
		var pp = list_item.parent().prev();

		// Make sure iframe is present and initialized properly
		if (pp.find('iframe').size() === 0) {
			replace_ph_with_video(pp.find('.ufyt_main-video-placeholder'));
		}

		// Setup ifram and title for selected video
		var videoUrl =  'https://www.youtube.com/embed/' + list_item.data('video-id') + '?modestbranding=1';
		pp.find('iframe').attr('src', videoUrl);
		pp.find('h3').html(list_item.find('h4').html());

		// Handle hidding active video thumbnail
		if(pp.parent().data('first-hidden')) {
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
