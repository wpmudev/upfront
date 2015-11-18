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
	$('.upfront-output-uslider').each( function() {
		var slider = $(this),
			options = slider.find('.uslider').data();

		/* if it is enclosed inside a lightbox,
		 * then set it up on first instance of 
		 * the lightbox showing up. Also store a flag
		 * issetup in order to avoid repeating this process
		 */

		if(slider.closest('div.upfront-region-lightbox').length ) {
			
			// slider should stay hidden before the lightbox opens up, 
			// or it kills the lightbox alignment because of its extra height
			slider.hide();

			var lightbox = slider.closest('div.upfront-region-lightbox');

			$(document).on("upfront-lightbox-open", function(e, which) {
				// no need to set it up again and again
				if(slider.data('issetup'))
					return;

				// identify that the event is triggered for the same lightbox
				if($(which).attr('id') !== lightbox.attr('id'))
					return;

				// do the thing
				slider.show();
				setupSlider(slider);
				
				slider.data('issetup', true);
				
			});

			return;
		}

		setupSlider(slider);

		function setupSlider(slider) {

			slider.find('.uslides').upfront_default_slider(options);


			slider.find('.uslide-above').each(function(){
				var slide = $(this);
				slide.find('.uslide-caption').remove().prependTo(slide);
			});
			slider.find('.uslide-left').each(function(){
				var slide = $(this);
				slide.find('.uslide-caption').remove().prependTo(slide);
			});
			slider.find('.uslide-bottomOver, .uslide-middleCover, .uslide-bottomCover, .uslide-topCover').each(function() {
				var slide = $(this);
				slide.find('.uslide-caption').remove().prependTo(slide.find('.uslide-image'));
			});
		}
	});
});
