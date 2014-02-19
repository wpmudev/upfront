jQuery(function($){
	var setHeight = function(texts){
		var max = 0;
		texts.find('.uslide-text').each(function(){
			max = Math.max(max, $(this).height());
		});
		texts.height(max);
	};
/*
	$('.uslides')
		.on('slidein', function(e, slide){
			if(slide){
				var slider = $(slide).closest('.uslider'),
					id = $(slide).attr('rel')
				;
				if(!slider.hasClass('uslider-notext')){
					var text = slider.find('.uslide-text[rel="' + id + '"]');
					text.addClass('uslide-text-current');
				}
			}
		})
		.on('slideout', function(e, slide){
			if(slide){
				var slider = $(slide).closest('.uslider'),
					id = $(slide).attr('rel')
				;
				if(!slider.hasClass('uslider-notext')){
					var text = slider.find('.uslide-text[rel="' + id + '"]');
					text.removeClass('uslide-text-current');
				}
			}
		})
	;
	*/
	setTimeout(function(){
		$('.uslider-below').each(function(){
			setHeight($(this).find('.uslider-texts'));
		});
		$('.uslider-above').each(function(){
			setHeight($(this).find('.uslider-texts'));
		});
	}, 300);
});