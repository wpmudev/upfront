jQuery(function($){
	if(typeof ugalleries != 'undefined'){
		for(var galleryId in ugalleries){
			$('#' + galleryId).magnificPopup(ugalleries[galleryId]);
		}
	}
});