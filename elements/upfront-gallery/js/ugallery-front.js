jQuery(function($){
	if(typeof ugalleries != 'undefined'){
		for(var galleryId in ugalleries){
			var gallery = $('#' + galleryId);

			if(gallery.find('.ugallery_lb_texts').length)
				ugalleries[galleryId].image = {
					titleSrc: function(item){
						var itemId = item.el.closest('.ugallery_item').attr('rel'),
							text = gallery.find('.ugallery_lb_text[rel=' + itemId + ']')
						;
						if(text.length)
							return text.html();
						return '';
					}
				}

			$('#' + galleryId).magnificPopup(ugalleries[galleryId]);
		}
	}
});