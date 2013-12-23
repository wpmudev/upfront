jQuery(function($){
	$('.uslides').on('slidein', function(e, slide){
		if(slide){
			var slider = $(slide).closest('.uslider'),
				id = $(slide).attr('rel')
			;
			if(!slider.hasClass('uslider-notext')){
				var text = slider.find('.uslide-text[rel="' + id + '"]');
				text.addClass('uslide-text-current');
			}
		}
	});
	$('.uslides').on('slideout', function(e, slide){
		if(slide){
			var slider = $(slide).closest('.uslider'),
				id = $(slide).attr('rel')
			;
			if(!slider.hasClass('uslider-notext')){
				var text = slider.find('.uslide-text[rel="' + id + '"]');
				text.removeClass('uslide-text-current');
			}
		}
	});
});