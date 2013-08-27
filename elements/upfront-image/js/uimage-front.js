jQuery(function($){
	if(typeof uimages != 'undefined'){
		for(var imageId in uimages){
			$('#' + imageId).magnificPopup(uimages[imageId]);
		}
	}
});