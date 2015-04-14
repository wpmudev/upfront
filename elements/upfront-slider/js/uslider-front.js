jQuery(function($){
	var setHeight = function(texts){
		var max = 0;
		texts.find('.uslide-text').each(function(){
			max = Math.max(max, $(this).height());
		});
		texts.height(max);
	};

	setTimeout(function(){
		$('.uslider-below').each(function(){
			setHeight($(this).find('.uslider-texts'));
		});
		$('.uslider-above').each(function(){
			setHeight($(this).find('.uslider-texts'));
		});
	}, 300);

	var magOptions = {
		type: 'image',
		gallery: {
			enabled: 'true',
			tCounter: '<span class="mfp-counter">%curr% / %total%</span>'
		},
		titleSrc: 'title',
		verticalFit: true,
		image: {
			titleSrc: 'title',
			verticalFit: true
		}
	};
	$('.uslider').each( function() {
		$(this).find('.uslider_lightbox_link').magnificPopup(magOptions);
	});
});

jQuery(function($){
  $('[id^="uslider-"]').each( function() {
    var slider = $(this),
      options = slider.find('.uslider').data();

    slider.find('.uslides').upfront_default_slider(options);

    slider.find('.uslide-above').each(function(){
      var slide = $(this);
      slide.find('.uslide-caption').remove().prependTo(slide);
    });
    slider.find('.uslide-left').each(function(){
      var slide = $(this);
      slide.find('.uslide-caption').remove().prependTo(slide);
    });
  });
});
