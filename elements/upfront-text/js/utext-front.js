jQuery(function($){
	// Update "preload" attribute to make videos show up and autoplay videos that are
	// set to autoplay.
	$('.uinsert-video-insert video').attr('preload', 'auto').each( function() {
		if ($(this).attr('data-autoplay-video') === "true") {
			$(this).attr('autoplay', 'true');
		}
	});
});
